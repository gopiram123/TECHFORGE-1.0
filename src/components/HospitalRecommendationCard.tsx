import React, { useState } from 'react';
import { HospitalRankingResult } from '../types/hospital';
import { Coordinates } from '../types/hospital';
import { getGoogleMapsDirectionsUrl, isValidCoordinates } from '../utils/distance';
import { 
  CheckCircle2, 
  MapPin, 
  Clock, 
  Bed, 
  UserCheck, 
  ExternalLink, 
  ShieldCheck, 
  Navigation, 
  Info, 
  X, 
  Check 
} from 'lucide-react';

interface HospitalRecommendationCardProps {
  ranking: HospitalRankingResult;
  userLocation?: Coordinates;
  onDispatchClick?: () => void;
  isDispatchAvailable?: boolean;
}

export const HospitalRecommendationCard: React.FC<HospitalRecommendationCardProps> = ({
  ranking,
  userLocation,
  onDispatchClick,
  isDispatchAvailable = true,
}) => {
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const { hospital, eligibility, recommendationExplanation } = ranking;
  const { details } = eligibility;

  const hasValidCoords = isValidCoordinates({
    latitude: hospital.latitude,
    longitude: hospital.longitude,
  });

  const mapsUrl = hasValidCoords
    ? getGoogleMapsDirectionsUrl(
        { latitude: hospital.latitude, longitude: hospital.longitude },
        isValidCoordinates(userLocation) ? userLocation : undefined
      )
    : '';

  const formatCapabilityName = (cap: string) => {
    return cap
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  return (
    <>
      <div className="bg-white border-2 border-teal-600 rounded-2xl shadow-sm p-5 sm:p-7 relative overflow-hidden">
        {/* Top Operational Pill */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-black uppercase px-2.5 py-0.5 rounded-md bg-teal-800 text-white tracking-wider">
              Recommended #1
            </span>
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded ${
                hospital.emergencyDepartmentReadiness === 'Ready'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}
            >
              ED Readiness: {hospital.emergencyDepartmentReadiness}
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              Score: {ranking.totalScore}
            </span>
          </div>

          <span className="text-[11px] text-slate-400 font-medium">
            Verified Demo Feed
          </span>
        </div>

        {/* Hospital Identity & Address */}
        <div className="mt-4 flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
              {hospital.name}
            </h3>

            {/* Address & GPS Coordinate display */}
            <div className="text-sm text-slate-600 flex items-start gap-1.5">
              <MapPin className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-medium text-slate-800">{hospital.address}</span>
                {hasValidCoords ? (
                  <span className="text-xs text-slate-500 block">
                    GPS Coordinates: {hospital.latitude.toFixed(4)}° N, {hospital.longitude.toFixed(4)}° E
                  </span>
                ) : (
                  <span className="text-xs text-rose-500 block">
                    GPS coordinates missing
                  </span>
                )}
              </div>
            </div>

            {/* Concise Plain-Language Explanation */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-800 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900 block mb-0.5">Selection Explanation:</span>
                <p className="text-slate-700 leading-relaxed">{recommendationExplanation}</p>
              </div>
            </div>
          </div>

          {/* Quick Metrics & Actions Box */}
          <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col justify-between space-y-4 min-w-[260px] shrink-0">
            <div className="grid grid-cols-2 gap-3 border-b border-slate-200/60 pb-3 text-center sm:text-left">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                  Simulated ETA
                </span>
                <span className="text-2xl font-extrabold text-slate-900">
                  ~{details.estimatedTravelTimeMinutes}m
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5 capitalize">
                  Traffic: {hospital.simulatedTrafficCondition}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                  Distance
                </span>
                <span className="text-2xl font-extrabold text-slate-900">
                  {details.distanceKm} km
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Straight-line
                </span>
              </div>
            </div>

            {/* Capacity status */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 flex items-center gap-1.5 font-medium">
                <Bed className="w-4 h-4 text-teal-700" />
                Reservable Beds:
              </span>
              <span className="font-extrabold text-teal-800 text-sm">
                {details.netAvailableBeds} available
              </span>
            </div>

            {/* Suggested Hospital Actions: View Details & Get Directions */}
            <div className="pt-2 flex flex-col gap-2">
              {hasValidCoords ? (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center space-x-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 active:bg-teal-900 rounded-lg py-2.5 transition shadow-xs"
                >
                  <Navigation className="w-4 h-4" />
                  <span>Get Directions</span>
                </a>
              ) : (
                <button
                  disabled
                  className="w-full inline-flex items-center justify-center space-x-1.5 text-xs font-medium text-slate-400 bg-slate-200 rounded-lg py-2.5 cursor-not-allowed"
                  title="GPS coordinates unavailable for directions"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Get Directions (Coordinates Unavailable)</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowDetailsModal(true)}
                className="w-full inline-flex items-center justify-center space-x-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg py-2 transition"
              >
                <Info className="w-3.5 h-3.5" />
                <span>View Details</span>
              </button>
            </div>
          </div>
        </div>

        {/* Clinical Summary Tags */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-semibold text-slate-600 mr-1">Required Facilities:</span>
            {details.matchedCapabilities.map((cap) => (
              <span
                key={cap}
                className="px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200 font-medium"
              >
                ✓ {formatCapabilityName(cap)}
              </span>
            ))}
          </div>

          <div className="flex items-center space-x-2 text-[11px] text-slate-500">
            <span>Total Beds: {hospital.totalBeds}</span>
            <span>•</span>
            <span>Reserved: {hospital.reservedBeds}</span>
          </div>
        </div>
      </div>

      {/* Hospital Details Modal */}
      {showDetailsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-2xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-5">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                  Hospital Operational Profile
                </span>
                <h4 className="text-xl font-bold text-slate-900 mt-1">{hospital.name}</h4>
                <p className="text-xs text-slate-500">{hospital.address}</p>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* GPS and Navigation Block */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-700 block text-[11px] uppercase tracking-wide">
                  Location & Routing
                </span>
                <div className="grid grid-cols-2 gap-2 text-slate-600">
                  <div>Latitude: <strong className="text-slate-800">{hospital.latitude.toFixed(4)}</strong></div>
                  <div>Longitude: <strong className="text-slate-800">{hospital.longitude.toFixed(4)}</strong></div>
                  <div>Straight Distance: <strong className="text-slate-800">{details.distanceKm} km</strong></div>
                  <div>Simulated ETA: <strong className="text-slate-800">~{details.estimatedTravelTimeMinutes} mins</strong></div>
                </div>
              </div>

              {/* Beds & Capacity */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <span className="font-bold text-slate-700 block text-[11px] uppercase tracking-wide">
                  Capacity Summary
                </span>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-white rounded border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Total Beds</span>
                    <span className="font-bold text-slate-800 text-sm">{hospital.totalBeds}</span>
                  </div>
                  <div className="p-2 bg-white rounded border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Available</span>
                    <span className="font-bold text-slate-800 text-sm">{hospital.availableBeds}</span>
                  </div>
                  <div className="p-2 bg-white rounded border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Net Free</span>
                    <span className="font-bold text-teal-700 text-sm">{details.netAvailableBeds}</span>
                  </div>
                </div>
              </div>

              {/* Specialists on Duty */}
              <div className="space-y-1.5">
                <span className="font-bold text-slate-700 block text-[11px] uppercase tracking-wide">
                  Specialist Medical Staff on Duty
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(hospital.specialistAvailability).map(([spec, onDuty]) => (
                    <span
                      key={spec}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-medium ${
                        onDuty
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-slate-100 text-slate-400 line-through'
                      }`}
                    >
                      {formatCapabilityName(spec)}: {onDuty ? 'Available' : 'Unavailable'}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-100">
              {hasValidCoords && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 transition flex items-center gap-1.5"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Get Directions</span>
                </a>
              )}
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
