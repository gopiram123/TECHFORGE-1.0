# SmartCare AI — Intelligent Emergency Hospital Finder & Ambulance Dispatch Platform

> **DEMO DATA NOTICE**: All hospital facilities, coordinates, addresses, capacity numbers, specialist schedules, and ambulance units in this system are simulated for hackathon demonstration. **NOT REAL HOSPITAL INFORMATION.**  
> In real-world life-threatening medical emergencies, immediately dial **108** (Emergency Helpline, India) or local emergency services.

---

## 1. Project Overview

**SmartCare AI** is an intelligent, reactive, multi-criteria clinical decision support and dispatch platform designed to solve a fatal flaw in conventional emergency routing: **the naive nearest-hospital trap**.

During medical crises (such as acute myocardial infarction, polytrauma, severe respiratory failure, or ischemic stroke), routing an emergency patient to the geographically closest facility can result in catastrophe if that facility lacks specialized intensive care (e.g., a cardiac catheterization lab, trauma bay, stroke unit), has an off-duty specialist, is on ambulance diversion, or has zero available ICU beds.

SmartCare AI enforces a strict paradigm: **the fastest *suitable* hospital, not simply the geographically nearest hospital.**

---

## 2. Key Capabilities & Workflow

### 2.1 The Two-Field User Emergency Request
The primary patient triage flow requires only **two inputs**:
1. **Patient Problem / Chief Complaint:** Free-text natural language description (e.g., `"crushing chest pain radiating to left jaw"`, `"highway collision with leg fracture and bleeding"`).
2. **Emergency Urgency Level:** One of three triage tiers:
   - **Critical / Urgent** (Priority 1)
   - **Moderate** (Priority 2)
   - **General** (Priority 3)

*No manual selection of medical department, specialist, beds, or ambulance is required from the patient.* Browser location is obtained via standard Geolocation API with graceful fallback to fixed fictional coordinates (`17.4399° N, 78.4422° E`).

---

## 3. Technology Stack

- **Frontend Framework:** React 18 with TypeScript 5
- **Build System & Dev Server:** Vite 6
- **Styling & Design System:** Tailwind CSS with operational emergency color palette (Deep Navy `#0B192C`, Slate Neutral `#F8FAFC`, Clinical Teal `#008170`, Cyan `#00ADB5`, Emergency Alert Red `#DC2626`)
- **Iconography:** Lucide React
- **Test Framework:** Vitest 2.1
- **Geospatial & Vector Engine:** Haversine formula distance calculator, responsive SVG cartography grid with interactive marker popups, Google Maps directions links
- **State & Service Architecture:** Singleton reactive state store (`StateStore`) with atomic capacity manager and structured audit log

---

## 4. Application Architecture

```
d:/hackthon/
├── src/
│   ├── types/
│   │   ├── hospital.ts         # Hospital, eligibility, ranking, and coordinate schemas
│   │   ├── ambulance.ts        # Ambulance telemetry and assignment models
│   │   ├── emergency.ts        # Emergency requests, triage levels, classification rules
│   │   └── audit.ts            # Audit event types and logging interfaces
│   ├── data/
│   │   ├── demoHospitals.ts    # Deterministic dataset of 12 fictional facilities
│   │   ├── demoAmbulances.ts   # Deterministic fleet of 6 simulated emergency ambulances
│   │   └── demoRequests.ts     # Pre-seeded multi-acuity emergency dispatch queue
│   ├── utils/
│   │   ├── distance.ts         # Haversine distance formula & Google Maps URL builder
│   │   ├── timeEstimation.ts   # Urban detour (1.35x), traffic factors, siren advantage
│   │   └── validation.ts       # 2-field emergency request validation
│   ├── services/
│   │   ├── problemClassifier.ts    # Configurable rule-based clinical problem engine
│   │   ├── hospitalEligibility.ts  # Hard clinical, capacity & readiness constraints
│   │   ├── hospitalRanking.ts      # Multi-factor deterministic ranking algorithm
│   │   ├── capacityManager.ts      # Atomic bed reservation, release, & occupancy guards
│   │   ├── ambulanceDispatch.ts    # Vehicle capability matching (ALS/BLS/MICU) & tracking
│   │   ├── reoptimisation.ts       # Dynamic re-ranking engine on environmental shocks
│   │   ├── offlineManager.ts       # Offline degradation & localStorage cache sync
│   │   ├── auditService.ts         # Structured immutable event ledger
│   │   └── stateStore.ts           # Central reactive state orchestrator
│   ├── components/
│   │   ├── Header.tsx                  # Top banner with India 112 hotline & controls
│   │   ├── Navigation.tsx              # 8-tab operational view switcher
│   │   ├── OfflineBanner.tsx           # Persistent alert when telemetry disconnected
│   │   ├── EmergencyRequestForm.tsx    # 2-field form with one-click test symptom chips
│   │   ├── HospitalRecommendationCard.tsx # #1 Top recommended hospital with explanation
│   │   ├── HospitalList.tsx            # Ranked alternatives & excluded facilities list
│   │   ├── HospitalMap.tsx             # Interactive vector cartography grid
│   │   ├── AmbulancePanel.tsx          # Fleet table & dispatcher confirmation panel
│   │   ├── CapacityPanel.tsx           # Bed occupancy grid & stress-test triggers
│   │   ├── PriorityQueue.tsx           # Multi-acuity queue with arrival tie-breaker
│   │   ├── ExplainabilityPanel.tsx     # Transparent nearest-vs-suitable scoring audit
│   │   ├── AuditLog.tsx                # Filterable event audit trail
│   │   └── DemoScenarioRunner.tsx      # Step-by-step hackathon demo runner modal
│   ├── pages/
│   │   ├── HomePage.tsx            # Emergency request & top match preview
│   │   ├── RecommendationsPage.tsx # Recommendations deep dive & map
│   │   ├── DashboardPage.tsx       # Operations KPI command center
│   │   ├── DispatchPage.tsx        # Fleet tracking & queue dispatch
│   │   ├── CapacityPage.tsx        # Hospital bed balancing & stress-tests
│   │   ├── AnalyticsPage.tsx       # Travel time vs distance & traffic analysis
│   │   ├── AuditPage.tsx           # Full immutable decision ledger
│   │   └── SettingsPage.tsx        # Telemetry verification & provenance
│   ├── tests/
│   │   └── smartcare.test.ts       # 20 Vitest automated verification tests
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
```

