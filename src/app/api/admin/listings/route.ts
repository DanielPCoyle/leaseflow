import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, unauthorized, badRequest } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user || !user.companyId) return unauthorized();

  const { searchParams } = new URL(request.url);
  const propertyId = searchParams.get("propertyId");
  const platform = searchParams.get("platform");

  const where: Record<string, unknown> = {
    property: { companyId: user.companyId },
  };
  if (propertyId) where.propertyId = propertyId;
  if (platform) where.platform = platform;

  const listings = await prisma.listing.findMany({
    where,
    include: {
      property: { select: { id: true, name: true } },
    },
    orderBy: [{ property: { name: "asc" } }, { platform: "asc" }],
  });

  return NextResponse.json(listings);
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user || !user.companyId) return unauthorized();

  const body = await request.json();
  const { propertyId, platform } = body;

  if (!propertyId || !platform) {
    return badRequest("propertyId and platform are required");
  }

  const property = await prisma.property.findFirst({
    where: { id: propertyId, companyId: user.companyId },
  });
  if (!property) return badRequest("Invalid property");

  const listing = await prisma.listing.upsert({
    where: { propertyId_platform: { propertyId, platform } },
    update: { status: "ACTIVE", lastSyncAt: new Date(), syncError: null },
    create: { propertyId, platform, status: "ACTIVE", lastSyncAt: new Date() },
  });

  return NextResponse.json(listing, { status: 201 });
}
