import React from 'react';
import { AppState } from '../services/stateStore';
import { HospitalRecommendationCard } from '../components/HospitalRecommendationCard';
import { HospitalList } from '../components/HospitalList';
import { HospitalMap } from '../components/HospitalMap';
import { SavedDataStatus } from '../components/SavedDataStatus';
import { ExplainabilityPanel } from '../components/ExplainabilityPanel';
import { NavTab } from '../components/Navigation';
import { 
  PhoneCall, 
  ShieldAlert, 
  Compass, 
  ArrowLeft 
} from 'lucide-react';

interface RecommendationsPageProps {
  state: AppState;
  onNavigate: (tab: NavTab) => void;
}

export const RecommendationsPage: React.FC<RecommendationsPageProps> = ({
  state,
  onNavigate,
}) => {
  const { activeRecommendations, activeExcluded, activeRequest, hospitals, ambulances } = state;
  const topRanking = activeRecommendations.length > 0 ? activeRecommendations[0] : null;

  return (
    <div className="space-y-7 animate-fadeIn pb-12">
      {/* Active Request Context Bar */}
      {activeRequest && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-900 text-white">
                Request #{activeRequest.id}
              </span>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  activeRequest.emergencyLevel === 'Critical / Urgent'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {activeRequest.emergencyLevel}
              </span>
              <span className="text-xs font-semibold text-slate-700">
                {activeRequest.classification.categoryLabel}
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-900">
              "{activeRequest.patientProblem}"
            </p>
          </div>

          <button
            onClick={() => onNavigate('home')}
            className="shrink-0 inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Modify Problem</span>
          </button>
        </div>
      )}

      {/* Heading & Saved Data Status */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          Recommended Hospitals
        </h2>
        <SavedDataStatus
          isOffline={state.isOffline}
          lastSyncTimestamp={state.lastSyncTimestamp}
        />
      </div>

      {/* When NO suitable hospital is identified */}
      {!topRanking ? (
        <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-8 sm:p-10 text-center space-y-4">
          <div className="w-14 h-14 bg-rose-100 text-rose-700 rounded-xl flex items-center justify-center mx-auto shadow-inner">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold text-rose-950">
            No suitable hospital could be confirmed from the available dataset.
          </h3>
          <p className="text-sm text-rose-900 max-w-lg mx-auto leading-relaxed">
            All facilities in the dataset failed essential clinical capabilities, had zero reservable beds, or are on full emergency department diversion.
          </p>
          <div className="pt-2">
            <a
              href="tel:108"
              className="inline-flex items-center space-x-2 bg-rose-600 hover:bg-rose-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-sm transition"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Contact Emergency Helpline (Dial 108)</span>
            </a>
          </div>
        </div>
      ) : (
        <>
          {/* Top Recommendation */}
          <section className="space-y-3">
            <HospitalRecommendationCard
              ranking={topRanking}
              userLocation={state.userLocation}
              onDispatchClick={() => onNavigate('dispatch')}
            />
          </section>

          {/* Interactive Geospatial Map */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Compass className="w-5 h-5 text-teal-700" />
                Hospital & Patient Location Map
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                Click any hospital marker to inspect details
              </span>
            </div>
            <HospitalMap
              userLocation={state.userLocation}
              userAddress={state.userLocation.address}
              locationType={state.userLocation.type}
              hospitals={hospitals}
              topHospitalId={topRanking.hospital.id}
              eligibleHospitalIds={activeRecommendations.map((r) => r.hospital.id)}
              ambulances={ambulances}
            />
          </section>

          {/* Explainability Breakdown */}
          <ExplainabilityPanel
            topRanking={topRanking}
            request={activeRequest}
          />

          {/* Ranked Alternatives & Excluded Facilities */}
          <section>
            <HospitalList
              rankedEligible={activeRecommendations}
              excludedResults={activeExcluded}
              userLocation={state.userLocation}
            />
          </section>
        </>
      )}
    </div>
  );
};
