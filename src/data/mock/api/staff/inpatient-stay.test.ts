import { describe, expect, it } from 'vitest';
import { loginAs, makeTestApi } from '../../testing';
import { ConflictError, ValidationError } from '../../../contracts/errors';

describe('transfer', () => {
  it('moves a stay to a free cage, checks the version and refuses busy or same cages', async () => {
    const { api, db } = makeTestApi();
    await loginAs(api, 'spa_ngocanh');
    const kem = db.read().t.stays.find((s) => s.code === 'NT-0044')!;
    await api.staff.inpatient.transfer(kem.id, kem.version, { cage_id: 'cage-C5', reason: '  Chuồng C4 cần vệ sinh ' });
    const after = db.read().t.stays.find((s) => s.id === kem.id)!;
    expect(after).toMatchObject({ cage_id: 'cage-C5', version: kem.version + 1 });
    expect(db.read().t.audit_events.at(-1)).toMatchObject({ action: 'stay.transfer', entity_id: kem.id, reason: 'Chuồng C4 cần vệ sinh', summary_vi: 'Lê Ngọc Anh chuyển Kem từ chuồng C4 sang C5 — Chuồng C4 cần vệ sinh' });
    await expect(api.staff.inpatient.transfer(kem.id, kem.version, { cage_id: 'cage-C6' })).rejects.toThrow(ConflictError);
    for (const cage_id of ['cage-C1', 'cage-C5']) {
      const err = await api.staff.inpatient.transfer(kem.id, after.version, { cage_id }).catch((e) => e);
      expect(err).toBeInstanceOf(ValidationError);
      expect((err as ValidationError).fields.cage_id).toBe('Chuồng này đang có bé ở.');
    }
    expect(db.read().t.stays.find((s) => s.id === kem.id)!.cage_id).toBe('cage-C5');
  });

  it('refuses a discharged stay', async () => {
    const { api } = makeTestApi();
    await loginAs(api, 'bacsi_duc');
    await expect(api.staff.inpatient.transfer('stay-NT-0035', 1, { cage_id: 'cage-C6' })).rejects.toThrow('Bé đã xuất viện.');
  });
});

