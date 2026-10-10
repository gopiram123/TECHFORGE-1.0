import { EmergencyRequest } from '../types/emergency';
import { DEMO_USER_LOCATION } from './demoHospitals';

/**
 * Pre-seeded emergency queue requests to demonstrate multi-acuity queueing and priority re-ordering.
 */
export const INITIAL_DEMO_REQUESTS: EmergencyRequest[] = [
  {
    id: 'REQ-DEMO-001',
    patientProblem: 'Severe compound fracture and deep bleeding from motorcycle crash',
    emergencyLevel: 'Critical / Urgent',
    timestamp: '2026-10-10T11:15:30.000Z',
    userLocation: DEMO_USER_LOCATION,
    locationType: 'Simulated Demo Coordinates',
    locationAddress: 'Panjagutta Flyover Pier 14, Demo City',
    classification: {
      category: 'trauma_critical',
      categoryLabel: 'Trauma & Emergency Surgical Requirement',
      matchedRuleId: 'RULE_ROAD_ACCIDENT_TRAUMA',
      matchedKeywords: ['motorcycle', 'crash', 'fracture', 'bleeding'],
      requiredCapabilities: ['trauma_center', 'emergency_room'],
      requiredSpecialists: ['trauma_surgeon'],
      suggestedAmbulanceType: 'Advanced Life Support (ALS)',
      isLifeThreatening: true,
      explanation: 'Matched rule RULE_ROAD_ACCIDENT_TRAUMA: Polytrauma keywords detected requiring level-1 surgical resuscitation.',
    },
    status: 'Ambulance_Dispatched',
    assignedHospitalId: 'HOSP-004',
    assignedHospitalName: 'Memorial Super Specialty Trauma Hospital',
    assignedAmbulanceId: 'AMB-04',
    dispatcherNotes: 'ALS unit en route; trauma bay 1 pre-alerted.',
  },
  {
    id: 'REQ-DEMO-002',
    patientProblem: 'Persistent high fever (103°F) and severe abdominal cramping for 2 days',
    emergencyLevel: 'Moderate',
    timestamp: '2026-10-10T11:18:10.000Z',
    userLocation: DEMO_USER_LOCATION,
    locationType: 'Simulated Demo Coordinates',
    locationAddress: 'Green Avenue Apt 4B, Sector 2, Demo City',
    classification: {
      category: 'general_fever_infection',
      categoryLabel: 'General Medical / Emergency Assessment Requirement',
      matchedRuleId: 'RULE_FEVER_INFECTION',
      matchedKeywords: ['fever', 'cramping'],
      requiredCapabilities: ['emergency_room'],
      requiredSpecialists: ['general_physician'],
      suggestedAmbulanceType: 'Basic Life Support (BLS)',
      isLifeThreatening: false,
      explanation: 'Matched rule RULE_FEVER_INFECTION: High fever and abdominal discomfort requiring ER medical workup.',
    },
    status: 'Pending',
    dispatcherNotes: 'Awaiting bed allocation at nearest general acute care hospital.',
  },
  {
    id: 'REQ-DEMO-003',
    patientProblem: 'Mild wrist sprain after slipping on stairway, no visible deformity',
    emergencyLevel: 'General',
    timestamp: '2026-10-10T11:12:00.000Z', // Arrived earlier, but lower triage priority than Critical/Moderate!
    userLocation: DEMO_USER_LOCATION,
    locationType: 'Simulated Demo Coordinates',
    locationAddress: 'Oakwood Residence Block C, Demo City',
    classification: {
      category: 'minor_ortho_general',
      categoryLabel: 'General Outpatient / Minor Injury Assessment',
      matchedRuleId: 'RULE_GENERAL_MINOR',
      matchedKeywords: ['sprain', 'slipping'],
      requiredCapabilities: ['emergency_room'],
      requiredSpecialists: ['general_physician'],
      suggestedAmbulanceType: 'Basic Life Support (BLS)',
      isLifeThreatening: false,
      explanation: 'Matched rule RULE_GENERAL_MINOR: Low acuity ambulatory complaint.',
    },
    status: 'Pending',
    dispatcherNotes: 'General priority; scheduled behind urgent cases.',
  },
];
