import { describe, expect, it } from 'vitest';
import { loginAs, makeTestApi } from '../../testing';
import { ForbiddenError, ValidationError } from '../../../contracts/errors';
import type { AdmitInput } from '../../../contracts/staff';

describe('admission queries', () => {
  it('lists free cages, doctors, day items and today\'s appointments', async () => {
    const { api } = makeTestApi();
    await loginAs(api, 'bacsi_mai');
    const o = await api.staff.inpatient.admitOptions();
    expect(o.cages.map((c) => c.code)).toEqual(['C2', 'C5', 'C6', 'M1', 'M3', 'R1', 'R2']);
    expect(o.cages.find((c) => c.code === 'M1')).toEqual({ id: 'cage-M1', code: 'M1', zone: 'Khu mèo', species_hint: 'cat' });
    expect(o.doctors.map((d) => d.name)).toEqual(['BS. Trần Minh Đức', 'BS. Phạm Thanh Mai']);
    expect(o.dayItems).toEqual([
      { id: 'pi-LT01', code: 'LT01', name: 'Nội trú mèo', price: 150000 },
      { id: 'pi-LT02', code: 'LT02', name: 'Nội trú chó dưới 15 kg', price: 180000 },
      { id: 'pi-LT03', code: 'LT03', name: 'Nội trú chó từ 15 kg', price: 250000 },
    ]);
    const names = o.today.map((t) => t.pet.name);
    expect(names).toEqual(expect.arrayContaining(['Bin', 'Mập', 'Mít']));
    expect(names).not.toContain('Miu');
    expect(o.today.every((t) => t.start_at.startsWith('2026-10-19'))).toBe(true);
    expect(o.today.find((t) => t.pet.name === 'Bin')!.draftInvoice).toBeUndefined();
  });

  it('offers the draft invoice of today\'s appointment', async () => {
    const { api } = makeTestApi();
    await loginAs(api, 'bacsi_mai');
    const map = (await api.staff.inpatient.admitOptions()).today.find((t) => t.pet.name === 'Mập')!;
    const inv = await api.staff.invoices.createDraft({ customer_id: 'cus-16', pet_ids: ['pet-map'], source_type: 'appointment', source_id: map.appointmentId });
    const again = (await api.staff.inpatient.admitOptions()).today.find((t) => t.pet.name === 'Mập')!;
    expect(again.draftInvoice?.id).toBe(inv);
    expect(again.draftInvoice?.code).toMatch(/^HD-\d{4}$/);
  });

  it('finds pets by pet name, owner name or phone', async () => {
    const { api } = makeTestApi();
    await loginAs(api, 'bacsi_mai');
    expect((await api.staff.inpatient.findPets('lan')).map((p) => [p.name, p.inpatient])).toEqual([['Miu', true], ['Bông', false]]);
    expect((await api.staff.inpatient.findPets('0900000001')).map((p) => p.name)).toEqual(['Miu', 'Bông']);
    expect(await api.staff.inpatient.findPets('kem')).toEqual([expect.objectContaining({ id: 'pet-kem', name: 'Kem', species: 'dog', weight_kg: 12, inpatient: true, suggestedDayItemId: 'pi-LT02', ownerName: 'Phạm Thu Thủy' })]);
    expect((await api.staff.inpatient.findPets('tôm'))[0]!.suggestedDayItemId).toBeUndefined();
    expect(await api.staff.inpatient.findPets('  ')).toEqual([]);
  });

  it('needs inpatient.admit', async () => {
    const { api } = makeTestApi();
    await loginAs(api, 'quanly_ha');
    await api.staff.inpatient.admitOptions();
    await loginAs(api, 'lan_nguyen');
    await expect(api.staff.inpatient.admitOptions()).rejects.toThrow(ForbiddenError);
    await expect(api.staff.inpatient.findPets('kem')).rejects.toThrow(ForbiddenError);
  });
});

