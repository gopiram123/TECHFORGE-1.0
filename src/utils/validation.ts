import { EmergencyLevel } from '../types/emergency';

export interface FormValidationResult {
  isValid: boolean;
  errors: {
    patientProblem?: string;
    emergencyLevel?: string;
  };
}

/**
 * Validates the primary 2-field user emergency request.
 * Browser location permission is optional and NOT a mandatory field.
 */
export function validateEmergencyRequest(
  problem: string,
  level: string
): FormValidationResult {
  const errors: { patientProblem?: string; emergencyLevel?: string } = {};

  const trimmedProblem = (problem || '').trim();
  if (!trimmedProblem) {
    errors.patientProblem = 'Please describe the patient\'s problem or chief complaint (e.g., chest pain, road accident, fever).';
  } else if (trimmedProblem.length < 2) {
    errors.patientProblem = 'Description must be at least 2 characters long.';
  }

  const validLevels: EmergencyLevel[] = [
    'Critical / Urgent',
    'Moderate',
    'General',
  ];
  if (!level || !validLevels.includes(level as EmergencyLevel)) {
    errors.emergencyLevel = 'Please select a valid emergency triage level.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export interface HospitalValidationErrors {
  name?: string;
  phone?: string;
  address?: string;
  latitude?: string;
  longitude?: string;
  totalBeds?: string;
  availableBeds?: string;
  operatingStatus?: string;
  general?: string;
}

/**
 * Validates hospital admin profile and capacity updates.
 * Strict rules:
 * - Available beds cannot be negative.
 * - Available beds cannot exceed total capacity.
 * - Total beds must be greater than zero.
 * - Geographic coordinates must be valid.
 */
export function validateHospitalProfile(
  data: {
    name?: string;
    phone?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    totalBeds?: number;
    availableBeds?: number;
    operatingStatus?: string;
  }
): { isValid: boolean; errors: HospitalValidationErrors } {
  const errors: HospitalValidationErrors = {};

  if (!data.name || data.name.trim().length === 0) {
    errors.name = 'Hospital name is required.';
  }

  if (!data.phone || data.phone.trim().length === 0) {
    errors.phone = 'Emergency dispatch contact phone number is required.';
  }

  if (!data.address || data.address.trim().length === 0) {
    errors.address = 'Hospital physical street address is required.';
  }

  if (data.latitude === undefined || isNaN(data.latitude) || data.latitude < -90 || data.latitude > 90) {
    errors.latitude = 'Valid latitude between -90 and 90 is required.';
  }

  if (data.longitude === undefined || isNaN(data.longitude) || data.longitude < -180 || data.longitude > 180) {
    errors.longitude = 'Valid longitude between -180 and 180 is required.';
  }

  if (data.totalBeds === undefined || isNaN(data.totalBeds) || data.totalBeds < 1) {
    errors.totalBeds = 'Total bed capacity must be at least 1.';
  }

  if (data.availableBeds === undefined || isNaN(data.availableBeds)) {
    errors.availableBeds = 'Currently available beds count is required.';
  } else if (data.availableBeds < 0) {
    errors.availableBeds = 'Available beds count cannot be negative.';
  } else if (data.totalBeds !== undefined && data.availableBeds > data.totalBeds) {
    errors.availableBeds = `Available beds (${data.availableBeds}) cannot exceed total capacity (${data.totalBeds}).`;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

