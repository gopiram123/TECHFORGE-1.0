import React from 'react';
import { AppState, stateStore } from '../services/stateStore';
import { 
  Settings, 
  Database, 
  MapPin, 
  Wifi, 
  WifiOff, 
  ShieldAlert, 
  Cpu, 
  RotateCcw, 
  Info 
} from 'lucide-react';

interface SettingsPageProps {
  state: AppState;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ state }) => {
  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      <div className="pb-4 border-b border-slate-200/80">
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-teal-700" />
          System Configuration & Telemetry Status
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Architecture overview, verification provenance, and hackathon operational disclosures.
        </p>
      </div>

      {/* Grid of Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Data Provenance & Verification */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Database className="w-4 h-4 text-teal-600" />
            Dataset Provenance & Verification
          </h3>
          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50">
              <span className="text-slate-600">Simulated Hospitals</span>
              <span className="font-bold text-slate-900">{state.hospitals.length} facilities (Deterministic)</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50">
              <span className="text-slate-600">Simulated Fleet</span>
              <span className="font-bold text-slate-900">{state.ambulances.length} ambulances (ALS, BLS, MICU)</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50">
              <span className="text-slate-600">Initial Queue Baseline</span>
              <span className="font-bold text-slate-900">3 pre-seeded multi-acuity cases</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50">
              <span className="text-slate-600">Last Telemetry Refresh</span>
              <span className="font-mono text-slate-700">{new Date(state.lastSyncTimestamp).toLocaleTimeString()}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Environment & Geolocation Integration */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-teal-600" />
            Geolocation & Routing Status
          </h3>
          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50">
              <span className="text-slate-600">Position Type</span>
              <span className="font-bold text-teal-700">{state.userLocation.type}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50">
              <span className="text-slate-600">Browser Permission</span>
              <span className="font-bold text-slate-900 uppercase text-[10px] bg-slate-200 px-2 py-0.5 rounded">
                {state.userLocation.permissionStatus}
              </span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50">
              <span className="text-slate-600">Distance Engine</span>
              <span className="font-bold text-slate-900">Haversine (Great Circle, R = 6371 km)</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50">
              <span className="text-slate-600">Transit Detour Multiplier</span>
              <span className="font-bold text-slate-900">1.35x Urban Grid Factor</span>
            </div>
          </div>
        </div>
      </div>

      {/* Disclaimers & Safety Notice */}
      <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-6 sm:p-8 space-y-3">
        <h3 className="text-base font-black text-amber-950 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-amber-700" />
          Hackathon Prototype Notice & Safety Limitations
        </h3>
        <p className="text-xs text-amber-900 leading-relaxed">
          LifeLink AI is an engineering proof-of-concept for hackathon demonstration. It does not provide medical diagnoses, guarantee clinical outcomes, or replace official emergency services. All hospital names, capacities, travel times, and vehicle tracking information are simulated. In a genuine medical emergency, dial national emergency dispatch immediately (108 in India).
        </p>
      </div>

      {/* Reset Demo Action */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-extrabold text-slate-900">Restore Baseline Demo State</h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Reset all 12 hospitals, 6 ambulances, and triage queue to initial deterministic values.
          </p>
        </div>
        <button
          onClick={() => stateStore.resetDemo()}
          className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition flex items-center space-x-2 shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
          <span>Reset Demo Environment</span>
        </button>
      </div>
    </div>
  );
};
