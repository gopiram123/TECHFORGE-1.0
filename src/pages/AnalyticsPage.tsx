import React from 'react';
import { AppState } from '../services/stateStore';
import { 
  BarChart3, 
  Clock, 
  MapPin, 
  TrendingUp, 
  Activity, 
  AlertCircle, 
  CheckCircle2, 
  XCircle 
} from 'lucide-react';

interface AnalyticsPageProps {
  state: AppState;
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ state }) => {
  const { hospitals, activeRecommendations } = state;

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Title */}
      <div className="pb-4 border-b border-slate-200/80">
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-teal-700" />
          Response-Time & Travel Analytics
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Comparative analytics illustrating why the fastest suitable hospital outperforms geographically nearest facilities.
        </p>
      </div>

      {/* Nearest vs Best Suitable Highlight Card */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-700 space-y-6">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
            Critical Insight
          </span>
          <h3 className="text-xl sm:text-2xl font-black mt-2 text-white">
            Nearest Physical Hospital vs. Fastest Clinically Suitable Hospital
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            In medical emergencies, naive Euclidean distance algorithms can be catastrophic. The table below illustrates the critical difference between raw proximity and clinical readiness.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Card A: Nearest Unsuitable */}
          <div className="bg-rose-950/40 border border-rose-500/30 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-rose-300 text-sm">
                City Central Community Hospital
              </span>
              <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold text-[10px]">
                Nearest (1.1 km)
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-slate-300 border-y border-rose-500/20 py-2.5">
              <div>
                <span className="text-[10px] text-slate-400 block">Distance</span>
                <span className="font-bold">1.1 km</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Travel Time</span>
                <span className="font-bold">~6 mins</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Available Beds</span>
                <span className="font-bold text-rose-400">0 BEDS (FULL)</span>
              </div>
            </div>
            <div className="text-rose-200/90 leading-relaxed text-[11px] flex items-start gap-1.5">
              <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>
                <strong>EXCLUDED BY ENGINE:</strong> Routing a patient here would result in ambulance diversion, door delay, and no ICU bed available for emergency intervention.
              </span>
            </div>
          </div>

          {/* Card B: Recommended Suitable */}
          <div className="bg-teal-950/40 border border-teal-500/40 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-teal-300 text-sm">
                Apollo Apex Heart & Trauma Institute
              </span>
              <span className="px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 font-bold text-[10px]">
                Recommended #1
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-slate-300 border-y border-teal-500/20 py-2.5">
              <div>
                <span className="text-[10px] text-slate-400 block">Distance</span>
                <span className="font-bold">2.4 km</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Travel Time</span>
                <span className="font-bold text-teal-300">~9 mins (Low Traffic)</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Available Beds</span>
                <span className="font-bold text-teal-400">18 Free Beds</span>
              </div>
            </div>
            <div className="text-teal-200/90 leading-relaxed text-[11px] flex items-start gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
              <span>
                <strong>OPTIMAL MATCH:</strong> Catheterization lab verified, on-duty cardiologist, emergency department ready, and shortest travel time among all eligible options.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Hospital Travel-Time Comparative Chart (Visual Bars) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 space-y-5">
        <div>
          <h3 className="text-lg font-extrabold text-slate-900">
            Simulated Travel Time vs. Distance Comparison
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Travel time accounts for urban road grid winding factors (1.35x) and simulated traffic congestion multipliers.
          </p>
        </div>

        <div className="space-y-3">
          {hospitals.slice(0, 8).map((h) => {
            const isTop = activeRecommendations[0]?.hospital.id === h.id;
            const maxMins = 35;
            const barWidth = Math.min(100, Math.round((h.estimatedTravelTime / maxMins) * 100));

            return (
              <div key={h.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    {isTop && <span className="text-emerald-600 font-extrabold">★</span>}
                    {h.name}
                  </span>
                  <div className="flex items-center space-x-3 text-slate-500 font-medium">
                    <span>Traffic: {h.simulatedTrafficCondition}</span>
                    <span className="font-bold text-slate-900">~{h.estimatedTravelTime} mins</span>
                  </div>
                </div>

                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isTop
                        ? 'bg-gradient-to-r from-teal-500 to-emerald-500'
                        : 'bg-slate-400'
                    }`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
