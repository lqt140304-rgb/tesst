import { describe, expect, it, vi } from 'vitest';
import { createKV, memoryStorage } from './kv';
import { createDb, DOC_KEY } from './db';
import { emptyTables, SCHEMA_VERSION, type Doc } from './schema';
import { ConflictError } from '../../contracts/errors';
import { checkVersion } from './version';
import { todayVN } from '../../../lib/dates';

function tinySeed(now: Date): Doc {
  const t = emptyTables();
  t.booking_requests.push({
    id: 'r1', code: 'YC-0001', scope: 'guest', snapshot: { contact_name: 'A', phone_e164: '+84900000001', pet_name: 'B', species: 'cat', service: 'kham', desired_date: '2026-10-20' },
    dedupe_key: 'k', status: 'pending', version: 1, created_at: now.toISOString(), updated_at: now.toISOString(),
  });
  return { schemaVersion: SCHEMA_VERSION, seededAt: todayVN(now), dirty: false, rev: 0, counters: { YC: 1, LH: 0, NT: 0, HD: 0, PT: 0, KH: 0, TC: 0 }, t };
}

const at = (s: string) => () => new Date(s);
const DAY1 = '2026-10-19T09:00:00+07:00';
const DAY2 = '2026-10-20T09:00:00+07:00';

describe('mock db', () => {
  it('transact rollback leaves doc unchanged when fn throws', () => {
    const db = createDb({ kv: createKV(memoryStorage()), clock: at(DAY1), seed: tinySeed });
    expect(() => db.transact('x', (d) => { d.t.booking_requests[0]!.status = 'contacting'; throw new Error('boom'); })).toThrow('boom');
    expect(db.read().t.booking_requests[0]!.status).toBe('pending');
    expect(db.read().rev).toBe(0);
  });

  it('transact bumps rev, sets dirty, persists and notifies subscribers', () => {
    const kv = createKV(memoryStorage());
    const db = createDb({ kv, clock: at(DAY1), seed: tinySeed });
    const cb = vi.fn();
    db.subscribe(cb);
    const result = db.transact('x', (d) => { d.t.booking_requests[0]!.status = 'contacting'; return 42; });
    expect(result).toBe(42);
    expect(db.read().rev).toBe(1);
    expect(db.read().dirty).toBe(true);
    expect(JSON.parse(kv.get(DOC_KEY)!).t.booking_requests[0].status).toBe('contacting');
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('version conflict throws ConflictError', () => {
    expect(() => checkVersion({ version: 3 }, 2)).toThrow(ConflictError);
    expect(() => checkVersion({ version: 3 }, 3)).not.toThrow();
  });

  it('invariant: flag on a non-unreachable request throws and rolls back', () => {
    const db = createDb({ kv: createKV(memoryStorage()), clock: at(DAY1), seed: tinySeed });
    expect(() => db.transact('x', (d) => { d.t.booking_requests[0]!.resubmit_flag_at = DAY1; })).toThrow(/resubmit_flag_at/);
    expect(db.read().t.booking_requests[0]!.resubmit_flag_at).toBeUndefined();
  });

  it('schema mismatch wipes and reseeds', () => {
    const kv = createKV(memoryStorage());
    kv.set(DOC_KEY, JSON.stringify({ ...tinySeed(new Date(DAY1)), schemaVersion: 0, dirty: true }));
    const onEvent = vi.fn();
    const db = createDb({ kv, clock: at(DAY1), seed: tinySeed, onEvent });
    expect(db.read().schemaVersion).toBe(SCHEMA_VERSION);
    expect(db.read().dirty).toBe(false);
    expect(onEvent).toHaveBeenCalledWith('schema-reset');
  });

  it('freshness: clean reseeds, dirty keeps and flags', () => {
    const kvClean = createKV(memoryStorage());
    createDb({ kv: kvClean, clock: at(DAY1), seed: tinySeed });
    const clean = createDb({ kv: kvClean, clock: at(DAY2), seed: tinySeed });
    expect(clean.read().seededAt).toBe('2026-10-20');
    expect(clean.needsRefreshBanner()).toBe(false);

    const kvDirty = createKV(memoryStorage());
    const first = createDb({ kv: kvDirty, clock: at(DAY1), seed: tinySeed });
    first.transact('edit', (d) => { d.t.booking_requests[0]!.status = 'contacting'; });
    const dirty = createDb({ kv: kvDirty, clock: at(DAY2), seed: tinySeed });
    expect(dirty.read().seededAt).toBe('2026-10-19');
    expect(dirty.read().t.booking_requests[0]!.status).toBe('contacting');
    expect(dirty.needsRefreshBanner()).toBe(true);
  });

  it('falls back to memory when kv throws', () => {
    const broken = { getItem: () => { throw new Error('denied'); }, setItem: () => { throw new Error('denied'); }, removeItem: () => { throw new Error('denied'); } } as unknown as Storage;
    const kv = createKV(broken);
    const onEvent = vi.fn();
    const db = createDb({ kv, clock: at(DAY1), seed: tinySeed, onEvent });
    db.transact('x', (d) => { d.t.booking_requests[0]!.status = 'contacting'; });
    expect(db.read().t.booking_requests[0]!.status).toBe('contacting');
    expect(kv.persistent).toBe(false);
    expect(onEvent).toHaveBeenCalledWith('storage-fallback');
  });

  it('reloads on storage event from another tab', () => {
    const storage = memoryStorage();
    const a = createDb({ kv: createKV(storage), clock: at(DAY1), seed: tinySeed });
    const b = createDb({ kv: createKV(storage), clock: at(DAY1), seed: tinySeed });
    const cb = vi.fn();
    b.subscribe(cb);
    a.transact('x', (d) => { d.t.booking_requests[0]!.status = 'contacting'; });
    b.reloadFromStorage();
    expect(b.read().t.booking_requests[0]!.status).toBe('contacting');
    expect(cb).toHaveBeenCalled();
  });

  it('reset reseeds and clears dirty', () => {
    const db = createDb({ kv: createKV(memoryStorage()), clock: at(DAY1), seed: tinySeed });
    db.transact('x', (d) => { d.t.booking_requests[0]!.status = 'contacting'; });
    db.reset();
    expect(db.read().t.booking_requests[0]!.status).toBe('pending');
    expect(db.read().dirty).toBe(false);
  });
});
