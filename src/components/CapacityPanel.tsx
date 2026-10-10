import React from 'react';
import { Hospital } from '../types/hospital';
import { CapacityManager } from '../services/capacityManager';
import { stateStore } from '../services/stateStore';
import { 
  BedDouble, 
  AlertTriangle, 
  AlertOctagon, 
  CheckCircle, 
  Zap, 
  Plus, 
  Minus, 
  Activity 
} from 'lucide-react';

interface CapacityPanelProps {
  hospitals: Hospital[];
}

export const CapacityPanel: React.FC<CapacityPanelProps> = ({ hospitals }) => {
  const handleTriggerScenario = (
    scenario:
      | 'RESERVE_ALL_BEDS_TOP_HOSPITAL'
      | 'HEAVY_TRAFFIC_TOP_HOSPITAL'
      | 'TOGGLE_ED_DIVERSION_TOP_HOSPITAL'
      | 'SPECIALIST_UNAVAILABLE'
      | 'RESTORE_HOSPITAL_NORMAL'
  ) => {
    stateStore.simulateConditionChange(scenario);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200/80 gap-3">
        <div>
          <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <BedDouble className="w-5 h-5 text-teal-700" />
            Hospital Capacity Balancing & Stress Testing
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Atomic reservation tracking, zero-bed lockout enforcement, and real-time load redistribution.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-medium">
            12 Monitored Facilities
          </span>
        </div>
      </div>

      {/* Interactive Simulation Controls */}
      <div className="bg-slate-900 text-white rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex items-center space-x-2">
          <Zap className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
            Interactive Stress Test Simulation Triggers
          </span>
        </div>
        <p className="text-xs text-slate-300">
          Trigger simulated environmental shocks on the currently recommended facility to observe instantaneous re-optimisation:
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            onClick={() => handleTriggerScenario('RESERVE_ALL_BEDS_TOP_HOSPITAL')}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition shadow-xs flex items-center space-x-1.5"
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>Simulate Bed Surge (Exhaust 100% Beds)</span>
          </button>

          <button
            onClick={() => handleTriggerScenario('HEAVY_TRAFFIC_TOP_HOSPITAL')}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white transition shadow-xs flex items-center space-x-1.5"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Simulate Route Gridlock (+45m Delay)</span>
          </button>

          <button
            onClick={() => handleTriggerScenario('TOGGLE_ED_DIVERSION_TOP_HOSPITAL')}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white transition shadow-xs flex items-center space-x-1.5"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Toggle ED Ambulance Diversion</span>
          </button>

          <button
            onClick={() => handleTriggerScenario('SPECIALIST_UNAVAILABLE')}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-700 hover:bg-slate-600 text-slate-200 transition shadow-xs"
          >
            <span>Simulate Specialist Off-Duty</span>
          </button>

          <button
            onClick={() => handleTriggerScenario('RESTORE_HOSPITAL_NORMAL')}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white transition shadow-xs"
          >
            <span>Restore Nominal Baseline</span>
          </button>
        </div>
      </div>

      {/* Hospital Capacity Table */}
      <div className="overflow-x-auto border border-slate-200 rounded-xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
            <tr>
              <th className="p-3">Hospital Name</th>
              <th className="p-3">Total Beds</th>
              <th className="p-3">Available Beds</th>
              <th className="p-3">Reserved Beds</th>
              <th className="p-3">Net Free</th>
              <th className="p-3">Occupancy</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {hospitals.map((hospital) => {
              const status = CapacityManager.getCapacityStatus(hospital);
              const isFull = status.warningStatus === 'Full_Divert';
              const isHigh = status.warningStatus === 'High_Occupancy';

              return (
                <tr
                  key={hospital.id}
                  className={`hover:bg-slate-50 transition ${
                    isFull ? 'bg-rose-50/40' : isHigh ? 'bg-amber-50/30' : ''
                  }`}
                >
                  <td className="p-3 font-bold text-slate-900">
                    <div>{hospital.name}</div>
                    <div className="text-[10px] font-normal text-slate-400">{hospital.id}</div>
                  </td>
                  <td className="p-3 text-slate-700">{hospital.totalBeds}</td>
                  <td className="p-3 text-slate-700">{hospital.availableBeds}</td>
                  <td className="p-3 text-slate-700">{hospital.reservedBeds}</td>
                  <td className="p-3 font-extrabold text-sm">
                    <span
                      className={
                        status.netAvailableBeds === 0
                          ? 'text-rose-600 font-black'
                          : 'text-teal-700'
                      }
                    >
                      {status.netAvailableBeds}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="w-24 bg-slate-200 rounded-full h-2 overflow-hidden mb-1">
                      <div
                        className={`h-full rounded-full ${
                          isFull ? 'bg-rose-600' : isHigh ? 'bg-amber-500' : 'bg-teal-600'
                        }`}
                        style={{ width: `${status.occupancyPercentage}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 font-semibold">
                      {status.occupancyPercentage}%
                    </span>
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isFull
                          ? 'bg-rose-100 text-rose-800'
                          : isHigh
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {isFull ? 'Full / Lockout' : isHigh ? 'High Occupancy' : 'Normal'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
