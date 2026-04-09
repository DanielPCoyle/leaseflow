import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, unauthorized, badRequest } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user || !user.companyId) return unauthorized();

  const { searchParams } = new URL(request.url);
  const propertyId = searchParams.get("propertyId");
  const status = searchParams.get("status");
  const bedrooms = searchParams.get("bedrooms");

  const where: Record<string, unknown> = {
    property: { companyId: user.companyId },
  };
  if (propertyId) where.propertyId = propertyId;
  if (status) where.status = status;
  if (bedrooms) where.bedrooms = parseInt(bedrooms);

  const units = await prisma.unit.findMany({
    where,
    include: {
      property: { select: { id: true, name: true, slug: true } },
      floorPlan: { select: { id: true, name: true } },
    },
    orderBy: [
      { property: { name: "asc" } },
      { floor: "asc" },
      { unitNumber: "asc" },
    ],
  });

  return NextResponse.json(units);
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user || !user.companyId) return unauthorized();

  const body = await request.json();
  const { propertyId, unitNumber, bedrooms, bathrooms, ...rest } = body;

  if (!propertyId || !unitNumber || bedrooms === undefined || bathrooms === undefined) {
    return badRequest("propertyId, unitNumber, bedrooms, and bathrooms are required");
  }

  // Verify property belongs to user's company
  const property = await prisma.property.findFirst({
    where: { id: propertyId, companyId: user.companyId },
  });
  if (!property) return badRequest("Invalid property");

  const unit = await prisma.unit.create({
    data: { propertyId, unitNumber, bedrooms, bathrooms, ...rest },
  });

  return NextResponse.json(unit, { status: 201 });
}
