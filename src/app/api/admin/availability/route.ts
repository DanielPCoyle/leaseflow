import { NextRequest, NextResponse } from "next/server";
import { getAvailableSlots, aggregateSlots } from "@/lib/availability";
import { getAuthenticatedUser, unauthorized, badRequest } from "@/lib/api-auth";

/**
 * Admin endpoint: Get detailed availability including agent assignments.
 * Used by the admin scheduling interface.
 *
 * GET /api/admin/availability?propertyId=xxx&date=2026-04-15
 */
export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user || !user.companyId) return unauthorized();

  const { searchParams } = new URL(request.url);
  const propertyId = searchParams.get("propertyId");
  const date = searchParams.get("date");

  if (!propertyId || !date) {
    return badRequest("propertyId and date are required");
  }

  const allSlots = await getAvailableSlots({
    propertyId,
    date,
    companyId: user.companyId,
  });

  const aggregated = aggregateSlots(allSlots);

  return NextResponse.json({
    propertyId,
    date,
    // Detailed view for admin: includes per-agent breakdown
    detailedSlots: allSlots,
    // Aggregated view: times where at least one agent is available
    availableSlots: aggregated,
  });
}
