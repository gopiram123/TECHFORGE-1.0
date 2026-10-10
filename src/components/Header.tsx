import React, { useState, useEffect } from 'react';
import { stateStore, AppState } from '../services/stateStore';
import { authService } from '../services/authService';
import { HospitalAdminUser } from '../types/admin';
import { 
  PhoneCall, 
  HeartPulse, 
  Wifi, 
  WifiOff, 
  Building2,
  ShieldCheck,
  UserCheck
} from 'lucide-react';

interface HeaderProps {
  onOpenAdminPortal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAdminPortal }) => {
  const [state, setState] = useState<AppState>(stateStore.getState());
  const [adminUser, setAdminUser] = useState<HospitalAdminUser | null>(authService.getCurrentUser());

  useEffect(() => {
    const unsubState = stateStore.subscribe(setState);
    const unsubAuth = authService.subscribe(setAdminUser);
    return () => {
      unsubState();
      unsubAuth();
    };
  }, []);

  const handleToggleOffline = () => {
    stateStore.toggleOfflineMode();
  };

  return (
    <header className="bg-[#0B132B] border-b border-slate-800 text-white sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Left: Brand & Subtitle */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-600 to-cyan-500 flex items-center justify-center text-white shadow-sm shadow-teal-500/20 shrink-0">
            <HeartPulse className="w-5 h-5 font-bold" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white leading-tight">
                LifeLink AI
              </h1>
              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 tracking-wider uppercase">
                Emergency
              </span>
            </div>
            <p className="text-xs text-slate-400 font-normal hidden sm:block">
              Intelligent Emergency Hospital Finder
            </p>
          </div>
        </div>

        {/* Center / Right: Helpline 108, Offline Toggle & Hospital Admin Entrance */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Emergency Helpline: 108 */}
          <a
            href="tel:108"
            title="Emergency Helpline: 108 (Click to call on supported devices)"
            className="flex items-center space-x-1.5 sm:space-x-2 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white px-2.5 sm:px-3 py-1.5 rounded-lg font-bold text-xs sm:text-sm tracking-wide transition shadow-xs border border-rose-500/80 shrink-0"
          >
            <PhoneCall className="w-3.5 h-3.5 text-white shrink-0 animate-pulse" />
            <span className="hidden md:inline text-[11px] font-semibold text-rose-100 uppercase tracking-wider">
              Helpline:
            </span>
            <span className="font-extrabold text-sm tracking-wider">108</span>
          </a>

          {/* Offline Mode Toggle */}
          <button
            onClick={handleToggleOffline}
            title={state.isOffline ? 'Switch to Online Mode' : 'Simulate Network Disconnection'}
            className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium border transition shrink-0 ${
              state.isOffline
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 hover:bg-amber-500/30'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
            }`}
          >
            {state.isOffline ? (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Offline</span>
              </>
            ) : (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Online</span>
              </>
            )}
          </button>

          {/* Hospital Staff Admin Portal Button */}
          {onOpenAdminPortal && (
            <button
              onClick={onOpenAdminPortal}
              title="Hospital Staff Portal: Manage bed capacity and emergency readiness"
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 border ${
                adminUser
                  ? 'bg-teal-700/80 hover:bg-teal-600 text-white border-teal-500/80 shadow-xs'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
            >
              {adminUser ? (
                <>
                  <UserCheck className="w-3.5 h-3.5 text-teal-300" />
                  <span className="hidden sm:inline">Admin: {adminUser.hospitalName.split(' ')[0]}</span>
                  <span className="sm:hidden">Admin</span>
                </>
              ) : (
                <>
                  <Building2 className="w-3.5 h-3.5 text-teal-400" />
                  <span>Admin</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
