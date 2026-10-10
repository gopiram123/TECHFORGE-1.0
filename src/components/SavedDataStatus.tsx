import React from 'react';
import { Database, WifiOff, Clock } from 'lucide-react';

interface SavedDataStatusProps {
  isOffline: boolean;
  lastSyncTimestamp?: string;
}

export const SavedDataStatus: React.FC<SavedDataStatusProps> = ({
  isOffline,
  lastSyncTimestamp,
}) => {
  const formattedTime = lastSyncTimestamp
    ? new Date(lastSyncTimestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  if (isOffline) {
    return (
      <div className="inline-flex items-center space-x-2 text-xs text-amber-900 bg-amber-50 border border-amber-300 px-3 py-1.5 rounded-lg shadow-xs">
        <WifiOff className="w-3.5 h-3.5 text-amber-600 shrink-0" />
        <span className="font-medium">Offline — showing saved/demo hospital information. Availability may have changed.</span>
        {formattedTime && (
          <span className="text-amber-800 text-[11px] font-semibold">(Synced: {formattedTime})</span>
        )}
      </div>
    );
  }

  return (
    <div className="inline-flex flex-wrap items-center gap-2 text-xs text-slate-600 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg">
      <Database className="w-3.5 h-3.5 text-slate-500 shrink-0" />
      <span>Live dataset connected.</span>
      {formattedTime && (
        <span className="text-slate-500 text-[11px] flex items-center gap-1">
          <Clock className="w-3 h-3 text-slate-400" />
          Last synced: {formattedTime}
        </span>
      )}
    </div>
  );
};
