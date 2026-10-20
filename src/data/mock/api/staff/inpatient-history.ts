/** "Lịch sử" of one stay, read from the audit trail (§3.7). */
import type { StayHistoryIcon, StayHistoryItem } from '../../../contracts/staff';
import type { AuditEvent, Doc } from '../../store/schema';

/** Rows about medicines and care, shown only to staff holding inpatient.clinical. */
export const CLINICAL_ACTIONS: ReadonlySet<string> = new Set(['order.create', 'order.stop', 'administration.record', 'care_note.create']);

const STAY_ICON: Record<string, StayHistoryIcon> = { 'stay.admit': 'admit', 'stay.transfer': 'transfer', 'stay.status': 'status', 'stay.discharge': 'discharge' };

function icon(action: string): StayHistoryIcon {
  if (CLINICAL_ACTIONS.has(action)) return 'clinical';
  if (action.startsWith('diary.')) return 'diary';
  if (action.startsWith('video.')) return 'video';
  return STAY_ICON[action] ?? 'status';
}

/** Summaries start with the actor's name; the item carries it separately. */
function label(e: AuditEvent): string {
  const prefix = `${e.actor_name_snapshot} `;
  const rest = e.summary_vi.startsWith(prefix) ? e.summary_vi.slice(prefix.length) : e.summary_vi;
  return rest.charAt(0).toUpperCase() + rest.slice(1);
}

export function stayHistory(doc: Readonly<Doc>, stayId: string, clinical: boolean): StayHistoryItem[] {
  const videos = new Set(doc.t.videos.filter((v) => v.stay_id === stayId).map((v) => v.id));
  return doc.t.audit_events
    .map((e, i) => ({ e, i }))
    .filter(({ e }) => (e.entity_type === 'stay' ? e.entity_id === stayId : e.entity_type === 'video' && videos.has(e.entity_id)))
    .filter(({ e }) => clinical || !CLINICAL_ACTIONS.has(e.action))
    // Seeded rows use +07:00, new ones UTC: compare instants. Same instant → the later-written row first.
    .sort((a, b) => Date.parse(b.e.at) - Date.parse(a.e.at) || b.i - a.i)
    .map(({ e }) => ({ at: e.at, label: label(e), actorName: e.actor_name_snapshot, icon: icon(e.action) }));
}
