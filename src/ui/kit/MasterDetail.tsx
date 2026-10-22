import { useEffect, useLayoutEffect, useRef, type ReactNode } from 'react';
import { m } from 'motion/react';
import { useReducedMotion, preset } from '../motion';
import { useMedia } from '@/lib/useMedia';
import { Icon } from '../icons/Icon';
import s from './MasterDetail.module.css';

/**
 * List + detail (redesign §5.2). From 1024 px the detail sits beside the list; narrower, it takes the full width with a
 * back button, the list stays mounted (hidden) and the page scroll is restored on the way back.
 * Focus: the detail's first h2 (give it tabIndex={-1}) takes focus when opened from the keyboard, and always on narrow
 * screens (the list is hidden there); closing returns focus to whatever opened it.
 */
export function MasterDetail({ label, list, detail, detailKey, onBack, backLabel, focusDetail = false }: {
  label: string; list: ReactNode; detail: ReactNode | null; detailKey?: string; onBack: () => void; backLabel: string; focusDetail?: boolean;
}) {
  const wide = useMedia('(min-width: 1024px)');
  const reduced = useReducedMotion() ?? false;
  const panel = useRef<HTMLElement>(null);
  const scrollY = useRef(0);
  const opener = useRef<HTMLElement | null>(null);
  const open = detail !== null;
  const narrowOpen = open && !wide;

  // Narrow screens: remember where the list was, start the detail at the top, come back to the same place and element.
  useLayoutEffect(() => {
    if (open) {
      if (!wide) window.scrollTo({ top: 0 });
      return;
    }
    if (!wide && scrollY.current) window.scrollTo({ top: scrollY.current });
    const back = opener.current;
    opener.current = null;
    if (back?.isConnected) back.focus({ preventScroll: true });
  }, [open, wide]);

  // Runs after the keyed panel for this detail has mounted, so it never focuses a panel that is leaving.
  useEffect(() => {
    if (open && (focusDetail || !wide)) panel.current?.querySelector<HTMLElement>('h2, [data-detail-focus]')?.focus({ preventScroll: true });
  }, [open, focusDetail, wide, detailKey]);

  const remember = () => {
    const active = document.activeElement;
    if (active instanceof HTMLElement && active !== document.body) opener.current = active;
    if (!wide) scrollY.current = window.scrollY;
  };

  const p = preset('enterPanel', { reduced });
  return (
    <div className={s.md} data-open={open || undefined}>
      <div className={s.list} data-md-list hidden={narrowOpen} onClickCapture={remember} onKeyDownCapture={remember}>
        {list}
      </div>
      {open && (
        <m.section key={detailKey ?? 'detail'} ref={panel} className={s.detail} aria-label={label} data-detail
          initial={p.initial} animate={p.animate} transition={p.transition}>
          {!wide && <button type="button" className={s.back} onClick={onBack}><Icon name="arrow-left" size={16} />{backLabel}</button>}
          {detail}
        </m.section>
      )}
    </div>
  );
}
