import React, { useState } from 'react';
import { EmergencyLevel } from '../types/emergency';
import { validateEmergencyRequest } from '../utils/validation';
import { stateStore } from '../services/stateStore';
import { 
  AlertCircle, 
  Search, 
  MapPin, 
  Check, 
  Sparkles 
} from 'lucide-react';

interface EmergencyRequestFormProps {
  onSearchComplete: (level: EmergencyLevel) => void;
  isSearching: boolean;
}

export const EmergencyRequestForm: React.FC<EmergencyRequestFormProps> = ({
  onSearchComplete,
  isSearching,
}) => {
  const [problem, setProblem] = useState(
    'Patient experiencing severe chest pain radiating to left arm'
  );
  const [emergencyLevel, setEmergencyLevel] = useState<EmergencyLevel>('Critical / Urgent');
  const [errors, setErrors] = useState<{ patientProblem?: string; emergencyLevel?: string }>({});

  const state = stateStore.getState();

  const handleRequestLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        stateStore.updateLocation(
          position.coords.latitude,
          position.coords.longitude,
          'Real Browser Geolocation',
          'granted',
          `GPS: ${position.coords.latitude.toFixed(4)}° N, ${position.coords.longitude.toFixed(4)}° E`
        );
      },
      () => {
        stateStore.updateLocation(
          state.userLocation.latitude,
          state.userLocation.longitude,
          'Simulated Demo Coordinates',
          'denied'
        );
      },
      { timeout: 7000 }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateEmergencyRequest(problem, emergencyLevel);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }
    setErrors({});

    stateStore.submitEmergencyRequest(problem, emergencyLevel);
    onSearchComplete(emergencyLevel);
  };

  const quickSymptoms = [
    { label: 'Chest Pain', text: 'Severe chest pain radiating to left arm with sweating', level: 'Critical / Urgent' as EmergencyLevel },
    { label: 'Breathing Difficulty', text: 'Shortness of breath, severe wheezing, asthma attack', level: 'Critical / Urgent' as EmergencyLevel },
    { label: 'Road Accident', text: 'Motorcycle accident with severe injury and bleeding', level: 'Critical / Urgent' as EmergencyLevel },
    { label: 'Stroke Symptoms', text: 'Facial drooping, one-sided arm weakness, slurred speech', level: 'Critical / Urgent' as EmergencyLevel },
    { label: 'High Fever', text: 'High fever with dehydration and vomiting', level: 'Moderate' as EmergencyLevel },
  ];

  return (
    <div className="bg-[#F0F7FA] border border-sky-200/70 rounded-3xl p-6 sm:p-8 shadow-xs max-w-2xl mx-auto">
      {/* Exact Heading Directly Above Form */}
      <div className="mb-6 text-center sm:text-left">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Fill the Patient Condition Form
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Provide the patient's symptoms and emergency level to automatically match eligible hospital facilities.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Field 1: Patient Problem */}
        <div>
          <label
            htmlFor="patientProblem"
            className="block text-sm font-bold text-slate-900 mb-2"
          >
            Patient Problem
          </label>
          <textarea
            id="patientProblem"
            rows={3}
            value={problem}
            onChange={(e) => {
              setProblem(e.target.value);
              if (errors.patientProblem) setErrors((prev) => ({ ...prev, patientProblem: undefined }));
            }}
            placeholder="Describe the patient's condition"
            className={`w-full rounded-2xl border bg-white px-4 py-3 text-slate-900 text-sm shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 transition ${
              errors.patientProblem
                ? 'border-rose-400 focus:border-rose-500'
                : 'border-slate-250 focus:border-teal-600'
            }`}
          />
          {errors.patientProblem && (
            <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1 font-medium">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.patientProblem}
            </p>
          )}

          {/* Quick Symptoms Chips */}
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-slate-500 font-medium">Quick examples:</span>
            {quickSymptoms.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setProblem(item.text);
                  setEmergencyLevel(item.level);
                  if (errors.patientProblem) setErrors({});
                }}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Field 2: Emergency Level */}
        <div>
          <label className="block text-sm font-bold text-slate-900 mb-2">
            Emergency Level
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Critical / Urgent */}
            <button
              type="button"
              onClick={() => setEmergencyLevel('Critical / Urgent')}
              className={`flex flex-col items-start p-3.5 rounded-2xl border-2 text-left transition ${
                emergencyLevel === 'Critical / Urgent'
                  ? 'border-rose-600 bg-rose-50/60 shadow-xs ring-1 ring-rose-600/30'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="font-bold text-sm text-rose-800">Critical / Urgent</span>
                {emergencyLevel === 'Critical / Urgent' && (
                  <span className="w-2 h-2 rounded-full bg-rose-600" />
                )}
              </div>
              <span className="text-[11px] text-slate-500">
                Life-threatening crisis
              </span>
            </button>

            {/* Moderate */}
            <button
              type="button"
              onClick={() => setEmergencyLevel('Moderate')}
              className={`flex flex-col items-start p-3.5 rounded-2xl border-2 text-left transition ${
                emergencyLevel === 'Moderate'
                  ? 'border-amber-500 bg-amber-50/60 shadow-xs ring-1 ring-amber-500/30'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="font-bold text-sm text-amber-800">Moderate</span>
                {emergencyLevel === 'Moderate' && (
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                )}
              </div>
              <span className="text-[11px] text-slate-500">
                Severe pain or illness
              </span>
            </button>

            {/* General */}
            <button
              type="button"
              onClick={() => setEmergencyLevel('General')}
              className={`flex flex-col items-start p-3.5 rounded-2xl border-2 text-left transition ${
                emergencyLevel === 'General'
                  ? 'border-teal-600 bg-teal-50/60 shadow-xs ring-1 ring-teal-600/30'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="font-bold text-sm text-teal-800">General</span>
                {emergencyLevel === 'General' && (
                  <span className="w-2 h-2 rounded-full bg-teal-600" />
                )}
              </div>
              <span className="text-[11px] text-slate-500">
                Low-acuity condition
              </span>
            </button>
          </div>
        </div>

        {/* GPS Location Status Pill */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <span className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-teal-600" />
            <span>
              Location: <strong>{state.userLocation.type === 'Real Browser Geolocation' ? 'GPS Active' : 'Demo Location'}</strong>
            </span>
          </span>
          <button
            type="button"
            onClick={handleRequestLocation}
            className="text-teal-700 hover:text-teal-800 font-semibold underline text-[11px]"
          >
            {state.userLocation.type === 'Real Browser Geolocation' ? 'Update GPS' : 'Enable Real GPS'}
          </button>
        </div>

        {/* Primary Action Button */}
        <div>
          <button
            type="submit"
            disabled={isSearching}
            className="w-full py-3.5 px-6 rounded-2xl font-bold text-white bg-teal-600 hover:bg-teal-700 active:bg-teal-800 transition shadow-md shadow-teal-600/20 flex items-center justify-center space-x-2 text-base disabled:opacity-50"
          >
            {isSearching ? (
              <span>Matching Suitable Hospitals...</span>
            ) : (
              <>
                <Search className="w-5 h-5" />
                <span>Find Suitable Hospitals</span>
              </>
            )}
          </button>
        </div>

        {/* Note */}
        <p className="text-center text-xs text-slate-500 pt-1">
          Hospital recommendations are based on available capacity, required facilities, and estimated travel time.
        </p>
      </form>
    </div>
  );
};
