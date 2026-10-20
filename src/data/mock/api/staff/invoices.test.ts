import { describe, expect, it } from 'vitest';
import { loginAs, makeTestApi } from '../../testing';
import { ConflictError, ForbiddenError, ValidationError } from '../../../contracts/errors';
import { paymentState } from '../../../rules/invoice-math';

describe('price list', () => {
  it('a draft line keeps its price mode and its pet when read back (F01)', async () => {
    const { api } = makeTestApi();
    await loginAs(api, 'bacsi_duc');
    const draft = await api.staff.invoices.get('inv-28');
    const keep = draft.lines.map((l) => ({ price_item_id: l.price_item_id, qty: l.qty, unit_price: l.unit_price, pet_id: l.pet_id }));
    const open = (await api.staff.prices.list()).find((p) => p.code === 'KB09')!;
    await api.staff.invoices.updateDraft('inv-28', draft.version, { lines: [...keep, { price_item_id: open.id, qty: 1, unit_price: 123000 }] });
    const back = await api.staff.invoices.get('inv-28');
    expect(back.lines.find((l) => l.code === 'KB09')).toMatchObject({ price_mode: 'open', unit_price: 123000 });
    expect(back.lines.filter((l) => l.code !== 'KB09').every((l) => l.price_mode === 'fixed')).toBe(true);
    expect(back.lines.filter((l) => l.code !== 'KB09').map((l) => l.pet_id)).toEqual(draft.lines.map((l) => l.pet_id));
    expect(draft.lines.some((l) => l.pet_id)).toBe(true);
  });
  it('every staff user can read 31 items', async () => {
    const { api } = makeTestApi();
    await loginAs(api, 'spa_ngocanh');
    expect(await api.staff.prices.list()).toHaveLength(31);
  });
});

