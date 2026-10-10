import React from 'react';
import { AppState } from '../services/stateStore';
import { CapacityPanel } from '../components/CapacityPanel';
import { BedDouble, ShieldCheck, AlertTriangle } from 'lucide-react';

interface CapacityPageProps {
  state: AppState;
}

export const CapacityPage: React.FC<CapacityPageProps> = ({ state }) => {
  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      <CapacityPanel hospitals={state.hospitals} />

      {/* Capacity Safety Disclosure */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-xs text-slate-600 space-y-2">
        <h4 className="font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          Atomic Bed Reservation & Capacity Guard Logic
        </h4>
        <p className="leading-relaxed">
          In this hackathon architecture, bed reservations are managed in-memory using atomic increment/decrement methods in <code>CapacityManager</code>. Before any ambulance assignment is finalized, the system re-checks available beds to eliminate race conditions. When deployed to a production multi-tenant backend, these operations map directly to database row-level locking or distributed Redis atomic counters.
        </p>
      </div>
    </div>
  );
};
