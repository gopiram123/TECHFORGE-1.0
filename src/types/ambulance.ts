import { Coordinates } from './hospital';

export type AmbulanceStatus = 'Available' | 'Assigned' | 'En Route' | 'Completed';

export interface Ambulance {
  id: string;
  vehicleNumber: string;
  type: 'Advanced Life Support (ALS)' | 'Basic Life Support (BLS)' | 'Mobile ICU';
  currentLocation: Coordinates;
  locationName: string;
  status: AmbulanceStatus;
  currentAssignment?: {
    requestId: string;
    patientName: string;
    patientProblem: string;
    assignedHospitalId: string;
    assignedHospitalName: string;
    assignedAt: string;
  };
  estimatedPickupMinutes: number;
  estimatedHospitalArrivalMinutes: number;
  lastUpdated: string;
  verificationStatus: 'Simulated' | 'Verified' | 'Offline';
}
