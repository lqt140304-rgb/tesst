import type { KV } from './kv';
import { CODE_PREFIXES, emptyTables, SCHEMA_VERSION, type Doc } from './schema';
import { todayVN } from '../../../lib/dates';

export const DOC_KEY = 'leson-demo:v1';

export type DbEvent = 'reseeded' | 'schema-reset' | 'storage-fallback';

export interface Db {
  read(): Readonly<Doc>;
  /** All-or-nothing write. `markDirty: false` is for housekeeping (login audit, seen markers, video purge) that is not a user edit. */
  transact<T>(label: string, fn: (draft: Doc) => T, opts?: { markDirty?: boolean }): T;
  subscribe(cb: () => void): () => void;
  reset(): void;
  reloadFromStorage(): void;
  needsRefreshBanner(): boolean;
  readonly kv: KV;
  readonly clock: () => Date;
}

export function checkInvariants(doc: Doc): void {
  for (const r of doc.t.booking_requests) {
    if (r.resubmit_flag_at && r.status !== 'unreachable') {
      throw new Error(`Invariant: resubmit_flag_at requires status unreachable (${r.code})`);
    }
  }
}

export function createDb(opts: { kv: KV; clock: () => Date; seed: (now: Date) => Doc; onEvent?: (e: DbEvent) => void }): Db {
  const { kv, clock, seed, onEvent } = opts;
  const listeners = new Set<() => void>();
  kv.onFallback = () => onEvent?.('storage-fallback');

  function persist(d: Doc) {
    kv.set(DOC_KEY, JSON.stringify(d));
  }
  const newWriteId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  function fresh(): Doc {
    const d = seed(clock());
    d.writeId = newWriteId();
    persist(d);
    return d;
  }
  function parse(raw: string | null): Doc | null {
    if (!raw) return null;
    try {
      const d = JSON.parse(raw) as Doc;
      // Tables and counters added after a document was saved are filled from that day's sample data (additive schema changes keep SCHEMA_VERSION).
      if (d?.t) {
        const saved = d.t as Partial<Doc['t']>;
        d.t = { ...emptyTables(), ...d.t };
        d.counters ??= {} as Doc['counters'];
        const missingTables = (Object.keys(emptyTables()) as (keyof Doc['t'])[]).filter((k) => saved[k] === undefined);
        const missingCounters = CODE_PREFIXES.filter((p) => d.counters[p] === undefined);
        if (missingTables.length || missingCounters.length) {
          const day = new Date(`${d.seededAt}T12:00:00+07:00`);
          const base = seed(Number.isNaN(day.getTime()) ? clock() : day);
          for (const k of missingTables) (d.t as Record<string, unknown>)[k] = base.t[k];
          for (const p of missingCounters) d.counters[p] = base.counters[p];
        }
        // Rows saved before optimistic versions existed are version 1.
        for (const rows of [d.t.customers, d.t.pets, d.t.price_items] as { version?: number }[][]) for (const r of rows) r.version ??= 1;
      }
      return d;
    } catch { return null; }
  }
  function load(): Doc {
    const stored = parse(kv.get(DOC_KEY));
    if (!stored) return fresh();
    if (stored.schemaVersion !== SCHEMA_VERSION) {
      onEvent?.('schema-reset');
      return fresh();
    }
    if (stored.seededAt !== todayVN(clock()) && !stored.dirty) {
      onEvent?.('reseeded');
      return fresh();
    }
    return stored;
  }

  let doc = load();
  const notify = () => listeners.forEach((l) => l());
  /** The stored document when another tab wrote (or reseeded) since this tab last saw it. */
  function newerStored(): Doc | null {
    const stored = parse(kv.get(DOC_KEY));
    if (!stored || stored.schemaVersion !== SCHEMA_VERSION) return null;
    return stored.writeId !== doc.writeId || stored.rev !== doc.rev || stored.seededAt !== doc.seededAt ? stored : null;
  }

  return {
    kv,
    clock,
    read: () => doc,
    transact(_label, fn, opts) {
      // Build on the latest stored document, so a missed storage event never lets this tab erase another tab's write.
      const base = newerStored() ?? doc;
      const draft = structuredClone(base);
      const result = fn(draft);
      checkInvariants(draft);
      draft.rev = base.rev + 1;
      draft.writeId = newWriteId();
      draft.dirty = opts?.markDirty === false ? base.dirty : true;
      persist(draft);
      doc = draft;
      notify();
      return result;
    },
    subscribe(cb) {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    reset() {
      doc = fresh();
      notify();
    },
    reloadFromStorage() {
      const stored = newerStored();
      if (stored) {
        doc = stored;
        notify();
      }
    },
    needsRefreshBanner: () => doc.dirty && doc.seededAt !== todayVN(clock()),
  };
}
