import { describe, expect, it } from 'vitest';
import { buildSeed } from './index';
import type { Doc } from '../store/schema';
import { paymentState } from '../../rules/invoice-math';
import { addDays, minutesBefore, at, todayVN } from '../../../lib/dates';
import { daysLeft } from '../../rules/video-expiry';
import { findOverlap } from '../../rules/appointment-overlap';

const NOW = new Date('2026-10-19T09:00:00+07:00');
const doc = buildSeed(NOW);
const byCode = <T extends { code: string }>(rows: T[], code: string) => rows.find((r) => r.code === code)!;

/** Every *_id / *_ids field must point to a row in some table. */
function allIds(d: Doc): Set<string> {
  const s = new Set<string>();
  for (const rows of Object.values(d.t)) for (const r of rows as { id?: string }[]) if (r.id) s.add(r.id);
  return s;
}

describe('seed', () => {
  it('every foreign key resolves', () => {
    const ids = allIds(doc);
    const SKIP = new Set(['media_key', 'deleted_by', 'id', 'preset_ids']); // presets are static config, not a table
    const missing: string[] = [];
    for (const [table, rows] of Object.entries(doc.t)) {
      for (const row of rows as Record<string, unknown>[]) {
        for (const [k, v] of Object.entries(row)) {
          if (SKIP.has(k) || !(k.endsWith('_id') || k.endsWith('_ids') || ['created_by', 'linked_by', 'issued_by', 'received_by', 'uploaded_by', 'shared_by', 'ordered_by', 'performed_by', 'admitted_by', 'updated_by'].includes(k))) continue;
          if (k === 'actor_id' && row.actor_type === 'system') continue;
          for (const x of Array.isArray(v) ? v : [v]) {
            if (typeof x === 'string' && x !== 'system' && !ids.has(x)) missing.push(`${table}.${k}=${x}`);
          }
        }
      }
    }
    expect(missing).toEqual([]);
  });

  it('human codes are unique per table', () => {
    for (const rows of Object.values(doc.t)) {
      const codes = (rows as { code?: string }[]).map((r) => r.code).filter(Boolean);
      expect(new Set(codes).size).toBe(codes.length);
    }
  });

  it('request status counts match the plan', () => {
    const count = (s: string) => doc.t.booking_requests.filter((r) => r.status === s).length;
    expect([count('pending'), count('contacting'), count('unreachable'), count('confirmed'), count('cancelled'), count('rejected')]).toEqual([5, 3, 4, 5, 2, 2]);
    expect(doc.t.booking_requests.filter((r) => r.resubmit_flag_at)).toHaveLength(1);
    expect(byCode(doc.t.booking_requests, 'YC-0234').resubmit_flag_at).toBe(minutesBefore(NOW, 35));
  });

  it('appointment statuses are only scheduled or cancelled', () => {
    expect(new Set(doc.t.appointments.map((a) => a.status))).toEqual(new Set(['scheduled', 'cancelled']));
    const today = doc.t.appointments.filter((a) => a.start_at.startsWith('2026-10-19'));
    expect(today).toHaveLength(7);
  });

  it('no person has two live appointments at the same time', () => {
    const live = doc.t.appointments.filter((a) => a.status === 'scheduled' && a.assignee_id);
    const clashes = live.filter((a) => findOverlap(live, { assignee_id: a.assignee_id, start_at: a.start_at, duration_min: a.duration_min, ignoreId: a.id }));
    expect(clashes.map((a) => a.code)).toEqual([]);
  });

  it('all seed dates are relative to the clock', () => {
    const later = new Date('2026-11-02T09:00:00+07:00');
    const d2 = buildSeed(later);
    expect(d2.seededAt).toBe(todayVN(later));
    expect(byCode(d2.t.booking_requests, 'YC-0244').created_at).toBe(minutesBefore(later, 12));
    expect(byCode(d2.t.stays, 'NT-0041').admitted_at).toBe(at('2026-11-02', -2, '10:30'));
    expect(d2.t.appointments.filter((a) => a.start_at.startsWith('2026-11-02'))).toHaveLength(7);
  });

  it('minh_khoa is not linked, has link code LS-7K2Q and a web pet Gạo', () => {
    const acc = doc.t.web_accounts.find((a) => a.username === 'minh_khoa')!;
    expect(acc.link_code).toBe('LS-7K2Q');
    expect(doc.t.account_links.some((l) => l.account_id === acc.id && !l.unlinked_at)).toBe(false);
    expect(doc.t.account_pets.some((p) => p.account_id === acc.id && p.name === 'Gạo')).toBe(true);
    const own = doc.t.booking_requests.filter((r) => r.account_id === acc.id);
    expect(own.map((r) => r.status)).toEqual(['unreachable']);
  });

  it('lan_nguyen is linked to KH-0001 and has an issued unpaid invoice', () => {
    const acc = doc.t.web_accounts.find((a) => a.username === 'lan_nguyen')!;
    const link = doc.t.account_links.find((l) => l.account_id === acc.id && !l.unlinked_at)!;
    expect(doc.t.customers.find((c) => c.id === link.customer_id)!.code).toBe('KH-0001');
    const unpaid = doc.t.invoices.filter((i) => i.customer_id === link.customer_id && i.status === 'issued')
      .filter((i) => paymentState(i.total, doc.t.payments.filter((p) => p.invoice_id === i.id)).state === 'unpaid');
    expect(unpaid.length).toBeGreaterThanOrEqual(1);
  });

  it('NT-0041 has three shared diary entries with part of day and category', () => {
    const stay = byCode(doc.t.stays, 'NT-0041');
    const shared = doc.t.diary_entries.filter((e) => e.stay_id === stay.id && e.status === 'shared');
    expect(shared).toHaveLength(3);
    for (const e of shared) {
      expect(['sang', 'chieu', 'toi']).toContain(e.part_of_day);
      expect(e.category).toBeTruthy();
    }
  });

  it('the Bơ video expires in 3 days and one video was auto-deleted', () => {
    const bo = doc.t.videos.find((v) => v.media_key === 'demo:v6-bo-spa')!;
    expect(daysLeft(bo.expires_at, NOW)).toBe(3);
    expect(doc.t.videos.filter((v) => v.deleted_by === 'system')).toHaveLength(1);
  });

  it('customer-facing text never contains a drug name', () => {
    const drugs = doc.t.care_orders.map((o) => o.item_name.toLowerCase());
    const texts = [...doc.t.diary_entries.map((e) => e.text), ...doc.t.videos.map((v) => v.caption ?? '')].map((t) => t.toLowerCase());
    for (const d of drugs) for (const t of texts) expect(t.includes(d)).toBe(false);
  });

  it('counts customers, pets, cages and price items', () => {
    expect(doc.t.customers).toHaveLength(18);
    expect(doc.t.pets).toHaveLength(22);
    expect(doc.t.cages).toHaveLength(12);
    expect(doc.t.price_items).toHaveLength(31);
    expect(doc.t.staff_users).toHaveLength(4);
    expect(doc.t.web_accounts).toHaveLength(6);
  });
  it('stays with a draft carry the day item of their LT line', () => {
    const dayItem = (code: string) => byCode(doc.t.stays, code).day_price_item_id;
    expect(dayItem('NT-0041')).toBe('pi-LT01');
    expect(dayItem('NT-0044')).toBe('pi-LT02');
    expect(dayItem('NT-0039')).toBe('pi-LT02');
    expect(dayItem('NT-0040')).toBe('pi-LT02');
    expect(dayItem('NT-0043')).toBe('pi-LT01');
    expect(dayItem('NT-0035')).toBeUndefined(); // issued invoice: left alone
  });

  it('every pet has a weight except the two kept for "Chưa ghi tiền nội trú"', () => {
    expect(doc.t.pets.filter((p) => p.weight_kg === undefined).map((p) => p.id).sort()).toEqual(['pet-tom', 'pet-xoai']);
  });

  it('every seeded stay has its admission (and discharge) in the audit trail', () => {
    for (const s of doc.t.stays) {
      const ev = doc.t.audit_events.filter((e) => e.entity_type === 'stay' && e.entity_id === s.id);
      expect(ev.find((e) => e.action === 'stay.admit')?.at).toBe(s.admitted_at);
      expect(ev.some((e) => e.action === 'stay.discharge')).toBe(!!s.discharged_at);
    }
    const v1 = doc.t.audit_events.filter((e) => e.entity_id === 'video-V1').map((e) => e.action);
    expect(v1).toEqual(['video.upload', 'video.share']);
  });
  it('two pending requests show a preferred time slot', () => {
    expect(byCode(doc.t.booking_requests, 'YC-0241').snapshot.preferred_slot).toBe('14-16');
    expect(byCode(doc.t.booking_requests, 'YC-0242').snapshot.preferred_slot).toBe('08-10');
  });
  it('customers, pets and price items start at version 1; open items carry a reference price', () => {
    for (const rows of [doc.t.customers, doc.t.pets, doc.t.price_items]) expect(rows.every((r) => r.version === 1)).toBe(true);
    const ref = Object.fromEntries(doc.t.price_items.filter((p) => p.reference_price !== undefined).map((p) => [p.code, p.reference_price]));
    expect(ref).toEqual({ KB09: 200000, TH06: 100000, VT05: 50000 });
  });
});

