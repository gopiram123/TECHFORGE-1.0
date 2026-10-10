import React from 'react';
import { AppState } from '../services/stateStore';
import { NavTab } from '../components/Navigation';
import { 
  LayoutDashboard, 
  Activity, 
  Truck, 
  BedDouble, 
  AlertTriangle, 
  Clock, 
  RotateCw, 
  Wifi, 
  WifiOff, 
  ArrowRight, 
  ShieldAlert 
} from 'lucide-react';

interface DashboardPageProps {
  state: AppState;
  onNavigate: (tab: NavTab) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ state, onNavigate }) => {
  const { requests, ambulances, hospitals, isOffline, lastReoptimisation } = state;

  const criticalCount = requests.filter((r) => r.emergencyLevel === 'Critical / Urgent').length;
  const moderateCount = requests.filter((r) => r.emergencyLevel === 'Moderate').length;
  const generalCount = requests.filter((r) => r.emergencyLevel === 'General').length;

  const availableAmbulances = ambulances.filter((a) => a.status === 'Available').length;
  const activeDispatches = ambulances.filter((a) => a.status === 'Assigned' || a.status === 'En Route').length;

  const totalBeds = hospitals.reduce((sum, h) => sum + h.totalBeds, 0);
  const totalAvailableBeds = hospitals.reduce((sum, h) => sum + h.availableBeds, 0);
  const totalReservedBeds = hospitals.reduce((sum, h) => sum + h.reservedBeds, 0);
  const netFreeBeds = Math.max(0, totalAvailableBeds - totalReservedBeds);

  const fullHospitalsCount = hospitals.filter(
    (h) => Math.max(0, h.availableBeds - h.reservedBeds) === 0
  ).length;

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200/80 gap-3">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-teal-700" />
            Emergency Operations Command Dashboard
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time telemetry aggregated from active queue, ambulance telematics, and bed reservations.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span
            className={`px-3 py-1 rounded-full font-bold flex items-center gap-1.5 ${
              isOffline
                ? 'bg-amber-100 text-amber-800'
                : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            {isOffline ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
            <span>{isOffline ? 'Offline Mode' : 'Central Dispatch Online'}</span>
          </span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Queue Breakdown */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Triage Queue
            </span>
            <Activity className="w-4 h-4 text-rose-500" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black text-slate-900">{requests.length}</span>
            <span className="text-xs text-slate-500">active cases</span>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold">
            <span className="text-rose-600">{criticalCount} Critical</span>
            <span className="text-amber-600">{moderateCount} Moderate</span>
            <span className="text-teal-600">{generalCount} General</span>
          </div>
        </div>

        {/* Card 2: Ambulance Fleet */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Ambulance Fleet
            </span>
            <Truck className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black text-slate-900">{availableAmbulances}</span>
            <span className="text-xs text-slate-500">available of {ambulances.length}</span>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-blue-700 font-semibold">{activeDispatches} Assigned / En Route</span>
            <button
              onClick={() => onNavigate('dispatch')}
              className="text-slate-500 hover:text-teal-700 font-bold underline"
            >
              Dispatch
            </button>
          </div>
        </div>

        {/* Card 3: Bed Capacity */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Net Bed Buffer
            </span>
            <BedDouble className="w-4 h-4 text-teal-600" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black text-teal-800">{netFreeBeds}</span>
            <span className="text-xs text-slate-500">free across {hospitals.length} hosps</span>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">{totalReservedBeds} beds reserved</span>
            <span className="text-rose-600 font-bold">{fullHospitalsCount} full / diverting</span>
          </div>
        </div>

        {/* Card 4: Response Time Estimate */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Avg Simulated Response
            </span>
            <Clock className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black text-slate-900">~14</span>
            <span className="text-xs text-slate-500">minutes total</span>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Pickup: ~5m</span>
            <span>Transit: ~9m</span>
          </div>
        </div>
      </div>

      {/* Re-Optimisation Alert Banner */}
      {lastReoptimisation && (
        <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 space-y-3 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <RotateCw className="w-4 h-4 text-cyan-400 animate-spin" />
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                Latest Re-Optimisation Event
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              {new Date(lastReoptimisation.recalculatedAt).toLocaleTimeString()}
            </span>
          </div>
          <p className="text-sm text-slate-200 font-medium">
            {lastReoptimisation.explanation}
          </p>
          <div className="text-xs text-slate-400">
            Trigger Reason: <strong className="text-slate-200">{lastReoptimisation.triggerReason}</strong>
          </div>
        </div>
      )}

      {/* Two Column Section: Queue Overview & Facility Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Recent Queue Cases */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-base font-extrabold text-slate-900">
              Active Triage Queue (Top Cases)
            </h3>
            <button
              onClick={() => onNavigate('dispatch')}
              className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1"
            >
              <span>Manage Queue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {requests.slice(0, 4).map((req, idx) => (
              <div
                key={req.id}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center space-x-2 mb-0.5">
                    <span className="font-bold text-slate-900">#{idx + 1} {req.id}</span>
                    <span
                      className={`text-[10px] font-black px-2 py-0.2 rounded-full ${
                        req.emergencyLevel === 'Critical / Urgent'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {req.emergencyLevel}
                    </span>
                  </div>
                  <p className="text-slate-600 truncate max-w-xs">{req.patientProblem}</p>
                </div>

                <span className="text-[11px] font-semibold text-slate-500 shrink-0">
                  {req.status.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Hospital Capacity High Occupancy Alerts */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-base font-extrabold text-slate-900">
              Critical Facility Capacity Alerts
            </h3>
            <button
              onClick={() => onNavigate('capacity')}
              className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1"
            >
              <span>View All 12 Hospitals</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {hospitals
              .filter((h) => h.availableBeds - h.reservedBeds <= 3 || h.emergencyDepartmentReadiness === 'Diverting')
              .map((h) => {
                const net = Math.max(0, h.availableBeds - h.reservedBeds);
                return (
                  <div
                    key={h.id}
                    className="p-3 rounded-xl bg-rose-50/50 border border-rose-200 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900">{h.name}</div>
                      <div className="text-[11px] text-rose-800 font-semibold mt-0.5">
                        {net === 0 ? 'ZERO Available Beds (Locked Out)' : `Only ${net} beds remaining`}
                        {h.emergencyDepartmentReadiness === 'Diverting' && ' • ED Diverting'}
                      </div>
                    </div>

                    <span className="text-xs font-black text-rose-700 shrink-0 px-2.5 py-1 bg-white rounded-lg border border-rose-200">
                      {net} Free
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
};
