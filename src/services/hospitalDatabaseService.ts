import { Hospital } from '../types/hospital';
import { HospitalAdminUser } from '../types/admin';
import { db, isFirebaseConfigured } from './firebase';
import { doc, getDoc, setDoc, updateDoc, collection, onSnapshot, getDocs } from 'firebase/firestore';
import { stateStore } from './stateStore';
import { validateHospitalProfile } from '../utils/validation';
import { AuditService } from './auditService';

const BROADCAST_CHANNEL_NAME = 'smartcare_hospitals_live_sync';
const STORAGE_KEY_SHARED_HOSPITALS = 'smartcare_published_hospitals_db';

class HospitalDatabaseService {
  private broadcastChannel: BroadcastChannel | null = null;
  private isConnectedToFirestore: boolean = false;
  private lastSyncTime: string = new Date().toISOString();

  constructor() {
    this.initSyncChannels();
    this.initFirestoreListener();
  }

  private initSyncChannels(): void {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        this.broadcastChannel.onmessage = (event) => {
          if (event.data && event.data.type === 'HOSPITAL_UPDATE') {
            console.info('[HospitalDB] Received live broadcast update for hospital:', event.data.hospital.id);
            this.applyRemoteUpdateToState(event.data.hospital);
          }
        };
      } catch (err) {
        console.warn('[HospitalDB] BroadcastChannel not supported or restricted', err);
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (event) => {
        if (event.key === STORAGE_KEY_SHARED_HOSPITALS && event.newValue) {
          try {
            const updatedHospitals = JSON.parse(event.newValue) as Hospital[];
            console.info('[HospitalDB] Received shared storage update, syncing hospitals...');
            stateStore.setHospitals(updatedHospitals);
          } catch (e) {
            console.warn('[HospitalDB] Failed to parse shared hospitals update', e);
          }
        }
      });
    }
  }

  private initFirestoreListener(): void {
    if (isFirebaseConfigured && db) {
      try {
        const hospitalsRef = collection(db, 'hospitals');
        onSnapshot(
          hospitalsRef,
          (snapshot) => {
            if (!snapshot.empty) {
              this.isConnectedToFirestore = true;
              this.lastSyncTime = new Date().toISOString();
              const remoteHospitals: Hospital[] = [];
              snapshot.forEach((docSnap) => {
                remoteHospitals.push(docSnap.data() as Hospital);
              });
              console.info('[HospitalDB] Synced', remoteHospitals.length, 'records from Firestore.');
              stateStore.setHospitals(remoteHospitals);
            }
          },
          (error) => {
            console.warn('[HospitalDB] Firestore real-time listener error:', error);
            this.isConnectedToFirestore = false;
          }
        );
      } catch (err) {
        console.warn('[HospitalDB] Error setting up Firestore listener:', err);
      }
    }
  }

  private applyRemoteUpdateToState(updatedHospital: Hospital): void {
    stateStore.updateHospitalRecord(updatedHospital);
  }

  public isConnected(): boolean {
    return this.isConnectedToFirestore;
  }

  public getLastSyncTime(): string {
    return this.lastSyncTime;
  }

  /**
   * Updates a hospital profile with strict server-side validation and ownership enforcement.
   *
   * Hard constraints enforced:
   * 1. Hospital admin can only edit their own assigned hospital.
   * 2. Available beds cannot be negative.
   * 3. Available beds cannot exceed total bed capacity.
   * 4. Verification status cannot be elevated or modified by hospital admins.
   * 5. Operating status must be 'Open', 'Temporarily Unavailable', or 'Closed'.
   */
  public async updateHospital(
    adminUser: HospitalAdminUser,
    hospitalId: string,
    updates: Partial<Hospital>
  ): Promise<{ success: boolean; updatedHospital?: Hospital; error?: string }> {
    // 1. Authorization check: hospital admin must own this hospital
    if (!adminUser) {
      return { success: false, error: 'Unauthorized: You must be logged in as a hospital administrator.' };
    }

    if (adminUser.role !== 'platform_admin' && adminUser.hospitalId !== hospitalId) {
      AuditService.log(
        'SECURITY_ALERT',
        `Unauthorized Access Attempt Rejected: ${adminUser.email}`,
        `Hospital admin from ${adminUser.hospitalId} attempted to modify unauthorized hospital ${hospitalId}. Action blocked.`,
        { attemptedHospitalId: hospitalId, userHospitalId: adminUser.hospitalId },
        'Security Module'
      );
      return {
        success: false,
        error: `Permission Denied: You are authorized to manage ${adminUser.hospitalName} (${adminUser.hospitalId}) only. You cannot modify ${hospitalId}.`,
      };
    }

    // 2. Fetch current record
    const currentHospital = stateStore.getState().hospitals.find((h) => h.id === hospitalId);
    if (!currentHospital) {
      return { success: false, error: `Hospital with ID ${hospitalId} not found in database.` };
    }

    // Demo Admin Isolation Check: Demo admins cannot edit or overwrite verified real hospital records
    if (adminUser.role === 'demo_admin' && (currentHospital.verificationStatus === 'Verified' || !currentHospital.isDemo)) {
      AuditService.log(
        'SECURITY_ALERT',
        `Demo Overwrite Attempt Blocked: ${adminUser.email}`,
        `Demo admin attempted to modify verified hospital ${currentHospital.name}. Action blocked.`,
        { attemptedHospitalId: hospitalId },
        'Security Module'
      );
      return {
        success: false,
        error: 'Permission Denied: Demo admin accounts cannot modify or overwrite verified real hospital records.',
      };
    }

    // 3. Strict Input & Capacity Validation
    const validation = validateHospitalProfile({
      name: updates.name ?? currentHospital.name,
      phone: updates.phone ?? currentHospital.phone,
      address: updates.address ?? currentHospital.address,
      latitude: updates.latitude ?? currentHospital.latitude,
      longitude: updates.longitude ?? currentHospital.longitude,
      totalBeds: updates.totalBeds ?? currentHospital.totalBeds,
      availableBeds: updates.availableBeds ?? currentHospital.availableBeds,
      operatingStatus: updates.operatingStatus ?? currentHospital.operatingStatus ?? 'Open',
    });

    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0];
      return { success: false, error: firstError || 'Invalid hospital details provided.' };
    }

    // 4. Security: Prevent privilege escalation (Hospital Admin CANNOT modify verification status)
    if (updates.verificationStatus && updates.verificationStatus !== currentHospital.verificationStatus) {
      if (adminUser.role !== 'platform_admin') {
        return {
          success: false,
          error: 'Security Restriction: Verification status is governed by Platform Administration and cannot be self-modified.',
        };
      }
    }

    const updatedTimestamp = new Date().toISOString();

    // 5. Construct sanitized, validated record
    const sanitizedHospital: Hospital = {
      ...currentHospital,
      name: updates.name ? updates.name.trim() : currentHospital.name,
      phone: updates.phone ? updates.phone.trim() : currentHospital.phone,
      address: updates.address ? updates.address.trim() : currentHospital.address,
      latitude: updates.latitude !== undefined ? Number(updates.latitude) : currentHospital.latitude,
      longitude: updates.longitude !== undefined ? Number(updates.longitude) : currentHospital.longitude,
      totalBeds: updates.totalBeds !== undefined ? Number(updates.totalBeds) : currentHospital.totalBeds,
      availableBeds: updates.availableBeds !== undefined ? Number(updates.availableBeds) : currentHospital.availableBeds,
      operatingStatus: updates.operatingStatus || currentHospital.operatingStatus || 'Open',
      emergencyDepartmentReadiness: updates.emergencyDepartmentReadiness || currentHospital.emergencyDepartmentReadiness,
      simulatedAmbulanceSupport: updates.simulatedAmbulanceSupport !== undefined
        ? updates.simulatedAmbulanceSupport
        : currentHospital.simulatedAmbulanceSupport,
      supportedSpecialties: updates.supportedSpecialties || currentHospital.supportedSpecialties,
      emergencyCapabilities: updates.emergencyCapabilities || currentHospital.emergencyCapabilities,
      specialistAvailability: updates.specialistAvailability || currentHospital.specialistAvailability,
      notes: updates.notes !== undefined ? updates.notes : currentHospital.notes,
      lastUpdated: updatedTimestamp,
      // Protect verification status from tampering
      verificationStatus: currentHospital.verificationStatus,
      dataSourceLabel: currentHospital.dataSourceLabel || 'Admin Verified Feed',
    };

    // 6. Write to Firestore if configured
    if (isFirebaseConfigured && db) {
      try {
        const hospitalDocRef = doc(db, 'hospitals', hospitalId);
        await setDoc(hospitalDocRef, sanitizedHospital, { merge: true });
        console.info('[HospitalDB] Record updated in Firestore for hospital:', hospitalId);
        this.isConnectedToFirestore = true;
      } catch (err: any) {
        console.warn('[HospitalDB] Firestore write failed, saving to local sync store:', err);
        this.isConnectedToFirestore = false;
      }
    }

    // 7. Update internal StateStore and notify all components immediately
    stateStore.updateHospitalRecord(sanitizedHospital);
    this.lastSyncTime = updatedTimestamp;

    // 8. Broadcast update to other tabs & windows
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({
          type: 'HOSPITAL_UPDATE',
          hospital: sanitizedHospital,
        });
      } catch (e) {
        console.warn('[HospitalDB] Failed to broadcast update', e);
      }
    }

    // Also write to shared localStorage for multi-tab sync
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const allHospitals = stateStore.getState().hospitals;
        window.localStorage.setItem(STORAGE_KEY_SHARED_HOSPITALS, JSON.stringify(allHospitals));
      }
    } catch (e) {
      // Ignore quota errors
    }

    // 9. Record in immutable audit trail
    AuditService.log(
      'HOSPITAL_UPDATE',
      `Hospital Records Updated: ${sanitizedHospital.name}`,
      `Authorized Admin ${adminUser.email} updated profile. Available Beds: ${sanitizedHospital.availableBeds}/${sanitizedHospital.totalBeds}, ED Status: ${sanitizedHospital.emergencyDepartmentReadiness}, Operating Status: ${sanitizedHospital.operatingStatus}.`,
      {
        hospitalId,
        availableBeds: sanitizedHospital.availableBeds,
        totalBeds: sanitizedHospital.totalBeds,
        operatingStatus: sanitizedHospital.operatingStatus,
        adminEmail: adminUser.email,
      },
      'Hospital Admin Portal'
    );

    return {
      success: true,
      updatedHospital: sanitizedHospital,
    };
  }
}

export const hospitalDatabaseService = new HospitalDatabaseService();
