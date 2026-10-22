import { m } from 'motion/react';
import { useReducedMotion } from '../motion';
import { Icon } from '../icons/Icon';
import { SAVE_LABEL, type SaveStatus } from './save-state';
import s from './SaveState.module.css';

/** "Bản nháp · Chưa lưu thay đổi" / "Đang lưu…" / "Đã lưu ✓"; empty while clean. Announced politely. */
export function SaveState({ status }: { status: SaveStatus }) {
  const reduced = useReducedMotion() ?? false;
  // The live region stays mounted (empty while clean) so its first message is announced.
  return (
    <span className={s.save} role="status" aria-live="polite" data-save={status}>
      {status === 'clean' ? null : status === 'saved'
        ? <m.span className={s.tick} aria-hidden="true" initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: reduced ? 0.1 : 0.2 }}><Icon name="check" size={14} /></m.span>
        : <span className={s.dot} aria-hidden="true" />}
      {status !== 'clean' && SAVE_LABEL[status]}
    </span>
  );
}
