import { describe, expect, it, vi } from 'vitest';
import { createKV, memoryStorage } from './kv';
import { createDb, DOC_KEY } from './db';
import { emptyTables, SCHEMA_VERSION, type Doc } from './schema';
import { ConflictError } from '../../contracts/errors';
import { checkVersion } from './version';
import { todayVN } from '../../../lib/dates';
import { nextCode } from '../ids';
import { DEFAULT_SETTINGS } from '../../rules/app-settings';
import { readSettings } from '../settings';

function tinySeed(now: Date): Doc {
  const t = emptyTables();
  t.booking_requests.push({
    id: 'r1', code: 'YC-0001', scope: 'guest', snapshot: { contact_name: 'A', phone_e164: '+84900000001', pet_name: 'B', species: 'cat', service: 'kham', desired_date: '2026-10-20' },
    dedupe_key: 'k', status: 'pending', version: 1, created_at: now.toISOString(), updated_at: now.toISOString(),
  });
  return { schemaVersion: SCHEMA_VERSION, seededAt: todayVN(now), dirty: false, rev: 0, counters: { YC: 1, LH: 0, NT: 0, HD: 0, PT: 0, KH: 0, TC: 0, KHO: 0, HT: 0 }, t };
}

/** The seed of a build that already has Kho: one sample item and its counter. */
function withStock(now: Date): Doc {
  const d = tinySeed(now);
  d.t.stock_items.push({ id: 's1', code: 'KHO-0001', name: 'Gạc', kind: 'vat_tu', unit: 'gói', qty: 3, min_qty: 1, active: true, version: 1, created_at: now.toISOString(), created_by: 'x' });
  d.counters.KHO = 1;
  return d;
}

/** The seed of a build that already has support tickets: one sample ticket and its counter. */
function withSupport(now: Date): Doc {
  const d = tinySeed(now);
  d.t.support_tickets.push({ id: 't1', code: 'HT-0001', kind: 'bug', title: 'Mẫu', body: 'Mẫu', status: 'new', created_at: now.toISOString(), created_by: 'x', created_by_name: 'X', version: 1 });
  d.counters.HT = 1;
  return d;
}

/** The seed of a build that already has featured content: one sample product and one sample case. */
function withContent(now: Date): Doc {
  const d = tinySeed(now);
  const base = { visible: true, sample: true, created_at: now.toISOString(), created_by_name: 'X', updated_at: now.toISOString(), updated_by_name: 'X', version: 1 };
  d.t.featured_products.push({ id: 'fp1', name: 'Mẫu (mẫu)', category: 'food', ...base });
  d.t.featured_cases.push({ id: 'fc1', title: 'Mẫu (mẫu)', story: 'Mẫu', pet_name: 'Bông', species: 'dog', consent_by_name: 'X', consent_at: now.toISOString(), ...base });
  return d;
}

