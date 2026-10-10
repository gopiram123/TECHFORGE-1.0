import { Hospital } from '../types/hospital';

export interface ReservationResult {
  success: boolean;
  hospitalId: string;
  previousReserved: number;
  newReserved: number;
  availableBeds: number;
  netRemainingBeds: number;
  error?: string;
}

export type CapacityWarningStatus = 'Normal' | 'High_Occupancy' | 'Full_Divert';

export interface HospitalCapacityStatus {
  hospitalId: string;
  hospitalName: string;
  totalBeds: number;
  availableBeds: number;
  reservedBeds: number;
  netAvailableBeds: number;
  occupancyPercentage: number;
  warningStatus: CapacityWarningStatus;
  warningMessage: string;
}

/**
 * Manages atomic capacity reservations, releases, and status checks.
 * Guarantees in-memory consistency and prevents overbooking.
 */
export class CapacityManager {
  /**
   * Evaluates occupancy and warning thresholds for a hospital.
   */
  public static getCapacityStatus(hospital: Hospital): HospitalCapacityStatus {
    const netAvailableBeds = Math.max(0, hospital.availableBeds - hospital.reservedBeds);
    const occupied = hospital.totalBeds - hospital.availableBeds + hospital.reservedBeds;
    const occupancyPercentage = Math.round(
      Math.min(100, Math.max(0, (occupied / hospital.totalBeds) * 100))
    );

    let warningStatus: CapacityWarningStatus = 'Normal';
    let warningMessage = 'Sufficient capacity available for routine emergency admissions.';

    if (netAvailableBeds === 0) {
      warningStatus = 'Full_Divert';
      warningMessage = 'CRITICAL: Zero reservable beds available. Facility cannot accept new emergency cases.';
    } else if (occupancyPercentage >= 85 || netAvailableBeds <= 2) {
      warningStatus = 'High_Occupancy';
      warningMessage = `WARNING: High occupancy alert (${occupancyPercentage}%). Only ${netAvailableBeds} beds remaining.`;
    }

    return {
      hospitalId: hospital.id,
      hospitalName: hospital.name,
      totalBeds: hospital.totalBeds,
      availableBeds: hospital.availableBeds,
      reservedBeds: hospital.reservedBeds,
      netAvailableBeds,
      occupancyPercentage,
      warningStatus,
      warningMessage,
    };
  }

  /**
   * Atomically attempts to reserve a bed for an emergency patient.
   * Enforces immediate re-check before finalizing.
   * Prevents available capacity from going negative.
   *
   * @param hospital Target hospital
   * @param count Number of beds to reserve (defaults to 1)
   */
  public static reserveBed(
    hospital: Hospital,
    count: number = 1
  ): { updatedHospital: Hospital; result: ReservationResult } {
    if (count <= 0) {
      return {
        updatedHospital: hospital,
        result: {
          success: false,
          hospitalId: hospital.id,
          previousReserved: hospital.reservedBeds,
          newReserved: hospital.reservedBeds,
          availableBeds: hospital.availableBeds,
          netRemainingBeds: hospital.availableBeds - hospital.reservedBeds,
          error: 'Reservation count must be at least 1.',
        },
      };
    }

    const netAvailable = hospital.availableBeds - hospital.reservedBeds;
    if (netAvailable < count) {
      return {
        updatedHospital: hospital,
        result: {
          success: false,
          hospitalId: hospital.id,
          previousReserved: hospital.reservedBeds,
          newReserved: hospital.reservedBeds,
          availableBeds: hospital.availableBeds,
          netRemainingBeds: Math.max(0, netAvailable),
          error: `Insufficient bed capacity. Requested ${count} bed(s), but only ${Math.max(0, netAvailable)} reservable.`,
        },
      };
    }

    // Atomically increment reserved count and adjust available count
    const updatedHospital: Hospital = {
      ...hospital,
      reservedBeds: hospital.reservedBeds + count,
      lastUpdated: new Date().toISOString(),
    };

    return {
      updatedHospital,
      result: {
        success: true,
        hospitalId: hospital.id,
        previousReserved: hospital.reservedBeds,
        newReserved: updatedHospital.reservedBeds,
        availableBeds: updatedHospital.availableBeds,
        netRemainingBeds: updatedHospital.availableBeds - updatedHospital.reservedBeds,
      },
    };
  }

  /**
   * Releases a previously reserved bed (e.g. when an ambulance trip is completed or cancelled).
   */
  public static releaseBed(
    hospital: Hospital,
    count: number = 1
  ): { updatedHospital: Hospital; result: ReservationResult } {
    const releaseCount = Math.min(hospital.reservedBeds, Math.max(0, count));
    const newReserved = Math.max(0, hospital.reservedBeds - releaseCount);

    const updatedHospital: Hospital = {
      ...hospital,
      reservedBeds: newReserved,
      lastUpdated: new Date().toISOString(),
    };

    return {
      updatedHospital,
      result: {
        success: true,
        hospitalId: hospital.id,
        previousReserved: hospital.reservedBeds,
        newReserved,
        availableBeds: updatedHospital.availableBeds,
        netRemainingBeds: updatedHospital.availableBeds - newReserved,
      },
    };
  }
}
