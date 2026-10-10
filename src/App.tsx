import React, { useState, useEffect } from 'react';
import { stateStore, AppState } from './services/stateStore';
import { Header } from './components/Header';
import { Navigation, NavTab } from './components/Navigation';

import { HomePage } from './pages/HomePage';
import { RecommendationsPage } from './pages/RecommendationsPage';
import { DashboardPage } from './pages/DashboardPage';
import { DispatchPage } from './pages/DispatchPage';
import { CapacityPage } from './pages/CapacityPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { AuditPage } from './pages/AuditPage';
import { SettingsPage } from './pages/SettingsPage';
import { HospitalAdminPage } from './pages/HospitalAdminPage';

export function App() {
  const [state, setState] = useState<AppState>(stateStore.getState());
  const [activeTab, setActiveTab] = useState<NavTab>('home');

  useEffect(() => {
    return stateStore.subscribe(setState);
  }, []);

  const availableAmbulances = state.ambulances.filter((a) => a.status === 'Available').length;
  const pendingRequests = state.requests.filter((r) => r.status === 'Pending').length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-teal-500 selection:text-white">
      {/* Header */}
      <Header onOpenAdminPortal={() => setActiveTab('admin')} />

      {/* Navigation Bar */}
      <Navigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        pendingQueueCount={pendingRequests}
        availableAmbulanceCount={availableAmbulances}
      />

      {/* Main Tab Content Viewport */}
      <main className="grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {activeTab === 'home' && (
          <HomePage
            state={state}
            onNavigate={setActiveTab}
          />
        )}
        {activeTab === 'recommendations' && (
          <RecommendationsPage
            state={state}
            onNavigate={setActiveTab}
          />
        )}
        {activeTab === 'dashboard' && (
          <DashboardPage
            state={state}
            onNavigate={setActiveTab}
          />
        )}
        {activeTab === 'dispatch' && (
          <DispatchPage
            state={state}
            onNavigate={setActiveTab}
          />
        )}
        {activeTab === 'capacity' && (
          <CapacityPage
            state={state}
          />
        )}
        {activeTab === 'analytics' && (
          <AnalyticsPage
            state={state}
          />
        )}
        {activeTab === 'audit' && (
          <AuditPage
            state={state}
          />
        )}
        {activeTab === 'settings' && (
          <SettingsPage
            state={state}
          />
        )}
        {activeTab === 'admin' && (
          <HospitalAdminPage
            onNavigate={setActiveTab}
          />
        )}
      </main>

      {/* Professional Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 text-xs py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-white text-sm">LifeLink AI</span>
            <span>•</span>
            <span>Intelligent Emergency Hospital Finder</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Helpline: 108 • National Emergency: 112 • Simulated Demo Data for Hackathon Evaluation
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
