import { describe, expect, it } from 'vitest';
import { loginAs, makeTestApi } from '../../testing';
import { ForbiddenError, NotLinkedError } from '../../../contracts/errors';

const FORBIDDEN_KEYS = ['item_name', 'dose', 'route', 'schedule_times', 'performed_at', 'performed_by', 'note_internal', 'reason_internal', 'internal_status', 'internalStatus', 'ordered_by', 'cage_id', 'cageCode', 'assignee_id', 'assigneeName', 'author_id', 'authorName', 'received_by', 'handler_id', 'shared_by', 'uploaded_by', 'created_by', 'issued_by', 'password_hash', 'password_salt', 'min_qty', 'qty_after', 'supplier', 'stock_items', 'app_settings', 'payment_methods', 'request_overdue_hours', 'support_tickets', 'reply_text', 'created_by_name', 'onboarding_done', 'holidays'];

function keysDeep(v: unknown, out = new Set<string>()): Set<string> {
  if (Array.isArray(v)) v.forEach((x) => keysDeep(x, out));
  else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) { out.add(k); keysDeep(x, out); }
  return out;
}

async function everyCustomerOutput(api: ReturnType<typeof makeTestApi>['api']) {
  const out: unknown[] = [];
  const safe = async <T>(p: Promise<T>) => p.catch((e) => { if (e instanceof NotLinkedError) return null; throw e; });
  out.push(await api.customer.overview());
  out.push(await api.customer.account.get());
  const pets = await api.customer.pets.list();
  out.push(pets);
  for (const p of pets) out.push(await api.customer.pets.get(p.id));
  const appts = await api.customer.appointments.list();
  out.push(appts);
  for (const r of [...appts.upcoming, ...appts.processing, ...appts.past]) if (r.kind === 'request') out.push(await api.customer.appointments.getRequest(r.id));
  const stays = await safe(api.customer.stays.list());
  out.push(stays);
  for (const s of stays ? [...stays.current, ...stays.past] : []) out.push(await api.customer.stays.get(s.id));
  out.push(await safe(api.customer.videos.list()));
  out.push(await api.customer.updates.list());
  const invoices = await safe(api.customer.invoices.list());
  out.push(invoices);
  for (const i of invoices ?? []) out.push(await api.customer.invoices.get(i.id));
  return out;
}

describe('customer leak test', () => {
  for (const username of ['lan_nguyen', 'minh_khoa', 'thuy_pham', 'ngoc_tran', 'hoang_long', 'maianh_do']) {
    it(`${username}: no internal keys, internal values or other customers' ids`, async () => {
      const { api, db } = makeTestApi();
      await loginAs(api, username);
      const outputs = await everyCustomerOutput(api);
      const json = JSON.stringify(outputs);
      const keys = keysDeep(outputs);
      for (const k of FORBIDDEN_KEYS) expect(keys.has(k), `key ${k}`).toBe(false);

      const t = db.read().t;
      const forbiddenValues = new Set<string>([
        ...t.care_orders.flatMap((o) => [o.item_name, o.dose ?? '', o.route ?? '']),
        ...t.care_notes.map((n) => n.text),
        ...t.stays.map((s) => s.reason_internal),
        ...t.staff_users.map((s) => s.display_name),
        ...t.price_items.filter((p) => p.customer_group === 'treatment').map((p) => p.name),
        ...t.cages.map((c) => `"${c.code}"`),
        ...t.stock_items.flatMap((i) => [i.name, i.code]),
      ].filter((v) => v.length > 2));
      for (const v of forbiddenValues) expect(json.includes(v), `value ${v}`).toBe(false);

      const me = t.web_accounts.find((a) => a.username === username)!;
      const myCustomer = t.account_links.find((l) => l.account_id === me.id && !l.unlinked_at)?.customer_id;
      const others = new Set<string>([
        ...t.customers.filter((c) => c.id !== myCustomer).map((c) => c.id),
        ...t.pets.filter((p) => p.customer_id !== myCustomer).map((p) => p.id),
        ...t.stays.filter((s) => s.customer_id !== myCustomer).map((s) => s.id),
        ...t.invoices.filter((i) => i.customer_id !== myCustomer).map((i) => i.id),
        ...t.booking_requests.filter((r) => r.account_id !== me.id).map((r) => r.id),
        ...t.web_accounts.filter((a) => a.id !== me.id).map((a) => a.id),
      ]);
      for (const id of others) expect(json.includes(`"${id}"`), `foreign id ${id}`).toBe(false);
    });
  }

  it('after admit → transfer → device video → discharge with farewell, the owner still sees nothing internal', async () => {
    const { api, db } = makeTestApi();
    await loginAs(api, 'bacsi_mai');
    const reason = 'Theo dõi sau tiêm phòng';
    const transferReason = 'Đổi chuồng gần quầy';
    const note = 'Dặn chủ tái khám sau 3 ngày';
    const farewell = 'Bông đã khỏe và sẵn sàng về nhà. Cảm ơn gia đình đã tin tưởng Lê Sơn!';
    const id = await api.staff.inpatient.admit({ pet_id: 'pet-bong', cage_id: 'cage-C5', reason_internal: reason, invoice: { day_price_item_id: 'pi-LT02' } });
    await api.staff.inpatient.transfer(id, 1, { cage_id: 'cage-C6', reason: transferReason });
    await api.staff.inpatient.videos.upload(id, { source: { kind: 'device', file: new Blob([new Uint8Array(10)], { type: 'video/webm' }) }, caption: 'Bông chơi bóng', duration_s: 8, share: { only_this_pet: true, no_people_or_private_info: true } });
    await api.staff.inpatient.discharge(id, 2, { note_internal: note, farewell: { text: farewell, share: true } });

    await loginAs(api, 'lan_nguyen');
    const outputs = await everyCustomerOutput(api);
    const json = JSON.stringify(outputs);
    const keys = keysDeep(outputs);
    for (const k of FORBIDDEN_KEYS) expect(keys.has(k), `key ${k}`).toBe(false);
    const t = db.read().t;
    for (const v of [reason, transferReason, note, '"C5"', '"C6"', ...t.staff_users.map((u) => u.display_name)]) expect(json.includes(v), `value ${v}`).toBe(false);
    expect(json).toContain(farewell);
    expect(json).toContain('"isLocal":true');
  });
});

describe('featured content leak test', () => {
  const FEATURED_SECRETS = ['price_vnd', 'priceVnd', 'consent_by_name', 'consent_at', 'consentByName', 'consentAt', 'updatedByName', 'updated_by_name', 'visible', 'version'];

  it('what a visitor, a customer and a spa member can read carries no internal or featured-only key', async () => {
    const t = makeTestApi();
    for (const who of [null, 'lan_nguyen', 'spa_ngocanh']) {
      if (who) await loginAs(t.api, who);
      const keys = keysDeep([await t.api.public.featured.products(), await t.api.public.featured.cases()]);
      for (const k of [...FORBIDDEN_KEYS, ...FEATURED_SECRETS]) expect(keys.has(k), `${who ?? 'guest'}: ${k}`).toBe(false);
    }
  });

  it('a customer and a visitor cannot reach the staff side of featured content', async () => {
    const t = makeTestApi();
    await expect(t.api.staff.content.cases.list()).rejects.toThrow(ForbiddenError);
    await loginAs(t.api, 'lan_nguyen');
    await expect(t.api.staff.content.cases.list()).rejects.toThrow(ForbiddenError);
    await loginAs(t.api, 'spa_ngocanh');
    await expect(t.api.staff.content.cases.list()).rejects.toThrow(ForbiddenError);
  });
});
