import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, unauthorized, badRequest } from "@/lib/api-auth";

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user || !user.companyId) return unauthorized();

  const properties = await prisma.property.findMany({
    where: { companyId: user.companyId },
    include: {
      region: true,
      _count: {
        select: {
          units: true,
          agentProperties: true,
        },
      },
      units: {
        select: { status: true },
      },
    },
    orderBy: { name: "asc" },
  });

  const data = properties.map((p) => {
    const occupied = p.units.filter((u) => u.status === "OCCUPIED").length;
    const total = p.units.length;
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      address: p.address,
      city: p.city,
      state: p.state,
      zip: p.zip,
      imageUrl: p.imageUrl,
      propertyType: p.propertyType,
      totalUnits: p.totalUnits,
      stories: p.stories,
      yearBuilt: p.yearBuilt,
      isActive: p.isActive,
      region: p.region ? { id: p.region.id, name: p.region.name } : null,
      unitCount: total,
      occupiedCount: occupied,
      occupancyRate: total > 0 ? Math.round((occupied / total) * 100) : 0,
      agentCount: p._count.agentProperties,
    };
  });

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user || !user.companyId) return unauthorized();

  const body = await request.json();
  const { name, slug, address, city, state, zip, regionId, ...rest } = body;

  if (!name || !address || !city || !state || !zip) {
    return badRequest("Name, address, city, state, and zip are required");
  }

  const property = await prisma.property.create({
    data: {
      companyId: user.companyId,
      name,
      slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      address,
      city,
      state,
      zip,
      regionId: regionId || undefined,
      ...rest,
    },
  });

  return NextResponse.json(property, { status: 201 });
}
