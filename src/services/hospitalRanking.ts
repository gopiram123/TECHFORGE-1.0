import { HospitalRankingResult } from '../types/hospital';
import { filterEligibleHospitals, EligibilityOptions } from './hospitalEligibility';
import { Hospital, Coordinates } from '../types/hospital';
import { ProvisionalClassification, EmergencyLevel } from '../types/emergency';

/**
 * Calculates a composite suitability score for an eligible hospital.
 * Note: Travel time is the dominant ranking factor among eligible hospitals,
 * while capability and capacity serve as positive bonuses and travel time serves as a penalty.
 */
function scoreHospital(
  result: ReturnType<typeof filterEligibleHospitals>['eligibleResults'][0],
  emergencyLevel: EmergencyLevel
): {
  totalScore: number;
  breakdown: HospitalRankingResult['breakdown'];
} {
  const { hospital, details } = result;

  // 1. Clinical Match Bonus (0 - 30 points)
  let clinicalMatchScore = 15;
  if (details.matchedCapabilities.length > 1) {
    clinicalMatchScore += (details.matchedCapabilities.length - 1) * 5;
  }

  // 2. Capacity & Readiness Score (0 - 25 points)
  let readinessScore = 10;
  if (hospital.emergencyDepartmentReadiness === 'Ready') {
    readinessScore = 20;
  } else if (hospital.emergencyDepartmentReadiness === 'Busy') {
    readinessScore = 10;
  }

  const capacityScore = Math.min(10, details.netAvailableBeds);

  // 3. Data Freshness Score (0 - 10 points)
  let freshnessScore = 5;
  if (hospital.verificationStatus === 'Verified') {
    freshnessScore = 10;
  } else if (hospital.verificationStatus === 'Demo') {
    freshnessScore = 7;
  }

  // 4. Travel Time Penalty (Dominant operational factor)
  // 1 minute of travel time subtracts 3 points in Critical mode, 2 points in Moderate/General
  const timeWeight = emergencyLevel === 'Critical / Urgent' ? 3.0 : 2.0;
  const timePenalty = details.estimatedTravelTimeMinutes * timeWeight;

  // 5. Distance Penalty (tie-breaker: 0.5 points per km)
  const distancePenalty = details.distanceKm * 0.5;

  // Composite score: Higher is better
  const baseScore = 200; // Baseline offset so score remains positive
  const totalScore = Math.round(
    (baseScore + clinicalMatchScore + readinessScore + capacityScore + freshnessScore - timePenalty - distancePenalty) * 10
  ) / 10;

  return {
    totalScore,
    breakdown: {
      clinicalMatchScore,
      capacityScore,
      readinessScore,
      freshnessScore,
      timePenalty: Math.round(timePenalty * 10) / 10,
      distancePenalty: Math.round(distancePenalty * 10) / 10,
    },
  };
}

/**
 * Ranks all hospitals for an incoming emergency case.
 *
 * Algorithm Workflow:
 * 1. Evaluates and filters hospitals by hard constraints (O(H)).
 * 2. Computes deterministic multi-criteria score for eligible candidates.
 * 3. Sorts eligible hospitals by score descending, breaking ties with lowest travel time and ID (O(H log H)).
 * 4. Synthesizes human-readable operational explanations for recommendations.
 *
 * Time Complexity: O(H log H), where H is the number of hospitals.
 */
export function rankEligibleHospitals(
  hospitals: Hospital[],
  classification: ProvisionalClassification,
  emergencyLevel: EmergencyLevel,
  userLocation: Coordinates,
  options: EligibilityOptions = {}
): {
  rankedEligible: HospitalRankingResult[];
  excludedResults: ReturnType<typeof filterEligibleHospitals>['ineligibleResults'];
} {
  const { eligibleResults, ineligibleResults } = filterEligibleHospitals(
    hospitals,
    classification,
    emergencyLevel,
    userLocation,
    options
  );

  // Score each eligible hospital
  const scoredEligible: HospitalRankingResult[] = eligibleResults.map((result) => {
    const { totalScore, breakdown } = scoreHospital(result, emergencyLevel);

    return {
      hospital: result.hospital,
      rank: 0, // Assigned after sorting
      totalScore,
      breakdown,
      eligibility: result,
      recommendationExplanation: '',
      isTopRecommendation: false,
    };
  });

  // Sort deterministically:
  // 1. Highest total score first (which rewards low travel time + high readiness)
  // 2. Tie-breaker: lowest estimated travel time
  // 3. Tie-breaker: lowest distance
  // 4. Stable tie-breaker: hospital ID
  scoredEligible.sort((a, b) => {
    if (b.totalScore !== a.totalScore) {
      return b.totalScore - a.totalScore;
    }
    if (a.eligibility.details.estimatedTravelTimeMinutes !== b.eligibility.details.estimatedTravelTimeMinutes) {
      return a.eligibility.details.estimatedTravelTimeMinutes - b.eligibility.details.estimatedTravelTimeMinutes;
    }
    if (a.eligibility.details.distanceKm !== b.eligibility.details.distanceKm) {
      return a.eligibility.details.distanceKm - b.eligibility.details.distanceKm;
    }
    return a.hospital.id.localeCompare(b.hospital.id);
  });

  // Assign ranks and generate explainable text
  scoredEligible.forEach((item, index) => {
    item.rank = index + 1;
    item.isTopRecommendation = index === 0;

    const h = item.hospital;
    const d = item.eligibility.details;
    const caps = d.matchedCapabilities.join(', ');

    if (item.isTopRecommendation) {
      item.recommendationExplanation = `Recommended: required specialist available, ${d.netAvailableBeds} beds available in demo data, and shortest estimated travel time (~${d.estimatedTravelTimeMinutes} mins) among eligible hospitals.`;
    } else {
      item.recommendationExplanation = `Suitable alternative (Rank #${item.rank}): required specialist available, ${d.netAvailableBeds} beds available in demo data, with ~${d.estimatedTravelTimeMinutes} mins estimated travel time.`;
    }
  });

  return {
    rankedEligible: scoredEligible,
    excludedResults: ineligibleResults,
  };
}
