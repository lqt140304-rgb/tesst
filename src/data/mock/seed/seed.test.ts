import { describe, expect, it } from 'vitest';
import { buildSeed } from './index';
import type { Doc } from '../store/schema';
import { paymentState } from '../../rules/invoice-math';
import { minutesBefore, at, todayVN } from '../../../lib/dates';
import { daysLeft } from '../../rules/video-expiry';

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
});
