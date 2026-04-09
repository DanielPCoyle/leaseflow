import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, unauthorized, badRequest } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user || !user.companyId) return unauthorized();

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const propertyId = searchParams.get("propertyId");

  const where: Record<string, unknown> = {
    property: { companyId: user.companyId },
  };
  if (status) where.status = status;
  if (propertyId) where.propertyId = propertyId;

  const applications = await prisma.application.findMany({
    where,
    include: {
      property: { select: { id: true, name: true } },
      unit: { select: { id: true, unitNumber: true, marketRent: true } },
      prospect: { select: { id: true, firstName: true, lastName: true } },
      _count: { select: { documents: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return NextResponse.json(applications);
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user || !user.companyId) return unauthorized();

  const body = await request.json();
  const { prospectId, propertyId, unitId, firstName, lastName, email, phone, ...rest } = body;

  if (!propertyId || !firstName || !lastName || !email || !phone) {
    return badRequest("propertyId, firstName, lastName, email, and phone are required");
  }

  const property = await prisma.property.findFirst({
    where: { id: propertyId, companyId: user.companyId },
  });
  if (!property) return badRequest("Invalid property");

  const application = await prisma.application.create({
    data: {
      prospectId: prospectId || undefined,
      propertyId,
      unitId: unitId || undefined,
      firstName,
      lastName,
      email,
      phone,
      status: "SUBMITTED",
      ...rest,
    },
  });

  // Update prospect status if linked
  if (prospectId) {
    await prisma.prospect.update({
      where: { id: prospectId },
      data: { status: "APPLIED" },
    });
  }

  return NextResponse.json(application, { status: 201 });
}
