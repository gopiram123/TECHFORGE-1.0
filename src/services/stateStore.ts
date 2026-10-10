import { Hospital, HospitalRankingResult } from '../types/hospital';
import { Ambulance, AmbulanceStatus } from '../types/ambulance';
import { EmergencyRequest, EmergencyLevel } from '../types/emergency';
import { INITIAL_DEMO_HOSPITALS, DEMO_USER_LOCATION } from '../data/demoHospitals';
import { INITIAL_DEMO_AMBULANCES } from '../data/demoAmbulances';
import { INITIAL_DEMO_REQUESTS } from '../data/demoRequests';
import { classifyPatientProblem } from './problemClassifier';
import { rankEligibleHospitals } from './hospitalRanking';
import { CapacityManager } from './capacityManager';
import { AmbulanceDispatchService } from './ambulanceDispatch';
import { reoptimiseRecommendations, ReoptimisationChangeSummary } from './reoptimisation';
import { OfflineManager } from './offlineManager';
import { AuditService } from './auditService';

export interface AppState {
  hospitals: Hospital[];
  ambulances: Ambulance[];
  requests: EmergencyRequest[];
  activeRequest: EmergencyRequest | null;
  activeRecommendations: HospitalRankingResult[];
  activeExcluded: ReturnType<typeof rankEligibleHospitals>['excludedResults'];
  userLocation: {
    latitude: number;
    longitude: number;
    address: string;
    type: 'Real Browser Geolocation' | 'User Provided' | 'Simulated Demo Coordinates';
    permissionStatus: 'prompt' | 'granted' | 'denied' | 'unavailable';
  };
  isOffline: boolean;
  lastSyncTimestamp: string;
  lastReoptimisation: ReoptimisationChangeSummary | null;
  isScenarioRunning: boolean;
  scenarioStep: number;
  scenarioDescription: string;
}

type Listener = (state: AppState) => void;

class StateStore {
  private state: AppState;
  private listeners: Set<Listener> = new Set();

  constructor() {
    this.state = this.getInitialState();
    OfflineManager.cacheHospitals(this.state.hospitals);
  }

  private getInitialState(): AppState {
    const defaultProblem = 'Severe crushing chest pain radiating to left jaw, sudden onset 20 mins ago';
    const classification = classifyPatientProblem(defaultProblem);
    const initialLocation = {
      latitude: DEMO_USER_LOCATION.latitude,
      longitude: DEMO_USER_LOCATION.longitude,
      address: DEMO_USER_LOCATION.address,
      type: 'Simulated Demo Coordinates' as const,
      permissionStatus: 'prompt' as const,
    };

    const initialRequest: EmergencyRequest = {
      id: 'REQ-DEMO-INIT',
      patientProblem: defaultProblem,
      emergencyLevel: 'Critical / Urgent',
      timestamp: new Date().toISOString(),
      userLocation: {
        latitude: initialLocation.latitude,
        longitude: initialLocation.longitude,
      },
      locationType: initialLocation.type,
      locationAddress: initialLocation.address,
      classification,
      status: 'Triaged',
    };

    // Calculate initial rankings
    const { rankedEligible, excludedResults } = rankEligibleHospitals(
      INITIAL_DEMO_HOSPITALS,
      classification,
      initialRequest.emergencyLevel,
      initialRequest.userLocation
    );

    return {
      hospitals: JSON.parse(JSON.stringify(INITIAL_DEMO_HOSPITALS)),
      ambulances: JSON.parse(JSON.stringify(INITIAL_DEMO_AMBULANCES)),
      requests: JSON.parse(JSON.stringify(INITIAL_DEMO_REQUESTS)),
      activeRequest: initialRequest,
      activeRecommendations: rankedEligible,
      activeExcluded: excludedResults,
      userLocation: initialLocation,
      isOffline: false,
      lastSyncTimestamp: new Date().toISOString(),
      lastReoptimisation: null,
      isScenarioRunning: false,
      scenarioStep: 0,
      scenarioDescription: '',
    };
  }

