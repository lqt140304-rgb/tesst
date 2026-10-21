import { at, minutesBefore, todayVN } from '../../../lib/dates';
import { emptyTables, SCHEMA_VERSION, type Doc } from '../store/schema';

/** Seed context: every date is an offset from the seed moment, so the demo always looks "today". */
export type SeedCtx = {
  now: Date;
  base: string;
  doc: Doc;
  /** Day offset + clock time → ISO (+07:00). */
  d: (offsetDays: number, hhmm: string) => string;
  /** Minutes before now → ISO (+07:00). */
  ago: (minutes: number) => string;
  /** Deterministic pseudo-random in [0, 1). */
  rng: () => number;
};

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createCtx(now: Date): SeedCtx {
  const base = todayVN(now);
  const doc: Doc = {
    schemaVersion: SCHEMA_VERSION,
    seededAt: base,
    dirty: false,
    rev: 0,
    counters: { YC: 0, LH: 0, NT: 0, HD: 0, PT: 0, KH: 0, TC: 0, KHO: 0 },
    t: emptyTables(),
  };
  return { now, base, doc, d: (o, hm) => at(base, o, hm), ago: (m) => minutesBefore(now, m), rng: mulberry32(20261019) };
}

export const phone = (n: number) => `+849000000${String(n).padStart(2, '0')}`;
