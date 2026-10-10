export type AuditEventType = 
  | 'PROBLEM_CLASSIFICATION'
  | 'ELIGIBILITY_CHECK'
  | 'HOSPITAL_RANKING'
  | 'CAPACITY_RESERVATION'
  | 'CAPACITY_RELEASE'
  | 'AMBULANCE_ASSIGNMENT'
  | 'AMBULANCE_STATUS_UPDATE'
  | 'REOPTIMISATION'
  | 'OFFLINE_MODE_CHANGE'
  | 'DATA_SYNC'
  | 'DEMO_RESET'
  | 'HOSPITAL_UPDATE'
  | 'SECURITY_ALERT';

export interface AuditEvent {
  id: string;
  timestamp: string;
  type: AuditEventType;
  title: string;
  summary: string;
  details: Record<string, any>;
  actor: 'System Engine' | 'Dispatcher' | 'Patient App' | 'Simulation Control' | 'Hospital Admin Portal' | 'Security Module';
}