describe('discharge', () => {
  // At 14:30 Miu (admitted 17/10 10:30) has stayed exactly 52 hours.
  const setup = async (username = 'bacsi_mai') => {
    const t = makeTestApi('2026-10-19T14:30:00+07:00');
    await loginAs(t.api, username);
    const stay = (code: string) => t.db.read().t.stays.find((s) => s.code === code)!;
    const invoice = (id: string) => t.db.read().t.invoices.find((i) => i.id === id)!;
    const lines = (invoiceId: string) => t.db.read().t.invoice_lines.filter((l) => l.invoice_id === invoiceId);
    const draftLines = async (invoiceId: string) => (await t.api.staff.invoices.get(invoiceId)).lines.map((l) => ({ price_item_id: l.price_item_id, pet_id: l.pet_id, qty: l.qty }));
    return { ...t, stay, invoice, lines, draftLines };
  };

  it('sets the day line to 2,2 days for 52 hours and re-totals the draft', async () => {
    const { api, db, stay, invoice, lines } = await setup();
    const miu = stay('NT-0041');
    const inv = invoice(miu.invoice_id!);
    const r = await api.staff.inpatient.discharge(miu.id, miu.version, {});
    expect(r).toEqual({ days: 2.2, invoiceUpdated: true });
    expect(lines(inv.id).find((l) => l.price_item_id === 'pi-LT01')).toMatchObject({ qty: 2.2, line_total: 330000 });
    expect(invoice(inv.id)).toMatchObject({ subtotal: inv.subtotal + 30000, total: inv.total + 30000, version: inv.version + 1, status: 'draft' });
    expect(stay('NT-0041')).toMatchObject({ discharged_at: '2026-10-19T14:30:00+07:00', discharged_by: 'stf-mai' });
    expect(db.read().t.audit_events.at(-1)!.summary_vi).toBe('BS. Phạm Thanh Mai cho xuất viện NT-0041 · hóa đơn tính 2,2 ngày');
  });

  it('leaves an issued invoice alone', async () => {
    const { api, db, stay, invoice } = await setup();
    const gao = stay('NT-0043');
    await api.staff.invoices.issue(gao.invoice_id!, invoice(gao.invoice_id!).version);
    const before = JSON.stringify([invoice(gao.invoice_id!), db.read().t.invoice_lines.filter((l) => l.invoice_id === gao.invoice_id)]);
    expect(await api.staff.inpatient.discharge(gao.id, gao.version, {})).toEqual({ days: 1.2, invoiceUpdated: false });
    expect(JSON.stringify([invoice(gao.invoice_id!), db.read().t.invoice_lines.filter((l) => l.invoice_id === gao.invoice_id)])).toBe(before);
    expect(db.read().t.audit_events.at(-1)!.summary_vi).toBe('BS. Phạm Thanh Mai cho xuất viện NT-0043');
  });

  it('does not re-add a day line staff removed', async () => {
    const { api, stay, invoice, lines } = await setup();
    const kem = stay('NT-0044');
    await api.staff.invoices.updateDraft(kem.invoice_id!, invoice(kem.invoice_id!).version, { lines: [{ price_item_id: 'pi-KB06', pet_id: 'pet-kem', qty: 1 }] });
    expect((await api.staff.inpatient.discharge(kem.id, kem.version, {})).invoiceUpdated).toBe(false);
    expect(lines(kem.invoice_id!).map((l) => l.price_item_id)).toEqual(['pi-KB06']);
  });

  it('finds the day line after the draft was re-saved with another day item', async () => {
    const { api, stay, invoice, lines } = await setup();
    const mochi = stay('NT-0039');
    await api.staff.invoices.updateDraft(mochi.invoice_id!, invoice(mochi.invoice_id!).version, { lines: [{ price_item_id: 'pi-LT03', pet_id: 'pet-mochi', qty: 4 }, { price_item_id: 'pi-TH02', pet_id: 'pet-mochi', qty: 1 }] });
    expect(await api.staff.inpatient.discharge(mochi.id, mochi.version, {})).toEqual({ days: 4.2, invoiceUpdated: true });
    expect(lines(mochi.invoice_id!).find((l) => l.price_item_id === 'pi-LT03')).toMatchObject({ qty: 4.2, line_total: 1050000 });
  });

  it('a 2,2-day line survives updateDraft with whole-đồng totals', async () => {
    const { api, stay, invoice, lines, draftLines } = await setup();
    const miu = stay('NT-0041');
    await api.staff.inpatient.discharge(miu.id, miu.version, {});
    await api.staff.invoices.updateDraft(miu.invoice_id!, invoice(miu.invoice_id!).version, { lines: await draftLines(miu.invoice_id!) });
    expect(lines(miu.invoice_id!).find((l) => l.price_item_id === 'pi-LT01')).toMatchObject({ qty: 2.2, line_total: 330000 });
    expect(Number.isInteger(invoice(miu.invoice_id!).subtotal)).toBe(true);
  });

  it('honours a chosen discharge time and refuses one before admission or in the future', async () => {
    const { api, db, stay } = await setup();
    const lu = stay('NT-0040');
    const before = JSON.stringify(db.read().t);
    for (const [discharged_at, message] of [
      ['2026-10-16T09:00:00+07:00', 'Thời điểm xuất viện không được trước lúc nhập viện.'],
      ['2026-10-19T15:00:00+07:00', 'Thời điểm xuất viện không được sau bây giờ.'],
    ]) {
      const err = await api.staff.inpatient.discharge(lu.id, lu.version, { discharged_at }).catch((e) => e);
      expect(err).toBeInstanceOf(ValidationError);
      expect((err as ValidationError).fields.discharged_at).toBe(message);
    }
    expect(JSON.stringify(db.read().t)).toBe(before);
    expect(await api.staff.inpatient.discharge(lu.id, lu.version, { discharged_at: '2026-10-19T09:45:00+07:00' })).toEqual({ days: 3, invoiceUpdated: true });
    expect(stay('NT-0040').discharged_at).toBe('2026-10-19T09:45:00+07:00');
  });

  it('turns the farewell into a "Sẵn sàng về nhà" entry, shared only with inpatient.share', async () => {
    const { api, db, stay } = await setup('bacsi_duc');
    const text = 'Mochi đã khỏe và sẵn sàng về nhà. Cảm ơn gia đình đã tin tưởng Lê Sơn!';
    const mochi = stay('NT-0039');
    await api.staff.inpatient.discharge(mochi.id, mochi.version, { farewell: { text, share: true } });
    const newest = (stayId: string) => db.read().t.diary_entries.filter((e) => e.stay_id === stayId).at(-1)!;
    expect(newest(mochi.id)).toMatchObject({ text, status: 'shared', shared_by: 'stf-duc', general_status: 'ready_home', category: 'tinh_than', part_of_day: 'chieu' });

    db.transact('test', (d) => { Object.assign(d.t.staff_users.find((u) => u.id === 'stf-ngocanh')!, { preset_ids: [], extra_capabilities: ['inpatient.view', 'inpatient.admit'] }); });
    await loginAs(api, 'spa_ngocanh');
    const kem = stay('NT-0044');
    await api.staff.inpatient.discharge(kem.id, kem.version, { farewell: { text: 'Kem đã sẵn sàng về nhà.', share: true } });
    expect(newest(kem.id)).toMatchObject({ status: 'draft', shared_by: undefined, author_id: 'stf-ngocanh' });

    await loginAs(api, 'bacsi_mai');
    const gao = stay('NT-0043');
    const count = db.read().t.diary_entries.length;
    await api.staff.inpatient.discharge(gao.id, gao.version, { farewell: { text: '   ', share: true } });
    expect(db.read().t.diary_entries).toHaveLength(count);
  });

  it('exposes billing on the stay view', async () => {
    const { api, stay } = await setup();
    const miu = stay('NT-0041');
    expect((await api.staff.inpatient.getStay(miu.id)).billing).toEqual({ invoiceId: miu.invoice_id, invoiceCode: expect.stringMatching(/^HD-/), status: 'draft', dayItemName: 'Nội trú mèo', dayPrice: 150000, dayQty: 2 });
    const plain = await api.staff.inpatient.admit({ pet_id: 'pet-dau', cage_id: 'cage-C5', reason_internal: 'Theo dõi' });
    expect((await api.staff.inpatient.getStay(plain)).billing).toBeUndefined();
    const empty = await api.staff.inpatient.admit({ pet_id: 'pet-tom', cage_id: 'cage-C6', reason_internal: 'Theo dõi', invoice: {} });
    const b = (await api.staff.inpatient.getStay(empty)).billing!;
    expect(b.status).toBe('draft');
    expect(b.dayItemName).toBeUndefined();
  });
});
