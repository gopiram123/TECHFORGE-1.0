import React, { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { stateStore, AppState } from '../services/stateStore';
import { HospitalAdminUser } from '../types/admin';
import { HospitalAdminLogin } from '../components/admin/HospitalAdminLogin';
import { HospitalAdminProfileEditor } from '../components/admin/HospitalAdminProfileEditor';
import { NavTab } from '../components/Navigation';
import { 
  Building2, 
  LogOut, 
  ShieldCheck, 
  UserCheck, 
  ArrowLeft,
  AlertCircle 
} from 'lucide-react';

interface HospitalAdminPageProps {
  onNavigate: (tab: NavTab) => void;
}

export const HospitalAdminPage: React.FC<HospitalAdminPageProps> = ({ onNavigate }) => {
  const [currentUser, setCurrentUser] = useState<HospitalAdminUser | null>(authService.getCurrentUser());
  const [appState, setAppState] = useState<AppState>(stateStore.getState());

  useEffect(() => {
    const unsubAuth = authService.subscribe(setCurrentUser);
    const unsubState = stateStore.subscribe(setAppState);
    return () => {
      unsubAuth();
      unsubState();
    };
  }, []);

  const handleLogout = async () => {
    await authService.logout();
  };

  // If not logged in, render Hospital Admin Login
  if (!currentUser) {
    return (
      <div className="space-y-6 pb-16">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <button
            onClick={() => onNavigate('home')}
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Emergency Finder</span>
          </button>
        </div>
        <HospitalAdminLogin onLoginSuccess={setCurrentUser} />
      </div>
    );
  }

  // Find the authorized hospital for this admin
  const assignedHospital = appState.hospitals.find((h) => h.id === currentUser.hospitalId);

  return (
    <div className="space-y-6 pb-16 max-w-5xl mx-auto animate-fadeIn">
      {/* Admin Top Navigation Bar */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-teal-600/30 border border-teal-500/50 flex items-center justify-center text-teal-400 shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {currentUser.hospitalName}
              </h2>
              <span className="text-[10px] bg-teal-500/20 text-teal-300 font-semibold px-2 py-0.5 rounded-full border border-teal-500/30">
                Hospital Administration Portal
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Authorized Staff Officer: <strong className="text-slate-200">{currentUser.email}</strong> ({currentUser.displayName})
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => onNavigate('home')}
            className="inline-flex items-center space-x-1 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-xl border border-slate-700 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Patient View</span>
          </button>

          <button
            onClick={handleLogout}
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-rose-300 hover:text-white bg-rose-950/60 hover:bg-rose-900 border border-rose-800/80 px-3.5 py-2 rounded-xl transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Editor or Error */}
      {assignedHospital ? (
        <HospitalAdminProfileEditor
          adminUser={currentUser}
          hospital={assignedHospital}
          onNavigateToPatientView={() => onNavigate('home')}
        />
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
          <h3 className="text-lg font-bold text-amber-950">
            Authorized Hospital Record Not Found
          </h3>
          <p className="text-xs text-amber-800 max-w-md mx-auto">
            Your account is assigned to hospital ID <strong>{currentUser.hospitalId}</strong>, but this record could not be located in the current database view. Please contact platform administration.
          </p>
        </div>
      )}
    </div>
  );
};
