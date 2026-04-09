import { prisma } from "@/lib/prisma";
import { estimateTravelTime } from "@/lib/travel";
import { TransportMode } from "@/generated/prisma/client";

export interface TimeSlot {
  time: string;        // "09:00"
  endTime: string;     // "09:30"
  available: boolean;
  agentId: string;
  agentName: string;
  reason?: string;     // Why unavailable: "booked", "travel_conflict", "outside_hours"
}

export interface AvailabilityRequest {
  propertyId: string;
  date: string;         // "2026-04-15"
  companyId: string;
  duration?: number;    // minutes, default 30
  slotInterval?: number; // minutes between slot starts, default 30
}

/**
 * Get available tour time slots for a property on a given date.
 *
 * This is the core scheduling intelligence. For each agent assigned to the property:
 * 1. Generate candidate time slots within office hours
 * 2. Check against existing booked tours
 * 3. Factor in travel time from/to adjacent tours at OTHER properties
 * 4. Apply the agent's configured buffer minutes
 *
 * Returns slots sorted by time, with availability per agent.
 */
export async function getAvailableSlots(
  req: AvailabilityRequest
): Promise<TimeSlot[]> {
  const duration = req.duration ?? 30;
  const interval = req.slotInterval ?? 30;

  // Get property details
  const property = await prisma.property.findFirst({
    where: { id: req.propertyId, companyId: req.companyId },
    select: {
      id: true,
      officeHours: true,
      latitude: true,
      longitude: true,
      agentProperties: {
        include: {
          agent: {
            include: {
              user: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  if (!property) return [];

  // Parse the target date
  const targetDate = new Date(req.date + "T00:00:00");
  const dayOfWeek = targetDate.getDay();
  const dayNames = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const dayKey = dayNames[dayOfWeek];

  // Get office hours for this day
  const officeHours = property.officeHours as Record<
    string,
    { open: string; close: string } | null
  > | null;

  if (!officeHours || !officeHours[dayKey]) return []; // Closed this day

  const { open, close } = officeHours[dayKey]!;

  // Generate candidate time slots
  const candidates = generateTimeSlots(open, close, interval, duration);

  const slots: TimeSlot[] = [];

  // For each agent assigned to this property
  for (const ap of property.agentProperties) {
    const agent = ap.agent;

    // Get all tours for this agent on this date
    const dayStart = new Date(req.date + "T00:00:00");
    const dayEnd = new Date(req.date + "T23:59:59");

    const existingTours = await prisma.tour.findMany({
      where: {
        agentId: agent.id,
        scheduledDate: { gte: dayStart, lte: dayEnd },
        status: { in: ["SCHEDULED", "CONFIRMED", "IN_PROGRESS"] },
      },
      include: {
        property: { select: { latitude: true, longitude: true } },
      },
      orderBy: { scheduledTime: "asc" },
    });

    for (const candidate of candidates) {
      const slotStart = timeToMinutes(candidate.start);
      const slotEnd = slotStart + duration;

      // Check 1: Direct time conflict with existing tours
      const conflict = existingTours.find((tour) => {
        const tourStart = timeToMinutes(tour.scheduledTime);
        const tourEnd = tourStart + tour.duration;
        return slotStart < tourEnd && slotEnd > tourStart;
      });

      if (conflict) {
        slots.push({
          time: candidate.start,
          endTime: candidate.end,
          available: false,
          agentId: agent.id,
          agentName: agent.user.name || "Agent",
          reason: "booked",
        });
        continue;
      }

      // Check 2: Travel time conflicts
      // Find the tour immediately before and after this candidate slot
      const tourBefore = findTourBefore(existingTours, slotStart);
      const tourAfter = findTourAfter(existingTours, slotEnd);

      let travelConflict = false;

      // Check travel time FROM previous tour TO this property
      if (
        tourBefore &&
        tourBefore.property.latitude &&
        tourBefore.property.longitude &&
        property.latitude &&
        property.longitude &&
        tourBefore.propertyId !== property.id // Only check if different property
      ) {
        const travelTime = estimateTravelTime(
          tourBefore.property.latitude,
          tourBefore.property.longitude,
          property.latitude,
          property.longitude,
          agent.transportMode as TransportMode
        );

        const tourBeforeEnd =
          timeToMinutes(tourBefore.scheduledTime) + tourBefore.duration;
        const availableGap = slotStart - tourBeforeEnd;

        if (availableGap < travelTime + agent.bufferMinutes) {
          travelConflict = true;
        }
      }

      // Check travel time FROM this property TO next tour
      if (
        !travelConflict &&
        tourAfter &&
        tourAfter.property.latitude &&
        tourAfter.property.longitude &&
        property.latitude &&
        property.longitude &&
        tourAfter.propertyId !== property.id
      ) {
        const travelTime = estimateTravelTime(
          property.latitude,
          property.longitude,
          tourAfter.property.latitude,
          tourAfter.property.longitude,
          agent.transportMode as TransportMode
        );

        const tourAfterStart = timeToMinutes(tourAfter.scheduledTime);
        const availableGap = tourAfterStart - slotEnd;

        if (availableGap < travelTime + agent.bufferMinutes) {
          travelConflict = true;
        }
      }

      slots.push({
        time: candidate.start,
        endTime: candidate.end,
        available: !travelConflict,
        agentId: agent.id,
        agentName: agent.user.name || "Agent",
        reason: travelConflict ? "travel_conflict" : undefined,
      });
    }
  }

  // Sort by time, then by availability (available first)
  slots.sort((a, b) => {
    const timeCompare = a.time.localeCompare(b.time);
    if (timeCompare !== 0) return timeCompare;
    return a.available === b.available ? 0 : a.available ? -1 : 1;
  });

  return slots;
}

/**
 * Aggregate availability: returns unique time slots where at least one agent is available.
 */
export function aggregateSlots(slots: TimeSlot[]): {
  time: string;
  endTime: string;
  availableAgents: { agentId: string; agentName: string }[];
}[] {
  const grouped = new Map<
    string,
    { endTime: string; agents: { agentId: string; agentName: string; available: boolean }[] }
  >();

  for (const slot of slots) {
    const existing = grouped.get(slot.time);
    if (existing) {
      existing.agents.push({
        agentId: slot.agentId,
        agentName: slot.agentName,
        available: slot.available,
      });
    } else {
      grouped.set(slot.time, {
        endTime: slot.endTime,
        agents: [
          {
            agentId: slot.agentId,
            agentName: slot.agentName,
            available: slot.available,
          },
        ],
      });
    }
  }

  return Array.from(grouped.entries())
    .map(([time, data]) => ({
      time,
      endTime: data.endTime,
      availableAgents: data.agents
        .filter((a) => a.available)
        .map(({ agentId, agentName }) => ({ agentId, agentName })),
    }))
    .filter((slot) => slot.availableAgents.length > 0)
    .sort((a, b) => a.time.localeCompare(b.time));
}

// --- Helpers ---

function generateTimeSlots(
  open: string,
  close: string,
  interval: number,
  duration: number
): { start: string; end: string }[] {
  const slots: { start: string; end: string }[] = [];
  const openMin = timeToMinutes(open);
  const closeMin = timeToMinutes(close);

  for (let start = openMin; start + duration <= closeMin; start += interval) {
    slots.push({
      start: minutesToTime(start),
      end: minutesToTime(start + duration),
    });
  }
  return slots;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

type TourWithProperty = {
  scheduledTime: string;
  duration: number;
  propertyId: string;
  property: { latitude: number | null; longitude: number | null };
};

function findTourBefore(
  tours: TourWithProperty[],
  slotStartMinutes: number
): TourWithProperty | null {
  let closest: TourWithProperty | null = null;
  let closestEnd = -1;

  for (const tour of tours) {
    const tourEnd = timeToMinutes(tour.scheduledTime) + tour.duration;
    if (tourEnd <= slotStartMinutes && tourEnd > closestEnd) {
      closest = tour;
      closestEnd = tourEnd;
    }
  }
  return closest;
}

function findTourAfter(
  tours: TourWithProperty[],
  slotEndMinutes: number
): TourWithProperty | null {
  let closest: TourWithProperty | null = null;
  let closestStart = Infinity;

  for (const tour of tours) {
    const tourStart = timeToMinutes(tour.scheduledTime);
    if (tourStart >= slotEndMinutes && tourStart < closestStart) {
      closest = tour;
      closestStart = tourStart;
    }
  }
  return closest;
}
