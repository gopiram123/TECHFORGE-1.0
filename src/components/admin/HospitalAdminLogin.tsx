import React, { useState } from 'react';
import { authService, AUTHORIZED_HOSPITAL_ACCOUNTS } from '../../services/authService';
import { HospitalAdminUser } from '../../types/admin';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  Building2, 
  KeyRound, 
  AlertTriangle, 
  ArrowRight,
  FlaskConical,
  ShieldAlert
} from 'lucide-react';

interface HospitalAdminLoginProps {
  onLoginSuccess: (user: HospitalAdminUser) => void;
}

export const HospitalAdminLogin: React.FC<HospitalAdminLoginProps> = ({ onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState<'real' | 'demo'>('real');
  
  // Real login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Demo login state
  const [demoEmail, setDemoEmail] = useState('demo.evaluator@lifelink.ai');
  const [demoPassword, setDemoPassword] = useState('demo123');
  const [demoError, setDemoError] = useState('');
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  const handleRealSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      const result = await authService.login(email, password);
      if (result.success && result.user) {
        onLoginSuccess(result.user);
      } else {
        setErrorMessage(result.error || 'Authentication failed. Please verify credentials.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsDemoLoading(true);
    setDemoError('');

    try {
      const result = await authService.loginDemoAdmin(demoEmail, demoPassword);
      if (result.success && result.user) {
        onLoginSuccess(result.user);
      } else {
        setDemoError(result.error || 'Please provide non-empty email and password for demo access.');
      }
    } catch (err: any) {
      setDemoError(err.message || 'Demo login failed.');
    } finally {
      setIsDemoLoading(false);
    }
  };

  const handleSelectDemoPreset = (accountEmail: string, defaultPassword: string) => {
    setEmail(accountEmail);
    setPassword(defaultPassword);
    setErrorMessage('');
    setActiveTab('real');
  };

  return (
    <div className="max-w-xl mx-auto py-8 px-4 animate-fadeIn">
      {/* Portal Header */}
      <div className="text-center space-y-2 mb-8">
        <div className="w-12 h-12 bg-slate-900 text-teal-400 rounded-2xl flex items-center justify-center mx-auto shadow-md border border-slate-800">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          LifeLink AI Hospital Admin
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
          Manage live hospital bed capacity, emergency department readiness protocols, and clinical specialist rosters.
        </p>
      </div>

      {/* Main Login Card with Mode Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-50/80">
          <button
            type="button"
            onClick={() => setActiveTab('real')}
            className={`py-3.5 px-4 text-xs font-bold transition flex items-center justify-center space-x-2 border-b-2 ${
              activeTab === 'real'
                ? 'border-teal-600 text-teal-900 bg-white shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-teal-600" />
            <span>Real Hospital Login</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('demo')}
            className={`py-3.5 px-4 text-xs font-bold transition flex items-center justify-center space-x-2 border-b-2 ${
              activeTab === 'demo'
                ? 'border-amber-600 text-amber-900 bg-white shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5 text-amber-600" />
            <span>Demo Admin Login</span>
          </button>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {activeTab === 'real' ? (
            /* REAL HOSPITAL ADMIN LOGIN */
            <div className="space-y-5 animate-fadeIn">
              <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700 uppercase tracking-wider pb-1">
                <Lock className="w-3.5 h-3.5 text-teal-600" />
                <span>Authorised Hospital Staff Authentication</span>
              </div>

              {errorMessage && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3.5 rounded-xl flex items-start space-x-2.5 animate-fadeIn">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                  <span className="leading-relaxed">{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleRealSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Authorised Staff Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. apollo.admin@lifelink.ai"
                      required
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Secure Password
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter hospital password..."
                      required
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center space-x-2 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-bold text-xs sm:text-sm py-3 rounded-xl transition shadow-xs disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Authenticating Hospital Admin...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In as Authorised Hospital Admin</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Authorised Accounts Presets */}
              <div className="pt-3 border-t border-slate-100 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Authorised Hospital Presets (1-Click Fill)
                  </span>
                  <span className="text-[10px] text-slate-400">Strictly Isolated</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                  {AUTHORIZED_HOSPITAL_ACCOUNTS.slice(0, 4).map((acc) => (
                    <button
                      key={acc.hospitalId}
                      type="button"
                      onClick={() => handleSelectDemoPreset(acc.email, acc.defaultPasswordHint)}
                      className="text-left p-2.5 border border-slate-200 hover:border-teal-400 hover:bg-teal-50/50 rounded-xl transition group"
                    >
                      <div className="flex items-center space-x-1.5 text-slate-800 font-bold text-[11px] group-hover:text-teal-900">
                        <Building2 className="w-3 h-3 text-teal-600 shrink-0" />
                        <span className="truncate">{acc.hospitalName}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                        {acc.email}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* DEMO ADMIN LOGIN (TESTING ONLY) */
            <div className="space-y-5 animate-fadeIn">
              {/* Mandatory Notice */}
              <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 space-y-1.5 text-amber-950">
                <div className="flex items-center space-x-2">
                  <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
                  <strong className="text-xs sm:text-sm font-bold uppercase tracking-wider text-amber-900">
                    DEMO MODE — NOT SECURE FOR REAL HOSPITAL DATA
                  </strong>
                </div>
                <p className="text-xs text-amber-800 leading-relaxed">
                  Demo login grants sandbox access for dashboard testing only. Demo edits are isolated and cannot edit, overwrite, or impersonate verified real hospital records.
                </p>
              </div>

              {demoError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3.5 rounded-xl flex items-start space-x-2.5 animate-fadeIn">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                  <span className="leading-relaxed">{demoError}</span>
                </div>
              )}

              <form onSubmit={handleDemoSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Demo Email (Any Non-Empty Email)
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={demoEmail}
                      onChange={(e) => setDemoEmail(e.target.value)}
                      placeholder="e.g. evaluator@demo.com"
                      required
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Accepts any non-empty email string for testing.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Demo Password (Any Non-Empty Password)
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={demoPassword}
                      onChange={(e) => setDemoPassword(e.target.value)}
                      placeholder="Enter any non-empty password..."
                      required
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Accepts any non-empty password for demo access only.</p>
                </div>

                <button
                  type="submit"
                  disabled={isDemoLoading}
                  className="w-full flex items-center justify-center space-x-2 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-bold text-xs sm:text-sm py-3 rounded-xl transition shadow-xs disabled:opacity-50"
                >
                  {isDemoLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Entering Demo Sandbox...</span>
                    </>
                  ) : (
                    <>
                      <span>Enter Demo Admin Dashboard</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Security Disclosure */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-150 text-[11px] text-slate-500 leading-relaxed space-y-1">
            <p className="font-semibold text-slate-700">Security & Authentication Isolation:</p>
            <p>
              Authorised accounts are enforced by backend security rules. Real hospital admins can only edit their own registered facility. Demo access is isolated to demo records.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