describe('stock seed', () => {
  const items = doc.t.stock_items;
  const item = (code: string) => items.find((i) => i.code === code)!;
  const movesOf = (id: string) => doc.t.stock_moves.filter((m) => m.item_id === id);
  it('has 14 items, 52 movements and the counter at 14', () => {
    expect(items.map((i) => i.code)).toEqual(Array.from({ length: 14 }, (_, n) => `KHO-${String(n + 1).padStart(4, '0')}`));
    expect(doc.t.stock_moves).toHaveLength(52);
    expect(doc.counters.KHO).toBe(14);
  });
  it('each item quantity is its latest movement quantity_after, and the running balance chains', () => {
    for (const i of items) {
      const ms = movesOf(i.id);
      expect(i.qty, i.code).toBe(ms.at(-1)!.qty_after);
      let run = 0;
      for (const m of ms) {
        run += m.delta;
        expect(m.qty_after, `${i.code} ${m.at}`).toBe(run);
        expect(run).toBeGreaterThanOrEqual(0);
      }
    }
  });
  it('final quantities, states and the single adjustment match the table', () => {
    expect(items.map((i) => i.qty)).toEqual([25, 5, 25, 5, 0, 8, 3, 150, 70, 7, 42, 10, 20, 13]);
    expect(item('KHO-0007').active).toBe(false);
    expect(items.filter((i) => !i.active)).toHaveLength(1);
    expect(movesOf(item('KHO-0011').id).filter((m) => m.kind === 'adjust').map((m) => [m.delta, m.reason])).toEqual([[-3, 'kiem_ke']]);
    expect(item('KHO-0004').expires_on! < todayVN(NOW)).toBe(true);
    expect(item('KHO-0003').expires_on).toBe(addDays(todayVN(NOW), 20));
  });
  it('all movements are in the past, by the manager, with the name stored', () => {
    for (const m of doc.t.stock_moves) {
      expect(new Date(m.at).getTime()).toBeLessThan(NOW.getTime());
      expect(m.by).toBe('stf-ha');
      expect(m.by_name).toBe('Nguyễn Thu Hà');
    }
  });
});