  public getState(): AppState {
    return this.state;
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    this.listeners.forEach((l) => l(this.state));
  }

  /**
   * Resets entire application state to deterministic baseline.
   */
  public resetDemo(): void {
    this.state = this.getInitialState();
    OfflineManager.cacheHospitals(this.state.hospitals);
    AuditService.clear();
    AuditService.log(
      'DEMO_RESET',
      'System State Reset',
      'Demo environment reset to initial deterministic state (12 hospitals, 6 ambulances, 3 queue cases).',
      {},
      'Simulation Control'
    );
    this.notify();
  }

  private requestCounter: number = 0;

  /**
   * Submits a new emergency request (the 2-input user workflow).
   */
  public submitEmergencyRequest(
    problem: string,
    level: EmergencyLevel
  ): EmergencyRequest {
    this.requestCounter++;
    const classification = classifyPatientProblem(problem);

    AuditService.log(
      'PROBLEM_CLASSIFICATION',
      `Rule Matched: ${classification.matchedRuleId}`,
      classification.explanation,
      {
        rawProblem: problem,
        category: classification.category,
        requiredCapabilities: classification.requiredCapabilities,
        requiredSpecialists: classification.requiredSpecialists,
      },
      'Patient App'
    );

    const newRequest: EmergencyRequest = {
      id: `REQ-${Date.now().toString().slice(-6)}-${this.requestCounter}`,
      patientProblem: problem,
      emergencyLevel: level,
      timestamp: new Date().toISOString(),
      userLocation: {
        latitude: this.state.userLocation.latitude,
        longitude: this.state.userLocation.longitude,
      },
      locationType: this.state.userLocation.type,
      locationAddress: this.state.userLocation.address,
      classification,
      status: 'Triaged',
    };

    // Calculate hospital recommendations
    const { rankedEligible, excludedResults } = rankEligibleHospitals(
      this.state.hospitals,
      classification,
      level,
      newRequest.userLocation
    );

    newRequest.recommendations = rankedEligible;
    if (rankedEligible.length > 0) {
      newRequest.assignedHospitalId = rankedEligible[0].hospital.id;
      newRequest.assignedHospitalName = rankedEligible[0].hospital.name;
    }

    AuditService.log(
      'HOSPITAL_RANKING',
      rankedEligible.length > 0
        ? `Top Hospital: ${rankedEligible[0].hospital.name}`
        : 'No Suitable Hospital Found',
      rankedEligible.length > 0
        ? rankedEligible[0].recommendationExplanation
        : 'All facilities failed clinical capability or capacity constraints.',
      {
        eligibleCount: rankedEligible.length,
        excludedCount: excludedResults.length,
      },
      'System Engine'
    );

    // Insert into emergency priority queue
    const updatedRequests = [...this.state.requests, newRequest];
    this.sortPriorityQueue(updatedRequests);

    this.state = {
      ...this.state,
      requests: updatedRequests,
      activeRequest: newRequest,
      activeRecommendations: rankedEligible,
      activeExcluded: excludedResults,
    };

    this.notify();
    return newRequest;
  }

  /**
   * Sorts requests in deterministic priority order:
   * 1. Critical / Urgent
   * 2. Moderate
   * 3. General
   * Tie-breaker: earlier arrival timestamp
   */
  private sortPriorityQueue(requests: EmergencyRequest[]): void {
    const priorityWeights: Record<EmergencyLevel, number> = {
      'Critical / Urgent': 3,
      Moderate: 2,
      General: 1,
    };

    requests.sort((a, b) => {
      const weightA = priorityWeights[a.emergencyLevel] || 0;
      const weightB = priorityWeights[b.emergencyLevel] || 0;

      if (weightB !== weightA) {
        return weightB - weightA;
      }
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    });
  }

