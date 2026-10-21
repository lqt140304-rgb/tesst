import type { StaffStayView } from '@/data/staff';
import { system } from '@/data/public';
import { cx } from '@/lib/cx';
import { STAY_STEP_LABELS, currentStayStep, stepIndex } from './stayStep';
import s from './Inpatient.module.css';

/** Where the pet is in the stay, for orientation only (not clickable). */
export function StayProgress({ v }: { v: Pick<StaffStayView, 'discharged_at' | 'expected_discharge_at' | 'diary'> }) {
  const current = stepIndex(currentStayStep(v, system.now()));
  return (
    <ol className={s.progress} aria-label="Tiến trình nội trú">
      {STAY_STEP_LABELS.map((label, i) => (
        <li key={label} className={cx(s.progressStep, i < current && s.stepDone, i === current && s.stepNow)} aria-current={i === current ? 'step' : undefined}>
          <span className={s.stepDot} aria-hidden="true" />
          <span>{label}</span>
        </li>
      ))}
    </ol>
  );
}
