import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, unauthorized, notFound } from "@/lib/api-auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user || !user.companyId) return unauthorized();

  const { id } = await params;

  const lease = await prisma.lease.findFirst({
    where: { id, companyId: user.companyId },
    include: {
      unit: {
        select: {
          id: true, unitNumber: true, bedrooms: true, bathrooms: true, sqft: true,
          property: { select: { id: true, name: true, address: true, city: true, state: true } },
        },
      },
      application: {
        select: { id: true, firstName: true, lastName: true, email: true, prospectId: true },
      },
      payments: { orderBy: { dueDate: "asc" } },
    },
  });

  if (!lease) return notFound("Lease not found");

  return NextResponse.json(lease);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user || !user.companyId) return unauthorized();

  const { id } = await params;
  const body = await request.json();

  const existing = await prisma.lease.findFirst({
    where: { id, companyId: user.companyId },
    include: { application: { select: { prospectId: true } } },
  });
  if (!existing) return notFound("Lease not found");

  const lease = await prisma.lease.update({
    where: { id },
    data: {
      ...body,
      ...(body.status === "ACTIVE" ? { signedAt: new Date() } : {}),
    },
  });

  // Side effects on status change
  if (body.status === "ACTIVE" && existing.status !== "ACTIVE") {
    // Mark unit as occupied
    await prisma.unit.update({
      where: { id: existing.unitId },
      data: { status: "OCCUPIED" },
    });
    // Update prospect
    if (existing.application?.prospectId) {
      await prisma.prospect.update({
        where: { id: existing.application.prospectId },
        data: { status: "LEASE_SIGNED" },
      });
    }
  }

  if (body.status === "TERMINATED" || body.status === "EXPIRED") {
    await prisma.unit.update({
      where: { id: existing.unitId },
      data: { status: "VACANT", availableDate: new Date() },
    });
  }

  return NextResponse.json(lease);
}
