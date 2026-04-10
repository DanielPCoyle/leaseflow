import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getAuthenticatedUser,
  unauthorized,
  notFound,
  requireRole,
} from "@/lib/api-auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user || !user.companyId) return unauthorized();

  const { id } = await params;

  const property = await prisma.property.findFirst({
    where: { id, companyId: user.companyId },
    include: {
      region: true,
      amenities: { orderBy: { category: "asc" } },
      photos: { orderBy: { sortOrder: "asc" } },
      floorPlans: {
        where: { isActive: true },
        orderBy: { bedrooms: "asc" },
      },
      units: {
        orderBy: [{ floor: "asc" }, { unitNumber: "asc" }],
        include: { floorPlan: true },
      },
      agentProperties: {
        include: {
          agent: {
            include: { user: { select: { name: true, email: true } } },
          },
        },
      },
    },
  });

  if (!property) return notFound("Property not found");

  return NextResponse.json(property);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user || !user.companyId) return unauthorized();

  const { id } = await params;
  const body = await request.json();

  const existing = await prisma.property.findFirst({
    where: { id, companyId: user.companyId },
  });
  if (!existing) return notFound("Property not found");

  const property = await prisma.property.update({
    where: { id },
    data: body,
  });

  return NextResponse.json(property);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user || !user.companyId) return unauthorized();
  const roleCheck = requireRole(user.role, "COMPANY_ADMIN");
  if (roleCheck) return roleCheck;

  const { id } = await params;

  const existing = await prisma.property.findFirst({
    where: { id, companyId: user.companyId },
  });
  if (!existing) return notFound("Property not found");

  await prisma.property.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