  /**
   * Updates user geolocation coordinates.
   */
  public updateLocation(
    lat: number,
    lng: number,
    type: AppState['userLocation']['type'],
    status: AppState['userLocation']['permissionStatus'],
    address?: string
  ): void {
    const newLocation = {
      latitude: lat,
      longitude: lng,
      type,
      permissionStatus: status,
      address: address || (type === 'Real Browser Geolocation' ? `Browser Position (${lat.toFixed(4)}, ${lng.toFixed(4)})` : DEMO_USER_LOCATION.address),
    };

    this.state = {
      ...this.state,
      userLocation: newLocation,
    };

    // If active request exists, reoptimise rankings for new position
    if (this.state.activeRequest) {
      const updatedReq = {
        ...this.state.activeRequest,
        userLocation: { latitude: lat, longitude: lng },
        locationType: type,
        locationAddress: newLocation.address,
      };
      const reopt = reoptimiseRecommendations(
        this.state.hospitals,
        updatedReq,
        this.state.activeRecommendations,
        'Patient coordinates updated'
      );
      this.state.activeRequest = updatedReq;
      this.state.activeRecommendations = reopt.newRankedEligible;
      this.state.activeExcluded = reopt.newExcludedResults;
      this.state.lastReoptimisation = reopt.summary;
    }

    this.notify();
  }

  /**
   * Dispatches an ambulance and reserves a hospital bed.
   */
  public confirmAmbulanceAssignment(
    ambulanceId: string,
    requestId: string,
    hospitalId: string
  ): { success: boolean; message: string } {
    const ambulance = this.state.ambulances.find((a) => a.id === ambulanceId);
    const request = this.state.requests.find((r) => r.id === requestId);
    const hospital = this.state.hospitals.find((h) => h.id === hospitalId);

    if (!ambulance || !request || !hospital) {
      return { success: false, message: 'Invalid ambulance, request, or hospital reference.' };
    }

    // 1. Double check ambulance availability
    if (ambulance.status !== 'Available') {
      return { success: false, message: `Ambulance ${ambulance.id} is already assigned or en route!` };
    }

    // 2. Double check and reserve capacity atomically
    const reserveAttempt = CapacityManager.reserveBed(hospital, 1);
    if (!reserveAttempt.result.success) {
      AuditService.log(
        'CAPACITY_RESERVATION',
        `Reservation Rejected: ${hospital.name}`,
        reserveAttempt.result.error || 'No reservable beds remaining.',
        { hospitalId: hospital.id },
        'Dispatcher'
      );
      return {
        success: false,
        message: `Dispatch failed: ${reserveAttempt.result.error}`,
      };
    }

    // 3. Assign ambulance
    const assignResult = AmbulanceDispatchService.assignAmbulance(ambulance, request, hospital);
    if (assignResult.error) {
      // rollback bed reservation
      CapacityManager.releaseBed(reserveAttempt.updatedHospital, 1);
      return { success: false, message: assignResult.error };
    }

    // Update state
    const updatedHospitals = this.state.hospitals.map((h) =>
      h.id === hospital.id ? reserveAttempt.updatedHospital : h
    );

    const updatedAmbulances = this.state.ambulances.map((a) =>
      a.id === ambulance.id ? assignResult.updatedAmbulance : a
    );

    const updatedRequests = this.state.requests.map((r) => {
      if (r.id === request.id) {
        return {
          ...r,
          status: 'Ambulance_Dispatched' as const,
          assignedAmbulanceId: ambulance.id,
          assignedHospitalId: hospital.id,
          assignedHospitalName: hospital.name,
        };
      }
      return r;
    });

    let updatedActiveRequest = this.state.activeRequest;
    if (updatedActiveRequest && updatedActiveRequest.id === request.id) {
      updatedActiveRequest = {
        ...updatedActiveRequest,
        status: 'Ambulance_Dispatched',
        assignedAmbulanceId: ambulance.id,
        assignedHospitalId: hospital.id,
        assignedHospitalName: hospital.name,
      };
    }

    AuditService.log(
      'CAPACITY_RESERVATION',
      `Bed Reserved: ${hospital.name}`,
      `1 bed reserved for Request ${request.id}. Net available: ${reserveAttempt.result.netRemainingBeds} beds.`,
      { hospitalId: hospital.id, netRemaining: reserveAttempt.result.netRemainingBeds },
      'Dispatcher'
    );

    AuditService.log(
      'AMBULANCE_ASSIGNMENT',
      `Ambulance ${ambulance.id} Dispatched`,
      `Unit ${ambulance.id} (${ambulance.type}) assigned to ${hospital.name} for ${request.patientProblem}.`,
      { ambulanceId: ambulance.id, requestId: request.id, hospitalId: hospital.id },
      'Dispatcher'
    );

    this.state = {
      ...this.state,
      hospitals: updatedHospitals,
      ambulances: updatedAmbulances,
      requests: updatedRequests,
      activeRequest: updatedActiveRequest,
    };

    // Reoptimise rankings following bed capacity change
    if (this.state.activeRequest) {
      const reopt = reoptimiseRecommendations(
        this.state.hospitals,
        this.state.activeRequest,
        this.state.activeRecommendations,
        `Bed reserved at ${hospital.name}`
      );
      this.state.activeRecommendations = reopt.newRankedEligible;
      this.state.activeExcluded = reopt.newExcludedResults;
      this.state.lastReoptimisation = reopt.summary;
    }

    this.notify();
    return {
      success: true,
      message: `Successfully dispatched ${ambulance.id} to ${hospital.name}. 1 emergency bed reserved.`,
    };
  }

