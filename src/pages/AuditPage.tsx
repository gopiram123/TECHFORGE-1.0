import React from 'react';
import { AuditLog } from '../components/AuditLog';
import { ExplainabilityPanel } from '../components/ExplainabilityPanel';
import { AppState, stateStore } from '../services/stateStore';
import { RotateCcw } from 'lucide-react';

interface AuditPageProps {
  state: AppState;
}

export const AuditPage: React.FC<AuditPageProps> = ({ state }) => {
  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200/80 gap-3">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Decision Audit & System Explainability Ledger
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Every clinical rule match, capacity reservation, and priority queue ordering is recorded with timestamp and actor attribution.
          </p>
        </div>

        <button
          onClick={() => stateStore.resetDemo()}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Demo State</span>
        </button>
      </div>

      <ExplainabilityPanel
        topRanking={state.activeRecommendations[0]}
        request={state.activeRequest}
      />

      <AuditLog />
    </div>
  );
};
