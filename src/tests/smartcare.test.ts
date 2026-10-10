import { describe, it, expect, beforeEach } from 'vitest';
import { classifyPatientProblem } from '../services/problemClassifier';
import { filterEligibleHospitals } from '../services/hospitalEligibility';
import { rankEligibleHospitals } from '../services/hospitalRanking';
import { CapacityManager } from '../services/capacityManager';
import { AmbulanceDispatchService } from '../services/ambulanceDispatch';
import { reoptimiseRecommendations } from '../services/reoptimisation';
import { OfflineManager } from '../services/offlineManager';
import { stateStore } from '../services/stateStore';
import { INITIAL_DEMO_HOSPITALS, DEMO_USER_LOCATION } from '../data/demoHospitals';
import { INITIAL_DEMO_AMBULANCES } from '../data/demoAmbulances';
import { EmergencyRequest } from '../types/emergency';
import { getGoogleMapsDirectionsUrl } from '../utils/distance';

describe('SmartCare AI Automated Test Suite', () => {
  beforeEach(() => {
    stateStore.resetDemo();
  });

  // 1. Known patient-problem keyword classification
  it('1. classifies known patient-problem keywords accurately', () => {
    const cardiac = classifyPatientProblem('Patient experiencing severe chest pain');
    expect(cardiac.category).toBe('cardiac_emergency');
    expect(cardiac.requiredCapabilities).toContain('cardiac_care');
    expect(cardiac.requiredSpecialists).toContain('cardiologist');
    expect(cardiac.isLifeThreatening).toBe(true);

    const trauma = classifyPatientProblem('High-speed highway accident with leg fracture and bleeding');
    expect(trauma.category).toBe('trauma_emergency');
    expect(trauma.requiredCapabilities).toContain('trauma_center');

    const respiratory = classifyPatientProblem('Severe asthma attack with breathing difficulty');
    expect(respiratory.category).toBe('respiratory_emergency');
    expect(respiratory.requiredCapabilities).toContain('icu_respiratory');

    const stroke = classifyPatientProblem('Sudden facial droop and right arm paralysis');
    expect(stroke.category).toBe('stroke_emergency');
    expect(stroke.requiredCapabilities).toContain('stroke_unit');

    const burn = classifyPatientProblem('Second degree burn injury from industrial fire');
    expect(burn.category).toBe('burn_emergency');
    expect(burn.requiredCapabilities).toContain('burn_unit');
  });

  // 2. Case-insensitive input
  it('2. handles case-insensitive input and varied casing', () => {
    const resUpper = classifyPatientProblem('CHEST PAIN radiating to jaw');
    const resMixed = classifyPatientProblem('cHeSt PaIn radiating to jaw');
    expect(resUpper.category).toBe('cardiac_emergency');
    expect(resMixed.category).toBe('cardiac_emergency');
    expect(resUpper.matchedRuleId).toBe(resMixed.matchedRuleId);
  });

  // 3. Empty problem descriptions
  it('3. handles empty and whitespace problem descriptions gracefully', () => {
    const emptyRes = classifyPatientProblem('');
    expect(emptyRes.matchedRuleId).toBe('RULE_EMPTY_INPUT');
    expect(emptyRes.category).toBe('unknown_unspecified');
    expect(emptyRes.requiredCapabilities).toContain('emergency_room');

    const spacesRes = classifyPatientProblem('    ');
    expect(spacesRes.matchedRuleId).toBe('RULE_EMPTY_INPUT');
  });

  // 4. Unknown problem descriptions
  it('4. classifies unrecognized complaints to manual review category', () => {
    const unknownRes = classifyPatientProblem('Unusual sensation like tingling purple feathers');
    expect(unknownRes.matchedRuleId).toBe('RULE_UNKNOWN_PROBLEM');
    expect(unknownRes.category).toBe('unrecognized_problem');
    expect(unknownRes.requiredCapabilities).toContain('emergency_room');
  });

  // 5. Critical cases taking priority
  it('5. prioritizes Critical cases over Moderate and General in the dispatch queue', () => {
    const req1 = stateStore.submitEmergencyRequest('Wrist sprain after slip', 'General');
    const req2 = stateStore.submitEmergencyRequest('Sudden unconsciousness and chest pain', 'Critical / Urgent');
    const req3 = stateStore.submitEmergencyRequest('Persistent vomiting and fever', 'Moderate');

    const queue = stateStore.getState().requests;
    const criticalIdx = queue.findIndex((r) => r.id === req2.id);
    const moderateIdx = queue.findIndex((r) => r.id === req3.id);
    const generalIdx = queue.findIndex((r) => r.id === req1.id);

    expect(criticalIdx).toBeLessThan(moderateIdx);
    expect(moderateIdx).toBeLessThan(generalIdx);
  });

  // 6. Arrival-time tie-breaking
  it('6. breaks ties within same emergency level by arrival time', () => {
    const reqFirst = stateStore.submitEmergencyRequest('Severe crushing chest pain case A', 'Critical / Urgent');
    const reqSecond = stateStore.submitEmergencyRequest('Gunshot wound trauma case B', 'Critical / Urgent');

    const queue = stateStore.getState().requests;
    const idxFirst = queue.findIndex((r) => r.id === reqFirst.id);
    const idxSecond = queue.findIndex((r) => r.id === reqSecond.id);

    expect(idxFirst).toBeLessThan(idxSecond);
  });

  // 7. Zero-bed hospitals being excluded
  it('7. strictly excludes hospitals with zero available beds', () => {
    const classification = classifyPatientProblem('chest pain');
    const { ineligibleResults } = filterEligibleHospitals(
      INITIAL_DEMO_HOSPITALS,
      classification,
      'Critical / Urgent',
      DEMO_USER_LOCATION
    );

    const zeroBedHospital = ineligibleResults.find((r) => r.hospital.id === 'HOSP-001');
    expect(zeroBedHospital).toBeDefined();
    expect(zeroBedHospital?.failedConstraints.capacityFailed).toBe(true);
    expect(zeroBedHospital?.reasons.some((reason) => reason.includes('Zero available capacity'))).toBe(true);
  });

  // 8. Missing required specialists or capabilities being excluded
  it('8. strictly excludes hospitals lacking required clinical capability or specialist', () => {
    const classification = classifyPatientProblem('severe chest pain'); // requires cardiac_care & cardiologist
    const { ineligibleResults } = filterEligibleHospitals(
      INITIAL_DEMO_HOSPITALS,
      classification,
      'Critical / Urgent',
      DEMO_USER_LOCATION
    );

    // HOSP-002 has available beds (14), but lacks cardiac_care and cardiologist
    const hosp002 = ineligibleResults.find((r) => r.hospital.id === 'HOSP-002');
    expect(hosp002).toBeDefined();
    expect(hosp002?.failedConstraints.capabilityFailed).toBe(true);
    expect(hosp002?.failedConstraints.specialistFailed).toBe(true);
  });

  // 9. A suitable hospital outranking an unsuitable nearest hospital
  it('9. ensures a clinically suitable hospital outranks the nearest unsuitable hospital', () => {
    const classification = classifyPatientProblem('chest pain');
    const { rankedEligible } = rankEligibleHospitals(
      INITIAL_DEMO_HOSPITALS,
      classification,
      'Critical / Urgent',
      DEMO_USER_LOCATION
    );

    // HOSP-001 is geographically closest (~1.1 km) but unsuitable (0 beds)
    // HOSP-003 is ~6.5 km away but suitable with cardiac cath lab & beds
    expect(rankedEligible.length).toBeGreaterThan(0);
    const topRecommended = rankedEligible[0];
    expect(topRecommended.hospital.id).not.toBe('HOSP-001');
    expect(topRecommended.hospital.id).toBe('HOSP-003'); // Apollo Apex Heart
    expect(topRecommended.hospital.emergencyCapabilities).toContain('cardiac_care');
  });

  // 10. Deterministic ranking for identical inputs
  it('10. produces deterministic rankings for identical inputs', () => {
    const classification = classifyPatientProblem('chest pain');
    const run1 = rankEligibleHospitals(
      INITIAL_DEMO_HOSPITALS,
      classification,
      'Critical / Urgent',
      DEMO_USER_LOCATION
    );
    const run2 = rankEligibleHospitals(
      INITIAL_DEMO_HOSPITALS,
      classification,
      'Critical / Urgent',
      DEMO_USER_LOCATION
    );

    expect(run1.rankedEligible.map((r) => r.hospital.id)).toEqual(
      run2.rankedEligible.map((r) => r.hospital.id)
    );
    expect(run1.rankedEligible[0].totalScore).toBe(run2.rankedEligible[0].totalScore);
  });

  // 11. Capacity reservation preventing overbooking
  it('11. prevents overbooking when hospital capacity is exhausted', () => {
    const hospital = { ...INITIAL_DEMO_HOSPITALS[0], availableBeds: 1, reservedBeds: 0 };
    
    // First reservation succeeds
    const firstAttempt = CapacityManager.reserveBed(hospital, 1);
    expect(firstAttempt.result.success).toBe(true);
    expect(firstAttempt.result.netRemainingBeds).toBe(0);

    // Second reservation must be rejected
    const secondAttempt = CapacityManager.reserveBed(firstAttempt.updatedHospital, 1);
    expect(secondAttempt.result.success).toBe(false);
    expect(secondAttempt.result.error).toContain('Insufficient bed capacity');
  });

  // 12. Capacity release on cancellation
  it('12. releases reserved capacity when an assignment is cancelled', () => {
    const hospital = { ...INITIAL_DEMO_HOSPITALS[2], availableBeds: 10, reservedBeds: 2 };
    const releaseAttempt = CapacityManager.releaseBed(hospital, 1);

    expect(releaseAttempt.result.success).toBe(true);
    expect(releaseAttempt.result.newReserved).toBe(1);
    expect(releaseAttempt.result.netRemainingBeds).toBe(9);
  });

  // 13. Re-optimisation after bed availability changes
  it('13. automatically re-optimises recommendations when top hospital loses capacity', () => {
    const req = stateStore.submitEmergencyRequest('severe chest pain', 'Critical / Urgent');
    const initialTop = stateStore.getState().activeRecommendations[0]?.hospital.id;
    expect(initialTop).toBe('HOSP-003');

    // Simulate mass casualty exhausting HOSP-003 beds
    stateStore.simulateConditionChange('RESERVE_ALL_BEDS_TOP_HOSPITAL');
    const newTop = stateStore.getState().activeRecommendations[0]?.hospital.id;

    expect(newTop).not.toBe('HOSP-003');
    expect(stateStore.getState().lastReoptimisation?.didTopRecommendationChange).toBe(true);
  });

  // 14. Re-optimisation after traffic changes
  it('14. recalculates recommendations when traffic conditions shift', () => {
    stateStore.submitEmergencyRequest('severe chest pain', 'Critical / Urgent');
    stateStore.simulateConditionChange('HEAVY_TRAFFIC_TOP_HOSPITAL');

    const lastReopt = stateStore.getState().lastReoptimisation;
    expect(lastReopt).toBeDefined();
    expect(lastReopt?.triggerReason).toContain('traffic');
  });

  // 15. Ambulances not being assigned to multiple active cases
  it('15. prevents assigning an ambulance to multiple active emergency cases', () => {
    const ambulance = { ...INITIAL_DEMO_AMBULANCES[0], status: 'Assigned' as const };
    const dummyReq: EmergencyRequest = {
      id: 'REQ-TEST-DUP',
      patientProblem: 'Emergency',
      emergencyLevel: 'Critical / Urgent',
      timestamp: new Date().toISOString(),
      userLocation: DEMO_USER_LOCATION,
      locationType: 'Simulated Demo Coordinates',
      locationAddress: 'Test',
      classification: classifyPatientProblem('chest pain'),
      status: 'Pending',
    };

    const result = AmbulanceDispatchService.assignAmbulance(
      ambulance,
      dummyReq,
      INITIAL_DEMO_HOSPITALS[2]
    );

    expect(result.error).toBeDefined();
    expect(result.error).toContain('already in state "Assigned"');
  });

  // 16. Offline mode marking dependent data as unverified
  it('16. marks dynamic data as unverified when offline mode is engaged', () => {
    stateStore.toggleOfflineMode(true);
    const state = stateStore.getState();

    expect(state.isOffline).toBe(true);
    state.hospitals.forEach((h) => {
      expect(h.verificationStatus).toBe('Stale');
      expect(h.dataSourceLabel).toContain('Offline Cache');
    });
  });

  // 17. Stale data not being represented as confirmed live information
  it('17. excludes or penalizes stale data from being treated as confirmed live feeds', () => {
    const classification = classifyPatientProblem('general fever');
    const { ineligibleResults } = filterEligibleHospitals(
      INITIAL_DEMO_HOSPITALS,
      classification,
      'Moderate',
      DEMO_USER_LOCATION,
      { allowStaleData: false }
    );

    // HOSP-009 has verificationStatus: 'Stale' (>48h old)
    const staleHosp = ineligibleResults.find((r) => r.hospital.id === 'HOSP-009');
    expect(staleHosp).toBeDefined();
    expect(staleHosp?.failedConstraints.freshnessFailed).toBe(true);
  });

  // 18. Graceful handling when no suitable hospital exists
  it('18. handles scenarios gracefully when no suitable hospital exists in dataset', () => {
    // Artificial classification requiring non-existent specialty
    const impossibleClassification = {
      category: 'exotic_emergency',
      categoryLabel: 'Exotic Requirement',
      matchedRuleId: 'RULE_EXOTIC',
      matchedKeywords: ['exotic'],
      requiredCapabilities: ['hyperbaric_deep_sea_chamber'],
      requiredSpecialists: ['hyperbaric_physician'],
      suggestedAmbulanceType: 'Mobile ICU' as const,
      isLifeThreatening: true,
      explanation: 'Exotic test requirement.',
    };

    const { rankedEligible, excludedResults } = rankEligibleHospitals(
      INITIAL_DEMO_HOSPITALS,
      impossibleClassification,
      'Critical / Urgent',
      DEMO_USER_LOCATION
    );

    expect(rankedEligible.length).toBe(0);
    expect(excludedResults.length).toBe(INITIAL_DEMO_HOSPITALS.length);
  });

  // 19. Correct display of hospital addresses and map links
  it('19. generates valid hospital map directions URLs and addresses', () => {
    const hosp = INITIAL_DEMO_HOSPITALS[2];
    expect(hosp.address).toBeTruthy();
    expect(hosp.latitude).toBeGreaterThan(0);
    expect(hosp.longitude).toBeGreaterThan(0);

    const mapUrl = getGoogleMapsDirectionsUrl(
      { latitude: hosp.latitude, longitude: hosp.longitude },
      DEMO_USER_LOCATION
    );
    expect(mapUrl).toContain('https://www.google.com/maps/dir/');
    expect(mapUrl).toContain(`destination=${hosp.latitude},${hosp.longitude}`);
    expect(mapUrl).toContain(`origin=${DEMO_USER_LOCATION.latitude},${DEMO_USER_LOCATION.longitude}`);
  });

  // 20. Reset Demo restoring the initial dataset
  it('20. fully restores initial dataset, requests, and ambulances upon Reset Demo', () => {
    // Alter state: dispatch ambulance and change conditions
    stateStore.simulateConditionChange('RESERVE_ALL_BEDS_TOP_HOSPITAL');
    stateStore.submitEmergencyRequest('Fracture from fall', 'Moderate');

    // Perform Reset Demo
    stateStore.resetDemo();
    const state = stateStore.getState();

    expect(state.hospitals.length).toBe(INITIAL_DEMO_HOSPITALS.length);
    expect(state.ambulances.length).toBe(INITIAL_DEMO_AMBULANCES.length);
    expect(state.isOffline).toBe(false);

    // Verify HOSP-003 was restored to original 18 available beds
    const hosp003 = state.hospitals.find((h) => h.id === 'HOSP-003');
    expect(hosp003?.availableBeds).toBe(18);
  });

  // 21. Hospital Admin Authentication
  it('21. authenticates authorized hospital admins and rejects unauthorized emails', async () => {
    const { authService } = await import('../services/authService');
    
    // Valid authorized login
    const validLogin = await authService.login('apollo.admin@smartcare.org', 'AdminSecure@2026!');
    expect(validLogin.success).toBe(true);
    expect(validLogin.user?.hospitalId).toBe('HOSP-003');

    // Unauthorized email rejected
    const invalidLogin = await authService.login('intruder@random.com', 'AdminSecure@2026!');
    expect(invalidLogin.success).toBe(false);
    expect(invalidLogin.error).toContain('Access Denied');

    await authService.logout();
    expect(authService.getCurrentUser()).toBeNull();
  });

  // 22. Hospital-specific access restrictions
  it('22. enforces hospital-specific access isolation between different hospital admins', async () => {
    const { authService } = await import('../services/authService');
    const { hospitalDatabaseService } = await import('../services/hospitalDatabaseService');

    // Login as Apollo admin (HOSP-003)
    const login = await authService.login('apollo.admin@smartcare.org', 'AdminSecure@2026!');
    expect(login.success).toBe(true);
    const user = login.user!;

    // Attempting to modify HOSP-001 (City Central) must be rejected
    const unauthorizedUpdate = await hospitalDatabaseService.updateHospital(user, 'HOSP-001', {
      availableBeds: 50,
    });
    expect(unauthorizedUpdate.success).toBe(false);
    expect(unauthorizedUpdate.error).toContain('Permission Denied');

    // Modifying own hospital (HOSP-003) is permitted
    const authorizedUpdate = await hospitalDatabaseService.updateHospital(user, 'HOSP-003', {
      availableBeds: 25,
    });
    expect(authorizedUpdate.success).toBe(true);
    expect(authorizedUpdate.updatedHospital?.availableBeds).toBe(25);
  });

  // 23. Invalid bed counts rejected
  it('23. strictly rejects negative bed counts and counts exceeding total capacity', async () => {
    const { authService } = await import('../services/authService');
    const { hospitalDatabaseService } = await import('../services/hospitalDatabaseService');

    const login = await authService.login('apollo.admin@smartcare.org', 'AdminSecure@2026!');
    const user = login.user!;

    // Negative beds
    const negativeRes = await hospitalDatabaseService.updateHospital(user, 'HOSP-003', {
      availableBeds: -5,
    });
    expect(negativeRes.success).toBe(false);
    expect(negativeRes.error).toContain('cannot be negative');

    // Exceeding total capacity (totalBeds is 260)
    const exceedRes = await hospitalDatabaseService.updateHospital(user, 'HOSP-003', {
      availableBeds: 999,
      totalBeds: 260,
    });
    expect(exceedRes.success).toBe(false);
    expect(exceedRes.error).toContain('cannot exceed total capacity');
  });

  // 24. Privilege protection
  it('24. prevents hospital admins from elevating or tampering with verification status', async () => {
    const { authService } = await import('../services/authService');
    const { hospitalDatabaseService } = await import('../services/hospitalDatabaseService');

    const login = await authService.login('greenfield.admin@smartcare.org', 'AdminSecure@2026!');
    const user = login.user!;

    // Greenfield is 'Demo' status. Attempting to elevate to 'Verified' must fail
    const tamperRes = await hospitalDatabaseService.updateHospital(user, 'HOSP-012', {
      verificationStatus: 'Verified',
    });
    expect(tamperRes.success).toBe(false);
    expect(tamperRes.error).toContain('Security Restriction');
  });

  // 25. Database updates appear in patient recommendations
  it('25. dynamically updates patient recommendations when hospital admin changes capacity', async () => {
    const { authService } = await import('../services/authService');
    const { hospitalDatabaseService } = await import('../services/hospitalDatabaseService');

    // Patient submits cardiac request
    const req = stateStore.submitEmergencyRequest(
      'Crushing chest pain radiating to jaw',
      'Critical / Urgent'
    );
    expect(req.recommendations?.[0].hospital.id).toBe('HOSP-003');

    // Apollo admin logs in and updates available beds to 0 (capacity exhausted)
    const login = await authService.login('apollo.admin@smartcare.org', 'AdminSecure@2026!');
    await hospitalDatabaseService.updateHospital(login.user!, 'HOSP-003', {
      availableBeds: 0,
    });

    // Patient active recommendations must have immediately shifted
    const currentRecs = stateStore.getState().activeRecommendations;
    expect(currentRecs[0].hospital.id).not.toBe('HOSP-003');
    // HOSP-003 must now be excluded for zero capacity
    const excluded = stateStore.getState().activeExcluded;
    const apolloExcluded = excluded.find((e) => e.hospital.id === 'HOSP-003');
    expect(apolloExcluded?.failedConstraints.capacityFailed).toBe(true);
  });

  // 26. Operating status Closed causes hospital exclusion
  it('26. marks hospitals as ineligible when operating status is Closed or Temporarily Unavailable', () => {
    const closedHosp = {
      ...INITIAL_DEMO_HOSPITALS[2],
      operatingStatus: 'Closed' as const,
    };
    const req = stateStore.submitEmergencyRequest('Severe chest pain', 'Critical / Urgent');
    const result = filterEligibleHospitals(
      [closedHosp],
      req.classification,
      req.emergencyLevel,
      req.userLocation
    );
    expect(result.eligibleResults.length).toBe(0);
    expect(result.ineligibleResults[0].reasons.some((r: string) => r.includes('Closed'))).toBe(true);
  });

  // 27. Offline mode fallback labels
  it('27. labels fallback hospitals with DEMO DATA notices when offline', () => {
    stateStore.toggleOfflineMode(true);
    const offlineState = stateStore.getState();
    expect(offlineState.isOffline).toBe(true);
    
    // Each degraded hospital must have the demo notice
    for (const h of offlineState.hospitals) {
      expect(h.dataSourceLabel).toContain('DEMO DATA — NOT VERIFIED REAL HOSPITAL INFORMATION');
      expect(h.isDemo).toBe(true);
    }
  });

  // 28. Demo Admin Login functionality & isolation
  it('28. accepts non-empty email/password for Demo Admin Login and blocks modifying real hospitals', async () => {
    const { authService } = await import('../services/authService');
    const { hospitalDatabaseService } = await import('../services/hospitalDatabaseService');

    // Rejects empty inputs
    const emptyLogin = await authService.loginDemoAdmin('', '');
    expect(emptyLogin.success).toBe(false);

    // Accepts any non-empty credentials
    const demoLogin = await authService.loginDemoAdmin('evaluator@hackathon.org', 'testPass123');
    expect(demoLogin.success).toBe(true);
    expect(demoLogin.user?.role).toBe('demo_admin');
    expect(demoLogin.user?.isDemo).toBe(true);

    // Demo admin attempting to modify verified real hospital (HOSP-003 Apollo) MUST be blocked
    const overwriteAttempt = await hospitalDatabaseService.updateHospital(demoLogin.user!, 'HOSP-003', {
      availableBeds: 5,
    });
    expect(overwriteAttempt.success).toBe(false);
    expect(overwriteAttempt.error).toContain('Permission Denied');

    await authService.logout();
  });

  // 29. Home page patient condition form validation
  it('29. validates the patient condition form inputs strictly', async () => {
    const { validateEmergencyRequest } = await import('../utils/validation');

    // Missing description
    const emptyDesc = validateEmergencyRequest('', 'Critical / Urgent');
    expect(emptyDesc.isValid).toBe(false);
    expect(emptyDesc.errors.patientProblem).toBeDefined();

    // Invalid emergency level
    const invalidLevel = validateEmergencyRequest('Severe crushing chest pain', 'InvalidLevel' as any);
    expect(invalidLevel.isValid).toBe(false);
    expect(invalidLevel.errors.emergencyLevel).toBeDefined();

    // Valid inputs
    const validForm = validateEmergencyRequest('Severe chest pain radiating to left arm', 'Critical / Urgent');
    expect(validForm.isValid).toBe(true);
    expect(Object.keys(validForm.errors).length).toBe(0);
  });

  // 30. Emergency classification and priority handling for all three levels
  it('30. properly processes Critical / Urgent, Moderate, and General emergency submissions', () => {
    const critReq = stateStore.submitEmergencyRequest('Crushing chest pain radiating to arm', 'Critical / Urgent');
    expect(critReq.emergencyLevel).toBe('Critical / Urgent');
    expect(critReq.status).toBe('Triaged');

    const modReq = stateStore.submitEmergencyRequest('High persistent fever and dehydration', 'Moderate');
    expect(modReq.emergencyLevel).toBe('Moderate');

    const genReq = stateStore.submitEmergencyRequest('Sprained ankle while walking', 'General');
    expect(genReq.emergencyLevel).toBe('General');
  });
});


