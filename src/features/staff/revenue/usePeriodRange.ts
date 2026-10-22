import { useState, type ComponentProps } from 'react';
import { useSearchParams } from 'react-router';
import { system } from '@/data/public';
import { validateRange } from '@/data/rules/calendar';
import { todayVN } from '@/lib/dates';
import type { PeriodPicker } from './PeriodPicker';
import { readRange, writePeriod, writeRange, type Fixed, type Period } from './revenueView';

/**
 * The period a reporting screen shows, kept in its address, with the picker's state (the free-range dates, their errors).
 * `fallback` is the period for a missing or broken address. A bad free range is refused here with the shared calendar rules and never reaches a report.
 */
export function usePeriodRange(fallback: Fixed): { range: { from: string; to: string }; picker: ComponentProps<typeof PeriodPicker> } {
  const today = todayVN(system.now());
  const [params, setParams] = useSearchParams();
  const cur = readRange(params.toString(), today, fallback);
  // "Chọn ngày" stays selected for the address it was chosen on; any other address (back button, a pasted link) shows what the address says.
  const search = params.toString();
  const [customAt, setCustomAt] = useState<string | null>(cur.period === 'custom' ? search : null);
  const custom = cur.period === 'custom' || customAt === search;
  // The date fields belong to the address they were typed for; any other address (Back, a pasted link) shows its own dates.
  const [typed, setTyped] = useState<{ search: string; from: string; to: string } | null>(null);
  const draft = typed && typed.search === search ? typed : { from: cur.from, to: cur.to };
  const [errors, setErrors] = useState<{ from?: string; to?: string }>({});
  const shown: Period = custom ? 'custom' : cur.period;

  function pick(p: Period) {
    setErrors({});
    if (p === 'custom') { setCustomAt(search); setTyped(null); return; }
    setCustomAt(null);
    setParams(new URLSearchParams(writePeriod(p)));
  }
  function apply() {
    const e = validateRange(draft);
    if (e.from || e.to) { setErrors(e); return; }
    setErrors({});
    const next = new URLSearchParams(writeRange(draft.from, draft.to));
    setCustomAt(next.toString());
    setTyped(null);
    setParams(next);
  }

  return {
    range: { from: cur.from, to: cur.to },
    picker: { value: shown, onPick: pick, from: draft.from, to: draft.to, onFrom: (v) => setTyped({ search, ...draft, from: v }), onTo: (v) => setTyped({ search, ...draft, to: v }), onApply: apply, errors },
  };
}