  /**
   * Cancels a dispatched trip or frees an assigned ambulance.
   */
  public cancelAmbulanceAssignment(ambulanceId: string): void {
    const ambulance = this.state.ambulances.find((a) => a.id === ambulanceId);
    if (!ambulance || !ambulance.currentAssignment) return;

    const hospitalId = ambulance.currentAssignment.assignedHospitalId;
    const hospital = this.state.hospitals.find((h) => h.id === hospitalId);

    let updatedHospitals = this.state.hospitals;
    if (hospital) {
      const releaseAttempt = CapacityManager.releaseBed(hospital, 1);
      updatedHospitals = this.state.hospitals.map((h) =>
        h.id === hospital.id ? releaseAttempt.updatedHospital : h
      );

      AuditService.log(
        'CAPACITY_RELEASE',
        `Bed Released: ${hospital.name}`,
        `Assignment cancelled; 1 reserved bed returned to available pool.`,
        { hospitalId: hospital.id },
        'Dispatcher'
      );
    }

    const updatedAmbulances = this.state.ambulances.map((a) => {
      if (a.id === ambulanceId) {
        return AmbulanceDispatchService.updateAmbulanceStatus(a, 'Available');
      }
      return a;
    });

    AuditService.log(
      'AMBULANCE_STATUS_UPDATE',
      `Ambulance ${ambulanceId} Released`,
      `Trip cancelled; ambulance returned to Available status.`,
      { ambulanceId },
      'Dispatcher'
    );

    this.state = {
      ...this.state,
      hospitals: updatedHospitals,
      ambulances: updatedAmbulances,
    };

    // Reoptimise recommendations
    if (this.state.activeRequest) {
      const reopt = reoptimiseRecommendations(
        this.state.hospitals,
        this.state.activeRequest,
        this.state.activeRecommendations,
        'Capacity released from cancelled assignment'
      );
      this.state.activeRecommendations = reopt.newRankedEligible;
      this.state.activeExcluded = reopt.newExcludedResults;
      this.state.lastReoptimisation = reopt.summary;
    }

    this.notify();
  }

