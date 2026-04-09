import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Public feed endpoint for ILS platforms to pull listing data.
 * GET /api/public/listings/[propertyId]/feed
 *
 * Returns standardized property + unit data for syndication to
 * Zillow, Apartments.com, Rent.com, etc.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ propertyId: string }> }
) {
  const { propertyId } = await params;

  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    include: {
      amenities: { select: { name: true, category: true } },
      photos: { select: { url: true, caption: true, category: true }, orderBy: { sortOrder: "asc" } },
      floorPlans: {
        where: { isActive: true },
        select: { name: true, bedrooms: true, bathrooms: true, sqft: true, basePrice: true, imageUrl: true },
      },
      units: {
        where: { status: "VACANT", isActive: true },
        select: {
          unitNumber: true, floor: true, bedrooms: true, bathrooms: true,
          sqft: true, marketRent: true, availableDate: true,
        },
      },
    },
  });

  if (!property) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }

  const petPolicy = property.petPolicy as Record<string, unknown> | null;

  return NextResponse.json({
    property: {
      name: property.name,
      address: property.address,
      city: property.city,
      state: property.state,
      zip: property.zip,
      latitude: property.latitude,
      longitude: property.longitude,
      propertyType: property.propertyType,
      yearBuilt: property.yearBuilt,
      totalUnits: property.totalUnits,
      stories: property.stories,
      description: property.description,
      phone: property.phone,
      email: property.email,
      website: property.website,
      petPolicy: petPolicy?.allowed ? {
        allowed: true,
        maxPets: petPolicy.maxPets,
        weightLimit: petPolicy.weightLimit,
        monthlyRent: petPolicy.monthlyRent,
        deposit: petPolicy.deposit,
      } : { allowed: false },
      officeHours: property.officeHours,
    },
    amenities: property.amenities,
    photos: property.photos,
    floorPlans: property.floorPlans,
    availableUnits: property.units,
    lastUpdated: new Date().toISOString(),
  });
}
