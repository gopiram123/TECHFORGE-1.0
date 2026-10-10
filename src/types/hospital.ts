export type VerificationStatus = 'Demo' | 'Verified' | 'Stale' | 'Unknown';

export type EDReadiness = 'Ready' | 'Busy' | 'Diverting' | 'Critical';

export type TrafficCondition = 'low' | 'moderate' | 'heavy' | 'severe';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Hospital {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone?: string;
  
  // Clinical capabilities
  supportedSpecialties: string[];
  emergencyCapabilities: string[]; // e.g. 'cardiac_care', 'trauma_center', 'icu_respiratory', 'stroke_unit', 'burn_unit', 'emergency_room', 'pediatric_icu'
  
  // Operational readiness
  emergencyDepartmentReadiness: EDReadiness;
  
  // Capacity
  totalBeds: number;
  availableBeds: number;
  reservedBeds: number;
  
  // Specialists currently on duty (true = available, false = unavailable)
  specialistAvailability: Record<string, boolean>; // e.g. { cardiologist: true, trauma_surgeon: false }
  
  // Ambulance support
  simulatedAmbulanceSupport: boolean;
  
  // Environmental & travel factors
  simulatedTrafficCondition: TrafficCondition;
  estimatedTravelTime: number; // in minutes (calculated or base simulated)
  
  // Data governance & provenance
  lastUpdated: string; // ISO 8601
  dataSourceLabel: string; // e.g. 'Simulated Demo Feed', 'Verified Partner Feed'
  verificationStatus: VerificationStatus;
  
  // Operational status (Open, Temporarily Unavailable, Closed)
  operatingStatus?: 'Open' | 'Temporarily Unavailable' | 'Closed';

  // Admin access control
  adminUid?: string;

  // Demo / verified indicator
  isDemo?: boolean;

  // Metadata for demo
  notes?: string;
}

export interface HospitalEligibilityResult {
  hospital: Hospital;
  isEligible: boolean;
  reasons: string[]; // reasons for inclusion or exclusion
  failedConstraints: {
    capabilityFailed: boolean;
    specialistFailed: boolean;
    capacityFailed: boolean;
    readinessFailed: boolean;
    freshnessFailed: boolean;
    distanceFailed: boolean;
  };
  details: {
    matchedCapabilities: string[];
    missingCapabilities: string[];
    missingSpecialists: string[];
    netAvailableBeds: number;
    distanceKm: number;
    estimatedTravelTimeMinutes: number;
  };
}

export interface HospitalRankingResult {
  hospital: Hospital;
  rank: number;
  totalScore: number;
  breakdown: {
    clinicalMatchScore: number;
    capacityScore: number;
    readinessScore: number;
    freshnessScore: number;
    timePenalty: number;
    distancePenalty: number;
  };
  eligibility: HospitalEligibilityResult;
  recommendationExplanation: string;
  isTopRecommendation: boolean;
}
