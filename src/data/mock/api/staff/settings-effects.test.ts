import { describe, expect, it } from 'vitest';
import { loginAs, makeTestApi } from '../../testing';
import { addDays, todayVN } from '../../../../lib/dates';
import { ValidationError } from '../../../contracts/errors';
import { SETTINGS_MSG } from '../../../rules/app-settings';
import { OPEN_REQUEST_STATUSES } from '../../../rules/request-status';

const RANGE = { from: '2026-10-19', to: '2026-10-25' };
const fieldsOf = async (p: Promise<unknown>) => ((await p.catch((e) => e)) as ValidationError).fields;

async function manager() {
  const t = makeTestApi();
  await loginAs(t.api, 'quanly_ha');
  return t;
}

describe('stock expiry days', () => {
  it('Kho list, summary, detail and the operations report all use the same number', async () => {
    const { api, db } = await manager();
    const today = todayVN(new Date('2026-10-19T09:00:00+07:00'));
    const expectedSoon = (days: number) => db.read().t.stock_items
      .filter((i) => i.active && i.expires_on && i.expires_on >= today && i.expires_on <= addDays(today, days)).length;
    const far = db.read().t.stock_items.find((i) => i.active && i.expires_on && i.expires_on > addDays(today, 150) && i.expires_on < addDays(today, 250))!;
    expect(await api.staff.stock.summary()).toMatchObject({ expiringSoon: 1 });
    expect((await api.staff.stock.get(far.id)).item.expiry).toBe('none');
    let version = 1;
    for (const days of [1, 365]) {
      version = (await api.staff.settings.update(version, { stock_expiry_days: days })).version;
      const soon = expectedSoon(days);
      expect((await api.staff.stock.summary()).expiringSoon).toBe(soon);
      expect((await api.staff.stock.list()).filter((r) => r.active && r.expiry === 'soon')).toHaveLength(soon);
      expect((await api.staff.reports.operations(RANGE)).stock.expiringSoon).toBe(soon);
      expect((await api.staff.stock.get(far.id)).item.expiry).toBe(days === 365 ? 'soon' : 'none');
      expect((await api.staff.stock.summary()).expired).toBe(1);
    }
    expect(expectedSoon(1)).toBe(0);
    expect(expectedSoon(365)).toBeGreaterThan(1);
  });
  it('a missing settings table still uses 30 days', async () => {
    const { api, db } = await manager();
    db.transact('t', (d) => { d.t.app_settings = []; });
    expect(await api.staff.stock.summary()).toMatchObject({ expiringSoon: 1, expired: 1 });
  });
});

describe('payment methods', () => {
  async function issued() {
    const t = await manager();
    const id = await t.api.staff.invoices.createDraft({ customer_id: 'cus-05', pet_ids: ['pet-lu'], source_type: 'counter' });
    const inv = await t.api.staff.invoices.get(id);
    await t.api.staff.invoices.updateDraft(id, inv.version, { lines: [{ price_item_id: 'pi-KB01', qty: 1 }, { price_item_id: 'pi-TH03', qty: 3 }] });
    await t.api.staff.invoices.issue(id, (await t.api.staff.invoices.get(id)).version);
    return { ...t, id };
  }
  it('a method that is off is refused for a new payment, before the amount is checked', async () => {
    const { api, db, id } = await issued();
    await api.staff.settings.update(1, { payment_methods: ['cash'] });
    const rev = db.read().rev;
    expect(await fieldsOf(api.staff.invoices.payments.record(id, { amount: 1000, method: 'qr' }))).toEqual({ method: SETTINGS_MSG.methodOff });
    expect(await fieldsOf(api.staff.invoices.payments.record(id, { amount: 0, method: 'transfer' }))).toEqual({ method: SETTINGS_MSG.methodOff });
    expect(db.read().rev).toBe(rev);
    expect(db.read().t.payments.filter((p) => p.invoice_id === id)).toHaveLength(0);
  });
  it('the methods that are on still work, and turning one back on makes it usable', async () => {
    const { api, id } = await issued();
    await api.staff.settings.update(1, { payment_methods: ['cash'] });
    expect((await api.staff.invoices.payments.record(id, { amount: 100000, method: 'cash', cash_given: 150000 })).change).toBe(50000);
    await api.staff.settings.update(2, { payment_methods: ['cash', 'qr'] });
    await api.staff.invoices.payments.record(id, { amount: 1000, method: 'qr' });
    expect((await api.staff.invoices.get(id)).payments.map((p) => p.method)).toEqual(['cash', 'qr']);
  });
  it('payments already recorded with a method that is now off stay as they are', async () => {
    const { api, id } = await issued();
    await api.staff.invoices.payments.record(id, { amount: 1000, method: 'transfer' });
    await api.staff.settings.update(1, { payment_methods: ['cash'] });
    expect((await api.staff.invoices.get(id)).payments.map((p) => p.method)).toEqual(['transfer']);
  });
});

