import { describe, expect, it } from 'vitest';
import type { AdmitOptions, AdmitPetOption } from '@/data/staff';
import { admitSummary, canAdvance, dayItemNote, orderCages, stepOfField, type AdmitDraft } from './admitSteps';

const kem = { id: 'pet-kem', name: 'Kem', species: 'dog', weight_kg: 12, ownerName: 'A', ownerPhone: '0', inpatient: false } as AdmitPetOption;
const draft = (o: Partial<AdmitDraft> = {}): AdmitDraft => ({ reason: '', status: 'watch', expected: '', invoice: true, ...o });
const opts: Pick<AdmitOptions, 'cages' | 'doctors' | 'dayItems'> = {
  cages: [{ id: 'cage-C4', code: 'C4', zone: 'Khu chó', species_hint: 'dog' }],
  doctors: [{ id: 'stf-mai', name: 'Mai', title: 'Bác sĩ' }],
  dayItems: [{ id: 'pi-LT01', code: 'LT01', name: 'Nội trú mèo', price: 150000 }],
};

describe('canAdvance', () => {
  it('step 1 needs a pet that is not already in a cage', () => {
    expect(canAdvance(1, draft())).toBe(false);
    expect(canAdvance(1, draft({ pet: { ...kem, inpatient: true } }))).toBe(false);
    expect(canAdvance(1, draft({ pet: kem }))).toBe(true);
  });
  it('step 2 needs a cage and a reason with text', () => {
    expect(canAdvance(2, draft({ cageId: 'cage-C4', reason: '   ' }))).toBe(false);
    expect(canAdvance(2, draft({ reason: 'Theo dõi' }))).toBe(false);
    expect(canAdvance(2, draft({ cageId: 'cage-C4', reason: 'Theo dõi' }))).toBe(true);
  });
  it('step 3 can always confirm', () => expect(canAdvance(3, draft())).toBe(true));
});

describe('stepOfField', () => {
  it('sends an error back to the step that owns the field', () => {
    expect(stepOfField('pet_id')).toBe(1);
    for (const f of ['cage_id', 'reason_internal', 'expected_discharge_at', 'doctor_id', 'initial_status']) expect(stepOfField(f)).toBe(2);
    for (const f of ['day_price_item_id', 'invoice', 'something_else']) expect(stepOfField(f)).toBe(3);
  });
});

describe('admitSummary', () => {
  const full = draft({ pet: kem, cageId: 'cage-C4', doctorId: 'stf-mai', invoice: true, dayItemId: 'pi-LT01' });
  it('names the pet, cage, doctor and what will be billed', () => {
    expect(admitSummary(full, opts)).toBe('Kem · chuồng C4 · Mai · hóa đơn nháp có Nội trú mèo');
  });
  it('says so when there is no invoice or no day line', () => {
    expect(admitSummary({ ...full, invoice: false }, opts)).toBe('Kem · chuồng C4 · Mai · không tạo hóa đơn');
    expect(admitSummary({ ...full, dayItemId: undefined }, opts)).toBe('Kem · chuồng C4 · Mai · hóa đơn nháp, chưa ghi tiền nội trú');
  });
});

describe('dayItemNote', () => {
  it('explains a missing weight', () => {
    expect(dayItemNote(draft({ pet: { ...kem, weight_kg: undefined } }))).toBe('Hồ sơ bé chưa có cân nặng nên chưa ghi tiền nội trú.');
  });
  it('says the charge joins the draft of the chosen appointment', () => {
    const appointment = { draftInvoice: { id: 'x', code: 'HD-1028' } } as never;
    expect(dayItemNote(draft({ pet: kem, appointment }))).toBe('Thêm vào hóa đơn nháp HD-1028 của lịch hẹn');
  });
  it('has nothing to add otherwise', () => expect(dayItemNote(draft({ pet: kem, dayItemId: 'pi-LT02' }))).toBeUndefined());
});

describe('orderCages', () => {
  const cages: AdmitOptions['cages'] = [
    { id: 'm1', code: 'M1', zone: 'Khu mèo', species_hint: 'cat' }, { id: 'c2', code: 'C2', zone: 'Khu chó', species_hint: 'dog' },
    { id: 'r1', code: 'R1', zone: 'Khu riêng', species_hint: 'any' }, { id: 'c5', code: 'C5', zone: 'Khu chó', species_hint: 'dog' },
  ];
  it('puts the zones that fit the species first and keeps cage order inside a zone', () => {
    const g = orderCages(cages, 'dog');
    expect(g.map((x) => [x.zone, x.fit])).toEqual([['Khu chó', true], ['Khu riêng', true], ['Khu mèo', false]]);
    expect(g[0]!.cages.map((c) => c.code)).toEqual(['C2', 'C5']);
  });
});