/** The seed of a build that already has system settings: the one default row. */
function withSettings(now: Date): Doc {
  const d = tinySeed(now);
  d.t.app_settings.push({ id: 'main', version: 1, values: { ...DEFAULT_SETTINGS, payment_methods: [...DEFAULT_SETTINGS.payment_methods] } });
  return d;
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

  it('housekeeping writes (markDirty: false) keep an untouched demo eligible for the next-day reseed', () => {
    const storage = memoryStorage();
    const a = createDb({ kv: createKV(storage), clock: at(DAY1), seed: tinySeed });
    a.transact('auth.login.audit', (d) => { d.counters.YC += 0; }, { markDirty: false });
    expect(a.read().dirty).toBe(false);
    expect(a.read().rev).toBe(1);
    const next = createDb({ kv: createKV(storage), clock: at(DAY2), seed: tinySeed });
    expect(next.read().seededAt).toBe(todayVN(new Date(DAY2)));
  });

  it("a write builds on the other tab's latest write instead of overwriting it", () => {
    const storage = memoryStorage();
    const a = createDb({ kv: createKV(storage), clock: at(DAY1), seed: tinySeed });
    const b = createDb({ kv: createKV(storage), clock: at(DAY1), seed: tinySeed });
    b.transact('b', (d) => { d.t.booking_requests[0]!.status = 'contacting'; });
    // A never received B's storage event; its own write must still keep B's change.
    a.transact('a', (d) => { d.counters.KH += 1; });
    const stored = JSON.parse(storage.getItem(DOC_KEY)!) as Doc;
    expect(stored.t.booking_requests[0]!.status).toBe('contacting');
    expect(stored.counters.KH).toBe(1);
  });

  it('an overnight tab adopts a reseed with the same rev', () => {
    const storage = memoryStorage();
    const a = createDb({ kv: createKV(storage), clock: at(DAY1), seed: tinySeed });
    const b = createDb({ kv: createKV(storage), clock: at(DAY2), seed: tinySeed });
    expect(b.read().rev).toBe(a.read().rev);
    a.reloadFromStorage();
    expect(a.read().seededAt).toBe(b.read().seededAt);
  });
  it('a stored document from before a table existed gets that table empty', () => {
    const kv = createKV(memoryStorage());
    const old = tinySeed(new Date(DAY1));
    old.dirty = true;
    delete (old.t as Partial<Doc['t']>).reschedule_requests;
    kv.set(DOC_KEY, JSON.stringify(old));
    const db = createDb({ kv, clock: at(DAY1), seed: tinySeed });
    expect(db.read().t.booking_requests).toHaveLength(1);
    expect(db.read().t.reschedule_requests).toEqual([]);
  });
  it('a document saved before Kho opens with the sample stock, the counter, and the user edits intact', () => {
    const kv = createKV(memoryStorage());
    const old = tinySeed(new Date(DAY1));
    old.dirty = true;
    old.t.booking_requests[0]!.status = 'contacting';
    delete (old.t as Partial<Doc['t']>).stock_items;
    delete (old.t as Partial<Doc['t']>).stock_moves;
    delete (old.counters as Partial<Doc['counters']>).KHO;
    kv.set(DOC_KEY, JSON.stringify(old));
    const db = createDb({ kv, clock: at(DAY1), seed: withStock });
    expect(db.read().t.stock_items.map((s) => s.code)).toEqual(['KHO-0001']);
    expect(db.read().counters.KHO).toBe(1);
    expect(db.read().t.booking_requests[0]!.status).toBe('contacting');
    expect(db.transact('t', (d) => nextCode(d, 'KHO'))).toBe('KHO-0002');
  });
  it('a stock table that exists but is empty stays empty (not refilled)', () => {
    const kv = createKV(memoryStorage());
    const old = tinySeed(new Date(DAY1));
    old.dirty = true;
    delete (old.counters as Partial<Doc['counters']>).KHO; // something is missing, so the backfill does run
    kv.set(DOC_KEY, JSON.stringify(old));
    const db = createDb({ kv, clock: at(DAY1), seed: withStock });
    expect(db.read().t.stock_items).toEqual([]);
    expect(db.read().counters.KHO).toBe(1);
  });
  it('a stored document from before staff preferences existed gets an empty table', () => {
    const kv = createKV(memoryStorage());
    const old = tinySeed(new Date(DAY1));
    old.dirty = true;
    delete (old.t as Partial<Doc['t']>).staff_prefs;
    kv.set(DOC_KEY, JSON.stringify(old));
    const db = createDb({ kv, clock: at(DAY1), seed: tinySeed });
    expect(db.read().t.staff_prefs).toEqual([]);
    expect(db.read().t.booking_requests).toHaveLength(1);
  });
  it('a document saved before system settings existed gets the default settings row', () => {
    const kv = createKV(memoryStorage());
    const old = tinySeed(new Date(DAY1));
    old.dirty = true;
    delete (old.t as Partial<Doc['t']>).app_settings;
    kv.set(DOC_KEY, JSON.stringify(old));
    const db = createDb({ kv, clock: at(DAY1), seed: withSettings });
    expect(db.read().t.app_settings).toHaveLength(1);
    expect(readSettings(db.read().t)).toEqual({ version: 1, values: DEFAULT_SETTINGS });
  });
  it('a settings table that exists but is empty stays empty and still reads as the defaults', () => {
    const kv = createKV(memoryStorage());
    const old = tinySeed(new Date(DAY1));
    old.dirty = true;
    delete (old.counters as Partial<Doc['counters']>).KHO; // something is missing, so the backfill does run
    kv.set(DOC_KEY, JSON.stringify(old));
    const db = createDb({ kv, clock: at(DAY1), seed: withSettings });
    expect(db.read().t.app_settings).toEqual([]);
    expect(readSettings(db.read().t)).toEqual({ version: 1, values: DEFAULT_SETTINGS });
  });
  it('a document saved before support tickets existed gets the sample tickets and the HT counter', () => {
    const kv = createKV(memoryStorage());
    const old = tinySeed(new Date(DAY1));
    old.dirty = true;
    delete (old.t as Partial<Doc['t']>).support_tickets;
    delete (old.counters as Partial<Doc['counters']>).HT;
    kv.set(DOC_KEY, JSON.stringify(old));
    const db = createDb({ kv, clock: at(DAY1), seed: withSupport });
    expect(db.read().t.support_tickets.map((t) => t.code)).toEqual(['HT-0001']);
    expect(db.read().counters.HT).toBe(1);
    expect(db.transact('t', (d) => nextCode(d, 'HT'))).toBe('HT-0002');
  });
  it('a support table that exists but is empty stays empty (not refilled)', () => {
    const kv = createKV(memoryStorage());
    const old = tinySeed(new Date(DAY1));
    old.dirty = true;
    delete (old.counters as Partial<Doc['counters']>).HT; // something is missing, so the backfill does run
    kv.set(DOC_KEY, JSON.stringify(old));
    const db = createDb({ kv, clock: at(DAY1), seed: withSupport });
    expect(db.read().t.support_tickets).toEqual([]);
    expect(db.read().counters.HT).toBe(1);
  });
  it('a document saved before featured content existed gets the sample products and cases', () => {
    const kv = createKV(memoryStorage());
    const old = tinySeed(new Date(DAY1));
    old.dirty = true;
    delete (old.t as Partial<Doc['t']>).featured_products;
    delete (old.t as Partial<Doc['t']>).featured_cases;
    kv.set(DOC_KEY, JSON.stringify(old));
    const db = createDb({ kv, clock: at(DAY1), seed: withContent });
    expect(db.read().t.featured_products.map((p) => p.id)).toEqual(['fp1']);
    expect(db.read().t.featured_cases.map((c) => c.id)).toEqual(['fc1']);
  });
  it('featured tables that exist but are empty stay empty (not refilled)', () => {
    const kv = createKV(memoryStorage());
    const old = tinySeed(new Date(DAY1));
    old.dirty = true;
    delete (old.counters as Partial<Doc['counters']>).HT; // something is missing, so the backfill does run
    kv.set(DOC_KEY, JSON.stringify(old));
    const db = createDb({ kv, clock: at(DAY1), seed: withContent });
    expect(db.read().t.featured_products).toEqual([]);
    expect(db.read().t.featured_cases).toEqual([]);
  });
  it('staff users saved before they had versions load as version 1', () => {
    const kv = createKV(memoryStorage());
    const old = tinySeed(new Date(DAY1));
    old.dirty = true;
    old.t.staff_users.push({ id: 's1', username: 'ai_do', display_name: 'A', title: 'B', preset_ids: ['spa'], extra_capabilities: [], is_sample: true, active: true, password_salt: 'x', password_hash: 'y' } as never);
    kv.set(DOC_KEY, JSON.stringify(old));
    const db = createDb({ kv, clock: at(DAY1), seed: tinySeed });
    expect(db.read().t.staff_users[0]!.version).toBe(1);
  });
  it('rows saved before versions existed load as version 1', () => {
    const kv = createKV(memoryStorage());
    const old = tinySeed(new Date(DAY1));
    old.dirty = true;
    old.t.customers.push({ id: 'c1', code: 'KH-0001', full_name: 'A', phone_e164: '+84900000001', created_at: DAY1, created_by: 's' } as never);
    old.t.pets.push({ id: 'p1', code: 'TC-0001', customer_id: 'c1', name: 'B', species: 'cat', alerts: [] } as never);
    old.t.price_items.push({ id: 'pi1', code: 'KB01', category: 'exam', name: 'X', unit: 'lần', price: 1, price_mode: 'fixed', active: true } as never);
    kv.set(DOC_KEY, JSON.stringify(old));
    const db = createDb({ kv, clock: at(DAY1), seed: tinySeed });
    expect([db.read().t.customers[0]!.version, db.read().t.pets[0]!.version, db.read().t.price_items[0]!.version]).toEqual([1, 1, 1]);
  });
});