  /**
   * Updates an ambulance's status (e.g. En Route, Completed).
   */
  public updateAmbulanceStatus(ambulanceId: string, status: AmbulanceStatus): void {
    const ambulance = this.state.ambulances.find((a) => a.id === ambulanceId);
    if (!ambulance) return;

    const updated = this.state.ambulances.map((a) => {
      if (a.id === ambulanceId) {
        return AmbulanceDispatchService.updateAmbulanceStatus(a, status);
      }
      return a;
    });

    this.state = {
      ...this.state,
      ambulances: updated,
    };

    AuditService.log(
      'AMBULANCE_STATUS_UPDATE',
      `Ambulance ${ambulanceId} status: ${status}`,
      `Vehicle status updated to ${status}.`,
      { ambulanceId, status },
      'Dispatcher'
    );

    this.notify();
  }

  /**
   * Updates an individual hospital record (e.g. from Hospital Admin Portal or backend sync)
   * and automatically re-optimises active patient recommendations.
   */
  public updateHospitalRecord(updatedHospital: Hospital): void {
    const updatedHospitals = this.state.hospitals.map((h) =>
      h.id === updatedHospital.id ? { ...updatedHospital } : h
    );

    if (!this.state.hospitals.some((h) => h.id === updatedHospital.id)) {
      updatedHospitals.push({ ...updatedHospital });
    }

    OfflineManager.cacheHospitals(updatedHospitals);

    this.state = {
      ...this.state,
      hospitals: updatedHospitals,
      lastSyncTimestamp: updatedHospital.lastUpdated || new Date().toISOString(),
    };

    // Automatically recalculate and re-optimise recommendations for active emergency request
    if (this.state.activeRequest) {
      const reopt = reoptimiseRecommendations(
        updatedHospitals,
        this.state.activeRequest,
        this.state.activeRecommendations,
        `Hospital profile and capacity updated for ${updatedHospital.name}`
      );
      this.state.activeRecommendations = reopt.newRankedEligible;
      this.state.activeExcluded = reopt.newExcludedResults;
      this.state.lastReoptimisation = reopt.summary;
    }

    this.notify();
  }

  /**
   * Sets entire hospital list (e.g. from remote Firestore sync).
   */
  public setHospitals(hospitals: Hospital[]): void {
    if (!hospitals || hospitals.length === 0) return;
    OfflineManager.cacheHospitals(hospitals);
    this.state = {
      ...this.state,
      hospitals: [...hospitals],
      lastSyncTimestamp: new Date().toISOString(),
    };

    if (this.state.activeRequest) {
      const reopt = reoptimiseRecommendations(
        hospitals,
        this.state.activeRequest,
        this.state.activeRecommendations,
        'Live hospital dataset updated from central database'
      );
      this.state.activeRecommendations = reopt.newRankedEligible;
      this.state.activeExcluded = reopt.newExcludedResults;
      this.state.lastReoptimisation = reopt.summary;
    }

    this.notify();
  }

