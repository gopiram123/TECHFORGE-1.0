import { Coordinates, HospitalRankingResult } from './hospital';

export type EmergencyLevel = 'Critical / Urgent' | 'Moderate' | 'General';

export interface ProvisionalClassification {
  category: string;
  categoryLabel: string;
  matchedRuleId: string;
  matchedKeywords: string[];
  requiredCapabilities: string[];
  requiredSpecialists: string[];
  suggestedAmbulanceType: 'Advanced Life Support (ALS)' | 'Basic Life Support (BLS)' | 'Mobile ICU';
  isLifeThreatening: boolean;
  explanation: string;
}

export interface EmergencyRequest {
  id: string;
  patientProblem: string;
  emergencyLevel: EmergencyLevel;
  timestamp: string; // ISO string
  userLocation: Coordinates;
  locationType: 'Real Browser Geolocation' | 'User Provided' | 'Simulated Demo Coordinates';
  locationAddress: string;
  
  // Rule-based classification
  classification: ProvisionalClassification;
  
  // Results
  status: 'Pending' | 'Triaged' | 'Hospital_Selected' | 'Ambulance_Dispatched' | 'Completed' | 'Cancelled';
  assignedHospitalId?: string;
  assignedHospitalName?: string;
  assignedAmbulanceId?: string;
  recommendations?: HospitalRankingResult[];
  
  // Audit
  dispatcherNotes?: string;
}
