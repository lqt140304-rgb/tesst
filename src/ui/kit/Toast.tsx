import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, m } from 'motion/react';
import { cx } from '@/lib/cx';
import { Icon } from '../icons/Icon';
import { dur, ease } from '../motion';
import s from './Toast.module.css';

type ToastInput = { message: ReactNode; tone?: 'success' | 'info' | 'error'; action?: { label: string; onClick: () => void }; duration?: number };
type ToastItem = ToastInput & { id: number };
const Ctx = createContext<(t: ToastInput) => void>(() => {});
export const useToast = () => useContext(Ctx);

function ToastView({ t, onDone }: { t: ToastItem; onDone: () => void }) {
  const [paused, setPaused] = useState(false);
  const left = useRef(t.duration ?? (t.action ? 10_000 : 5_000)); // undo toasts ≥ 10 s (R27)
  useEffect(() => {
    if (paused) return;
    const start = Date.now();
    const timer = setTimeout(onDone, left.current);
    return () => { clearTimeout(timer); left.current -= Date.now() - start; };
  }, [paused, onDone]);
  const icon = t.tone === 'error' ? 'info' : t.tone === 'info' ? 'info' : 'check';
  return (
    <m.div layout role="status" className={cx(s.toast, s[t.tone ?? 'success'])}
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}
      initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: dur.m, ease: ease.out }}>
      <span className={s.icon}><Icon name={icon} size={18} /></span>
      <span className={s.msg}>{t.message}</span>
      {t.action && <button type="button" className={s.action} onClick={() => { t.action!.onClick(); onDone(); }}>{t.action.label}</button>}
      <button type="button" className={s.close} onClick={onDone} aria-label="Đóng thông báo"><Icon name="x" size={16} /></button>
    </m.div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const seq = useRef(0);
  const push = useCallback((t: ToastInput) => setItems((xs) => [...xs.slice(-2), { ...t, id: ++seq.current }]), []);
  const remove = useCallback((id: number) => setItems((xs) => xs.filter((x) => x.id !== id)), []);
  const value = useMemo(() => push, [push]);
  return (
    <Ctx.Provider value={value}>
      {children}
      <div className={s.region} aria-live="polite">
        <AnimatePresence initial={false}>
          {items.map((t) => <ToastView key={t.id} t={t} onDone={() => remove(t.id)} />)}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  );
}
