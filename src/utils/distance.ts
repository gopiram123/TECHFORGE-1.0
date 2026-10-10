import { Coordinates } from '../types/hospital';

/**
 * Checks whether coordinates are non-null and within valid Earth lat/lng ranges.
 */
export function isValidCoordinates(coord?: Coordinates | null): boolean {
  if (!coord) return false;
  const { latitude, longitude } = coord;
  if (typeof latitude !== 'number' || typeof longitude !== 'number') return false;
  if (isNaN(latitude) || isNaN(longitude)) return false;
  return latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180 && (latitude !== 0 || longitude !== 0);
}

/**
 * Calculates the great-circle distance between two points on the Earth's surface
 * using the Haversine formula.
 *
 * Formula:
 * a = sin²(Δlat/2) + cos(lat1) * cos(lat2) * sin²(Δlon/2)
 * c = 2 * atan2(√a, √(1−a))
 * d = R * c
 *
 * Where:
 * - R = 6,371 km (Earth's mean spherical radius)
 * - lat1, lat2, lon1, lon2 in radians
 *
 * Time Complexity: O(1)
 *
 * @param coord1 First coordinate (latitude, longitude)
 * @param coord2 Second coordinate (latitude, longitude)
 * @returns Straight-line distance in kilometers, rounded to 2 decimal places.
 */
export function calculateHaversineDistanceKm(
  coord1: Coordinates,
  coord2: Coordinates
): number {
  if (
    coord1.latitude === coord2.latitude &&
    coord1.longitude === coord2.longitude
  ) {
    return 0;
  }

  const R = 6371.0; // Earth mean radius in kilometers
  const toRad = (deg: number) => (deg * Math.PI) / 180.0;

  const lat1Rad = toRad(coord1.latitude);
  const lat2Rad = toRad(coord2.latitude);
  const deltaLat = toRad(coord2.latitude - coord1.latitude);
  const deltaLon = toRad(coord2.longitude - coord1.longitude);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1Rad) *
      Math.cos(lat2Rad) *
      Math.sin(deltaLon / 2) *
      Math.sin(deltaLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 100) / 100;
}

/**
 * Generates an external Google Maps directions link.
 * 
 * If valid origin coordinates are provided, generates origin-to-destination routing.
 * If origin is unavailable, opens the destination coordinate directly without inventing an origin.
 */
export function getGoogleMapsDirectionsUrl(
  destination: Coordinates,
  origin?: Coordinates
): string {
  if (isValidCoordinates(origin)) {
    return `https://www.google.com/maps/dir/?api=1&origin=${origin!.latitude},${origin!.longitude}&destination=${destination.latitude},${destination.longitude}&travelmode=driving`;
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${destination.latitude},${destination.longitude}`;
}
