import React, { useState, useEffect } from 'react';
import { AuditEvent, AuditEventType } from '../types/audit';
import { AuditService } from '../services/auditService';
import { 
  FileText, 
  Filter, 
  Trash2, 
  ChevronDown, 
  ChevronRight, 
  Clock, 
  ShieldCheck 
} from 'lucide-react';

export const AuditLog: React.FC = () => {
  const [events, setEvents] = useState<AuditEvent[]>(AuditService.getEvents());
  const [filterType, setFilterType] = useState<string>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    return AuditService.subscribe(setEvents);
  }, []);

  const filteredEvents = filterType === 'ALL'
    ? events
    : events.filter((e) => e.type === filterType);

  const eventTypes: Array<{ id: string; label: string }> = [
    { id: 'ALL', label: 'All Events' },
    { id: 'PROBLEM_CLASSIFICATION', label: 'Problem Classification' },
    { id: 'HOSPITAL_RANKING', label: 'Hospital Ranking' },
    { id: 'CAPACITY_RESERVATION', label: 'Capacity Reservation' },
    { id: 'AMBULANCE_ASSIGNMENT', label: 'Ambulance Dispatch' },
    { id: 'REOPTIMISATION', label: 'Re-Optimisation' },
    { id: 'OFFLINE_MODE_CHANGE', label: 'Offline / Telemetry' },
  ];

  const getActorBadge = (actor: AuditEvent['actor']) => {
    switch (actor) {
      case 'System Engine':
        return 'bg-teal-100 text-teal-800';
      case 'Dispatcher':
        return 'bg-blue-100 text-blue-800';
      case 'Simulation Control':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200/80 gap-3">
        <div>
          <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal-700" />
            Immutable Audit Trail & Event Ledger
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Every classification, capacity decrement, dispatch order, and re-optimisation event recorded chronologically.
          </p>
        </div>

        <button
          onClick={() => AuditService.clear()}
          className="inline-flex items-center space-x-1.5 text-xs text-slate-500 hover:text-rose-600 font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-rose-200 transition"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear Audit Events</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1 rounded-xl">
        {eventTypes.map((t) => (
          <button
            key={t.id}
            onClick={() => setFilterType(t.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              filterType === t.id
                ? 'bg-white text-teal-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Event Stream */}
      <div className="divide-y divide-slate-100">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            No audit events found for this filter.
          </div>
        ) : (
          filteredEvents.map((event) => {
            const isExpanded = expandedId === event.id;
            const time = new Date(event.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            });

            return (
              <div key={event.id} className="py-3.5 space-y-2">
                <div
                  onClick={() => setExpandedId(isExpanded ? null : event.id)}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition"
                >
                  <div className="flex items-center space-x-2.5">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                    <span className="text-[10px] font-mono text-slate-400">
                      {time}
                    </span>
                    <span className="text-xs font-extrabold text-slate-900">
                      {event.title}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getActorBadge(
                        event.actor
                      )}`}
                    >
                      {event.actor}
                    </span>
                  </div>

                  <span className="text-[10px] text-slate-400 font-mono">
                    {event.type}
                  </span>
                </div>

                <p className="text-xs text-slate-600 pl-6 pr-2">
                  {event.summary}
                </p>

                {isExpanded && Object.keys(event.details).length > 0 && (
                  <div className="ml-6 mr-2 bg-slate-900 text-slate-200 rounded-xl p-3 text-[11px] font-mono overflow-x-auto shadow-inner">
                    <pre>{JSON.stringify(event.details, null, 2)}</pre>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
