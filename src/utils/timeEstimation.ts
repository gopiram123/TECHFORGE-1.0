import { TrafficCondition } from '../types/hospital';

/**
 * Traffic multiplier constants for simulated urban routes.
 */
export const TRAFFIC_MULTIPLIERS: Record<TrafficCondition, number> = {
  low: 1.0,
  moderate: 1.3,
  heavy: 1.8,
  severe: 2.5,
};

/**
 * Baseline urban emergency travel speed (km/h) under normal uncongested conditions.
 */
const BASE_URBAN_SPEED_KMH = 35.0;

/**
 * Urban road detour factor: accounts for real-world grid network versus straight-line Euclidean distance.
 */
const URBAN_DETOUR_FACTOR = 1.35;

/**
 * Calculates simulated travel time in minutes based on straight-line distance and traffic conditions.
 *
 * Formula:
 * effectiveRoadDistance = distanceKm * URBAN_DETOUR_FACTOR
 * speedKmh = BASE_URBAN_SPEED_KMH / TRAFFIC_MULTIPLIERS[trafficCondition]
 * timeMinutes = (effectiveRoadDistance / speedKmh) * 60 + baseDispatchDelayMinutes
 *
 * Time Complexity: O(1)
 */
export function calculateSimulatedTravelTimeMinutes(
  distanceKm: number,
  trafficCondition: TrafficCondition = 'moderate',
  isEmergencyAmbulance: boolean = true
): number {
  if (distanceKm <= 0) return 2; // minimum on-scene/immediate delay

  const detourDistance = distanceKm * URBAN_DETOUR_FACTOR;
  const trafficFactor = TRAFFIC_MULTIPLIERS[trafficCondition] || 1.3;
  
  // Emergency ambulances with sirens move approximately 15% faster through traffic
  const sirenAdvantage = isEmergencyAmbulance ? 0.85 : 1.0;

  const baseSpeed = BASE_URBAN_SPEED_KMH;
  const effectiveSpeed = Math.max(10, baseSpeed / trafficFactor); // speed floor of 10 km/h

  const travelMinutes = (detourDistance / effectiveSpeed) * 60 * sirenAdvantage;
  const basePrepDelay = 2.0; // 2 min staging/turnout

  return Math.max(3, Math.round(travelMinutes + basePrepDelay));
}

/**
 * Calculates the total estimated response timeline:
 * Total Response Time = Ambulance-to-Patient Pickup ETA + Patient-to-Hospital Transit ETA.
 */
export function calculateTotalResponseTime(
  pickupMinutes: number,
  hospitalTransitMinutes: number
): {
  pickupMinutes: number;
  hospitalTransitMinutes: number;
  totalMinutes: number;
  label: string;
} {
  const total = Math.round(pickupMinutes + hospitalTransitMinutes);
  return {
    pickupMinutes: Math.round(pickupMinutes),
    hospitalTransitMinutes: Math.round(hospitalTransitMinutes),
    totalMinutes: total,
    label: `Simulated ETA: ~${total} mins (${pickupMinutes}m pickup + ${hospitalTransitMinutes}m transit)`,
  };
}
