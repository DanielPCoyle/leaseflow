import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAvailableSlots, aggregateSlots } from "@/lib/availability";
import { sendTourConfirmation } from "@/lib/email";

/**
 * Public endpoint: Submit a tour booking request.
 * POST /api/public/tours
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    propertyId,
    scheduledDate,
    scheduledTime,
    prospectName,
    prospectEmail,
    prospectPhone,
    tourType = "IN_PERSON",
    desiredBedrooms,
    budgetMax,
    moveInDate,
    hasPets,
    petDetails,
    notes,
    unitIds,
  } = body;

  if (!propertyId || !scheduledDate || !scheduledTime || !prospectName || !prospectEmail) {
    return NextResponse.json(
      { error: "propertyId, scheduledDate, scheduledTime, prospectName, and prospectEmail are required" },
      { status: 400 }
    );
  }

  // Look up property
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { id: true, companyId: true, isActive: true },
  });

  if (!property || !property.isActive) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }

  // Verify the time slot is actually available
  const allSlots = await getAvailableSlots({
    propertyId,
    date: scheduledDate,
    companyId: property.companyId,
  });
  const aggregated = aggregateSlots(allSlots);
  const matchingSlot = aggregated.find((s) => s.time === scheduledTime);

  if (!matchingSlot || matchingSlot.availableAgents.length === 0) {
    return NextResponse.json(
      { error: "This time slot is no longer available. Please choose another time." },
      { status: 409 }
    );
  }

  // Auto-assign the first available agent
  const assignedAgent = matchingSlot.availableAgents[0];

  // Create or find prospect
  let prospect = await prisma.prospect.findFirst({
    where: { email: prospectEmail, companyId: property.companyId },
  });

  if (!prospect) {
    const [firstName, ...lastParts] = prospectName.split(" ");
    const lastName = lastParts.join(" ") || firstName;

    prospect = await prisma.prospect.create({
      data: {
        companyId: property.companyId,
        firstName,
        lastName,
        email: prospectEmail,
        phone: prospectPhone || null,
        desiredBedrooms: desiredBedrooms ?? null,
        budgetMax: budgetMax ?? null,
        desiredMoveIn: moveInDate ? new Date(moveInDate) : null,
        hasPets: hasPets || false,
        petDetails: petDetails || null,
        status: "TOUR_SCHEDULED",
        source: "website",
      },
    });
  } else {
    // Update prospect status
    await prisma.prospect.update({
      where: { id: prospect.id },
      data: { status: "TOUR_SCHEDULED" },
    });
  }

  // Create the tour
  const tour = await prisma.tour.create({
    data: {
      propertyId,
      agentId: assignedAgent.agentId,
      prospectId: prospect.id,
      prospectName,
      prospectEmail,
      prospectPhone: prospectPhone || null,
      scheduledDate: new Date(scheduledDate),
      scheduledTime,
      tourType,
      notes: notes || null,
      status: "SCHEDULED",
      ...(unitIds?.length && {
        tourUnits: {
          create: unitIds.map((uid: string) => ({ unitId: uid })),
        },
      }),
    },
    include: {
      property: { select: { name: true, address: true, city: true, state: true, zip: true, phone: true } },
      agent: { include: { user: { select: { name: true } } } },
    },
  });

  // Send confirmation email (non-blocking, logs errors)
  const propertyAddress = `${tour.property.address}, ${tour.property.city}, ${tour.property.state} ${tour.property.zip}`;
  sendTourConfirmation({
    to: prospectEmail,
    prospectName,
    propertyName: tour.property.name,
    propertyAddress,
    propertyPhone: tour.property.phone,
    agentName: tour.agent?.user.name ?? null,
    scheduledDate: tour.scheduledDate.toISOString(),
    scheduledTime: tour.scheduledTime,
    tourType: tour.tourType,
  }).catch((err) => console.error("Tour confirmation email failed:", err));

  return NextResponse.json(
    {
      success: true,
      tour: {
        id: tour.id,
        propertyName: tour.property.name,
        propertyAddress: `${tour.property.address}, ${tour.property.city}, ${tour.property.state} ${tour.property.zip}`,
        propertyPhone: tour.property.phone,
        agentName: tour.agent?.user.name,
        scheduledDate: tour.scheduledDate,
        scheduledTime: tour.scheduledTime,
        tourType: tour.tourType,
      },
    },
    { status: 201 }
  );
}
