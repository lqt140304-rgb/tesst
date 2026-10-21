import { paths } from '@/app/routes';
import type { Cap } from '@/data/rules/capabilities';
import type { StaffInteraction, StaffInteractionKind } from '@/data/staff';
import type { IconName } from '@/ui';

export const INTERACTION_ICON: Record<StaffInteractionKind, IconName> = {
  customer: 'circle-user-round', request: 'inbox', appointment: 'calendar-days', stay: 'house-paw', invoice: 'receipt', payment: 'banknote', link: 'link-2',
};

/** Where a history row can take the person, only to pages they may open; nothing for kinds without a page of their own. */
export function interactionLink(i: Pick<StaffInteraction, 'kind' | 'refId'>, can: (cap: Cap | Cap[]) => boolean): string | undefined {
  if (!i.refId) return undefined;
  switch (i.kind) {
    case 'request': return can('requests.handle') ? paths.nv.request(i.refId) : undefined;
    case 'stay': return can('inpatient.view') ? paths.nv.stay(i.refId) : undefined;
    case 'invoice':
    case 'payment': return can(['invoices.create', 'payments.record']) ? paths.nv.invoice(i.refId) : undefined;
    default: return undefined;
  }
}
