import { describe, expect, it } from 'vitest';
import { loginAs, makeTestApi } from '../../testing';
import { ConflictError, ForbiddenError, ValidationError } from '../../../contracts/errors';
import type { PriceInput } from '../../../contracts/staff';

const fixed: PriceInput = { category: 'exam', name: 'Siêu âm', unit: 'lần', price_mode: 'fixed', price: 250000 };
const fields = async (p: Promise<unknown>) => ((await p.catch((e) => e)) as ValidationError).fields;

async function setup(as = 'quanly_ha') {
  const t = makeTestApi();
  await loginAs(t.api, as);
  const row = (id: string) => t.db.read().t.price_items.find((p) => p.id === id)!;
  return { ...t, row };
}

describe('price list writes', () => {
  it('adds a fixed item with a generated code; a reference price is dropped', async () => {
    const { api, row, db } = await setup();
    const id = await api.staff.prices.create({ ...fixed, reference_price: 999 });
    expect(row(id)).toMatchObject({ code: 'KB10', customer_group: 'itemized', price: 250000, price_mode: 'fixed', reference_price: undefined, active: true, version: 1, updated_by: 'stf-ha' });
    expect(db.read().t.audit_events.at(-1)!.action).toBe('price.create');
    const id2 = await api.staff.prices.create({ ...fixed, name: 'X-quang' });
    expect(row(id2).code).toBe('KB11');
  });

  it('an open item stores no price but keeps its reference price; medicine is shown to customers as treatment', async () => {
    const { api, row } = await setup();
    const id = await api.staff.prices.create({ category: 'medicine', name: 'Thuốc bôi da', unit: 'tuýp', price_mode: 'open', price: 5, reference_price: 80000, customer_group: 'itemized' });
    expect(row(id)).toMatchObject({ code: 'TH07', price: 0, reference_price: 80000, customer_group: 'treatment' });
    const exam = await api.staff.prices.create({ category: 'exam', name: 'Thủ thuật nhỏ', unit: 'lần', price_mode: 'open', customer_group: 'treatment' });
    expect(row(exam).customer_group).toBe('treatment');
  });

  it('checks the fields with the exact messages', async () => {
    const { api, db } = await setup();
    const count = db.read().t.price_items.length;
    expect((await fields(api.staff.prices.create({ ...fixed, name: '  ' }))).name).toBe('Vui lòng nhập tên mục.');
    expect((await fields(api.staff.prices.create({ ...fixed, name: 'tắm sấy MÈO', category: 'spa' }))).name).toBe('Mục này đã có trong bảng giá.');
    expect((await fields(api.staff.prices.create({ ...fixed, unit: ' ' }))).unit).toBe('Vui lòng nhập đơn vị, ví dụ: lần, mũi, ngày.');
    for (const price of [0, -5, 1.5, undefined]) expect((await fields(api.staff.prices.create({ ...fixed, price }))).price).toBe('Giá cần là số từ 1 ₫ trở lên.');
    expect((await fields(api.staff.prices.create({ ...fixed, price_mode: 'open', reference_price: 0 }))).reference_price).toBe('Giá tham khảo cần là số từ 1 ₫ trở lên.');
    expect(db.read().t.price_items).toHaveLength(count);
  });

  it('update changes the item but never the lines already on invoices', async () => {
    const { api, db, row } = await setup();
    const draft = db.read().t.invoices.find((i) => i.status === 'draft')!;
    const issued = db.read().t.invoices.find((i) => i.status === 'issued' && db.read().t.invoice_lines.some((l) => l.invoice_id === i.id && l.price_item_id === 'pi-KB01'))!;
    const before = JSON.stringify(db.read().t.invoice_lines.filter((l) => l.price_item_id === 'pi-KB01'));
    await api.staff.prices.update('pi-KB01', 1, { category: 'exam', name: 'Khám lâm sàng tổng quát', unit: 'lần', price_mode: 'fixed', price: 180000 });
    expect(row('pi-KB01')).toMatchObject({ name: 'Khám lâm sàng tổng quát', price: 180000, version: 2, code: 'KB01' });
    expect(JSON.stringify(db.read().t.invoice_lines.filter((l) => l.price_item_id === 'pi-KB01'))).toBe(before);
    expect([draft.status, issued.status]).toEqual(['draft', 'issued']);
    expect((await fields(api.staff.prices.update('pi-KB01', 2, { ...fixed, category: 'spa' }))).category).toBe('Không đổi được danh mục của mục này.');
    await expect(api.staff.prices.update('pi-KB01', 1, { ...fixed, name: 'Khác' })).rejects.toThrow(ConflictError);
  });

  it('only pricelist.edit may write; everyone on staff can still read', async () => {
    const { api } = await setup('bacsi_duc');
    await expect(api.staff.prices.create(fixed)).rejects.toThrow(ForbiddenError);
    await expect(api.staff.prices.update('pi-KB01', 1, fixed)).rejects.toThrow(ForbiddenError);
    await expect(api.staff.prices.setActive('pi-KB01', 1, false)).rejects.toThrow(ForbiddenError);
    expect((await api.staff.prices.list()).length).toBeGreaterThan(20);
    expect((await api.staff.prices.list()).find((p) => p.code === 'KB09')).toMatchObject({ reference_price: 200000, version: 1 });
  });

  it('a switched-off item is refused on new draft lines but a draft that already holds it still saves', async () => {
    const { api, db } = await setup();
    const stayDraft = (code: string) => db.read().t.invoices.find((i) => i.id === db.read().t.stays.find((s) => s.code === code)!.invoice_id)!;
    const inv = stayDraft('NT-0041'); // Miu's draft: LT01, KB06, KB07, TH01, TH05
    const detail = await api.staff.invoices.get(inv.id);
    const lines = detail.lines.map((l) => ({ price_item_id: l.price_item_id, pet_id: l.pet_id, qty: l.qty, unit_price: l.unit_price }));
    await api.staff.prices.setActive('pi-TH05', 1, false);
    expect(db.read().t.audit_events.at(-1)!.action).toBe('price.deactivate');
    await api.staff.invoices.updateDraft(inv.id, detail.version, { lines });
    const other = stayDraft('NT-0044');
    const err = await fields(api.staff.invoices.updateDraft(other.id, other.version, { lines: [{ price_item_id: 'pi-TH05', qty: 1 }] }));
    expect(err['lines.0']).toBe('Mục "Giảm đau đường uống" đã ngừng dùng. Bạn chọn mục khác nhé.');
    await api.staff.prices.setActive('pi-TH05', 2, true);
    expect(db.read().t.audit_events.at(-1)!.action).toBe('price.activate');
  });

  it('the inpatient day items stay on and fixed', async () => {
    const { api, row } = await setup();
    expect((await fields(api.staff.prices.setActive('pi-LT01', 1, false))).active).toBe('Mục này dùng để tính tiền nội trú nên không tắt được.');
    expect((await fields(api.staff.prices.update('pi-LT01', 1, { category: 'inpatient', name: 'Nội trú mèo', unit: 'ngày', price_mode: 'open' }))).price_mode).toBe('Mục này dùng để tính tiền nội trú nên phải giữ giá cố định.');
    await api.staff.prices.update('pi-LT01', 1, { category: 'inpatient', name: 'Nội trú mèo (phòng riêng)', unit: 'ngày', price_mode: 'fixed', price: 160000 });
    expect(row('pi-LT01')).toMatchObject({ name: 'Nội trú mèo (phòng riêng)', price: 160000, version: 2 });
  });

  it('Final C1: editing a procedure without customer_group keeps it folded for customers (R7)', async () => {
    const { api, row } = await setup();
    expect(row('pi-KB06').customer_group).toBe('treatment');
    await api.staff.prices.update('pi-KB06', 1, { category: 'exam', name: 'Truyền dịch', unit: 'lần', price_mode: 'fixed', price: 130000 });
    expect(row('pi-KB06')).toMatchObject({ customer_group: 'treatment', price: 130000 });
    await api.staff.prices.update('pi-KB06', 2, { category: 'exam', name: 'Truyền dịch', unit: 'lần', price_mode: 'fixed', price: 130000, customer_group: 'itemized' });
    expect(row('pi-KB06').customer_group).toBe('itemized'); // choosing it explicitly still works
  });

  it('Final I1: saving a draft again keeps each line\'s name, unit, group and price from when it was added', async () => {
    const { api, db } = await setup();
    const stay = db.read().t.stays.find((x) => x.code === 'NT-0041')!;
    const lineOf = () => db.read().t.invoice_lines.filter((l) => l.invoice_id === stay.invoice_id && l.price_item_id === 'pi-KB06');
    const was = { ...lineOf()[0]! };
    await api.staff.prices.update('pi-KB06', 1, { category: 'exam', name: 'Tên mới', unit: 'gói', price_mode: 'fixed', price: 999000 });
    const resave = async (withPrice: boolean) => {
      const d = await api.staff.invoices.get(stay.invoice_id!);
      const lines = d.lines.map((l) => ({ price_item_id: l.price_item_id, pet_id: l.pet_id, qty: l.qty, ...(withPrice ? { unit_price: l.unit_price } : {}) }));
      await api.staff.invoices.updateDraft(stay.invoice_id!, d.version, { lines });
    };
    for (const withPrice of [true, false]) {
      await resave(withPrice);
      expect(lineOf()[0]).toMatchObject({ name_snapshot: was.name_snapshot, unit_snapshot: was.unit_snapshot, customer_group_snapshot: was.customer_group_snapshot, category_snapshot: was.category_snapshot, unit_price: was.unit_price, line_total: was.line_total });
    }
    // A line added after the edit takes the item's current values.
    const d = await api.staff.invoices.get(stay.invoice_id!);
    await api.staff.invoices.updateDraft(stay.invoice_id!, d.version, { lines: [...d.lines.map((l) => ({ price_item_id: l.price_item_id, pet_id: l.pet_id, qty: l.qty, unit_price: l.unit_price })), { price_item_id: 'pi-KB02', qty: 1 }] });
    expect(db.read().t.invoice_lines.find((l) => l.invoice_id === stay.invoice_id && l.price_item_id === 'pi-KB02')).toMatchObject({ name_snapshot: 'Tái khám', unit_price: 100000 });
  });

  it('M1: a switched-off item already on a draft cannot get a second line', async () => {
    const { api, db } = await setup();
    const stay = db.read().t.stays.find((x) => x.code === 'NT-0041')!;
    const d = await api.staff.invoices.get(stay.invoice_id!);
    const keep = d.lines.map((l) => ({ price_item_id: l.price_item_id, pet_id: l.pet_id, qty: l.qty, unit_price: l.unit_price }));
    await api.staff.prices.setActive('pi-TH05', 1, false);
    const err = await fields(api.staff.invoices.updateDraft(stay.invoice_id!, d.version, { lines: [...keep, { price_item_id: 'pi-TH05', pet_id: 'pet-miu', qty: 5 }] }));
    expect(err[`lines.${keep.length}`]).toBe('Mục "Giảm đau đường uống" đã ngừng dùng. Bạn chọn mục khác nhé.');
    await api.staff.invoices.updateDraft(stay.invoice_id!, d.version, { lines: keep }); // the existing line alone still saves
  });

  it('M2: update does not silently ignore a changed active flag', async () => {
    const { api, row } = await setup();
    const same = { category: 'exam' as const, name: 'Tái khám', unit: 'lần', price_mode: 'fixed' as const, price: 100000 };
    expect((await fields(api.staff.prices.update('pi-KB02', 1, { ...same, active: false }))).active).toBe('Dùng nút bật/tắt để đổi trạng thái mục này.');
    expect(row('pi-KB02')).toMatchObject({ active: true, version: 1 });
    await api.staff.prices.update('pi-KB02', 1, { ...same, active: true }); // same value is fine
    expect(row('pi-KB02').version).toBe(2);
  });

  it('M5: names that differ only by extra spaces are duplicates', async () => {
    const { api } = await setup();
    expect((await fields(api.staff.prices.create({ ...fixed, name: ' Tái   khám ' }))).name).toBe('Mục này đã có trong bảng giá.');
  });
});
