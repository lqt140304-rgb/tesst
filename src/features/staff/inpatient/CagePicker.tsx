import { useRef } from 'react';
import type { Species } from '@/data/contracts/enums';
import type { AdmitOptions } from '@/data/staff';
import { cx } from '@/lib/cx';
import { orderCages } from './admitSteps';
import s from './Inpatient.module.css';

/** Empty cages as buttons, grouped by zone; the zones that suit the pet come first and say so. */
export function CagePicker({ cages, species, value, onChange, label }: {
  cages: AdmitOptions['cages']; species: Species; value?: string; onChange: (id: string) => void; label: string;
}) {
  const groups = orderCages(cages, species);
  const flat = groups.flatMap((g) => g.cages);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const current = Math.max(0, flat.findIndex((c) => c.id === value));
  function onKey(e: React.KeyboardEvent, i: number) {
    const dir = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const n = (i + dir + flat.length) % flat.length;
    onChange(flat[n]!.id);
    refs.current[n]?.focus();
  }
  if (flat.length === 0) return <p className={s.meta}>Hiện không còn chuồng trống.</p>;
  let index = -1;
  return (
    <div role="radiogroup" aria-label={label} className={s.cageGroups}>
      {groups.map((g) => (
        <div key={g.zone} className={s.cageZone}>
          <p className={s.cageZoneTitle}>{g.zone}{g.fit && <span className={s.fitTag}>Hợp với bé</span>}</p>
          <div className={s.cageGrid}>
            {g.cages.map((c) => {
              const i = ++index;
              return (
                <button key={c.id} ref={(el) => { refs.current[i] = el; }} type="button" role="radio" aria-checked={c.id === value} aria-label={`Chuồng ${c.code}`}
                  tabIndex={i === current ? 0 : -1} className={cx(s.cageBtn, 'num')} onClick={() => onChange(c.id)} onKeyDown={(e) => onKey(e, i)}>
                  {c.code}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
