import type { SupportStatus } from '@/data/contracts/enums';
import { paths } from '@/app/routes';

/** The sizes the support rules allow; the counters under the boxes count against these. */
export const LIMITS = { title: 80, body: 1000, screen: 100, reply: 500 } as const;

export const countText = (value: string, max: number): string => `${value.trim().length}/${max}`;

export const statusTone = (s: SupportStatus): 'orange' | 'teal' | 'plum' => (s === 'new' ? 'orange' : s === 'seen' ? 'plum' : 'teal');

export const progressText = (done: number, total: number): string => `Đã làm ${done}/${total}`;

export type HelpTab = 'huong-dan' | 'gop-y' | 'hop-thu';
/** The inbox tab is only for people who have the right; anyone else asking for it lands on the guides. */
export function helpTab(raw: string | null, canInbox: boolean): HelpTab {
  if (raw === 'gop-y') return 'gop-y';
  if (raw === 'hop-thu' && canInbox) return 'hop-thu';
  return 'huong-dan';
}

export const pickArticle = (id: string | null, ids: readonly string[]): string | undefined => (id && ids.includes(id) ? id : undefined);

export const supportHref = (screen?: string): string => `${paths.nv.help}?tab=gop-y${screen ? `&man=${encodeURIComponent(screen)}` : ''}`;