  /**
   * Simulates condition changes (Capacity surge, traffic congestion, ED diversion, etc.)
   * and triggers automatic re-optimisation.
   */
  public simulateConditionChange(
    scenario:
      | 'RESERVE_ALL_BEDS_TOP_HOSPITAL'
      | 'HEAVY_TRAFFIC_TOP_HOSPITAL'
      | 'TOGGLE_ED_DIVERSION_TOP_HOSPITAL'
      | 'SPECIALIST_UNAVAILABLE'
      | 'RESTORE_HOSPITAL_NORMAL'
  ): void {
    const topHospital =
      this.state.activeRecommendations.length > 0
        ? this.state.activeRecommendations[0].hospital
        : this.state.hospitals.find((h) => h.id === 'HOSP-003');

    if (!topHospital) return;

    let updatedHospitals = [...this.state.hospitals];
    let triggerExplanation = '';

    if (scenario === 'RESERVE_ALL_BEDS_TOP_HOSPITAL') {
      updatedHospitals = updatedHospitals.map((h) => {
        if (h.id === topHospital.id) {
          return {
            ...h,
            availableBeds: h.reservedBeds, // Net available beds becomes ZERO!
            lastUpdated: new Date().toISOString(),
          };
        }
        return h;
      });
      triggerExplanation = `Mass casualty intake at ${topHospital.name} exhausted all available emergency beds (0 remaining).`;
    } else if (scenario === 'HEAVY_TRAFFIC_TOP_HOSPITAL') {
      updatedHospitals = updatedHospitals.map((h) => {
        if (h.id === topHospital.id) {
          return {
            ...h,
            simulatedTrafficCondition: 'severe',
            estimatedTravelTime: 45,
            lastUpdated: new Date().toISOString(),
          };
        }
        return h;
      });
      triggerExplanation = `Major highway gridlock added severe traffic delay (simulated ETA 45 mins) to ${topHospital.name}.`;
    } else if (scenario === 'TOGGLE_ED_DIVERSION_TOP_HOSPITAL') {
      updatedHospitals = updatedHospitals.map((h) => {
        if (h.id === topHospital.id) {
          const newStatus = h.emergencyDepartmentReadiness === 'Diverting' ? 'Ready' : 'Diverting';
          return {
            ...h,
            emergencyDepartmentReadiness: newStatus,
            lastUpdated: new Date().toISOString(),
          };
        }
        return h;
      });
      triggerExplanation = `Emergency department status at ${topHospital.name} toggled to DIVERTING due to critical equipment recalibration.`;
    } else if (scenario === 'SPECIALIST_UNAVAILABLE') {
      updatedHospitals = updatedHospitals.map((h) => {
        if (h.id === topHospital.id) {
          return {
            ...h,
            specialistAvailability: {
              ...h.specialistAvailability,
              cardiologist: false,
              trauma_surgeon: false,
            },
            lastUpdated: new Date().toISOString(),
          };
        }
        return h;
      });
      triggerExplanation = `Specialist physician called into unscheduled emergency surgery at ${topHospital.name}; no backup available.`;
    } else if (scenario === 'RESTORE_HOSPITAL_NORMAL') {
      const original = INITIAL_DEMO_HOSPITALS.find((h) => h.id === topHospital.id);
      if (original) {
        updatedHospitals = updatedHospitals.map((h) => (h.id === topHospital.id ? { ...original } : h));
      }
      triggerExplanation = `Conditions at ${topHospital.name} restored to nominal operating parameters.`;
    }

    this.state.hospitals = updatedHospitals;

    // Automatic re-optimisation
    if (this.state.activeRequest) {
      const reopt = reoptimiseRecommendations(
        updatedHospitals,
        this.state.activeRequest,
        this.state.activeRecommendations,
        triggerExplanation
      );

      this.state.activeRecommendations = reopt.newRankedEligible;
      this.state.activeExcluded = reopt.newExcludedResults;
      this.state.lastReoptimisation = reopt.summary;

      AuditService.log(
        'REOPTIMISATION',
        reopt.summary.didTopRecommendationChange
          ? 'Recommendation Re-Optimised (Shifted)'
          : 'Re-Optimisation Recalculated (Maintained)',
        reopt.summary.explanation,
        {
          trigger: scenario,
          previousTop: reopt.summary.previousTopHospitalName,
          newTop: reopt.summary.newTopHospitalName,
        },
        'Simulation Control'
      );
    }

    this.notify();
  }

