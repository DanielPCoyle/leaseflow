import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, unauthorized, badRequest } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user || !user.companyId) return unauthorized();

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const propertyId = searchParams.get("propertyId");

  const where: Record<string, unknown> = { companyId: user.companyId };
  if (status) where.status = status;
  if (propertyId) where.unit = { propertyId };

  const leases = await prisma.lease.findMany({
    where,
    include: {
      unit: {
        select: {
          id: true, unitNumber: true, bedrooms: true, bathrooms: true,
          property: { select: { id: true, name: true } },
        },
      },
      application: { select: { id: true, firstName: true, lastName: true } },
      _count: { select: { payments: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return NextResponse.json(leases);
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user || !user.companyId) return unauthorized();

  const body = await request.json();
  const {
    applicationId, unitId, primaryTenantName, primaryTenantEmail,
    primaryTenantPhone, leaseStart, leaseEnd, monthlyRent,
    securityDeposit, moveInFee, leaseTerm,
  } = body;

  if (!unitId || !primaryTenantName || !primaryTenantEmail || !leaseStart || !leaseEnd || !monthlyRent) {
    return badRequest("unitId, primaryTenantName, primaryTenantEmail, leaseStart, leaseEnd, and monthlyRent are required");
  }

  // Verify unit belongs to company
  const unit = await prisma.unit.findFirst({
    where: { id: unitId, property: { companyId: user.companyId } },
  });
  if (!unit) return badRequest("Invalid unit");

  const lease = await prisma.lease.create({
    data: {
      companyId: user.companyId,
      unitId,
      applicationId: applicationId || undefined,
      primaryTenantName,
      primaryTenantEmail,
      primaryTenantPhone: primaryTenantPhone || null,
      leaseStart: new Date(leaseStart),
      leaseEnd: new Date(leaseEnd),
      monthlyRent: parseFloat(monthlyRent),
      securityDeposit: securityDeposit ? parseFloat(securityDeposit) : null,
      moveInFee: moveInFee ? parseFloat(moveInFee) : null,
      leaseTerm: leaseTerm ? parseInt(leaseTerm) : null,
      status: "DRAFT",
    },
  });

  // Update unit status to occupied if lease is active
  // (will happen on status change to ACTIVE)

  // Update prospect status if application linked
  if (applicationId) {
    const app = await prisma.application.findUnique({
      where: { id: applicationId },
      select: { prospectId: true },
    });
    if (app?.prospectId) {
      await prisma.prospect.update({
        where: { id: app.prospectId },
        data: { status: "LEASE_SENT" },
      });
    }
  }

  return NextResponse.json(lease, { status: 201 });
}