describe('support tickets seed', () => {
  const tickets = doc.t.support_tickets;
  it('has 4 sample tickets HT-0001..0004: 2 new, 1 seen, 1 answered, and the counter at 4', () => {
    expect(tickets.map((t) => t.code)).toEqual(['HT-0001', 'HT-0002', 'HT-0003', 'HT-0004']);
    expect(doc.counters.HT).toBe(4);
    expect(tickets.map((t) => t.status).sort()).toEqual(['answered', 'new', 'new', 'seen']);
  });
  it('are written by real staff, labelled as samples, and only the answered one carries a reply', () => {
    const staff = new Set(doc.t.staff_users.map((u) => u.id));
    for (const t of tickets) {
      expect(staff.has(t.created_by)).toBe(true);
      expect(doc.t.staff_users.find((u) => u.id === t.created_by)!.display_name).toBe(t.created_by_name);
      expect(t.title.endsWith(' (mẫu)')).toBe(true);
      expect(t.version).toBe(1);
      const replied = [t.reply_text, t.replied_by_name, t.replied_at].filter(Boolean).length;
      expect(replied).toBe(t.status === 'answered' ? 3 : 0);
      expect(Date.parse(t.created_at)).toBeLessThanOrEqual(NOW.getTime());
    }
    expect(tickets.filter((t) => t.status === 'answered')[0]!.replied_by_name).toBe('Nguyễn Thu Hà');
  });
  it('kinds: a bug and an idea are new, a how-to is seen, a how-to is answered', () => {
    const by = (s: string) => tickets.filter((t) => t.status === s).map((t) => t.kind).sort();
    expect(by('new')).toEqual(['bug', 'idea']);
    expect(by('seen')).toEqual(['howto']);
    expect(by('answered')).toEqual(['howto']);
  });
});
