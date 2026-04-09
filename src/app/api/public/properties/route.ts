import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Public endpoint: List properties for a company.
 * Accessed via company slug: GET /api/public/properties?company=alterra
 * Or for portfolio browsing: GET /api/public/properties?company=alterra&bedrooms=1&maxPrice=3000
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const companySlug = searchParams.get("company");
  const bedrooms = searchParams.get("bedrooms");
  const maxPrice = searchParams.get("maxPrice");
  const regionId = searchParams.get("regionId");

  if (!companySlug) {
    return NextResponse.json({ error: "company parameter required" }, { status: 400 });
  }

  const company = await prisma.company.findUnique({
    where: { slug: companySlug },
    select: {
      id: true,
      name: true,
      logoUrl: true,
      portfolioBrowsingEnabled: true,
    },
  });

  if (!company) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  const propertyWhere: Record<string, unknown> = {
    companyId: company.id,
    isActive: true,
  };
  if (regionId) propertyWhere.regionId = regionId;

  const properties = await prisma.property.findMany({
    where: propertyWhere,
    include: {
      region: { select: { id: true, name: true } },
      amenities: { take: 6, orderBy: { category: "asc" } },
      photos: { take: 1, orderBy: { sortOrder: "asc" } },
      floorPlans: {
        where: { isActive: true },
        select: { bedrooms: true, basePrice: true, sqft: true },
      },
      units: {
        where: {
          status: "VACANT",
          isActive: true,
          ...(bedrooms ? { bedrooms: parseInt(bedrooms) } : {}),
          ...(maxPrice ? { marketRent: { lte: parseFloat(maxPrice) } } : {}),
        },
        select: {
          id: true,
          bedrooms: true,
          bathrooms: true,
          sqft: true,
          marketRent: true,
          availableDate: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  // Filter to only properties with matching vacant units if filters applied
  const filtered = (bedrooms || maxPrice)
    ? properties.filter((p) => p.units.length > 0)
    : properties;

  const data = filtered.map((p) => {
    const minPrice = Math.min(
      ...p.floorPlans.map((fp) => fp.basePrice),
      ...p.units.map((u) => u.marketRent ?? Infinity)
    );
    const maxBed = Math.max(...p.floorPlans.map((fp) => fp.bedrooms), 0);

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      address: p.address,
      city: p.city,
      state: p.state,
      zip: p.zip,
      description: p.description,
      imageUrl: p.photos[0]?.url || p.imageUrl,
      propertyType: p.propertyType,
      region: p.region,
      amenities: p.amenities.map((a) => ({ name: a.name, icon: a.icon })),
      priceFrom: minPrice === Infinity ? null : minPrice,
      bedroomRange: `Studio - ${maxBed}BR`,
      vacantUnits: p.units.length,
      petFriendly: !!(p.petPolicy as Record<string, unknown>)?.allowed,
    };
  });

  return NextResponse.json({
    company: { name: company.name, logoUrl: company.logoUrl },
    properties: data,
  });
}
