import React, { useState } from 'react';
import { AppState } from '../services/stateStore';
import { AmbulancePanel } from '../components/AmbulancePanel';
import { PriorityQueue } from '../components/PriorityQueue';
import { EmergencyRequest } from '../types/emergency';
import { NavTab } from '../components/Navigation';
import { Truck, Users, ShieldAlert, ArrowLeft } from 'lucide-react';

interface DispatchPageProps {
  state: AppState;
  onNavigate: (tab: NavTab) => void;
}

export const DispatchPage: React.FC<DispatchPageProps> = ({ state, onNavigate }) => {
  const [selectedRequest, setSelectedRequest] = useState<EmergencyRequest | null>(
    state.activeRequest || (state.requests.length > 0 ? state.requests[0] : null)
  );

  const targetHospital = selectedRequest?.assignedHospitalId
    ? state.hospitals.find((h) => h.id === selectedRequest.assignedHospitalId) || null
    : state.activeRecommendations.length > 0
    ? state.activeRecommendations[0].hospital
    : null;

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Fleet Overview Panel */}
      <AmbulancePanel
        ambulances={state.ambulances}
        activeRequest={selectedRequest}
        targetHospital={targetHospital}
      />

      {/* Priority Dispatch Queue */}
      <PriorityQueue
        requests={state.requests}
        onSelectRequest={(req) => setSelectedRequest(req)}
        activeRequestId={selectedRequest?.id}
      />
    </div>
  );
};
