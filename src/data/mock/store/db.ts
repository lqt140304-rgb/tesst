import type { KV } from './kv';
import { SCHEMA_VERSION, type Doc } from './schema';
import { todayVN } from '../../../lib/dates';

export const DOC_KEY = 'leson-demo:v1';

export type DbEvent = 'reseeded' | 'schema-reset' | 'storage-fallback';

export interface Db {
  read(): Readonly<Doc>;
  transact<T>(label: string, fn: (draft: Doc) => T): T;
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
  function fresh(): Doc {
    const d = seed(clock());
    persist(d);
    return d;
  }
  function parse(raw: string | null): Doc | null {
    if (!raw) return null;
    try { return JSON.parse(raw) as Doc; } catch { return null; }
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

  return {
    kv,
    clock,
    read: () => doc,
    transact(_label, fn) {
      const draft = structuredClone(doc);
      const result = fn(draft);
      checkInvariants(draft);
      draft.rev = doc.rev + 1;
      draft.dirty = true;
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
      const stored = parse(kv.get(DOC_KEY));
      if (stored && stored.schemaVersion === SCHEMA_VERSION && stored.rev !== doc.rev) {
        doc = stored;
        notify();
      }
    },
    needsRefreshBanner: () => doc.dirty && doc.seededAt !== todayVN(clock()),
  };
}
