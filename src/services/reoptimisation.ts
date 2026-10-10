import { Hospital, HospitalRankingResult } from '../types/hospital';
import { EmergencyRequest } from '../types/emergency';
import { rankEligibleHospitals } from './hospitalRanking';

export interface ReoptimisationChangeSummary {
  recalculatedAt: string;
  triggerReason: string;
  previousTopHospitalId?: string;
  previousTopHospitalName?: string;
  newTopHospitalId?: string;
  newTopHospitalName?: string;
  didTopRecommendationChange: boolean;
  explanation: string;
}

export interface ReoptimisationResult {
  newRankedEligible: HospitalRankingResult[];
  newExcludedResults: ReturnType<typeof rankEligibleHospitals>['excludedResults'];
  summary: ReoptimisationChangeSummary;
}

/**
 * Re-evaluates hospital rankings and determines whether the active recommendation shifted.
 */
export function reoptimiseRecommendations(
  hospitals: Hospital[],
  activeRequest: EmergencyRequest,
  previousRecommendations: HospitalRankingResult[] = [],
  triggerReason: string = 'Environmental / telemetry condition changed'
): ReoptimisationResult {
  const previousTop = previousRecommendations.length > 0 ? previousRecommendations[0] : undefined;

  const { rankedEligible, excludedResults } = rankEligibleHospitals(
    hospitals,
    activeRequest.classification,
    activeRequest.emergencyLevel,
    activeRequest.userLocation
  );

  const newTop = rankedEligible.length > 0 ? rankedEligible[0] : undefined;

  const didTopRecommendationChange =
    (previousTop?.hospital.id !== newTop?.hospital.id);

  let explanation = '';
  if (!previousTop && newTop) {
    explanation = `Initial recommendation established: ${newTop.hospital.name} ranked #1 with ${newTop.eligibility.details.netAvailableBeds} available beds.`;
  } else if (previousTop && !newTop) {
    explanation = `ALERT: Previously recommended hospital (${previousTop.hospital.name}) became unavailable, and NO other hospital in the dataset meets clinical requirements. Contact emergency dispatch immediately!`;
  } else if (didTopRecommendationChange && previousTop && newTop) {
    explanation = `RECOMMENDATION CHANGED: Switched from "${previousTop.hospital.name}" to "${newTop.hospital.name}". Reason: ${triggerReason}. ${newTop.recommendationExplanation}`;
  } else if (newTop) {
    explanation = `Rankings reaffirmed after update: "${newTop.hospital.name}" remains the optimal choice (~${newTop.eligibility.details.estimatedTravelTimeMinutes} mins travel time).`;
  } else {
    explanation = 'No eligible hospital available.';
  }

  return {
    newRankedEligible: rankedEligible,
    newExcludedResults: excludedResults,
    summary: {
      recalculatedAt: new Date().toISOString(),
      triggerReason,
      previousTopHospitalId: previousTop?.hospital.id,
      previousTopHospitalName: previousTop?.hospital.name,
      newTopHospitalId: newTop?.hospital.id,
      newTopHospitalName: newTop?.hospital.name,
      didTopRecommendationChange,
      explanation,
    },
  };
}
