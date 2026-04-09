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

  const existing = await prisma.unit.findFirst({
    where: { id, property: { companyId: user.companyId } },
  });
  if (!existing) return notFound("Unit not found");

  const unit = await prisma.unit.update({
    where: { id },
    data: body,
    include: {
      property: { select: { id: true, name: true } },
      floorPlan: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(unit);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user || !user.companyId) return unauthorized();

  const { id } = await params;

  const existing = await prisma.unit.findFirst({
    where: { id, property: { companyId: user.companyId } },
  });
  if (!existing) return notFound("Unit not found");

  await prisma.unit.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
