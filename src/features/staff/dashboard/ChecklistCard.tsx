import { useState } from 'react';
import { AppLink } from '@/app/nav';
import { usePrefs } from '@/app/prefs';
import { paths } from '@/app/routes';
import { staff } from '@/data/staff';
import { useQuery } from '@/data/hooks/useQuery';
import { Button, Icon } from '@/ui';
import { progressText } from '../help/helpView';
import s from '../Staff.module.css';

/** Where each first task is done; a task without a screen of its own just opens the overview. */
const WHERE: Record<string, string> = {
  'xem-tong-quan': paths.nv.home, 'xem-lich': paths.nv.calendar, 'xu-ly-yeu-cau': paths.nv.requests, 'mo-ho-so-khach': paths.nv.customers,
  'xem-bang-noi-tru': paths.nv.board, 'viet-nhat-ky': paths.nv.board, 'lap-hoa-don-nhap': paths.nv.invoiceNew, 'thu-tien': paths.nv.invoices,
  'xem-bang-gia': paths.nv.prices,
};

/** "Việc đầu tiên": small things to try in the first days, ticked by doing them; it can be hidden and brought back in Tùy chọn của tôi. */
export function ChecklistCard() {
  const q = useQuery(() => staff.help.checklist(), []);
  const { save } = usePrefs();
  const [hiding, setHiding] = useState(false);
  const c = q.data;
  if (!c || c.hidden || hiding) return null;
  const all = c.doneCount === c.total;
  return (
    <section className={s.nudges} aria-labelledby="viec-dau-tien">
      <div className={s.firstHead}>
        <h2 id="viec-dau-tien" className={s.nudgesTitle}>Việc đầu tiên</h2>
        <span className={`${s.firstCount} num`}>{progressText(c.doneCount, c.total)}</span>
      </div>
      {all && <p className={s.firstAll}>Bạn đã làm hết các việc đầu tiên.</p>}
      <ul className={s.nudgeList}>
        {c.items.map((i) => (
          <li key={i.key} data-task data-done={i.done ? 'true' : 'false'}>
            {i.done ? (
              <span className={s.firstRow}><Icon name="circle-check" size={18} className={s.firstTick} /><span><span className={s.firstDone}>{i.label}</span><span className={s.firstSr}> Đã làm</span></span></span>
            ) : (
              <AppLink to={WHERE[i.key] ?? paths.nv.home} className={s.firstRow}><Icon name="circle-minus" size={18} className={s.firstOpen} /><span><strong>{i.label}</strong><span className={s.firstDetail}>{i.detail}</span></span></AppLink>
            )}
          </li>
        ))}
      </ul>
      <div className={s.firstFoot}><Button variant="ghost" size="sm" onClick={() => { setHiding(true); void save({ onboarding_hidden: true }).catch(() => setHiding(false)); }}>Ẩn danh sách</Button></div>
    </section>
  );
}
