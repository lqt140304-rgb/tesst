import { useEffect, useMemo, useState } from 'react';
import { bookings, system } from '@/data/public';
import { hoursState, type HoursState } from './homeView';

/**
 * Whether the hospital is open right now, by the demo clock and the holidays. The clock is read on mount and every minute;
 * until the holidays arrive the answer is by the clock alone, so a button is never wrong for the usual day.
 */
export function useHospitalHours(): { state: HoursState; ready: boolean } {
  const [now, setNow] = useState(() => system.now());
  const [holidays, setHolidays] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let alive = true;
    bookings.holidays().then((h) => { if (alive) { setHolidays(h); setReady(true); } }).catch(() => { if (alive) setReady(true); });
    const t = setInterval(() => setNow(system.now()), 60_000);
    return () => { alive = false; clearInterval(t); };
  }, []);
  return { state: useMemo(() => hoursState(now, holidays), [now, holidays]), ready };
}
