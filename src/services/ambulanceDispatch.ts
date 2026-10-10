import { Ambulance, AmbulanceStatus } from '../types/ambulance';
import { EmergencyRequest } from '../types/emergency';
import { Hospital } from '../types/hospital';
import { calculateHaversineDistanceKm } from '../utils/distance';
import { calculateSimulatedTravelTimeMinutes } from '../utils/timeEstimation';

export interface DispatchMatchResult {
  matchedAmbulance?: Ambulance;
  score: number;
  pickupTimeMinutes: number;
  hospitalArrivalMinutes: number;
  reason: string;
}

/**
 * Service for matching, assigning, confirming, and releasing simulated ambulances.
 */
export class AmbulanceDispatchService {
  /**
   * Scans available ambulances to find the most suitable vehicle for an emergency request.
   *
   * Matching Criteria:
   * 1. Status must be 'Available'.
   * 2. Capability matching: Prefers exact type (e.g. ALS, Mobile ICU) for Critical cases.
   * 3. Proximity to patient: Shortest estimated pickup time.
   *
   * Time Complexity: O(A), where A is the number of ambulances.
   */
  public static findBestAmbulance(
    ambulances: Ambulance[],
    request: EmergencyRequest,
    targetHospital: Hospital
  ): DispatchMatchResult {
    const available = ambulances.filter((a) => a.status === 'Available');

    if (available.length === 0) {
      return {
        score: 0,
        pickupTimeMinutes: 0,
        hospitalArrivalMinutes: 0,
        reason: 'No ambulances currently available in the active fleet.',
      };
    }

    const requiredType = request.classification.suggestedAmbulanceType;
    let bestAmbulance: Ambulance | undefined;
    let minPickupTime = Infinity;
    let bestReason = '';

    for (const amb of available) {
      const distanceToPatient = calculateHaversineDistanceKm(
        amb.currentLocation,
        request.userLocation
      );

      const pickupMinutes = calculateSimulatedTravelTimeMinutes(
        distanceToPatient,
        'low', // Ambulances use priority driving
        true
      );

      // Capability compatibility score
      let typeMatchBonus = 0;
      if (amb.type === requiredType) {
        typeMatchBonus = -3; // 3 minute preference for exact type match
      } else if (
        request.emergencyLevel === 'Critical / Urgent' &&
        amb.type === 'Basic Life Support (BLS)'
      ) {
        typeMatchBonus = 5; // Penalty for basic unit in critical emergency
      }

      const effectiveEvaluationTime = pickupMinutes + typeMatchBonus;

      if (effectiveEvaluationTime < minPickupTime) {
        minPickupTime = effectiveEvaluationTime;
        bestAmbulance = amb;
        bestReason = `Unit ${amb.id} (${amb.type}) located at ${amb.locationName}: estimated ${pickupMinutes} min pickup time to patient.`;
      }
    }

    if (!bestAmbulance) {
      return {
        score: 0,
        pickupTimeMinutes: 0,
        hospitalArrivalMinutes: 0,
        reason: 'Could not select an available ambulance.',
      };
    }

    const patientToHospitalDist = calculateHaversineDistanceKm(
      request.userLocation,
      { latitude: targetHospital.latitude, longitude: targetHospital.longitude }
    );
    const transitToHospitalMinutes = calculateSimulatedTravelTimeMinutes(
      patientToHospitalDist,
      targetHospital.simulatedTrafficCondition,
      true
    );

    const actualPickupMinutes = calculateSimulatedTravelTimeMinutes(
      calculateHaversineDistanceKm(bestAmbulance.currentLocation, request.userLocation),
      'low',
      true
    );

    return {
      matchedAmbulance: bestAmbulance,
      score: 100 - minPickupTime,
      pickupTimeMinutes: actualPickupMinutes,
      hospitalArrivalMinutes: actualPickupMinutes + transitToHospitalMinutes,
      reason: bestReason,
    };
  }

  /**
   * Assigns an ambulance to a request.
   * Enforces that an ambulance cannot be assigned to multiple active cases.
   */
  public static assignAmbulance(
    ambulance: Ambulance,
    request: EmergencyRequest,
    targetHospital: Hospital
  ): { updatedAmbulance: Ambulance; error?: string } {
    if (ambulance.status !== 'Available') {
      return {
        updatedAmbulance: ambulance,
        error: `Ambulance ${ambulance.id} is already in state "${ambulance.status}" and cannot be assigned.`,
      };
    }

    const updatedAmbulance: Ambulance = {
      ...ambulance,
      status: 'Assigned',
      currentAssignment: {
        requestId: request.id,
        patientName: 'Emergency Patient (Triage Ref)',
        patientProblem: request.patientProblem,
        assignedHospitalId: targetHospital.id,
        assignedHospitalName: targetHospital.name,
        assignedAt: new Date().toISOString(),
      },
      lastUpdated: new Date().toISOString(),
    };

    return { updatedAmbulance };
  }

  /**
   * Updates an ambulance's operational status.
   */
  public static updateAmbulanceStatus(
    ambulance: Ambulance,
    newStatus: AmbulanceStatus
  ): Ambulance {
    const updated: Ambulance = {
      ...ambulance,
      status: newStatus,
      lastUpdated: new Date().toISOString(),
    };

    if (newStatus === 'Available' || newStatus === 'Completed') {
      delete updated.currentAssignment;
    }

    return updated;
  }
}
