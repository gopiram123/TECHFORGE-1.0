import { AuditEvent, AuditEventType } from '../types/audit';

export class AuditService {
  private static events: AuditEvent[] = [];
  private static listeners: Array<(events: AuditEvent[]) => void> = [];

  public static log(
    type: AuditEventType,
    title: string,
    summary: string,
    details: Record<string, any> = {},
    actor: AuditEvent['actor'] = 'System Engine'
  ): AuditEvent {
    const event: AuditEvent = {
      id: `AUDIT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      type,
      title,
      summary,
      details,
      actor,
    };

    AuditService.events.unshift(event);
    // Keep last 150 events in memory
    if (AuditService.events.length > 150) {
      AuditService.events = AuditService.events.slice(0, 150);
    }

    AuditService.notifyListeners();
    return event;
  }

  public static getEvents(): AuditEvent[] {
    return [...AuditService.events];
  }

  public static clear(): void {
    AuditService.events = [];
    AuditService.notifyListeners();
  }

  public static subscribe(listener: (events: AuditEvent[]) => void): () => void {
    AuditService.listeners.push(listener);
    listener([...AuditService.events]);
    return () => {
      AuditService.listeners = AuditService.listeners.filter((l) => l !== listener);
    };
  }

  private static notifyListeners(): void {
    const current = [...AuditService.events];
    AuditService.listeners.forEach((l) => l(current));
  }
}
