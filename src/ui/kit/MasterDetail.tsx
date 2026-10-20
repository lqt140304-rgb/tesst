import { useEffect, useLayoutEffect, useRef, type ReactNode } from 'react';
import { AnimatePresence, m, useReducedMotion } from 'motion/react';
import { useMedia } from '@/lib/useMedia';
import { Icon } from '../icons/Icon';
import { preset } from '../motion';
import s from './MasterDetail.module.css';

/**
 * List + detail (redesign §5.2). From 1024 px the detail sits beside the list; narrower, it takes the full width with a
 * back button, the list stays mounted (hidden) and the page scroll is restored on the way back.
 */
export function MasterDetail({ label, list, detail, detailKey, onBack, backLabel, focusDetail = false }: {
  label: string; list: ReactNode; detail: ReactNode | null; detailKey?: string; onBack: () => void; backLabel: string; focusDetail?: boolean;
}) {
  const wide = useMedia('(min-width: 1024px)');
  const reduced = useReducedMotion() ?? false;
  const panel = useRef<HTMLElement>(null);
  const scrollY = useRef(0);
  const open = detail !== null;
  const narrowOpen = open && !wide;

  // Narrow screens: remember where the list was, start the detail at the top, come back to the same place.
  useLayoutEffect(() => {
    if (wide) return;
    if (open) { window.scrollTo({ top: 0 }); return; }
    if (scrollY.current) window.scrollTo({ top: scrollY.current });
  }, [open, wide]);

  useEffect(() => {
    if (open && focusDetail) panel.current?.querySelector<HTMLElement>('h2, [data-detail-focus]')?.focus({ preventScroll: true });
  }, [open, focusDetail, detailKey]);

  const p = preset('enterPanel', { reduced });
  return (
    <div className={s.md} data-open={open || undefined}>
      <div className={s.list} data-md-list hidden={narrowOpen} onClickCapture={() => { if (!wide) scrollY.current = window.scrollY; }} onKeyDownCapture={() => { if (!wide) scrollY.current = window.scrollY; }}>
        {list}
      </div>
      <AnimatePresence mode="wait" initial={false}>
        {open && (
          <m.section key={detailKey ?? 'detail'} ref={panel} className={s.detail} aria-label={label} data-detail
            initial={p.initial} animate={p.animate} transition={p.transition}>
            {!wide && <button type="button" className={s.back} onClick={onBack}><Icon name="arrow-left" size={16} />{backLabel}</button>}
            {detail}
          </m.section>
        )}
      </AnimatePresence>
    </div>
  );
}
