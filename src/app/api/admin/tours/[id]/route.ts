import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, unauthorized, notFound } from "@/lib/api-auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user || !user.companyId) return unauthorized();

  const { id } = await params;
  const body = await request.json();

  const existing = await prisma.tour.findFirst({
    where: { id, property: { companyId: user.companyId } },
  });
  if (!existing) return notFound("Tour not found");

  // Handle status transitions
  const statusTimestamps: Record<string, Record<string, Date>> = {
    CONFIRMED: { confirmedAt: new Date() },
    COMPLETED: { completedAt: new Date() },
    CANCELLED: { cancelledAt: new Date() },
    NO_SHOW: { noShowAt: new Date() },
  };

  const extraData = body.status ? (statusTimestamps[body.status] || {}) : {};

  const tour = await prisma.tour.update({
    where: { id },
    data: { ...body, ...extraData },
    include: {
      property: { select: { name: true } },
      agent: { include: { user: { select: { name: true } } } },
    },
  });

  return NextResponse.json(tour);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user || !user.companyId) return unauthorized();

  const { id } = await params;

  const existing = await prisma.tour.findFirst({
    where: { id, property: { companyId: user.companyId } },
  });
  if (!existing) return notFound("Tour not found");

  await prisma.tour.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
