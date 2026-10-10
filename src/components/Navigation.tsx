import React from 'react';
import { 
  Home, 
  Hospital, 
  LayoutDashboard, 
  Truck, 
  BedDouble, 
  BarChart3, 
  FileText, 
  Settings,
  Building2 
} from 'lucide-react';

export type NavTab = 
  | 'home'
  | 'recommendations'
  | 'dashboard'
  | 'dispatch'
  | 'capacity'
  | 'analytics'
  | 'audit'
  | 'settings'
  | 'admin';

interface NavigationProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  pendingQueueCount: number;
  availableAmbulanceCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  pendingQueueCount,
  availableAmbulanceCount,
}) => {
  const tabs: Array<{ id: NavTab; label: string; icon: React.ReactNode; badge?: string | number }> = [
    { id: 'home', label: 'Home', icon: <Home className="w-4 h-4" /> },
    { id: 'recommendations', label: 'Hospital Matches', icon: <Hospital className="w-4 h-4" /> },
    { id: 'dashboard', label: 'Operations Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { 
      id: 'dispatch', 
      label: 'Ambulance Dispatch', 
      icon: <Truck className="w-4 h-4" />,
      badge: `${availableAmbulanceCount} avail`
    },
    { id: 'capacity', label: 'Capacity Balancing', icon: <BedDouble className="w-4 h-4" /> },
    { id: 'analytics', label: 'Response Analytics', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'audit', label: 'Audit & Explainability', icon: <FileText className="w-4 h-4" /> },
    { id: 'settings', label: 'System & Status', icon: <Settings className="w-4 h-4" /> },
    { id: 'admin', label: 'Admin', icon: <Building2 className="w-4 h-4" />, badge: 'Staff' },
  ];

  return (
    <nav className="bg-[#0B132B]/95 backdrop-blur-md border-b border-slate-800 sticky top-16 z-40 shadow-sm overflow-x-auto scrollbar-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1 sm:space-x-1.5 py-2 min-w-max">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/90'
                }`}
              >
                <span className={isActive ? 'text-white' : 'text-slate-400'}>
                  {tab.icon}
                </span>
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive
                        ? 'bg-teal-800 text-teal-100'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
