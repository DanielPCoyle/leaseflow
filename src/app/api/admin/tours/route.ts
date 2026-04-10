import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, unauthorized, badRequest } from "@/lib/api-auth";
import { estimateTravelTime } from "@/lib/travel";
import { sendTourConfirmation } from "@/lib/email";
import { TransportMode } from "@/generated/prisma/client";

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user || !user.companyId) return unauthorized();

  const { searchParams } = new URL(request.url);
  const agentId = searchParams.get("agentId");
  const propertyId = searchParams.get("propertyId");
  const status = searchParams.get("status");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");

  const where: Record<string, unknown> = {
    property: { companyId: user.companyId },
  };
  if (agentId) where.agentId = agentId;
  if (propertyId) where.propertyId = propertyId;
  if (status) where.status = status;
  if (dateFrom || dateTo) {
    where.scheduledDate = {};
    if (dateFrom) (where.scheduledDate as Record<string, unknown>).gte = new Date(dateFrom);
    if (dateTo) (where.scheduledDate as Record<string, unknown>).lte = new Date(dateTo);
  }

  const tours = await prisma.tour.findMany({
    where,
    include: {
      property: { select: { id: true, name: true } },
      agent: {
        include: { user: { select: { name: true } } },
      },
      prospect: { select: { id: true, firstName: true, lastName: true } },
      tourUnits: { include: { unit: { select: { unitNumber: true, bedrooms: true, marketRent: true } } } },
    },
    orderBy: [{ scheduledDate: "desc" }, { scheduledTime: "asc" }],
    take: 100,
  });

  return NextResponse.json(tours);
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user || !user.companyId) return unauthorized();

  const body = await request.json();
  const {
    propertyId,
    agentId,
    prospectId,
    prospectName,
    prospectEmail,
    prospectPhone,
    scheduledDate,
    scheduledTime,
    duration = 30,
    tourType = "IN_PERSON",
    unitIds,
    notes,
  } = body;

  if (!propertyId || !prospectName || !prospectEmail || !scheduledDate || !scheduledTime) {
    return badRequest(
      "propertyId, prospectName, prospectEmail, scheduledDate, and scheduledTime are required"
    );
  }

  // Verify property belongs to company
  const property = await prisma.property.findFirst({
    where: { id: propertyId, companyId: user.companyId },
    select: { id: true, latitude: true, longitude: true },
  });
  if (!property) return badRequest("Invalid property");

  // Calculate travel time from previous tour if agent has one
  let travelTimeFromPrev: number | null = null;

  if (agentId) {
    const agent = await prisma.agent.findFirst({
      where: { id: agentId, companyId: user.companyId },
      select: { transportMode: true, bufferMinutes: true },
    });

    if (agent) {
      const prevTour = await prisma.tour.findFirst({
        where: {
          agentId,
          scheduledDate: new Date(scheduledDate),
          scheduledTime: { lt: scheduledTime },
          status: { in: ["SCHEDULED", "CONFIRMED"] },
        },
        include: {
          property: { select: { latitude: true, longitude: true } },
        },
        orderBy: { scheduledTime: "desc" },
      });

      if (
        prevTour?.property.latitude &&
        prevTour?.property.longitude &&
        property.latitude &&
        property.longitude &&
        prevTour.propertyId !== propertyId
      ) {
        travelTimeFromPrev = estimateTravelTime(
          prevTour.property.latitude,
          prevTour.property.longitude,
          property.latitude,
          property.longitude,
          agent.transportMode as TransportMode
        );
      }
    }
  }

  const tour = await prisma.tour.create({
    data: {
      propertyId,
      agentId: agentId || undefined,
      prospectId: prospectId || undefined,
      prospectName,
      prospectEmail,
      prospectPhone: prospectPhone || undefined,
      scheduledDate: new Date(scheduledDate),
      scheduledTime,
      duration,
      tourType,
      notes: notes || undefined,
      travelTimeFromPrev,
      ...(unitIds?.length && {
        tourUnits: {
          create: unitIds.map((uid: string) => ({ unitId: uid })),
        },
      }),
    },
    include: {
      property: { select: { name: true, address: true, city: true, state: true, zip: true, phone: true } },
      agent: { include: { user: { select: { name: true } } } },
      tourUnits: { include: { unit: true } },
    },
  });

  // Send confirmation email (non-blocking)
  const fullAddress = `${tour.property.address}, ${tour.property.city}, ${tour.property.state} ${tour.property.zip}`;
  sendTourConfirmation({
    to: prospectEmail,
    prospectName,
    propertyName: tour.property.name,
    propertyAddress: fullAddress,
    propertyPhone: tour.property.phone,
    agentName: tour.agent?.user.name ?? null,
    scheduledDate: tour.scheduledDate.toISOString(),
    scheduledTime: tour.scheduledTime,
    tourType: tour.tourType,
  }).catch((err) => console.error("Tour confirmation email failed:", err));

  return NextResponse.json(tour, { status: 201 });
}
