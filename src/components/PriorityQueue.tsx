import React from 'react';
import { EmergencyRequest } from '../types/emergency';
import { 
  AlertCircle, 
  Clock, 
  MapPin, 
  Activity, 
  CheckCircle2, 
  ShieldAlert, 
  Send 
} from 'lucide-react';

interface PriorityQueueProps {
  requests: EmergencyRequest[];
  onSelectRequest?: (request: EmergencyRequest) => void;
  activeRequestId?: string;
}

export const PriorityQueue: React.FC<PriorityQueueProps> = ({
  requests,
  onSelectRequest,
  activeRequestId,
}) => {
  const getBadgeStyle = (level: string) => {
    switch (level) {
      case 'Critical / Urgent':
        return 'bg-rose-100 text-rose-800 border-rose-300 font-black';
      case 'Moderate':
        return 'bg-amber-100 text-amber-800 border-amber-300 font-bold';
      default:
        return 'bg-teal-100 text-teal-800 border-teal-300 font-semibold';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 sm:p-8 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200/80 gap-2">
        <div>
          <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-rose-600" />
            Triage Priority Dispatch Queue
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Strict multi-acuity sorting: Priority 1 (Critical) &gt; Priority 2 (Moderate) &gt; Priority 3 (General) with arrival-time tie breaking.
          </p>
        </div>

        <div className="text-xs font-bold text-slate-500">
          Queue Length: {requests.length} cases
        </div>
      </div>

      <div className="divide-y divide-slate-100">
        {requests.map((req, index) => {
          const isSelected = req.id === activeRequestId;
          const timeFormatted = new Date(req.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          });

          return (
            <div
              key={req.id}
              onClick={() => onSelectRequest?.(req)}
              className={`py-4 px-3 sm:px-4 rounded-xl cursor-pointer transition ${
                isSelected
                  ? 'bg-teal-50/80 border border-teal-200'
                  : 'hover:bg-slate-50 border border-transparent'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center shrink-0">
                    #{index + 1}
                  </span>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full border ${getBadgeStyle(
                      req.emergencyLevel
                    )}`}
                  >
                    {req.emergencyLevel}
                  </span>
                  <span className="text-xs font-bold text-slate-700">
                    {req.id}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    ({timeFormatted})
                  </span>
                </div>

                <div className="flex items-center space-x-2 text-xs">
                  <span
                    className={`px-2 py-0.5 rounded font-semibold ${
                      req.status === 'Ambulance_Dispatched'
                        ? 'bg-blue-100 text-blue-800'
                        : req.status === 'Hospital_Selected'
                        ? 'bg-teal-100 text-teal-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {req.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <p className="text-sm font-semibold text-slate-900 mb-1">
                "{req.patientProblem}"
              </p>

              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500">
                <span>Rule: <strong>{req.classification.matchedRuleId}</strong></span>
                <span>•</span>
                <span>Required: [{req.classification.requiredCapabilities.join(', ')}]</span>
                {req.assignedHospitalName && (
                  <>
                    <span>•</span>
                    <span className="text-teal-700 font-semibold">
                      Target: {req.assignedHospitalName}
                    </span>
                  </>
                )}
                {req.assignedAmbulanceId && (
                  <>
                    <span>•</span>
                    <span className="text-blue-700 font-semibold">
                      Unit: {req.assignedAmbulanceId}
                    </span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
