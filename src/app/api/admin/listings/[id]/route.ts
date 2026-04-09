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

  const existing = await prisma.listing.findFirst({
    where: { id, property: { companyId: user.companyId } },
  });
  if (!existing) return notFound("Listing not found");

  const listing = await prisma.listing.update({
    where: { id },
    data: body,
  });

  return NextResponse.json(listing);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user || !user.companyId) return unauthorized();

  const { id } = await params;

  const existing = await prisma.listing.findFirst({
    where: { id, property: { companyId: user.companyId } },
  });
  if (!existing) return notFound("Listing not found");

  await prisma.listing.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