describe('invoices', () => {
  async function draftFor(api: ReturnType<typeof makeTestApi>['api']) {
    const id = await api.staff.invoices.createDraft({ customer_id: 'cus-05', pet_ids: ['pet-lu'], source_type: 'counter' });
    let inv = await api.staff.invoices.get(id);
    const saved = await api.staff.invoices.updateDraft(id, inv.version, { lines: [{ price_item_id: 'pi-KB01', qty: 1 }, { price_item_id: 'pi-TH03', qty: 3 }] });
    // The editor keeps the version it saved, so its next save is checked against what it last wrote.
    expect(saved).toBe((await api.staff.invoices.get(id)).version);
    await expect(api.staff.invoices.updateDraft(id, inv.version, { lines: [] })).rejects.toThrow(ConflictError);
    inv = await api.staff.invoices.get(id);
    return inv;
  }

  it('issue computes totals and freezes lines', async () => {
    const { api } = makeTestApi();
    await loginAs(api, 'bacsi_duc');
    const inv = await draftFor(api);
    expect(inv.total).toBe(150000 + 45000);
    await api.staff.invoices.issue(inv.id, inv.version);
    const issued = await api.staff.invoices.get(inv.id);
    expect(issued).toMatchObject({ status: 'issued', state: 'unpaid', remaining: 195000 });
    await expect(api.staff.invoices.updateDraft(inv.id, issued.version, { lines: [] })).rejects.toThrow('Hóa đơn đã phát hành không sửa được.');
  });

  it('cannot issue an empty invoice', async () => {
    const { api } = makeTestApi();
    await loginAs(api, 'bacsi_duc');
    const id = await api.staff.invoices.createDraft({ customer_id: 'cus-05', pet_ids: ['pet-lu'], source_type: 'counter' });
    const inv = await api.staff.invoices.get(id);
    await expect(api.staff.invoices.issue(id, inv.version)).rejects.toThrow(ValidationError);
  });

  it('partial then full payment derives partial then paid, with cash change', async () => {
    const { api } = makeTestApi();
    await loginAs(api, 'quanly_ha');
    const inv = await draftFor(api);
    await api.staff.invoices.issue(inv.id, inv.version);
    const r1 = await api.staff.invoices.payments.record(inv.id, { amount: 100000, method: 'cash', cash_given: 200000 });
    expect(r1.change).toBe(100000);
    expect((await api.staff.invoices.get(inv.id)).state).toBe('partial');
    await api.staff.invoices.payments.record(inv.id, { amount: 95000, method: 'transfer' });
    expect((await api.staff.invoices.get(inv.id))).toMatchObject({ state: 'paid', remaining: 0 });
  });

  it('a payment above the remaining amount throws', async () => {
    const { api } = makeTestApi();
    await loginAs(api, 'quanly_ha');
    const inv = await draftFor(api);
    await api.staff.invoices.issue(inv.id, inv.version);
    await expect(api.staff.invoices.payments.record(inv.id, { amount: 999999, method: 'cash' })).rejects.toThrow(ValidationError);
    await expect(api.staff.invoices.payments.record(inv.id, { amount: 100000, method: 'cash', cash_given: 50000 })).rejects.toThrow(ValidationError);
  });

  it('a doctor can issue but cannot record payments', async () => {
    const { api } = makeTestApi();
    await loginAs(api, 'bacsi_duc');
    const inv = await draftFor(api);
    await api.staff.invoices.issue(inv.id, inv.version);
    await expect(api.staff.invoices.payments.record(inv.id, { amount: 1000, method: 'cash' })).rejects.toThrow(ForbiddenError);
  });

  it('open-price lines need a unit price', async () => {
    const { api } = makeTestApi();
    await loginAs(api, 'bacsi_duc');
    const id = await api.staff.invoices.createDraft({ customer_id: 'cus-05', pet_ids: ['pet-lu'], source_type: 'counter' });
    const inv = await api.staff.invoices.get(id);
    await expect(api.staff.invoices.updateDraft(id, inv.version, { lines: [{ price_item_id: 'pi-KB09', qty: 1 }] })).rejects.toThrow(ValidationError);
    await api.staff.invoices.updateDraft(id, inv.version, { lines: [{ price_item_id: 'pi-KB09', qty: 1, unit_price: 350000 }] });
    expect((await api.staff.invoices.get(id)).total).toBe(350000);
  });

  it('lists by derived state', async () => {
    const { api } = makeTestApi();
    await loginAs(api, 'quanly_ha');
    expect((await api.staff.invoices.list({ state: 'partial' })).map((i) => i.customerName).sort()).toEqual(['Bùi Quang Huy', 'Trần Bảo Ngọc']);
    expect(await api.staff.invoices.list({ state: 'draft' })).toHaveLength(5);
  });

  it('spa cannot see invoices or revenue', async () => {
    const { api } = makeTestApi();
    await loginAs(api, 'spa_ngocanh');
    await expect(api.staff.invoices.list({})).rejects.toThrow(ForbiddenError);
    await expect(api.staff.reports.revenue({ from: '2026-10-01', to: '2026-10-19' })).rejects.toThrow(ForbiddenError);
  });

  it('revenue: outstanding equals the remaining of issued invoices, collected by method sums up', async () => {
    const { api, db } = makeTestApi();
    await loginAs(api, 'quanly_ha');
    const r = await api.staff.reports.revenue({ from: '2026-10-01', to: '2026-10-19' });
    const t = db.read().t;
    const outstanding = t.invoices.filter((i) => i.status === 'issued').reduce((s, i) => s + paymentState(i.total, t.payments.filter((p) => p.invoice_id === i.id)).remaining, 0);
    expect(r.outstanding).toBe(outstanding);
    expect(r.collected).toBe(r.byMethod.cash + r.byMethod.transfer + r.byMethod.qr);
    expect(r.collected).toBeGreaterThan(0);
    expect(r.daily.reduce((s, d) => s + d.amount, 0)).toBe(r.collected);
    expect(r.daily).toHaveLength(19);
  });
});
