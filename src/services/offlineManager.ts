import { Hospital } from '../types/hospital';

export interface OfflineState {
  isOffline: boolean;
  lastSyncTimestamp: string;
  syncStatus: 'synced' | 'pending_sync' | 'sync_failed';
  cachedHospitalCount: number;
  queuedAuditEventsCount: number;
}

const STORAGE_KEY_OFFLINE_HOSPITALS = 'smartcare_offline_hospitals_cache';
const STORAGE_KEY_LAST_SYNC = 'smartcare_last_sync_timestamp';

/**
 * Service to manage offline simulation, cache fallback, and telemetry verification status.
 */
export class OfflineManager {
  /**
   * Saves the hospitals to localStorage cache.
   */
  public static cacheHospitals(hospitals: Hospital[]): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_KEY_OFFLINE_HOSPITALS, JSON.stringify(hospitals));
        localStorage.setItem(STORAGE_KEY_LAST_SYNC, new Date().toISOString());
      }
    } catch (e) {
      console.warn('Unable to cache hospitals to localStorage', e);
    }
  }

  /**
   * Loads cached hospitals from localStorage.
   */
  public static getCachedHospitals(): Hospital[] | null {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const data = localStorage.getItem(STORAGE_KEY_OFFLINE_HOSPITALS);
        if (data) {
          return JSON.parse(data) as Hospital[];
        }
      }
    } catch (e) {
      console.warn('Unable to retrieve cached hospitals', e);
    }
    return null;
  }

  /**
   * When in offline mode, flags hospitals as unverified demo records.
   * Labeled strictly per clinical safety requirements:
   * "DEMO DATA — NOT VERIFIED REAL HOSPITAL INFORMATION"
   */
  public static applyOfflineDegradation(hospitals: Hospital[]): Hospital[] {
    return hospitals.map((h) => ({
      ...h,
      verificationStatus: 'Stale',
      isDemo: true,
      dataSourceLabel: 'DEMO DATA — NOT VERIFIED REAL HOSPITAL INFORMATION (Offline Cache)',
      notes: `${h.notes || ''} [Offline — showing saved/demo hospital information. Availability may have changed.]`,
    }));
  }

  public static getLastSyncTime(): string {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem(STORAGE_KEY_LAST_SYNC);
      if (stored) return stored;
    }
    return '';
  }
}
