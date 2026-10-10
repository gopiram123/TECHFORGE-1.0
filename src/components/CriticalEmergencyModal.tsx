import React from 'react';
import { 
  AlertOctagon, 
  PhoneCall, 
  ShieldAlert, 
  ArrowRight, 
  X,
  WifiOff
} from 'lucide-react';

interface CriticalEmergencyModalProps {
  isOpen: boolean;
  onContinue: () => void;
  onClose: () => void;
}

export const CriticalEmergencyModal: React.FC<CriticalEmergencyModalProps> = ({
  isOpen,
  onContinue,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div 
      role="dialog"
      aria-modal="true"
      aria-labelledby="critical-emergency-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-fadeIn"
    >
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border-2 border-rose-300 space-y-5 animate-scaleUp">
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-3 border-b border-rose-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-rose-600/30">
              <AlertOctagon className="w-7 h-7" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                Priority 1 Dispatch Alert
              </span>
              <h2 
                id="critical-emergency-title"
                className="text-xl sm:text-2xl font-black text-rose-950 tracking-tight mt-0.5"
              >
                CRITICAL EMERGENCY
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close Alert"
            className="text-slate-400 hover:text-slate-600 p-1 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Primary Alert Advisory */}
        <div className="bg-rose-50/80 border border-rose-200/90 rounded-2xl p-4 text-center sm:text-left space-y-2">
          <p className="text-sm sm:text-base font-semibold text-rose-950 leading-relaxed">
            “This may require immediate emergency assistance. Contact local emergency services or a qualified dispatcher now.”
          </p>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
            <a
              href="tel:108"
              className="inline-flex items-center space-x-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition shadow-xs"
            >
              <PhoneCall className="w-3.5 h-3.5 animate-pulse" />
              <span>Call Helpline 108</span>
            </a>
            <a
              href="tel:112"
              className="inline-flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition shadow-xs"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>National Emergency 112</span>
            </a>
          </div>
        </div>

        {/* Police Notification Status */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-1.5 text-left">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
            <WifiOff className="w-4 h-4 text-slate-500 shrink-0" />
            <span>Notification Service Status</span>
          </div>
          <p className="text-xs font-bold text-slate-900">
            Police notification service is not connected. No message has been sent.
          </p>
          <p className="text-[11px] text-slate-500 leading-normal">
            Automated alerts are not transmitted without an authorised, verified police telematics integration. Emergency medical assistance remains the immediate priority.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
          <button
            type="button"
            onClick={onContinue}
            className="w-full sm:flex-1 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-white bg-teal-600 hover:bg-teal-700 active:bg-teal-800 transition shadow-md flex items-center justify-center space-x-2"
          >
            <span>Continue to Hospital Recommendations</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition"
          >
            Close Alert
          </button>
        </div>
      </div>
    </div>
  );
};
