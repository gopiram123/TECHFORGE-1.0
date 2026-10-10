import { Hospital, EDReadiness } from './hospital';

export interface HospitalAdminUser {
  uid: string;
  email: string;
  displayName: string;
  hospitalId: string; // The authorized hospital ID this admin can manage
  hospitalName: string;
  role: 'hospital_admin' | 'platform_admin' | 'demo_admin';
  assignedAt?: string;
  isDemo?: boolean;
}

export interface HospitalProfileFormData {
  name: string;
  phone: string;
  address: string;
  latitude: number;
  longitude: number;
  totalBeds: number;
  availableBeds: number;
  operatingStatus: 'Open' | 'Temporarily Unavailable' | 'Closed';
  emergencyDepartmentReadiness: EDReadiness;
  simulatedAmbulanceSupport: boolean;
  supportedSpecialties: string[];
  emergencyCapabilities: string[];
  specialistAvailability: Record<string, boolean>;
  notes?: string;
}

export interface HospitalValidationErrors {
  name?: string;
  phone?: string;
  address?: string;
  latitude?: string;
  longitude?: string;
  totalBeds?: string;
  availableBeds?: string;
  general?: string;
}