describe('admit', () => {
  const todayApt = (db: ReturnType<typeof makeTestApi>['db'], petId: string) => db.read().t.appointments.find((a) => a.pet_id === petId && a.start_at.startsWith('2026-10-19'))!;

  it('creates a stay draft with a 0,1-day line', async () => {
    const { api, db } = makeTestApi();
    await loginAs(api, 'bacsi_mai');
    const id = await api.staff.inpatient.admit({ pet_id: 'pet-bin', cage_id: 'cage-M1', reason_internal: 'Theo dõi nôn', initial_status: 'stable', invoice: { day_price_item_id: 'pi-LT01' } });
    const s = db.read().t.stays.find((x) => x.id === id)!;
    expect(s).toMatchObject({ internal_status: 'stable', doctor_id: 'stf-mai', day_price_item_id: 'pi-LT01' });
    const inv = db.read().t.invoices.find((i) => i.id === s.invoice_id)!;
    expect(inv).toMatchObject({ status: 'draft', source_type: 'stay', source_id: id, pet_ids: ['pet-bin'], customer_id: 'cus-09', subtotal: 15000, total: 15000 });
    expect(db.read().t.invoice_lines.filter((l) => l.invoice_id === inv.id)).toEqual([expect.objectContaining({ price_item_id: 'pi-LT01', qty: 0.1, line_total: 15000, pet_id: 'pet-bin' })]);
  });

  it('"Chưa ghi tiền nội trú" makes an empty draft; no invoice when unticked', async () => {
    const { api, db } = makeTestApi();
    await loginAs(api, 'bacsi_mai');
    const tomId = await api.staff.inpatient.admit({ pet_id: 'pet-tom', cage_id: 'cage-C2', reason_internal: 'Theo dõi hô hấp', invoice: {} });
    const s = db.read().t.stays.find((x) => x.id === tomId)!;
    expect(s.day_price_item_id).toBeUndefined();
    expect(s.internal_status).toBe('watch');
    expect(db.read().t.invoices.find((i) => i.id === s.invoice_id)).toMatchObject({ status: 'draft', source_type: 'stay', source_id: tomId, total: 0 });
    expect(db.read().t.invoice_lines.filter((l) => l.invoice_id === s.invoice_id)).toEqual([]);
    const invoices = db.read().t.invoices.length;
    const dauId = await api.staff.inpatient.admit({ pet_id: 'pet-dau', cage_id: 'cage-C5', reason_internal: 'Theo dõi sau mổ' });
    expect(db.read().t.stays.find((x) => x.id === dauId)!.invoice_id).toBeUndefined();
    expect(db.read().t.invoices).toHaveLength(invoices);
  });

  it('adds the day line to the appointment draft instead of a new invoice', async () => {
    const { api, db } = makeTestApi();
    await loginAs(api, 'bacsi_mai');
    const apt = todayApt(db, 'pet-map');
    const draft = await api.staff.invoices.createDraft({ customer_id: 'cus-16', pet_ids: ['pet-map'], source_type: 'appointment', source_id: apt.id });
    const invoices = db.read().t.invoices.length;
    const id = await api.staff.inpatient.admit({ pet_id: 'pet-map', cage_id: 'cage-M3', reason_internal: 'Theo dõi sau khám', appointment_id: apt.id, invoice: { day_price_item_id: 'pi-LT01' } });
    expect(db.read().t.invoices).toHaveLength(invoices);
    expect(db.read().t.stays.find((x) => x.id === id)).toMatchObject({ invoice_id: draft, appointment_id: apt.id });
    expect(db.read().t.invoice_lines.filter((l) => l.invoice_id === draft).map((l) => l.price_item_id)).toEqual(['pi-LT01']);
    expect(db.read().t.invoices.find((i) => i.id === draft)!.total).toBe(15000);
  });

  it('refuses busy cage, staying pet, non-doctor, past expected date, foreign appointment, bad day item — and writes nothing', async () => {
    const { api, db } = makeTestApi();
    await loginAs(api, 'bacsi_mai');
    const base = { pet_id: 'pet-dau', cage_id: 'cage-C5', reason_internal: 'Theo dõi' };
    const bad: [Partial<AdmitInput>, string, string][] = [
      [{ cage_id: 'cage-C1' }, 'cage_id', 'Chuồng này đang có bé ở.'],
      [{ pet_id: 'pet-miu' }, 'pet_id', 'Bé đang nội trú.'],
      [{ doctor_id: 'stf-ngocanh' }, 'doctor_id', 'Bạn chọn bác sĩ phụ trách nhé.'],
      [{ expected_discharge_at: '2026-10-18T10:00:00+07:00' }, 'expected_discharge_at', 'Ngày dự kiến xuất viện không được trước hôm nay.'],
      [{ appointment_id: todayApt(db, 'pet-bin').id }, 'appointment_id', 'Lịch hẹn này không phải của bé.'],
      [{ invoice: { day_price_item_id: 'pi-LT04' } }, 'day_price_item_id', 'Mục tiền nội trú không hợp lệ.'],
    ];
    const before = JSON.stringify(db.read().t);
    for (const [patch, field, message] of bad) {
      const err = await api.staff.inpatient.admit({ ...base, ...patch }).catch((e) => e);
      expect(err, field).toBeInstanceOf(ValidationError);
      expect((err as ValidationError).fields[field]).toBe(message);
    }
    expect(JSON.stringify(db.read().t)).toBe(before);
    await api.staff.inpatient.admit({ ...base, expected_discharge_at: '2026-10-19T17:00:00+07:00' });
  });

  it('spa admits with a doctor and a draft; without a doctor it is refused', async () => {
    const { api, db } = makeTestApi();
    await loginAs(api, 'spa_ngocanh');
    const err = await api.staff.inpatient.admit({ pet_id: 'pet-dau', cage_id: 'cage-C5', reason_internal: 'Gửi nội trú' }).catch((e) => e);
    expect((err as ValidationError).fields.doctor_id).toBe('Bạn chọn bác sĩ phụ trách nhé.');
    const id = await api.staff.inpatient.admit({ pet_id: 'pet-dau', cage_id: 'cage-C5', doctor_id: 'stf-duc', reason_internal: 'Gửi nội trú', invoice: {} });
    const s = db.read().t.stays.find((x) => x.id === id)!;
    expect(s).toMatchObject({ doctor_id: 'stf-duc', admitted_by: 'stf-ngocanh' });
    expect(db.read().t.invoices.find((i) => i.id === s.invoice_id)!.status).toBe('draft');
  });
});
