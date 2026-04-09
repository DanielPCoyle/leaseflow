import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAvailableSlots, aggregateSlots } from "@/lib/availability";
import { badRequest } from "@/lib/api-auth";

/**
 * Public endpoint: Get available tour time slots for a property.
 * Used by the prospect-facing booking page.
 *
 * GET /api/public/availability?propertyId=xxx&date=2026-04-15
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const propertyId = searchParams.get("propertyId");
  const date = searchParams.get("date");

  if (!propertyId || !date) {
    return badRequest("propertyId and date are required");
  }

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return badRequest("Date must be in YYYY-MM-DD format");
  }

  // Look up property to get companyId
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { companyId: true, isActive: true },
  });

  if (!property || !property.isActive) {
    return badRequest("Property not found or inactive");
  }

  const allSlots = await getAvailableSlots({
    propertyId,
    date,
    companyId: property.companyId,
  });

  // For public API, aggregate to just show available times (not agent details)
  const available = aggregateSlots(allSlots);

  return NextResponse.json({
    propertyId,
    date,
    slots: available.map((s) => ({
      time: s.time,
      endTime: s.endTime,
      agentCount: s.availableAgents.length,
    })),
  });
}
