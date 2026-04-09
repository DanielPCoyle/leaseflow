import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Public endpoint: Get property details by slug.
 * GET /api/public/properties/versailles?company=alterra
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { searchParams } = new URL(request.url);
  const companySlug = searchParams.get("company");
  const { slug } = await params;

  if (!companySlug) {
    return NextResponse.json({ error: "company parameter required" }, { status: 400 });
  }

  const company = await prisma.company.findUnique({
    where: { slug: companySlug },
    select: { id: true, name: true, logoUrl: true, settings: true },
  });

  if (!company) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  const property = await prisma.property.findFirst({
    where: { slug, companyId: company.id, isActive: true },
    include: {
      region: { select: { name: true } },
      amenities: { orderBy: { category: "asc" } },
      photos: { orderBy: { sortOrder: "asc" } },
      floorPlans: {
        where: { isActive: true },
        orderBy: { bedrooms: "asc" },
        include: {
          units: {
            where: { status: "VACANT", isActive: true },
            select: {
              id: true,
              unitNumber: true,
              floor: true,
              bedrooms: true,
              bathrooms: true,
              sqft: true,
              marketRent: true,
              availableDate: true,
              features: true,
            },
            orderBy: { marketRent: "asc" },
          },
        },
      },
      // Also get vacant units without floor plans
      units: {
        where: { status: "VACANT", isActive: true, floorPlanId: null },
        select: {
          id: true,
          unitNumber: true,
          floor: true,
          bedrooms: true,
          bathrooms: true,
          sqft: true,
          marketRent: true,
          availableDate: true,
          features: true,
        },
        orderBy: { marketRent: "asc" },
      },
    },
  });

  if (!property) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }

  const petPolicy = property.petPolicy as Record<string, unknown> | null;

  return NextResponse.json({
    company: { name: company.name, logoUrl: company.logoUrl },
    property: {
      id: property.id,
      name: property.name,
      slug: property.slug,
      address: property.address,
      city: property.city,
      state: property.state,
      zip: property.zip,
      description: property.description,
      imageUrl: property.imageUrl,
      propertyType: property.propertyType,
      yearBuilt: property.yearBuilt,
      totalUnits: property.totalUnits,
      stories: property.stories,
      officeHours: property.officeHours,
      region: property.region?.name,
      phone: property.phone,
      email: property.email,
      petPolicy: petPolicy?.allowed
        ? {
            allowed: true,
            maxPets: petPolicy.maxPets,
            weightLimit: petPolicy.weightLimit,
            monthlyRent: petPolicy.monthlyRent,
            deposit: petPolicy.deposit,
          }
        : { allowed: false },
      photos: property.photos.map((p) => ({
        url: p.url,
        caption: p.caption,
        category: p.category,
      })),
      amenities: property.amenities.map((a) => ({
        name: a.name,
        category: a.category,
        icon: a.icon,
      })),
      floorPlans: property.floorPlans.map((fp) => ({
        id: fp.id,
        name: fp.name,
        bedrooms: fp.bedrooms,
        bathrooms: fp.bathrooms,
        sqft: fp.sqft,
        basePrice: fp.basePrice,
        imageUrl: fp.imageUrl,
        modelUrl: fp.modelUrl,
        availableUnits: fp.units,
      })),
      additionalVacantUnits: property.units,
    },
  });
}
