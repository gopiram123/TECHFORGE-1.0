import React, { useState, useEffect } from 'react';
import { Hospital, EDReadiness } from '../../types/hospital';
import { HospitalAdminUser } from '../../types/admin';
import { hospitalDatabaseService } from '../../services/hospitalDatabaseService';
import { validateHospitalProfile, HospitalValidationErrors } from '../../utils/validation';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Bed, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Save, 
  RefreshCw, 
  ExternalLink, 
  Activity, 
  Stethoscope, 
  Truck,
  Clock,
  Radio,
  FileCheck2
} from 'lucide-react';

interface HospitalAdminProfileEditorProps {
  adminUser: HospitalAdminUser;
  hospital: Hospital;
  onNavigateToPatientView?: () => void;
}

export const HospitalAdminProfileEditor: React.FC<HospitalAdminProfileEditorProps> = ({
  adminUser,
  hospital,
  onNavigateToPatientView,
}) => {
  // Local form state
  const [name, setName] = useState(hospital.name);
  const [phone, setPhone] = useState(hospital.phone || '');
  const [address, setAddress] = useState(hospital.address);
  const [latitude, setLatitude] = useState(hospital.latitude);
  const [longitude, setLongitude] = useState(hospital.longitude);
  const [totalBeds, setTotalBeds] = useState(hospital.totalBeds);
  const [availableBeds, setAvailableBeds] = useState(hospital.availableBeds);
  const [operatingStatus, setOperatingStatus] = useState<'Open' | 'Temporarily Unavailable' | 'Closed'>(
    hospital.operatingStatus || 'Open'
  );
  const [emergencyDepartmentReadiness, setEmergencyDepartmentReadiness] = useState<EDReadiness>(
    hospital.emergencyDepartmentReadiness
  );
  const [simulatedAmbulanceSupport, setSimulatedAmbulanceSupport] = useState(hospital.simulatedAmbulanceSupport);
  const [specialistAvailability, setSpecialistAvailability] = useState<Record<string, boolean>>(
    { ...hospital.specialistAvailability }
  );
  const [emergencyCapabilities, setEmergencyCapabilities] = useState<string[]>(
    [...hospital.emergencyCapabilities]
  );

  // Status and feedback states
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [formErrors, setFormErrors] = useState<HospitalValidationErrors>({});
  const [lastSavedTime, setLastSavedTime] = useState(hospital.lastUpdated);

  // Sync state if hospital updates from outside
  useEffect(() => {
    setName(hospital.name);
    setPhone(hospital.phone || '');
    setAddress(hospital.address);
    setLatitude(hospital.latitude);
    setLongitude(hospital.longitude);
    setTotalBeds(hospital.totalBeds);
    setAvailableBeds(hospital.availableBeds);
    setOperatingStatus(hospital.operatingStatus || 'Open');
    setEmergencyDepartmentReadiness(hospital.emergencyDepartmentReadiness);
    setSimulatedAmbulanceSupport(hospital.simulatedAmbulanceSupport);
    setSpecialistAvailability({ ...hospital.specialistAvailability });
    setEmergencyCapabilities([...hospital.emergencyCapabilities]);
    setLastSavedTime(hospital.lastUpdated);
  }, [hospital]);

  const allAvailableSpecialists = [
    { id: 'cardiologist', label: 'Cardiologist (Interventional)' },
    { id: 'trauma_surgeon', label: 'Trauma Surgeon (Level 1)' },
    { id: 'pulmonologist', label: 'Pulmonologist / Critical Care' },
    { id: 'neurologist', label: 'Neurologist / Stroke Specialist' },
    { id: 'burn_specialist', label: 'Burn Care Specialist' },
    { id: 'pediatrician', label: 'Pediatric Specialist' },
    { id: 'general_physician', label: 'General Physician / ER Lead' },
  ];

  const allCapabilities = [
    { id: 'emergency_room', label: '24/7 Emergency Room' },
    { id: 'cardiac_care', label: 'Cardiac Cath Lab & Angioplasty' },
    { id: 'trauma_center', label: 'Dedicated Trauma Resuscitation' },
    { id: 'icu_respiratory', label: 'ICU Mechanical Ventilation / ECMO' },
    { id: 'stroke_unit', label: 'Comprehensive Stroke Unit & CT' },
    { id: 'burn_unit', label: 'Specialized Sterile Burn Ward' },
    { id: 'pediatric_icu', label: 'Pediatric Intensive Care (PICU)' },
  ];

  const toggleSpecialist = (specId: string) => {
    setSpecialistAvailability((prev) => ({
      ...prev,
      [specId]: !prev[specId],
    }));
  };

  const toggleCapability = (capId: string) => {
    setEmergencyCapabilities((prev) =>
      prev.includes(capId) ? prev.filter((c) => c !== capId) : [...prev, capId]
    );
  };

  const handleAvailableBedsChange = (val: number) => {
    setAvailableBeds(val);
    if (val < 0) {
      setFormErrors((prev) => ({ ...prev, availableBeds: 'Available beds cannot be negative.' }));
    } else if (val > totalBeds) {
      setFormErrors((prev) => ({
        ...prev,
        availableBeds: `Available beds (${val}) cannot exceed total capacity (${totalBeds}).`,
      }));
    } else {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next.availableBeds;
        return next;
      });
    }
  };

  const handleTotalBedsChange = (val: number) => {
    setTotalBeds(val);
    if (val < 1) {
      setFormErrors((prev) => ({ ...prev, totalBeds: 'Total bed capacity must be at least 1.' }));
    } else if (availableBeds > val) {
      setFormErrors((prev) => ({
        ...prev,
        availableBeds: `Available beds (${availableBeds}) cannot exceed total capacity (${val}).`,
      }));
    } else {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next.totalBeds;
        delete next.availableBeds;
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    // Pre-flight validation
    const validation = validateHospitalProfile({
      name,
      phone,
      address,
      latitude,
      longitude,
      totalBeds,
      availableBeds,
      operatingStatus,
    });

    if (!validation.isValid) {
      setFormErrors(validation.errors);
      setIsSaving(false);
      setErrorMessage(Object.values(validation.errors)[0] || 'Please correct the validation errors.');
      return;
    }

    try {
      const result = await hospitalDatabaseService.updateHospital(adminUser, hospital.id, {
        name,
        phone,
        address,
        latitude,
        longitude,
        totalBeds,
        availableBeds,
        operatingStatus,
        emergencyDepartmentReadiness,
        simulatedAmbulanceSupport,
        specialistAvailability,
        emergencyCapabilities,
      });

      if (result.success && result.updatedHospital) {
        setSuccessMessage('Hospital details and live capacity successfully saved and published!');
        setLastSavedTime(result.updatedHospital.lastUpdated);
        setFormErrors({});
      } else {
        setErrorMessage(result.error || 'Failed to update hospital records.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected database error occurred.');
    } finally {
      setIsSaving(false);
    }
  };

  const occupancyRate = Math.min(100, Math.round(((totalBeds - availableBeds) / Math.max(1, totalBeds)) * 100));

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Visible Demo Mode Notice */}
      {(adminUser.role === 'demo_admin' || adminUser.isDemo) && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 flex items-start space-x-3 text-amber-950 shadow-xs animate-fadeIn">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <h3 className="font-extrabold text-xs sm:text-sm tracking-wide text-amber-900 uppercase">
              DEMO MODE — NOT SECURE FOR REAL HOSPITAL DATA
            </h3>
            <p className="text-xs text-amber-800 leading-relaxed">
              You are currently authenticated in Demo Admin Mode. All edits are confined to this isolated demo sandbox and cannot modify, overwrite, or impersonate verified real hospital records.
            </p>
          </div>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-900 text-white px-2.5 py-0.5 rounded-full">
              Hospital ID: {hospital.id}
            </span>

            {/* Operating status badge */}
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                operatingStatus === 'Open'
                  ? 'bg-emerald-100 text-emerald-800'
                  : operatingStatus === 'Temporarily Unavailable'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-rose-100 text-rose-800'
              }`}
            >
              Status: {operatingStatus}
            </span>

            {/* Verification Status (Read-Only) */}
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                hospital.verificationStatus === 'Verified'
                  ? 'bg-teal-100 text-teal-800'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {hospital.verificationStatus === 'Verified' ? 'Verified Node' : 'Demo Record'}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {hospital.name}
          </h2>
          <p className="text-xs text-slate-500 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span>{hospital.address}</span>
            <span className="text-slate-300">•</span>
            <Phone className="w-3.5 h-3.5 text-slate-400" />
            <span>{hospital.phone || 'No phone recorded'}</span>
          </p>
        </div>

        {/* Live sync & patient navigation preview */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          {onNavigateToPatientView && (
            <button
              type="button"
              onClick={onNavigateToPatientView}
              className="inline-flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-3.5 py-2 rounded-xl transition"
            >
              <span>View in Patient Finder</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            </button>
          )}

          <div className="text-[11px] text-slate-500 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>
              Last synced: {lastSavedTime ? new Date(lastSavedTime).toLocaleTimeString() : 'Never'}
            </span>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs p-4 rounded-2xl flex items-center justify-between shadow-xs animate-fadeIn">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{successMessage}</span>
          </div>
          {onNavigateToPatientView && (
            <button
              onClick={onNavigateToPatientView}
              className="text-xs font-bold text-emerald-900 underline hover:text-emerald-700"
            >
              Inspect Patient Recommendations &rarr;
            </button>
          )}
        </div>
      )}

      {/* Error Banner */}
      {errorMessage && (
        <div className="bg-rose-50 border border-rose-300 text-rose-800 text-xs p-4 rounded-2xl flex items-start space-x-2.5 shadow-xs animate-fadeIn">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Validation or Save Error:</p>
            <p className="text-rose-700 mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Facility Profile & Operating Status */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
              <Building2 className="w-4 h-4 text-teal-600" />
              <span>Hospital Identification & Contact</span>
            </div>
            <div className="text-[11px] text-slate-400">
              Assigned to: {adminUser.email}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Hospital Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
              />
              {formErrors.name && (
                <p className="text-[11px] text-rose-600 mt-1">{formErrors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Emergency Dispatch Contact Phone
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 040-555-0100"
                required
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
              />
              {formErrors.phone && (
                <p className="text-[11px] text-rose-600 mt-1">{formErrors.phone}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Physical Street Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
              />
              {formErrors.address && (
                <p className="text-[11px] text-rose-600 mt-1">{formErrors.address}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Latitude Coordinates (GPS)
              </label>
              <input
                type="number"
                step="0.0001"
                value={latitude}
                onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
                required
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
              />
              {formErrors.latitude && (
                <p className="text-[11px] text-rose-600 mt-1">{formErrors.latitude}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Longitude Coordinates (GPS)
              </label>
              <input
                type="number"
                step="0.0001"
                value={longitude}
                onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
                required
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
              />
              {formErrors.longitude && (
                <p className="text-[11px] text-rose-600 mt-1">{formErrors.longitude}</p>
              )}
            </div>
          </div>

          {/* Operating Status & Platform Verification Disclosure */}
          <div className="pt-2 border-t border-slate-150 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Hospital Operating Status
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Open', 'Temporarily Unavailable', 'Closed'] as const).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setOperatingStatus(status)}
                    className={`py-2 px-2 text-center text-xs font-bold rounded-xl border transition ${
                      operatingStatus === status
                        ? status === 'Open'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : status === 'Temporarily Unavailable'
                          ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                          : 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Verification Status (Protected)
              </label>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                <span className="font-bold text-slate-800">
                  {hospital.verificationStatus === 'Verified' ? 'Confirmed Partner Node' : 'Simulated Record'}
                </span>
                <span className="text-[10px] text-slate-400">
                  Platform Admin Managed
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Verification status is governed by Platform Administration and cannot be self-modified.
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Bed Capacity & Emergency Department Readiness */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
              <Bed className="w-4 h-4 text-teal-600" />
              <span>Bed Capacity & Emergency Department Readiness</span>
            </div>
            <span className="text-[11px] font-semibold text-slate-500">
              Occupancy: {occupancyRate}%
            </span>
          </div>

          {/* Capacity Progress Bar */}
          <div className="space-y-1.5">
            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${occupancyRate}%` }}
                className={`transition-all duration-300 ${
                  occupancyRate >= 90
                    ? 'bg-rose-500'
                    : occupancyRate >= 75
                    ? 'bg-amber-500'
                    : 'bg-teal-500'
                }`}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>Occupied: {totalBeds - availableBeds} beds</span>
              <span>Available: {availableBeds} beds</span>
              <span>Total Capacity: {totalBeds} beds</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Total Licensed Beds
              </label>
              <input
                type="number"
                min="1"
                value={totalBeds}
                onChange={(e) => handleTotalBedsChange(parseInt(e.target.value) || 0)}
                required
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
              />
              {formErrors.totalBeds && (
                <p className="text-[11px] text-rose-600 mt-1">{formErrors.totalBeds}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Currently Available Beds
              </label>
              <input
                type="number"
                min="0"
                max={totalBeds}
                value={availableBeds}
                onChange={(e) => handleAvailableBedsChange(parseInt(e.target.value) || 0)}
                required
                className={`w-full text-xs sm:text-sm px-3.5 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition ${
                  formErrors.availableBeds
                    ? 'border-rose-400 bg-rose-50/30'
                    : 'border-slate-200 focus:border-teal-600'
                }`}
              />
              {formErrors.availableBeds ? (
                <p className="text-[11px] text-rose-600 mt-1">{formErrors.availableBeds}</p>
              ) : (
                <p className="text-[10px] text-slate-400 mt-1">
                  Must be between 0 and total capacity ({totalBeds}).
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Emergency Department Readiness
              </label>
              <select
                value={emergencyDepartmentReadiness}
                onChange={(e) => setEmergencyDepartmentReadiness(e.target.value as EDReadiness)}
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition bg-white"
              >
                <option value="Ready">Ready (Accepting All Critical Cases)</option>
                <option value="Busy">Busy (Elevated Wait Times)</option>
                <option value="Diverting">Diverting (Ambulance Diversion Active)</option>
                <option value="Critical">Critical (Disaster Code Active)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Emergency Ambulance Fleet Support
              </label>
              <div className="flex items-center space-x-3 pt-1">
                <button
                  type="button"
                  onClick={() => setSimulatedAmbulanceSupport(!simulatedAmbulanceSupport)}
                  className={`px-4 py-2 text-xs font-bold rounded-xl border transition flex items-center space-x-2 ${
                    simulatedAmbulanceSupport
                      ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>
                    {simulatedAmbulanceSupport ? 'Ambulance Units Active' : 'No Dedicated Ambulance'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Essential Facilities & On-Duty Specialists */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
              <Activity className="w-4 h-4 text-teal-600" />
              <span>Clinical Capabilities & Specialist Roster</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              LifeLink AI evaluates these flags against patient chief complaints to match eligible emergency facilities.
            </p>
          </div>

          {/* Essential Facilities Checklist */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              Essential Clinical Facilities Available
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {allCapabilities.map((cap) => {
                const isSelected = emergencyCapabilities.includes(cap.id);
                return (
                  <button
                    key={cap.id}
                    type="button"
                    onClick={() => toggleCapability(cap.id)}
                    className={`flex items-center space-x-2.5 p-3 rounded-xl border text-left text-xs transition ${
                      isSelected
                        ? 'border-teal-500 bg-teal-50/60 text-slate-900 font-semibold'
                        : 'border-slate-200 bg-slate-50/50 text-slate-600 hover:bg-slate-100/70'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'border-teal-600 bg-teal-600 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </div>
                    <span>{cap.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* On-Duty Specialists Checklist */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-700">
              Specialist Physicians Currently On Duty
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {allAvailableSpecialists.map((spec) => {
                const isOnDuty = Boolean(specialistAvailability[spec.id]);
                return (
                  <button
                    key={spec.id}
                    type="button"
                    onClick={() => toggleSpecialist(spec.id)}
                    className={`flex items-center space-x-2.5 p-3 rounded-xl border text-left text-xs transition ${
                      isOnDuty
                        ? 'border-teal-500 bg-teal-50/60 text-slate-900 font-semibold'
                        : 'border-slate-200 bg-slate-50/50 text-slate-600 hover:bg-slate-100/70'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                        isOnDuty
                          ? 'border-teal-600 bg-teal-600 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isOnDuty && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </div>
                    <span>{spec.label}</span>
                    <span
                      className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        isOnDuty
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {isOnDuty ? 'On Duty' : 'Off Duty'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Section 4: Save Actions */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-0.5 text-center sm:text-left">
            <h4 className="text-sm font-bold text-white flex items-center gap-2 justify-center sm:justify-start">
              <FileCheck2 className="w-4 h-4 text-teal-400" />
              <span>Ready to publish changes?</span>
            </h4>
            <p className="text-xs text-slate-400">
              Updates will instantly synchronize across database channels and recalculate patient recommendations.
            </p>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-xl transition shadow-md disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving & Publishing...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Changes & Publish Live</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
