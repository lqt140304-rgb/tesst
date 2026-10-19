import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, m, useReducedMotion } from 'motion/react';
import { cx } from '@/lib/cx';
import { Icon } from '../icons/Icon';
import { dur, ease } from '../motion';
import s from './Dialog.module.css';

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/** Modal dialog: focus trap, Esc closes, focus returns to the opener; a bottom sheet on phones. */
export function Dialog({ open, onClose, title, intro, children, footer, wide }: {
  open: boolean; onClose: () => void; title: ReactNode; intro?: ReactNode; children?: ReactNode; footer?: ReactNode; wide?: boolean;
}) {
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const reduce = useReducedMotion();
  // The latest onClose without re-running the open/close effect (a new callback each parent render must not steal focus).
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; });

  useEffect(() => {
    if (!open) return;
    opener.current = document.activeElement as HTMLElement | null;
    const t = setTimeout(() => {
      const first = panel.current?.querySelector<HTMLElement>('[data-autofocus]') ?? panel.current?.querySelector<HTMLElement>(FOCUSABLE);
      (first ?? panel.current)?.focus();
    }, 30);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); closeRef.current(); }
      if (e.key !== 'Tab' || !panel.current) return;
      const items = [...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
      if (!items.length) return;
      const first = items[0]!, last = items[items.length - 1]!;
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey, true);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      clearTimeout(t);
      document.removeEventListener('keydown', onKey, true);
      document.body.style.overflow = prevOverflow;
      opener.current?.focus?.();
    };
  }, [open]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <m.div className={s.backdrop} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: dur.s }}>
          <m.div ref={panel} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} className={cx(s.panel, wide && s.wide)}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }} transition={{ duration: dur.l, ease: ease.outExpo }}>
            <div className={s.head}>
              <h2 id={titleId} className={s.title}>{title}</h2>
              <button type="button" className={s.close} onClick={onClose} aria-label="Đóng"><Icon name="x" size={20} /></button>
            </div>
            {intro && <p className={s.intro}>{intro}</p>}
            {children}
            {footer && <div className={s.footer}>{footer}</div>}
          </m.div>
        </m.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
