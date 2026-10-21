import { useSession } from '@/app/session/SessionProvider';
import type { StaffStayView } from '@/data/staff';
import { system } from '@/data/public';
import { Icon } from '@/ui';
import { stayChores, type Chore } from './chores';
import s from './Inpatient.module.css';

/** Gentle "what to do next" list; each line opens the tab where it is done. */
export function NextChores({ v, onGoTab }: { v: Pick<StaffStayView, 'diary' | 'videos' | 'billing' | 'discharged_at'>; onGoTab: (tab: Chore['tab']) => void }) {
  const { can } = useSession();
  const chores = stayChores(v, can, system.now());
  return (
    <div className={s.chores}>
      <p className={s.blockTitle}>Việc nên làm</p>
      {chores.length === 0 ? <p className={s.meta}>Không có việc nào đang chờ.</p> : (
        <ul className={s.choreList}>
          {chores.map((c) => (
            <li key={c.key}><button type="button" className={s.choreBtn} onClick={() => onGoTab(c.tab)}><span>{c.label}</span><Icon name="arrow-right" size={16} /></button></li>
          ))}
        </ul>
      )}
    </div>
  );
}
