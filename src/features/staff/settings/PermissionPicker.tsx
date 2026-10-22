import { CAP_LABEL, type Cap, type PresetId } from '@/data/rules/capabilities';
import { Checkbox } from '@/ui';
import { groupsFor, inheritedCaps, viewNote } from './settingsView';
import s from './Settings.module.css';

/**
 * The rights as a tick list by work area. What a role already gives is ticked and locked ("Có theo vai"); the rest can be given
 * one by one. `selected` is everything the person would have; `held` decides whether the old umbrella stock right is offered.
 */
export function PermissionPicker({ presets, selected, onChange, held }: {
  presets: readonly PresetId[]; selected: ReadonlySet<Cap>; onChange: (next: Set<Cap>) => void; held: ReadonlySet<Cap>;
}) {
  const byRole = inheritedCaps(presets);
  const note = viewNote(selected, presets);
  const toggle = (c: Cap) => {
    const next = new Set(selected);
    if (next.has(c)) next.delete(c); else next.add(c);
    onChange(next);
  };
  return (
    <div className={s.picker}>
      {groupsFor(held).map((g) => (
        <fieldset key={g.key} className={s.pickGroup}>
          <legend className={s.pickLegend}>{g.label}</legend>
          <div className={s.pickList}>
            {g.caps.map((c) => {
              const locked = byRole.has(c);
              return (
                <Checkbox key={c} checked={locked || selected.has(c)} disabled={locked} onChange={() => toggle(c)}
                  label={<>{CAP_LABEL[c]}{locked && <span className={s.byRole}>Có theo vai</span>}</>} />
              );
            })}
          </div>
          {g.key === 'kho' && note && <p className={s.pickNote} role="status">{note}</p>}
        </fieldset>
      ))}
    </div>
  );
}
