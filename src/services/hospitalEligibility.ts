import { Hospital, HospitalEligibilityResult, Coordinates } from '../types/hospital';
import { ProvisionalClassification, EmergencyLevel } from '../types/emergency';
import { calculateHaversineDistanceKm } from '../utils/distance';
import { calculateSimulatedTravelTimeMinutes } from '../utils/timeEstimation';

export interface EligibilityOptions {
  maxDistanceKm?: number;
  maxTravelTimeMinutes?: number;
  allowStaleData?: boolean;
}

/**
 * Evaluates whether a hospital meets all essential hard constraints for a given emergency case.
 *
 * Hard Constraints Enforced:
 * 1. Essential Clinical Emergency Capabilities (e.g., cardiac_care, trauma_center, stroke_unit)
 * 2. Specialist Availability (must have essential on-duty doctor when required)
 * 3. Net Reservable Capacity (availableBeds - reservedBeds > 0)
 * 4. Emergency Department Readiness (Cannot accept cases if ED is 'Diverting')
 * 5. Data Freshness & Verification (Cannot treat 'Stale' or 'Unknown' feeds as confirmed)
 * 6. Geographic / Travel Time Feasibility
 *
 * Time Complexity for H hospitals: O(H * C), where C is the number of required capabilities.
 */
export function evaluateHospitalEligibility(
  hospital: Hospital,
  classification: ProvisionalClassification,
  emergencyLevel: EmergencyLevel,
  userLocation: Coordinates,
  options: EligibilityOptions = {}
): HospitalEligibilityResult {
  const reasons: string[] = [];
  const failedConstraints = {
    capabilityFailed: false,
    specialistFailed: false,
    capacityFailed: false,
    readinessFailed: false,
    freshnessFailed: false,
    distanceFailed: false,
  };

  const distanceKm = calculateHaversineDistanceKm(userLocation, {
    latitude: hospital.latitude,
    longitude: hospital.longitude,
  });

  const estimatedTravelTimeMinutes = calculateSimulatedTravelTimeMinutes(
    distanceKm,
    hospital.simulatedTrafficCondition,
    emergencyLevel === 'Critical / Urgent'
  );

  // 1. Capability Check: Hospital must possess all required capabilities
  const matchedCapabilities = classification.requiredCapabilities.filter((cap) =>
    hospital.emergencyCapabilities.includes(cap)
  );
  const missingCapabilities = classification.requiredCapabilities.filter(
    (cap) => !hospital.emergencyCapabilities.includes(cap)
  );

  if (missingCapabilities.length > 0) {
    failedConstraints.capabilityFailed = true;
    reasons.push(
      `Missing required clinical capabilities: [${missingCapabilities.join(', ')}].`
    );
  }

  // 2. Specialist Availability Check: When required specialist is designated, must be on duty
  const missingSpecialists = classification.requiredSpecialists.filter((spec) => {
    // specialist availability is explicitly false
    return hospital.specialistAvailability[spec] !== true;
  });

  if (missingSpecialists.length > 0) {
    failedConstraints.specialistFailed = true;
    reasons.push(
      `Essential specialists currently unavailable on duty: [${missingSpecialists.join(', ')}].`
    );
  }

  // 3. Capacity Check: Net available beds (availableBeds - reservedBeds) must be > 0
  const netAvailableBeds = Math.max(0, hospital.availableBeds - hospital.reservedBeds);
  if (netAvailableBeds <= 0) {
    failedConstraints.capacityFailed = true;
    reasons.push(
      `Zero available capacity: ${hospital.availableBeds} unassigned beds with ${hospital.reservedBeds} active reservations.`
    );
  }

  // 4. Operational & ED Readiness Check
  if (hospital.operatingStatus === 'Closed') {
    failedConstraints.readinessFailed = true;
    reasons.push('Hospital operational status is Closed (not accepting emergency patients).');
  } else if (hospital.operatingStatus === 'Temporarily Unavailable') {
    failedConstraints.readinessFailed = true;
    reasons.push('Hospital is Temporarily Unavailable (admissions suspended).');
  } else if (hospital.emergencyDepartmentReadiness === 'Diverting') {
    failedConstraints.readinessFailed = true;
    reasons.push('Emergency Department is currently under diversion protocol (Diverting).');
  }

  // 5. Data Freshness Check: Cannot confirm unverified or stale data as live available
  if (hospital.verificationStatus === 'Stale') {
    if (!options.allowStaleData) {
      failedConstraints.freshnessFailed = true;
      reasons.push('Hospital capacity telemetry is stale (>48 hrs unverified).');
    }
  } else if (hospital.verificationStatus === 'Unknown') {
    failedConstraints.freshnessFailed = true;
    reasons.push('Hospital operational status is unknown and unverified.');
  }

  // 6. Perimeter check (optional upper bound, e.g. > 100km)
  const maxDistance = options.maxDistanceKm ?? 80;
  if (distanceKm > maxDistance) {
    failedConstraints.distanceFailed = true;
    reasons.push(`Hospital is outside maximum emergency transport perimeter (${distanceKm} km > ${maxDistance} km).`);
  }

  const isEligible =
    !failedConstraints.capabilityFailed &&
    !failedConstraints.specialistFailed &&
    !failedConstraints.capacityFailed &&
    !failedConstraints.readinessFailed &&
    !failedConstraints.freshnessFailed &&
    !failedConstraints.distanceFailed;

  if (isEligible) {
    reasons.push(
      `Meets all clinical criteria: [${matchedCapabilities.join(', ')}], specialists confirmed, ${netAvailableBeds} net beds available.`
    );
  }

  return {
    hospital,
    isEligible,
    reasons,
    failedConstraints,
    details: {
      matchedCapabilities,
      missingCapabilities,
      missingSpecialists,
      netAvailableBeds,
      distanceKm,
      estimatedTravelTimeMinutes,
    },
  };
}

/**
 * Filters an entire list of hospitals down to eligible candidates.
 * Time Complexity: O(H) where H is the number of hospitals.
 */
export function filterEligibleHospitals(
  hospitals: Hospital[],
  classification: ProvisionalClassification,
  emergencyLevel: EmergencyLevel,
  userLocation: Coordinates,
  options: EligibilityOptions = {}
): {
  eligibleResults: HospitalEligibilityResult[];
  ineligibleResults: HospitalEligibilityResult[];
} {
  const eligibleResults: HospitalEligibilityResult[] = [];
  const ineligibleResults: HospitalEligibilityResult[] = [];

  for (const hospital of hospitals) {
    const result = evaluateHospitalEligibility(
      hospital,
      classification,
      emergencyLevel,
      userLocation,
      options
    );
    if (result.isEligible) {
      eligibleResults.push(result);
    } else {
      ineligibleResults.push(result);
    }
  }

  return { eligibleResults, ineligibleResults };
}
