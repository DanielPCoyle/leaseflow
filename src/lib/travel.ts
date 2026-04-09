import { TransportMode } from "@/generated/prisma/client";

/**
 * Simple travel time estimation between two coordinates.
 * Uses straight-line distance with mode-based speed multipliers.
 *
 * For v1, this avoids Google Maps API costs. Can be upgraded to
 * Google Distance Matrix API later for real route-based estimates.
 */

// Average speeds in mph by transport mode
const SPEED_MPH: Record<TransportMode, number> = {
  CAR: 20,      // City driving average
  TRANSIT: 12,  // Including wait times
  BIKE: 10,
  WALK: 3,
};

// Overhead minutes per mode (parking, walking to entrance, etc.)
const OVERHEAD_MINUTES: Record<TransportMode, number> = {
  CAR: 10,     // Parking + walk
  TRANSIT: 5,  // Walk to/from stop
  BIKE: 3,     // Lock up bike
  WALK: 0,
};

/**
 * Calculate straight-line distance between two points in miles
 * using the Haversine formula.
 */
function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 3959; // Earth radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Estimate travel time in minutes between two coordinates.
 * Applies a 1.4x multiplier to straight-line distance to approximate
 * real road/path distance (Manhattan distance correction).
 */
export function estimateTravelTime(
  fromLat: number, fromLon: number,
  toLat: number, toLon: number,
  mode: TransportMode
): number {
  const straightLine = haversineDistance(fromLat, fromLon, toLat, toLon);
  const roadDistance = straightLine * 1.4; // Road correction factor
  const travelMinutes = (roadDistance / SPEED_MPH[mode]) * 60;
  return Math.ceil(travelMinutes + OVERHEAD_MINUTES[mode]);
}

/**
 * Check if an agent has enough travel time between two appointments.
 */
export function hasEnoughTravelTime(
  fromLat: number, fromLon: number,
  toLat: number, toLon: number,
  mode: TransportMode,
  bufferMinutes: number,
  availableMinutes: number
): boolean {
  const needed = estimateTravelTime(fromLat, fromLon, toLat, toLon, mode);
  return availableMinutes >= needed + bufferMinutes;
}
