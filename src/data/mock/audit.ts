import { newId } from './ids';
import type { AuditEvent, Doc } from './store/schema';

export function appendAudit(doc: Doc, now: Date, e: Omit<AuditEvent, 'id' | 'at'> & { at?: string }): void {
  doc.t.audit_events.push({ ...e, id: newId(), at: e.at ?? now.toISOString() });
}
