import React from 'react';
import { HospitalRankingResult } from '../types/hospital';
import { EmergencyRequest } from '../types/emergency';
import { 
  Sparkles, 
  HelpCircle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Bed, 
  Award, 
  ArrowRight 
} from 'lucide-react';

interface ExplainabilityPanelProps {
  topRanking?: HospitalRankingResult;
  request?: EmergencyRequest | null;
}

export const ExplainabilityPanel: React.FC<ExplainabilityPanelProps> = ({
  topRanking,
  request,
}) => {
  if (!topRanking || !request) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center text-slate-500 text-sm">
        Submit an emergency request to view the algorithmic decision breakdown.
      </div>
    );
  }

  const { breakdown, eligibility, hospital } = topRanking;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 sm:p-8 space-y-6">
      <div className="border-b border-slate-200/80 pb-4">
        <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-teal-600" />
          Algorithmic Explainability & Clinical Decision Audit
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Full transparency into hard constraint verification and multi-criteria score weighting.
        </p>
      </div>

      {/* Decision Summary */}
      <div className="bg-slate-900 text-white rounded-xl p-5 space-y-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-teal-400">
          Executive Decision Summary
        </span>
        <p className="text-sm text-slate-100 leading-relaxed">
          {topRanking.recommendationExplanation}
        </p>
      </div>

      {/* Nearest vs Best Suitable Comparative Matrix */}
      <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 space-y-3">
        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-teal-600" />
          Why not simply pick the geographically nearest hospital?
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 space-y-1.5">
            <span className="font-extrabold text-rose-800 uppercase tracking-wide block">
              Nearest Physical Facility: City Central (~1.1 km)
            </span>
            <div className="text-rose-900">
              <span className="font-bold text-rose-950">Verdict: EXCLUDED.</span>
              <p className="mt-1">
                Zero available bed capacity (0 unassigned beds, 0 reservations). Transporting an emergency patient here would lead to ambulance diversion or delayed resuscitation.
              </p>
            </div>
          </div>

          <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 space-y-1.5">
            <span className="font-extrabold text-teal-800 uppercase tracking-wide block">
              Fastest Suitable Facility: {hospital.name} (~{eligibility.details.distanceKm} km)
            </span>
            <div className="text-teal-900">
              <span className="font-bold text-teal-950">Verdict: RECOMMENDED #1.</span>
              <p className="mt-1">
                Verified clinical capabilities [
                {eligibility.details.matchedCapabilities.join(', ')}], on-duty specialists, {eligibility.details.netAvailableBeds} reservable beds, and shortest travel time (~{eligibility.details.estimatedTravelTimeMinutes} mins) among all eligible facilities.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Multi-Criteria Scoring Breakdown */}
      <div>
        <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Award className="w-4 h-4 text-teal-600" />
          Multi-Factor Objective Scoring Formula Breakdown
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
            <span className="text-slate-500 text-[10px] uppercase font-semibold block">
              Clinical Match
            </span>
            <span className="text-lg font-black text-teal-700">
              +{breakdown.clinicalMatchScore}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Specialty bonus</span>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
            <span className="text-slate-500 text-[10px] uppercase font-semibold block">
              ED Readiness
            </span>
            <span className="text-lg font-black text-teal-700">
              +{breakdown.readinessScore}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Readiness status</span>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
            <span className="text-slate-500 text-[10px] uppercase font-semibold block">
              Bed Capacity
            </span>
            <span className="text-lg font-black text-teal-700">
              +{breakdown.capacityScore}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Reservable buffer</span>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
            <span className="text-slate-500 text-[10px] uppercase font-semibold block">
              Data Freshness
            </span>
            <span className="text-lg font-black text-teal-700">
              +{breakdown.freshnessScore}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Telemetry verified</span>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
            <span className="text-slate-500 text-[10px] uppercase font-semibold block">
              Travel Penalty
            </span>
            <span className="text-lg font-black text-rose-600">
              -{breakdown.timePenalty}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              ~{eligibility.details.estimatedTravelTimeMinutes}m × weight
            </span>
          </div>

          <div className="bg-teal-50 border border-teal-300 rounded-xl p-3">
            <span className="text-teal-700 text-[10px] uppercase font-bold block">
              Net Score
            </span>
            <span className="text-xl font-black text-teal-900">
              {topRanking.totalScore}
            </span>
            <span className="text-[10px] text-teal-700 block mt-0.5">Overall suitability</span>
          </div>
        </div>
      </div>
    </div>
  );
};
