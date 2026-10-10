import React from 'react';
import { stateStore } from '../services/stateStore';
import { 
  PlayCircle, 
  CheckCircle2, 
  RotateCcw, 
  X, 
  Activity, 
  Sparkles, 
  ArrowRight 
} from 'lucide-react';

interface DemoScenarioRunnerProps {
  isOpen: boolean;
  onClose: () => void;
  currentStep: number;
  description: string;
  isRunning: boolean;
  onStartScenario: () => void;
}

export const DemoScenarioRunner: React.FC<DemoScenarioRunnerProps> = ({
  isOpen,
  onClose,
  currentStep,
  description,
  isRunning,
  onStartScenario,
}) => {
  if (!isOpen) return null;

  const steps = [
    { num: 1, title: 'Reset Demo State & Register Incident', desc: 'Registers patient: "Severe crushing chest pain, diaphoresis"' },
    { num: 2, title: 'Algorithmic Problem Interpretation', desc: 'Predefined rules classify Cardiac Emergency requiring catheterization lab' },
    { num: 3, title: 'Hard Constraint Filtering & Suitability Match', desc: 'City Central (1.1 km) rejected (0 beds); Apollo Apex recommended (#1)' },
    { num: 4, title: 'Ambulance Dispatch & Atomic Bed Reservation', desc: 'Dispatches ALS unit (4m pickup ETA) and decrements 1 cardiac bed' },
    { num: 5, title: 'Dynamic Environmental Shock & Re-Optimisation', desc: 'Highway traffic delay injected -> system recalculates & shifts recommendation' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 sm:p-8 space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-teal-100 text-teal-800">
                Automated Demonstration
              </span>
              <span className="text-xs text-slate-500 font-medium">Hackathon Showcase</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
              One-Click End-to-End Demo Scenario
            </h3>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Demonstrates how LifeLink AI prevents common dispatch failures by verifying clinical suitability over raw proximity, protecting bed capacity atomically, and re-optimising upon route disruptions.
        </p>

        {/* Step Progress Indicators */}
        <div className="space-y-3">
          {steps.map((s) => {
            const isPassed = currentStep > s.num;
            const isCurrent = currentStep === s.num;

            return (
              <div
                key={s.num}
                className={`flex items-start space-x-3 p-3 rounded-xl border transition ${
                  isCurrent
                    ? 'border-teal-500 bg-teal-50/60 shadow-xs'
                    : isPassed
                    ? 'border-emerald-200 bg-emerald-50/30'
                    : 'border-slate-100 bg-slate-50 opacity-60'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                    isPassed
                      ? 'bg-emerald-600 text-white'
                      : isCurrent
                      ? 'bg-teal-600 text-white animate-bounce'
                      : 'bg-slate-300 text-slate-700'
                  }`}
                >
                  {isPassed ? <CheckCircle2 className="w-4 h-4" /> : s.num}
                </div>

                <div className="space-y-0.5">
                  <h4
                    className={`text-xs font-bold ${
                      isCurrent ? 'text-teal-950 font-black' : isPassed ? 'text-emerald-950' : 'text-slate-700'
                    }`}
                  >
                    {s.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-snug">{s.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Live Step Status Message */}
        {description && (
          <div className="p-3.5 bg-slate-900 text-teal-300 rounded-xl text-xs font-mono shadow-inner border border-slate-800 flex items-center space-x-2">
            <Activity className="w-4 h-4 text-teal-400 shrink-0 animate-pulse" />
            <span className="truncate">{description}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 pt-2 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
          >
            Close
          </button>

          <button
            onClick={onStartScenario}
            disabled={isRunning}
            className="px-6 py-2.5 rounded-xl text-xs font-extrabold text-white bg-teal-700 hover:bg-teal-600 active:bg-teal-800 transition shadow-md shadow-teal-700/20 flex items-center space-x-2 disabled:opacity-50"
          >
            <PlayCircle className="w-4 h-4" />
            <span>{isRunning ? 'Running Simulation...' : 'Execute Scenario'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