---

## 5. Algorithms & Time Complexity

Let:
- $H$ = Number of hospitals in dataset ($H = 12$)
- $A$ = Number of ambulances in fleet ($A = 6$)
- $E$ = Number of emergency requests in active triage queue ($E \ge 3$)
- $K$ = Number of configured problem classification rules ($K = 7$)

### 5.1 Problem Classification Engine — $O(K)$
Matches patient chief complaint text against predefined rules with regex token boundaries and case-insensitive normalization. Configured in `src/services/problemClassifier.ts`:
- **Cardiac Emergency** (`RULE_CARDIAC_EMERGENCY`): Requires `cardiac_care`, `emergency_room`, on-duty `cardiologist`, ALS ambulance.
- **Trauma & Surgical Emergency** (`RULE_ROAD_ACCIDENT_TRAUMA`): Requires `trauma_center`, `emergency_room`, on-duty `trauma_surgeon`, ALS ambulance.
- **Respiratory Emergency** (`RULE_RESPIRATORY_EMERGENCY`): Requires `icu_respiratory`, `emergency_room`, on-duty `pulmonologist`, Mobile ICU.
- **Stroke-Capable Emergency** (`RULE_STROKE_EMERGENCY`): Requires `stroke_unit`, `emergency_room`, on-duty `neurologist`, ALS ambulance.
- **Burn Emergency** (`RULE_BURN_EMERGENCY`): Requires `burn_unit`, on-duty `burn_specialist`.
- **Pediatric Emergency** (`RULE_PEDIATRIC_EMERGENCY`): Requires `pediatric_icu`, on-duty `pediatrician`.
- **Fever / Infection** (`RULE_FEVER_INFECTION`): Acute emergency workup, general physician, BLS ambulance.
- **Fallback** (`RULE_UNKNOWN_PROBLEM`): Provisionally maps to emergency room with manual dispatcher review.

### 5.2 Hospital Eligibility Filtering — $O(H)$
Applies non-negotiable **hard constraints** before scoring:
1. Hospital possesses all required emergency clinical capabilities.
2. Hospital has required specialist physician confirmed on duty.
3. Hospital has net reservable capacity ($availableBeds - reservedBeds > 0$). **Zero available beds strictly disqualifies.**
4. Emergency department readiness is not `Diverting`.
5. Data telemetry is verified (stale feeds $>48$h are disqualified or warned).
6. Hospital is within geographic feasible transport perimeter.

### 5.3 Hospital Ranking Algorithm — $O(H \log H)$
For all facilities passing hard constraints, computes a deterministic suitability score:
$$\text{Score} = 200 + \text{ClinicalBonus} + \text{ReadinessBonus} + \text{CapacityBonus} + \text{FreshnessBonus} - \text{TimePenalty} - \text{DistancePenalty}$$
Where travel time is the dominant operational factor ($\text{TimePenalty} = \text{ETA} \times 3.0$ for Critical cases). Sorted deterministically using comparison sort ($O(H \log H)$) with travel time, distance, and hospital ID tie-breakers.

### 5.4 Ambulance Fleet Scan — $O(A)$
Linear scan ($O(A)$) filtering for `status === 'Available'`, calculating distance-to-patient and vehicle capability compatibility bonus (ALS vs BLS).

