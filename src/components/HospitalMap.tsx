import React, { useState } from 'react';
import { Hospital } from '../types/hospital';
import { Ambulance } from '../types/ambulance';
import { Coordinates } from '../types/hospital';
import { getGoogleMapsDirectionsUrl } from '../utils/distance';
import { 
  MapPin, 
  Navigation, 
  ExternalLink, 
  Layers, 
  X, 
  Bed, 
  Clock, 
  Info, 
  Truck 
} from 'lucide-react';

interface HospitalMapProps {
  userLocation: Coordinates;
  userAddress: string;
  locationType: string;
  hospitals: Hospital[];
  topHospitalId?: string;
  eligibleHospitalIds: string[];
  ambulances: Ambulance[];
}

export const HospitalMap: React.FC<HospitalMapProps> = ({
  userLocation,
  userAddress,
  locationType,
  hospitals,
  topHospitalId,
  eligibleHospitalIds,
  ambulances,
}) => {
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);

  // Map coordinate bounds to SVG viewBox (1000 x 700)
  // Lat range: 17.36 to 17.51 (span ~0.15 deg)
  // Lng range: 78.33 to 78.53 (span ~0.20 deg)
  const minLat = 17.36;
  const maxLat = 17.51;
  const minLng = 78.33;
  const maxLng = 78.53;

  const projectToSvg = (lat: number, lng: number) => {
    const x = ((lng - minLng) / (maxLng - minLng)) * 900 + 50;
    // Latitude decreases as you go south, so invert y
    const y = ((maxLat - lat) / (maxLat - minLat)) * 600 + 50;
    return { x: Math.max(30, Math.min(970, x)), y: Math.max(30, Math.min(670, y)) };
  };

  const userPoint = projectToSvg(userLocation.latitude, userLocation.longitude);
  const topHospital = hospitals.find((h) => h.id === topHospitalId);
  const topPoint = topHospital
    ? projectToSvg(topHospital.latitude, topHospital.longitude)
    : null;

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-lg overflow-hidden relative">
      {/* Map Header Overlay */}
      <div className="p-4 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2 text-slate-200">
          <Layers className="w-4 h-4 text-teal-400" />
          <span className="font-bold tracking-wider uppercase text-[11px]">
            Emergency Geospatial Grid Map
          </span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400">
            {locationType === 'Real Browser Geolocation' ? 'GPS Active' : 'Simulated Metro Zone Grid'}
          </span>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-300">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-sm shadow-purple-500/50" />
            Patient
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
            #1 Recommended
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            Eligible Alternative
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            Excluded
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
            Ambulance
          </span>
        </div>
      </div>

      {/* SVG Vector Map Canvas */}
      <div className="relative w-full aspect-16/10 sm:aspect-2/1 bg-[#0B1528] overflow-hidden">
        <svg
          viewBox="0 0 1000 700"
          className="w-full h-full select-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Grid Pattern */}
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="#1E293B"
                strokeWidth="0.8"
                strokeOpacity="0.4"
              />
            </pattern>
            {/* Radial Glow for #1 Hospital */}
            <radialGradient id="recGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
            </radialGradient>
            {/* Radial Glow for Patient */}
            <radialGradient id="patientGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#A855F7" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#A855F7" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Background Grid */}
          <rect width="1000" height="700" fill="#0B1528" />
          <rect width="1000" height="700" fill="url(#grid)" />

          {/* Fictional City Highway Arteries */}
          <g stroke="#1E293B" strokeWidth="3" opacity="0.6">
            <path d="M 50 350 Q 500 320 950 360" fill="none" strokeDasharray="6,4" />
            <path d="M 500 50 Q 480 350 520 650" fill="none" strokeDasharray="6,4" />
            <circle cx="500" cy="340" r="180" fill="none" strokeWidth="2" strokeDasharray="4,4" />
          </g>

          {/* District Labels */}
          <text x="120" y="90" fill="#334155" fontSize="13" fontWeight="bold">TECH CORRIDOR WEST</text>
          <text x="700" y="100" fill="#334155" fontSize="13" fontWeight="bold">NORTH DISTRICT</text>
          <text x="750" y="620" fill="#334155" fontSize="13" fontWeight="bold">SOUTH HUB</text>
          <text x="440" y="320" fill="#475569" fontSize="14" fontWeight="extrabold">METRO CIVIC CORE</text>

          {/* Recommended Route Vector Line */}
          {topPoint && (
            <g>
              <line
                x1={userPoint.x}
                y1={userPoint.y}
                x2={topPoint.x}
                y2={topPoint.y}
                stroke="#10B981"
                strokeWidth="3.5"
                strokeDasharray="8,6"
                className="animate-pulse"
              />
            </g>
          )}

          {/* Hospital Pins */}
          {hospitals.map((hospital) => {
            const pt = projectToSvg(hospital.latitude, hospital.longitude);
            const isTop = hospital.id === topHospitalId;
            const isEligible = eligibleHospitalIds.includes(hospital.id);

            let markerColor = '#EF4444'; // Red default for excluded
            if (isTop) markerColor = '#10B981'; // Green for top
            else if (isEligible) markerColor = '#06B6D4'; // Cyan for eligible
            else if (hospital.emergencyDepartmentReadiness === 'Diverting') markerColor = '#F59E0B'; // Amber for divert

            return (
              <g
                key={hospital.id}
                transform={`translate(${pt.x}, ${pt.y})`}
                onClick={() => setSelectedHospital(hospital)}
                className="cursor-pointer group"
              >
                {/* Ping wave for #1 hospital */}
                {isTop && (
                  <circle cx="0" cy="0" r="28" fill="url(#recGlow)" className="animate-ping opacity-40" />
                )}

                <circle
                  cx="0"
                  cy="0"
                  r={isTop ? 14 : 9}
                  fill={markerColor}
                  stroke="#0F172A"
                  strokeWidth="2.5"
                  className="transition-transform group-hover:scale-125"
                />

                <circle cx="0" cy="0" r={isTop ? 5 : 3} fill="#FFFFFF" />

                {/* Hospital label */}
                <text
                  x="0"
                  y={isTop ? 28 : 20}
                  textAnchor="middle"
                  fill={isTop ? '#34D399' : '#94A3B8'}
                  fontSize={isTop ? '12' : '9'}
                  fontWeight={isTop ? 'bold' : 'normal'}
                  className="pointer-events-none drop-shadow-md"
                >
                  {hospital.name.split(' ')[0]} {isTop ? '★' : ''}
                </text>
              </g>
            );
          })}

          {/* Simulated Ambulances */}
          {ambulances.map((amb) => {
            const pt = projectToSvg(amb.currentLocation.latitude, amb.currentLocation.longitude);
            const isAvail = amb.status === 'Available';
            return (
              <g
                key={amb.id}
                transform={`translate(${pt.x}, ${pt.y})`}
                className="pointer-events-none"
              >
                <rect
                  x="-8"
                  y="-8"
                  width="16"
                  height="16"
                  rx="3"
                  fill={isAvail ? '#3B82F6' : '#64748B'}
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                />
                <text
                  x="0"
                  y="3"
                  textAnchor="middle"
                  fill="#FFFFFF"
                  fontSize="8"
                  fontWeight="bold"
                >
                  A
                </text>
              </g>
            );
          })}

          {/* Patient Position Pin (Pulsing Purple) */}
          <g transform={`translate(${userPoint.x}, ${userPoint.y})`}>
            <circle cx="0" cy="0" r="32" fill="url(#patientGlow)" className="animate-ping opacity-60" />
            <circle cx="0" cy="0" r="12" fill="#A855F7" stroke="#FFFFFF" strokeWidth="2.5" />
            <circle cx="0" cy="0" r="4" fill="#FFFFFF" />
            <text
              x="0"
              y="-18"
              textAnchor="middle"
              fill="#D8B4FE"
              fontSize="11"
              fontWeight="extrabold"
              className="drop-shadow-md"
            >
              PATIENT INCIDENT
            </text>
          </g>
        </svg>

        {/* Selected Hospital Popup Card */}
        {selectedHospital && (
          <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:max-w-md bg-slate-900/95 backdrop-blur-md border border-slate-700 text-white p-4 rounded-xl shadow-2xl animate-fadeIn z-30">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    selectedHospital.id === topHospitalId
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : eligibleHospitalIds.includes(selectedHospital.id)
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  }`}
                >
                  {selectedHospital.id === topHospitalId
                    ? '#1 Top Recommended'
                    : eligibleHospitalIds.includes(selectedHospital.id)
                    ? 'Eligible Alternative'
                    : 'Excluded / Ineligible'}
                </span>
                <h4 className="text-base font-bold mt-1 text-slate-100">
                  {selectedHospital.name}
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  {selectedHospital.address}
                </p>
              </div>

              <button
                onClick={() => setSelectedHospital(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-800 grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-slate-500 text-[10px] block">ETA (Sim)</span>
                <span className="font-bold text-slate-200">~{selectedHospital.estimatedTravelTime} mins</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">Net Beds</span>
                <span className="font-bold text-teal-400">
                  {Math.max(0, selectedHospital.availableBeds - selectedHospital.reservedBeds)} free
                </span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">ED Status</span>
                <span className="font-bold text-slate-200">{selectedHospital.emergencyDepartmentReadiness}</span>
              </div>
            </div>

            <div className="mt-3 pt-2 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Coords: {selectedHospital.latitude.toFixed(4)}, {selectedHospital.longitude.toFixed(4)}
              </span>
              <a
                href={getGoogleMapsDirectionsUrl(
                  { latitude: selectedHospital.latitude, longitude: selectedHospital.longitude },
                  userLocation
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1 text-xs font-bold text-teal-300 hover:text-teal-200 bg-teal-900/60 hover:bg-teal-900 px-2.5 py-1 rounded transition"
              >
                <span>Google Maps</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
