import { AppLink } from '@/app/nav';
import { NUDGE_KEYS, type NudgeKey } from '@/data/contracts/enums';
import { nudgeChoices, nudgeLines, oldDrafts, usePrefs } from '@/app/prefs';
import { useSession } from '@/app/session/SessionProvider';
import { system } from '@/data/public';
import { staff } from '@/data/staff';
import { useQuery } from '@/data/hooks/useQuery';
import { Icon } from '@/ui';
import s from '../Staff.module.css';

/** "Nhắc việc": one line per kind of chore the person switched on, only while there is something to do. */
export function NudgeList() {
  const { can } = useSession();
  const { prefs } = usePrefs();
  const allowed = nudgeChoices(can);
  const enabled = Object.fromEntries(NUDGE_KEYS.map((k) => [k, prefs.nudges[k] && allowed.includes(k)])) as Record<NudgeKey, boolean>;

  const requests = useQuery(() => (enabled.requests ? staff.requests.list({ tab: 'can_xu_ly' }) : Promise.resolve(null)), [enabled.requests]);
  const reschedules = useQuery(() => (enabled.reschedules ? staff.requests.reschedules().catch(() => []) : Promise.resolve(null)), [enabled.reschedules]);
  const stock = useQuery(() => (enabled.stock ? staff.stock.summary() : Promise.resolve(null)), [enabled.stock]);
  const drafts = useQuery(() => (enabled.drafts ? staff.invoices.list({ state: 'draft' }) : Promise.resolve(null)), [enabled.drafts]);

  const lines = nudgeLines({
    enabled,
    requests: requests.data?.length ?? 0,
    reschedules: reschedules.data?.length ?? 0,
    stock: stock.data ? stock.data.low + stock.data.out : 0,
    drafts: drafts.data ? oldDrafts(drafts.data, system.now()) : 0,
  });
  if (lines.length === 0) return null;
  return (
    <section className={s.nudges} aria-labelledby="nhac-viec">
      <h2 id="nhac-viec" className={s.nudgesTitle}>Nhắc việc</h2>
      <ul className={s.nudgeList}>
        {lines.map((l) => (
          <li key={l.key} data-nudge={l.key}>
            <AppLink to={l.to} className={s.nudgeRow}><span>{l.text}</span><Icon name="arrow-right" size={16} /></AppLink>
          </li>
        ))}
      </ul>
    </section>
  );
}
