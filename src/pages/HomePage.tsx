import React, { useState, useRef } from 'react';
import { AppState, stateStore } from '../services/stateStore';
import { EmergencyRequestForm } from '../components/EmergencyRequestForm';
import { HospitalCard } from '../components/HospitalCard';
import { SavedDataStatus } from '../components/SavedDataStatus';
import { CriticalEmergencyModal } from '../components/CriticalEmergencyModal';
import { Hospital3DHero } from '../components/Hospital3DHero';
import { NavTab } from '../components/Navigation';
import { EmergencyLevel } from '../types/emergency';
import { 
  PhoneCall, 
  ShieldAlert, 
  ArrowRight,
  Building2 
} from 'lucide-react';

interface HomePageProps {
  state: AppState;
  onNavigate: (tab: NavTab) => void;
  onRunScenario?: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ state, onNavigate }) => {
  const [isSearching, setIsSearching] = useState(false);
  const [isCriticalPopupOpen, setIsCriticalPopupOpen] = useState(false);
  const lastAlertedRequestIdRef = useRef<string | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const { activeRecommendations } = state;
  // Display up to 5 eligible hospitals as specified in Section 4
  const eligibleHospitals = activeRecommendations.slice(0, 5);

  const handleSearchComplete = (level: EmergencyLevel) => {
    setIsSearching(true);
    const activeReq = stateStore.getState().activeRequest;
    const isCritical = level === 'Critical / Urgent';

    setTimeout(() => {
      setIsSearching(false);

      if (isCritical) {
        // Prevent duplicate alerts for the exact same active emergency request
        if (activeReq && activeReq.id !== lastAlertedRequestIdRef.current) {
          lastAlertedRequestIdRef.current = activeReq.id;
          setIsCriticalPopupOpen(true);
        } else if (!activeReq && !lastAlertedRequestIdRef.current) {
          setIsCriticalPopupOpen(true);
        } else {
          if (resultsRef.current) {
            resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      } else {
        // Moderate or General: directly reveal results without critical popup
        if (resultsRef.current) {
          resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }, 300);
  };

  const handleContinueFromAlert = () => {
    setIsCriticalPopupOpen(false);
    setTimeout(() => {
      if (resultsRef.current) {
        resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleCloseAlert = () => {
    setIsCriticalPopupOpen(false);
  };

  const isRealUserLocation = state.userLocation.type === 'Real Browser Geolocation';

  return (
    <div className="space-y-10 animate-fadeIn pb-16 max-w-4xl mx-auto">
      {/* Critical / Urgent Emergency Modal */}
      <CriticalEmergencyModal
        isOpen={isCriticalPopupOpen}
        onContinue={handleContinueFromAlert}
        onClose={handleCloseAlert}
      />

      {/* 3D Interactive Hospital Experience Hero */}
      <section>
        <Hospital3DHero />
      </section>

      {/* Main Search Card */}
      <section>
        <EmergencyRequestForm
          onSearchComplete={handleSearchComplete}
          isSearching={isSearching}
        />
      </section>

      {/* Hospital Recommendations Section */}
      <section ref={resultsRef} className="space-y-5 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Recommended Hospitals
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Ranked by clinical capability, available capacity, and travel time.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {eligibleHospitals.length > 0 && (
              <button
                onClick={() => onNavigate('recommendations')}
                className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1"
              >
                <span>View Full Map & Alternatives</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            <SavedDataStatus
              isOffline={state.isOffline}
              lastSyncTimestamp={state.lastSyncTimestamp}
            />
          </div>
        </div>

        {/* Searching loading state */}
        {isSearching && (
          <div className="py-12 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-semibold text-slate-700">
              Filtering facilities by clinical requirements and beds...
            </p>
          </div>
        )}

        {/* Results List */}
        {!isSearching && (
          <>
            {eligibleHospitals.length > 0 ? (
              <div className="space-y-4">
                {eligibleHospitals.map((ranking) => (
                  <HospitalCard
                    key={ranking.hospital.id}
                    ranking={ranking}
                    userLocation={isRealUserLocation ? state.userLocation : undefined}
                    isRealUserLocation={isRealUserLocation}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-7 text-center space-y-3">
                <ShieldAlert className="w-8 h-8 text-rose-600 mx-auto" />
                <h3 className="text-lg font-bold text-rose-950">
                  No suitable hospital found in dataset
                </h3>
                <p className="text-xs text-rose-700 max-w-md mx-auto leading-relaxed">
                  All facilities failed essential requirements, had zero available beds, or were on diversion. For emergency care, contact local emergency dispatch immediately.
                </p>
                <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                  <a
                    href="tel:108"
                    className="inline-flex items-center space-x-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Call Helpline 108</span>
                  </a>
                  <a
                    href="tel:112"
                    className="inline-flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Call Emergency 112</span>
                  </a>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* Formal Safety Notice & Admin Entrance */}
      <section className="pt-6 border-t border-slate-200 text-center space-y-3">
        <p className="text-xs text-slate-500 max-w-xl mx-auto leading-relaxed">
          <strong>Important Safety Notice:</strong> LifeLink AI is an emergency facility discovery tool and does not provide clinical diagnoses. For life-threatening symptoms, dial <strong>108</strong> or <strong>112</strong> immediately.
        </p>

        <div className="pt-2">
          <button
            onClick={() => onNavigate('admin')}
            className="inline-flex items-center space-x-1.5 text-xs text-slate-500 hover:text-teal-700 transition"
          >
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <span>Hospital Administrator? Access the <strong>Admin Portal</strong> to update capacity &rarr;</span>
          </button>
        </div>
      </section>
    </div>
  );
};
