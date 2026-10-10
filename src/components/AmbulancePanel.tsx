import React, { useState } from 'react';
import { Ambulance, AmbulanceStatus } from '../types/ambulance';
import { EmergencyRequest } from '../types/emergency';
import { Hospital } from '../types/hospital';
import { stateStore } from '../services/stateStore';
import { AmbulanceDispatchService } from '../services/ambulanceDispatch';
import { 
  Truck, 
  Clock, 
  MapPin, 
  CheckCircle, 
  AlertCircle, 
  ShieldAlert, 
  Check, 
  X, 
  Send 
} from 'lucide-react';

interface AmbulancePanelProps {
  ambulances: Ambulance[];
  activeRequest: EmergencyRequest | null;
  targetHospital: Hospital | null;
}

export const AmbulancePanel: React.FC<AmbulancePanelProps> = ({
  ambulances,
  activeRequest,
  targetHospital,
}) => {
  const [selectedAmbulanceId, setSelectedAmbulanceId] = useState<string>('');
  const [actionMessage, setActionMessage] = useState<string>('');
  const [isConfirming, setIsConfirming] = useState(false);

  const availableAmbulances = ambulances.filter((a) => a.status === 'Available');

  // Suggest best ambulance if an active request and hospital exist
  const bestMatch = (activeRequest && targetHospital)
    ? AmbulanceDispatchService.findBestAmbulance(ambulances, activeRequest, targetHospital)
    : null;

  const handleAssign = (ambId: string) => {
    if (!activeRequest || !targetHospital) {
      setActionMessage('Please select or submit an active emergency request first.');
      return;
    }

    const res = stateStore.confirmAmbulanceAssignment(ambId, activeRequest.id, targetHospital.id);
    setActionMessage(res.message);
    setIsConfirming(false);
  };

  const handleStatusChange = (ambId: string, newStatus: AmbulanceStatus) => {
    stateStore.updateAmbulanceStatus(ambId, newStatus);
    setActionMessage(`Ambulance ${ambId} status changed to ${newStatus}.`);
  };

  const handleCancelAssignment = (ambId: string) => {
    stateStore.cancelAmbulanceAssignment(ambId);
    setActionMessage(`Assignment for ambulance ${ambId} cancelled; vehicle returned to Available pool.`);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200/80 gap-3">
        <div>
          <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Truck className="w-5 h-5 text-teal-700" />
            Simulated Emergency Ambulance Fleet & Dispatch
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Fleet tracking, capability matching (ALS/BLS/Mobile ICU), and dispatcher confirmation.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold">
            {availableAmbulances.length} Units Available
          </span>
          <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-medium">
            Total Fleet: {ambulances.length}
          </span>
        </div>
      </div>

      {/* Action Notification Banner */}
      {actionMessage && (
        <div className="bg-teal-50 border border-teal-200 text-teal-900 px-4 py-2.5 rounded-xl text-xs flex items-center justify-between">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage('')} className="text-teal-700 font-bold ml-2">
            ✕
          </button>
        </div>
      )}

      {/* Suggested Dispatch Box (if active request exists) */}
      {activeRequest && targetHospital && (
        <div className="bg-gradient-to-r from-teal-500/10 via-slate-50 to-cyan-500/10 border border-teal-200 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-teal-600 text-white">
                Dispatch Recommendation
              </span>
              <span className="text-xs font-semibold text-slate-700">
                For: {activeRequest.classification.categoryLabel}
              </span>
            </div>
            <p className="text-xs text-slate-800">
              {bestMatch?.matchedAmbulance ? (
                <span>
                  Recommended Unit: <strong>{bestMatch.matchedAmbulance.id}</strong> ({bestMatch.matchedAmbulance.type}) • ~{bestMatch.pickupTimeMinutes} mins pickup ETA to {targetHospital.name}.
                </span>
              ) : (
                <span>No available ambulance meets current criteria.</span>
              )}
            </p>
            {bestMatch?.reason && (
              <p className="text-[11px] text-slate-500 italic">"{bestMatch.reason}"</p>
            )}
          </div>

          {bestMatch?.matchedAmbulance && (
            <button
              onClick={() => handleAssign(bestMatch.matchedAmbulance!.id)}
              className="shrink-0 px-4 py-2 rounded-lg text-xs font-bold bg-teal-700 hover:bg-teal-600 active:bg-teal-800 text-white transition shadow-xs flex items-center space-x-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Confirm Dispatch ({bestMatch.matchedAmbulance.id})</span>
            </button>
          )}
        </div>
      )}

      {/* Fleet Table / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ambulances.map((amb) => {
          const isAvail = amb.status === 'Available';
          const isAssigned = amb.status === 'Assigned';
          const isEnRoute = amb.status === 'En Route';

          return (
            <div
              key={amb.id}
              className={`border rounded-xl p-4 transition flex flex-col justify-between ${
                isAvail
                  ? 'border-slate-200 bg-white hover:border-teal-300'
                  : isAssigned
                  ? 'border-amber-300 bg-amber-50/30'
                  : 'border-blue-300 bg-blue-50/30'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-extrabold text-slate-900">{amb.id}</span>
                    <span className="text-xs text-slate-500 font-mono">({amb.vehicleNumber})</span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isAvail
                        ? 'bg-emerald-100 text-emerald-800'
                        : isAssigned
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {amb.status}
                  </span>
                </div>

                <div className="text-xs text-teal-800 font-semibold mb-2">
                  {amb.type}
                </div>

                <p className="text-xs text-slate-500 flex items-center gap-1 mb-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  {amb.locationName}
                </p>

                {/* Assignment details if active */}
                {amb.currentAssignment && (
                  <div className="bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 space-y-1 mb-3">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">
                      Active Assignment:
                    </span>
                    <div>Req: {amb.currentAssignment.requestId}</div>
                    <div className="font-semibold text-slate-900">
                      To: {amb.currentAssignment.assignedHospitalName}
                    </div>
                  </div>
                )}
              </div>

              {/* Dispatcher Actions */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                {isAvail ? (
                  activeRequest && targetHospital ? (
                    <button
                      onClick={() => handleAssign(amb.id)}
                      className="w-full py-1.5 rounded-lg font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition"
                    >
                      Dispatch This Unit
                    </button>
                  ) : (
                    <span className="text-slate-400 italic">Ready for deployment</span>
                  )
                ) : (
                  <div className="flex items-center space-x-2 w-full justify-between">
                    {isAssigned && (
                      <button
                        onClick={() => handleStatusChange(amb.id, 'En Route')}
                        className="py-1 px-2.5 rounded bg-blue-100 hover:bg-blue-200 text-blue-800 font-semibold transition"
                      >
                        Set En Route
                      </button>
                    )}
                    {isEnRoute && (
                      <button
                        onClick={() => handleStatusChange(amb.id, 'Completed')}
                        className="py-1 px-2.5 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-semibold transition"
                      >
                        Complete Trip
                      </button>
                    )}
                    <button
                      onClick={() => handleCancelAssignment(amb.id)}
                      className="py-1 px-2.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold transition"
                    >
                      Cancel / Free
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
