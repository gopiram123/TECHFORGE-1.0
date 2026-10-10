import React from 'react';
import { WifiOff, RefreshCw, AlertCircle } from 'lucide-react';
import { stateStore } from '../services/stateStore';

interface OfflineBannerProps {
  isOffline: boolean;
  lastSyncTimestamp: string;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({
  isOffline,
  lastSyncTimestamp,
}) => {
  if (!isOffline) return null;

  const handleSync = () => {
    stateStore.toggleOfflineMode(false);
  };

  const formattedTime = new Date(lastSyncTimestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className="bg-amber-600 text-white px-4 py-3 shadow-md border-b border-amber-700 animate-fadeIn">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="flex items-start space-x-2.5">
          <WifiOff className="w-5 h-5 text-amber-200 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold tracking-wide uppercase bg-amber-800/80 px-2 py-0.5 rounded text-[11px] mr-2">
              SIMULATED OFFLINE MODE ACTIVE
            </span>
            <span>
              Live hospital bed telemetry, real-time traffic updates, and cloud dispatch messaging are unavailable. Recommendations are computed locally from cached baseline demo data.
            </span>
            <div className="text-amber-100 text-xs mt-1 flex items-center space-x-2">
              <span>Last Cached Sync: {formattedTime}</span>
              <span>•</span>
              <span className="italic">Bed counts & readiness marked as unverified</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleSync}
          className="shrink-0 flex items-center space-x-1.5 bg-white text-amber-900 hover:bg-amber-50 font-semibold px-3 py-1.5 rounded-lg text-xs transition shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Restore Telemetry Connection</span>
        </button>
      </div>
    </div>
  );
};