  /**
   * Toggles Offline Mode simulation.
   */
  public toggleOfflineMode(forceOffline?: boolean): void {
    const isOffline = forceOffline !== undefined ? forceOffline : !this.state.isOffline;

    let updatedHospitals = this.state.hospitals;
    if (isOffline) {
      updatedHospitals = OfflineManager.applyOfflineDegradation(this.state.hospitals);
      AuditService.log(
        'OFFLINE_MODE_CHANGE',
        'Offline Mode Engaged',
        'Device disconnected from central telemetry. Live data marked as unverified / cached.',
        {},
        'Simulation Control'
      );
    } else {
      // Restore fresh verification flags
      updatedHospitals = JSON.parse(JSON.stringify(INITIAL_DEMO_HOSPITALS));
      AuditService.log(
        'DATA_SYNC',
        'Telemetry Restored & Synchronized',
        'Connection re-established with verified hospital dispatch nodes. Data refreshed.',
        {},
        'Simulation Control'
      );
    }

    this.state = {
      ...this.state,
      isOffline,
      hospitals: updatedHospitals,
      lastSyncTimestamp: new Date().toISOString(),
    };

    if (this.state.activeRequest) {
      const reopt = reoptimiseRecommendations(
        updatedHospitals,
        this.state.activeRequest,
        this.state.activeRecommendations,
        isOffline ? 'Network offline: using cached telemetry' : 'Network online: telemetry refreshed'
      );
      this.state.activeRecommendations = reopt.newRankedEligible;
      this.state.activeExcluded = reopt.newExcludedResults;
      this.state.lastReoptimisation = reopt.summary;
    }

    this.notify();
  }

  /**
   * Runs the automated step-by-step One-Click Demo Scenario (Section 21).
   */
  public async runDemoScenario(stepCallback?: (step: number, desc: string) => void): Promise<void> {
    this.state.isScenarioRunning = true;
    this.notify();

    // Step 1: Reset demo to clean state
    this.resetDemo();
    this.state.scenarioStep = 1;
    this.state.scenarioDescription = 'Step 1/5: Resetting demo state and registering emergency: "Severe crushing chest pain, diaphoresis"';
    stepCallback?.(1, this.state.scenarioDescription);
    this.notify();
    await new Promise((r) => setTimeout(r, 900));

    // Step 2: Patient reports chest pain, Critical
    const req = this.submitEmergencyRequest(
      'Patient reports severe crushing chest pain radiating to left arm with breathing distress',
      'Critical / Urgent'
    );
    this.state.scenarioStep = 2;
    this.state.scenarioDescription =
      'Step 2/5: Classified as Cardiac Emergency. Evaluating nearest hospitals against hard constraints.';
    stepCallback?.(2, this.state.scenarioDescription);
    this.notify();
    await new Promise((r) => setTimeout(r, 1100));

    // Step 3: Explanation of nearest vs best suitable
    this.state.scenarioStep = 3;
    this.state.scenarioDescription =
      'Step 3/5: Closest hospital (City Central, 1.1 km) has 0 beds; St Jude (3.2 km) lacks cardiac care. Recommended: Apollo Apex Heart Institute (Rank #1, 14 min ETA).';
    stepCallback?.(3, this.state.scenarioDescription);
    this.notify();
    await new Promise((r) => setTimeout(r, 1200));

    // Step 4: Dispatch ALS ambulance
    const availableALS = this.state.ambulances.find(
      (a) => a.status === 'Available' && a.type === 'Advanced Life Support (ALS)'
    );
    if (availableALS && req.assignedHospitalId) {
      this.confirmAmbulanceAssignment(availableALS.id, req.id, req.assignedHospitalId);
      this.state.scenarioStep = 4;
      this.state.scenarioDescription = `Step 4/5: Dispatched ALS unit ${availableALS.id} (4 min pickup ETA) and reserved 1 ICU cardiac bed at Apollo Apex.`;
      stepCallback?.(4, this.state.scenarioDescription);
      this.notify();
      await new Promise((r) => setTimeout(r, 1200));
    }

    // Step 5: Simulate condition change (e.g. traffic gridlock or remaining bed exhaustion)
    this.simulateConditionChange('HEAVY_TRAFFIC_TOP_HOSPITAL');
    this.state.scenarioStep = 5;
    this.state.scenarioDescription =
      'Step 5/5: Highway gridlock detected on route to Apollo Apex! System re-optimised and promoted Fortis Crest (12 min ETA) as optimal facility.';
    stepCallback?.(5, this.state.scenarioDescription);
    this.state.isScenarioRunning = false;
    this.notify();
  }
}

export const stateStore = new StateStore();