describe('request overdue', () => {
  const NOW = new Date('2026-10-19T09:00:00+07:00').getTime();
  const hoursAgo = (iso: string) => (NOW - Date.parse(iso)) / 3_600_000;
  it('only open requests older than the number of hours are late: 24 by default, then 1', async () => {
    const { api } = await manager();
    const late = (hours: number) => (c: { status: never; createdAt: string }) => OPEN_REQUEST_STATUSES.includes(c.status) && hoursAgo(c.createdAt) > hours;
    const first = await api.staff.requests.list({ tab: 'tat_ca' });
    for (const c of first) expect(c.overdue).toBe(late(24)(c as never));
    expect(first.some((c) => c.overdue)).toBe(true);
    expect(first.some((c) => !c.overdue)).toBe(true);
    await api.staff.settings.update(1, { request_overdue_hours: 1 });
    const cards = await api.staff.requests.list({ tab: 'tat_ca' });
    for (const c of cards) expect(c.overdue).toBe(late(1)(c as never));
    expect(cards.filter((c) => c.overdue).length).toBeGreaterThan(first.filter((c) => c.overdue).length);
    expect(cards.some((c) => c.overdue)).toBe(true);
    expect(cards.some((c) => !c.overdue && OPEN_REQUEST_STATUSES.includes(c.status))).toBe(true);
    expect(cards.filter((c) => !OPEN_REQUEST_STATUSES.includes(c.status) && hoursAgo(c.createdAt) > 1).every((c) => c.overdue === false)).toBe(true);
  });
  it('the detail carries it too, and changing the number takes effect at once', async () => {
    const { api } = await manager();
    const open = (await api.staff.requests.list({ tab: 'can_xu_ly' })).find((c) => hoursAgo(c.createdAt) > 1 && hoursAgo(c.createdAt) < 24)!;
    await api.staff.settings.update(1, { request_overdue_hours: 1 });
    expect((await api.staff.requests.get(open.id)).overdue).toBe(true);
    await api.staff.settings.update(2, { request_overdue_hours: 24 });
    expect((await api.staff.requests.get(open.id)).overdue).toBe(false);
  });
  it('the mark follows the clock: late only when more than the number of hours have passed', async () => {
    const { api, setNow } = await manager();
    const open = (await api.staff.requests.list({ tab: 'can_xu_ly' })).find((c) => c.code === 'YC-0242')!;   // made 120 minutes before "now", i.e. at 07:00
    await api.staff.settings.update(1, { request_overdue_hours: 3 });
    expect((await api.staff.requests.get(open.id)).overdue).toBe(false);
    setNow('2026-10-19T10:00:00+07:00');   // exactly 3 hours
    expect((await api.staff.requests.get(open.id)).overdue).toBe(false);
    setNow('2026-10-19T10:01:00+07:00');
    expect((await api.staff.requests.get(open.id)).overdue).toBe(true);
    setNow('2026-10-19T06:00:00+07:00');   // before it was made
    expect((await api.staff.requests.get(open.id)).overdue).toBe(false);
  });
});
