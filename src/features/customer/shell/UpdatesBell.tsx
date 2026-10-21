import { useEffect, useId, useRef, useState } from 'react';
import { AnimatePresence, m } from 'motion/react';
import { AppLink } from '@/app/nav';
import { paths } from '@/app/routes';
import { customer, type CustomerUpdate } from '@/data/customer';
import { useQuery } from '@/data/hooks/useQuery';
import { PART_OF_DAY_LABEL } from '@/data/contracts/enums';
import { cx } from '@/lib/cx';
import { Icon, type IconName } from '@/ui';
import s from './Bell.module.css';

const ICON: Record<CustomerUpdate['kind'], IconName> = { diary: 'diary', video: 'video', request: 'calendar-check', invoice: 'receipt' };
const hrefOf = (t: CustomerUpdate['target']) => (t.kind === 'stay' ? paths.kh.stay(t.id) : t.kind === 'request' ? paths.kh.request(t.id) : paths.kh.invoice(t.id));

/** The bell: new things since the last time it was opened (spec 2026-10-21 §3.1). Day and part of day only — never a clock time. Opening it marks everything seen. */
export function UpdatesBell() {
  const q = useQuery(() => customer.updates.list(), []);
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState<CustomerUpdate[]>([]);
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const btn = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLElement>(null);
  const id = useId();
  const items = q.data ?? [];
  const unseen = items.filter((u) => u.unseen).length;

  function toggle() {
    if (open) { setOpen(false); return; }
    const r = btn.current?.getBoundingClientRect();
    const narrow = window.innerWidth < 993;
    setPos({ top: (r?.bottom ?? 56) + 8, left: narrow ? 8 : Math.min(r?.left ?? 8, window.innerWidth - 348) });
    setShown(items); // keep the "new" marks on screen while the panel is open
    setOpen(true);
    if (unseen > 0) void customer.updates.markAllSeen();
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); btn.current?.focus(); } };
    const onDoc = (e: MouseEvent) => { const t = e.target as Node; if (!panel.current?.contains(t) && !btn.current?.contains(t)) setOpen(false); };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDoc);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onDoc); };
  }, [open]);

  return (
    <>
      <button ref={btn} type="button" className={s.btn} aria-label={unseen > 0 ? `Cập nhật mới (${unseen} chưa xem)` : 'Cập nhật mới'}
        aria-expanded={open} aria-controls={open ? id : undefined} onClick={toggle}>
        <Icon name="bell" size={22} />
        {unseen > 0 && <span className={s.dot} data-unseen aria-hidden="true">{unseen > 9 ? '9+' : unseen}</span>}
      </button>
      <AnimatePresence>
        {open && (
          <m.section id={id} ref={panel} role="region" aria-label="Cập nhật mới" className={s.panel} style={{ top: pos.top, left: pos.left }}
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, transition: { duration: 0.12 } }} transition={{ duration: 0.17 }}>
            <h2 className={s.h}>Cập nhật mới</h2>
            {shown.length === 0 ? <p className={s.empty}>Chưa có cập nhật mới.</p> : (
              <ul className={s.list}>
                {shown.map((u) => (
                  <li key={u.id}>
                    <AppLink to={hrefOf(u.target)} className={cx(s.item, u.unseen && s.fresh)} onClick={() => setOpen(false)}>
                      <span className={s.ico} aria-hidden="true"><Icon name={ICON[u.kind]} size={18} /></span>
                      <span>
                        <span className={s.text}>{u.text}</span>
                        <span className={s.when}>{u.dateLabel}{u.partOfDay ? ` · ${PART_OF_DAY_LABEL[u.partOfDay]}` : ''}</span>
                      </span>
                    </AppLink>
                  </li>
                ))}
              </ul>
            )}
          </m.section>
        )}
      </AnimatePresence>
    </>
  );
}
