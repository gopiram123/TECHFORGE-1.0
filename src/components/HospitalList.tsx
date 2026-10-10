import React, { useState } from 'react';
import { HospitalRankingResult, HospitalEligibilityResult, Coordinates, Hospital } from '../types/hospital';
import { getGoogleMapsDirectionsUrl, isValidCoordinates } from '../utils/distance';
import { 
  Building2, 
  MapPin, 
  Clock, 
  Bed, 
  XCircle, 
  CheckCircle2, 
  Navigation, 
  Info, 
  AlertOctagon, 
  X 
} from 'lucide-react';

interface HospitalListProps {
  rankedEligible: HospitalRankingResult[];
  excludedResults: HospitalEligibilityResult[];
  userLocation?: Coordinates;
}

export const HospitalList: React.FC<HospitalListProps> = ({
  rankedEligible,
  excludedResults,
  userLocation,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'eligible' | 'excluded'>('eligible');
  const [modalHospital, setModalHospital] = useState<Hospital | null>(null);

  const alternatives = rankedEligible.slice(1); // Rank #2 onwards

  const formatCapabilityName = (cap: string) => {
    return cap
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 p-5 sm:p-7">
      {/* Sub-Tabs Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            Recommended Hospitals
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Eligible alternative facilities ranked by suitability and travel time.
          </p>
        </div>

        <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl shrink-0">
          <button
            onClick={() => setActiveSubTab('eligible')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeSubTab === 'eligible'
                ? 'bg-white text-teal-800 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Suitable Alternatives ({alternatives.length})
          </button>
          <button
            onClick={() => setActiveSubTab('excluded')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeSubTab === 'excluded'
                ? 'bg-white text-rose-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Excluded Facilities ({excludedResults.length})
          </button>
        </div>
      </div>

      {/* Tab 1: Eligible Alternatives */}
      {activeSubTab === 'eligible' && (
        <div className="mt-5 space-y-3.5">
          {alternatives.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <Building2 className="w-7 h-7 text-slate-400 mx-auto mb-1.5" />
              <p className="text-sm font-semibold text-slate-700">No additional alternative hospitals</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Only the #1 recommended hospital meets all essential requirements in this dataset.
              </p>
            </div>
          ) : (
            alternatives.map((item) => {
              const hosp = item.hospital;
              const hasCoords = isValidCoordinates({
                latitude: hosp.latitude,
                longitude: hosp.longitude,
              });

              const mapsUrl = hasCoords
                ? getGoogleMapsDirectionsUrl(
                    { latitude: hosp.latitude, longitude: hosp.longitude },
                    isValidCoordinates(userLocation) ? userLocation : undefined
                  )
                : '';

              return (
                <div
                  key={hosp.id}
                  className="bg-slate-50 hover:bg-slate-50/90 border border-slate-200 rounded-xl p-4 sm:p-5 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 max-w-xl">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                        Rank #{item.rank}
                      </span>
                      <span className="text-xs font-semibold text-teal-800">
                        Score: {item.totalScore}
                      </span>
                      <span className="text-xs text-slate-500">
                        • ED: {hosp.emergencyDepartmentReadiness}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-slate-900">
                      {hosp.name}
                    </h4>

                    {/* Hospital address & coordinates */}
                    <div className="text-xs text-slate-600 flex items-start gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <div>
                        <span>{hosp.address}</span>
                        {hasCoords && (
                          <span className="text-slate-400 block text-[11px]">
                            ({hosp.latitude.toFixed(4)}° N, {hosp.longitude.toFixed(4)}° E)
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 italic">
                      "{item.recommendationExplanation}"
                    </p>
                  </div>

                  {/* Actions & Metrics */}
                  <div className="flex flex-row md:flex-col items-end justify-between w-full md:w-auto gap-3 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-200">
                    <div className="text-left md:text-right">
                      <div className="text-sm font-bold text-slate-900">
                        ~{item.eligibility.details.estimatedTravelTimeMinutes} mins
                      </div>
                      <div className="text-xs text-slate-500">
                        {item.eligibility.details.distanceKm} km • {item.eligibility.details.netAvailableBeds} beds available
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setModalHospital(hosp)}
                        className="inline-flex items-center space-x-1 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 px-3 py-1.5 rounded-lg transition"
                      >
                        <Info className="w-3.5 h-3.5" />
                        <span>View Details</span>
                      </button>

                      {hasCoords ? (
                        <a
                          href={mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-1 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 px-3 py-1.5 rounded-lg transition"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          <span>Get Directions</span>
                        </a>
                      ) : (
                        <button
                          disabled
                          className="text-xs font-medium text-slate-400 bg-slate-200 px-3 py-1.5 rounded-lg cursor-not-allowed"
                        >
                          No Coords
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab 2: Excluded Facilities */}
      {activeSubTab === 'excluded' && (
        <div className="mt-5 space-y-3.5">
          {excludedResults.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 rounded-xl">
              <p className="text-sm text-slate-600">No hospitals were excluded.</p>
            </div>
          ) : (
            excludedResults.map((item) => {
              const hosp = item.hospital;
              const hasCoords = isValidCoordinates({
                latitude: hosp.latitude,
                longitude: hosp.longitude,
              });

              const mapsUrl = hasCoords
                ? getGoogleMapsDirectionsUrl(
                    { latitude: hosp.latitude, longitude: hosp.longitude },
                    isValidCoordinates(userLocation) ? userLocation : undefined
                  )
                : '';

              return (
                <div
                  key={hosp.id}
                  className="bg-rose-50/40 border border-rose-200 rounded-xl p-4 sm:p-5 transition flex flex-col md:flex-row items-start justify-between gap-4"
                >
                  <div className="space-y-1.5 max-w-xl">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-rose-200 text-rose-800 flex items-center gap-1">
                        <XCircle className="w-3 h-3 text-rose-700" />
                        Disqualified
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        {hosp.id}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-slate-900">
                      {hosp.name}
                    </h4>

                    <div className="text-xs text-slate-600 flex items-start gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>{hosp.address} ({item.details.distanceKm} km away)</span>
                    </div>

                    {/* Disqualification Reasons */}
                    <div className="bg-white/90 border border-rose-200 rounded-lg p-2.5 text-xs text-rose-950 space-y-1 mt-1">
                      <span className="font-bold text-rose-800 block text-[11px] uppercase tracking-wider">
                        Disqualification Reason(s):
                      </span>
                      {item.reasons.map((reason, idx) => (
                        <div key={idx} className="flex items-start space-x-1.5 text-rose-900">
                          <AlertOctagon className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                          <span>{reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-row md:flex-col items-end justify-between w-full md:w-auto gap-3 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-rose-200">
                    <div className="text-left md:text-right text-xs text-slate-600">
                      <div>Total Beds: {hosp.totalBeds}</div>
                      <div>Net Available: {item.details.netAvailableBeds}</div>
                      <div>ED Readiness: {hosp.emergencyDepartmentReadiness}</div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setModalHospital(hosp)}
                        className="inline-flex items-center space-x-1 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 px-3 py-1.5 rounded-lg transition"
                      >
                        <Info className="w-3.5 h-3.5" />
                        <span>View Details</span>
                      </button>

                      {hasCoords && (
                        <a
                          href={mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-1 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 px-3 py-1.5 rounded-lg transition"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          <span>Inspect Map</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Details Modal */}
      {modalHospital && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-2xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                  Facility Details
                </span>
                <h4 className="text-xl font-bold text-slate-900 mt-1">{modalHospital.name}</h4>
                <p className="text-xs text-slate-500">{modalHospital.address}</p>
              </div>
              <button
                onClick={() => setModalHospital(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 gap-2 text-slate-700">
                <div>Total Beds: <strong>{modalHospital.totalBeds}</strong></div>
                <div>Available: <strong>{modalHospital.availableBeds}</strong></div>
                <div>Reserved: <strong>{modalHospital.reservedBeds}</strong></div>
                <div>ED Status: <strong>{modalHospital.emergencyDepartmentReadiness}</strong></div>
                <div>Latitude: <strong>{modalHospital.latitude.toFixed(4)}</strong></div>
                <div>Longitude: <strong>{modalHospital.longitude.toFixed(4)}</strong></div>
              </div>

              <div>
                <span className="font-bold text-slate-700 block mb-1 text-[11px] uppercase tracking-wide">
                  Capabilities:
                </span>
                <div className="flex flex-wrap gap-1">
                  {modalHospital.emergencyCapabilities.map((c) => (
                    <span key={c} className="px-2 py-0.5 bg-slate-100 rounded text-slate-700">
                      {formatCapabilityName(c)}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end border-t border-slate-100">
              <button
                onClick={() => setModalHospital(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
