import React, { useState } from 'react';
import { HospitalRankingResult, Coordinates, Hospital } from '../types/hospital';
import { getGoogleMapsDirectionsUrl, isValidCoordinates } from '../utils/distance';
import { 
  Navigation, 
  MapPin, 
  Clock, 
  Bed, 
  CheckCircle2, 
  Info, 
  X, 
  ExternalLink 
} from 'lucide-react';

interface HospitalCardProps {
  ranking: HospitalRankingResult;
  userLocation?: Coordinates | null;
  isRealUserLocation?: boolean;
}

export const HospitalCard: React.FC<HospitalCardProps> = ({
  ranking,
  userLocation,
  isRealUserLocation = false,
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const { hospital, eligibility, rank } = ranking;
  const { details } = eligibility;

  const hasValidCoords = isValidCoordinates({
    latitude: hospital.latitude,
    longitude: hospital.longitude,
  });

  // Only pass userLocation as origin if it is genuinely available
  const mapsUrl = hasValidCoords
    ? getGoogleMapsDirectionsUrl(
        { latitude: hospital.latitude, longitude: hospital.longitude },
        isRealUserLocation && isValidCoordinates(userLocation) ? userLocation! : undefined
      )
    : '';

  const formatCapabilityName = (cap: string) => {
    return cap
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  // Concise single-line reason for recommendation
  const shortReason = rank === 1
    ? `Fastest travel time among facilities with required clinical capabilities and available beds.`
    : `Suitable alternative with required facilities and ${details.netAvailableBeds} available beds.`;

  return (
    <>
      <div
        className={`bg-gradient-to-br from-white via-white to-[#F0F7FA] rounded-2xl border transition-all duration-200 p-5 sm:p-6 shadow-xs hover:shadow-md ${
          rank === 1
            ? 'border-teal-500 ring-2 ring-teal-500/20 shadow-sm'
            : 'border-slate-200/90 hover:border-teal-300'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          {/* Main Info */}
          <div className="space-y-2.5 flex-1 min-w-0">
            {/* Header Tags */}
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  rank === 1
                    ? 'bg-teal-700 text-white'
                    : 'bg-slate-100 text-slate-700 font-semibold'
                }`}
              >
                {rank === 1 ? 'Top Recommendation' : `#${rank} Match`}
              </span>

              {details.distanceKm !== undefined && (
                <span className="text-xs font-medium text-slate-600 flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-150">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  {details.distanceKm} km away
                </span>
              )}

              {details.estimatedTravelTimeMinutes !== undefined && (
                <span className="text-xs font-bold text-teal-800 flex items-center gap-1 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                  <Clock className="w-3 h-3 text-teal-600" />
                  ~{details.estimatedTravelTimeMinutes} mins (Estimated ETA)
                </span>
              )}

              {/* Operating status badge */}
              {hospital.operatingStatus && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    hospital.operatingStatus === 'Open'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : hospital.operatingStatus === 'Temporarily Unavailable'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {hospital.operatingStatus}
                </span>
              )}

              <span className="text-[10px] text-slate-400 font-medium ml-auto">
                {hospital.isDemo || hospital.verificationStatus === 'Demo'
                  ? 'DEMO DATA — NOT REAL HOSPITAL'
                  : 'VERIFIED NODE'}
              </span>
            </div>

            {/* Hospital Name & Address */}
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                {hospital.name}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{hospital.address}</span>
              </p>
            </div>

            {/* Key Clinical & Capacity Status */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600 pt-1">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span>
                  {details.matchedCapabilities.map(formatCapabilityName).join(', ')} ready
                </span>
              </span>

              <span className="flex items-center gap-1.5">
                <Bed className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                <strong className="text-slate-800">
                  {details.netAvailableBeds} of {hospital.totalBeds} beds available
                </strong>
                <span className="text-[11px] text-slate-400">
                  {hospital.isDemo ? '(Demo data)' : '(Live capacity)'}
                </span>
              </span>
            </div>

            {/* Short Plain-Language Reason */}
            <p className="text-xs text-slate-700 bg-sky-50/80 p-2.5 rounded-xl border border-sky-100/90 leading-relaxed">
              <strong className="text-slate-800">Why recommended: </strong>
              {shortReason}
            </p>
          </div>

          {/* Action Buttons Column */}
          <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 pt-2 sm:pt-0 shrink-0">
            {hasValidCoords ? (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 active:bg-teal-800 px-4 py-2.5 rounded-xl transition shadow-xs"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>View Location & Directions</span>
              </a>
            ) : (
              <button
                disabled
                className="w-full sm:w-auto text-xs font-medium text-slate-400 bg-slate-100 px-3 py-2 rounded-xl cursor-not-allowed"
                title="Coordinates missing"
              >
                Location Unavailable
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowDetails(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl transition"
            >
              <Info className="w-3 h-3" />
              <span>Hospital Details</span>
            </button>
          </div>
        </div>
      </div>

      {/* Hospital Details Modal */}
      {showDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-2xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                  Hospital Overview
                </span>
                <h4 className="text-lg font-bold text-slate-900 mt-1">{hospital.name}</h4>
                <p className="text-xs text-slate-500">{hospital.address}</p>
              </div>
              <button
                onClick={() => setShowDetails(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-150">
                <div>Total Beds: <strong>{hospital.totalBeds}</strong></div>
                <div>Net Available: <strong className="text-teal-700">{details.netAvailableBeds}</strong></div>
                <div>ED Status: <strong>{hospital.emergencyDepartmentReadiness}</strong></div>
                <div>Traffic Level: <strong className="capitalize">{hospital.simulatedTrafficCondition}</strong></div>
              </div>

              <div>
                <span className="font-bold text-slate-800 block mb-1">
                  Clinical Capabilities:
                </span>
                <div className="flex flex-wrap gap-1">
                  {hospital.emergencyCapabilities.map((cap) => (
                    <span
                      key={cap}
                      className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px]"
                    >
                      {formatCapabilityName(cap)}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-800 block mb-1">
                  GPS Destination Coordinates:
                </span>
                <p className="text-slate-600 font-mono text-[11px]">
                  {hospital.latitude.toFixed(4)}° N, {hospital.longitude.toFixed(4)}° E (Simulated Demo Coordinates)
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-100">
              {hasValidCoords && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 transition flex items-center gap-1.5"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Open in Google Maps</span>
                </a>
              )}
              <button
                onClick={() => setShowDetails(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200"
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