### 5.5 Triage Priority Queue — $O(E \log E)$
Sorts requests by priority weight:
1. `Critical / Urgent` (Weight 3)
2. `Moderate` (Weight 2)
3. `General` (Weight 1)
Within the same priority tier, breaks ties strictly by arrival timestamp ($t_{\text{arrival}}$ ascending).

---

## 6. Installation & Execution Instructions

### Prerequisites
- Node.js version 18+ or 20+ (tested on Node v24.21.0)
- npm version 9+ (tested on npm 11.19.0)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Run Automated Tests
Execute the 20-test automated verification suite:
```bash
npm test
```
*All 20 test cases will execute and verify classification, eligibility, atomic capacity reservation, priority queue ordering, re-optimisation, and offline handling.*

### Step 3: Run Production Build
```bash
npm run build
```
*Compiles TypeScript and bundles via Vite into `dist/`.*

### Step 4: Launch Development Server
```bash
npm run dev
```
Navigate your browser to: **http://localhost:5173**

---

## 7. The 20 Automated Tests & Verification Results

All 20 test scenarios mandated in the master specification are automated in `src/tests/smartcare.test.ts` and pass 100%:

| # | Test Scenario | Result |
|---|---|:---:|
| 1 | Known patient-problem keyword classification | **PASS** |
| 2 | Case-insensitive input handling | **PASS** |
| 3 | Empty and whitespace problem descriptions | **PASS** |
| 4 | Unknown problem descriptions fallback to manual review | **PASS** |
| 5 | Critical cases taking priority in dispatch queue | **PASS** |
| 6 | Arrival-time tie-breaking for equal priority cases | **PASS** |
| 7 | Zero-bed hospitals being strictly excluded | **PASS** |
| 8 | Missing required specialists/capabilities being excluded | **PASS** |
| 9 | Suitable hospital outranking nearest unsuitable hospital | **PASS** |
| 10 | Deterministic ranking for identical inputs | **PASS** |
| 11 | Capacity reservation preventing overbooking | **PASS** |
| 12 | Capacity release on cancellation | **PASS** |
| 13 | Re-optimisation after bed availability changes | **PASS** |
| 14 | Re-optimisation after traffic condition changes | **PASS** |
| 15 | Ambulances not being assigned to multiple active cases | **PASS** |
| 16 | Offline mode marking dependent data as unverified | **PASS** |
| 17 | Stale data not represented as confirmed live information | **PASS** |
| 18 | Graceful handling when no suitable hospital exists | **PASS** |
| 19 | Correct display of hospital addresses and map links | **PASS** |
| 20 | Reset Demo restoring the initial dataset | **PASS** |

---

## 8. One-Click Hackathon Demo Scenario

To demonstrate the platform to hackathon judges:
1. Open the application at `http://localhost:5173`.
2. Click the glowing **"Run Demo Scenario"** button in the top navigation bar.
3. The automated scenario executes in 5 sequential steps:
   - **Step 1:** Resets demo state and registers a cardiac incident: *"Patient reports severe crushing chest pain, cold sweats, left arm tightness"*.
   - **Step 2:** Rule engine classifies case as `Cardiac Emergency`, requiring a cardiac catheterization lab and on-duty cardiologist.
   - **Step 3:** The nearest facility (**City Central**, 1.1 km) is **rejected** because it has 0 available beds. **St. Jude** (3.2 km) is **rejected** because it lacks cardiac care. **Apollo Apex Heart & Trauma Institute** is **recommended #1** (2.4 km, ~9 min travel time, 18 available ICU beds).
   - **Step 4:** Dispatches ALS Unit **AMB-01** (4 min pickup ETA) and decrements 1 cardiac bed atomically.
   - **Step 5:** Injects highway gridlock onto the route to Apollo Apex (+45m delay). The re-optimisation engine immediately fires and switches the top recommendation to **Fortis Crest Multi-Specialty Hospital**!

---

## 9. Offline Simulation & Data Governance

- **Toggle Offline Mode:** Accessible via the top header button.
- **Behavior:**
  - Displays persistent high-visibility warning banner.
  - Loads hospital and fleet records from browser `localStorage` cache.
  - Marks live bed counts, traffic conditions, and ED readiness as `Stale / Unverified`.
  - Disables false claims of real-time remote connectivity.
  - Restoring connectivity executes a live telemetry refresh and re-runs active rankings.

---

## 10. Safety Disclosures & Known Limitations

1. **Non-Diagnostic:** SmartCare AI maps natural language problem keywords to provisional operational requirements. It does not perform clinical diagnosis.
2. **Deterministic Demonstration:** The hospital, ambulance, and location datasets are deterministic and fictional to guarantee reproducible hackathon evaluation.
3. **Emergency Contact:** Users with emergency symptoms are instructed at all times to dial **108** (India Emergency Helpline).
