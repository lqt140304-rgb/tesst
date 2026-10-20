import { describe, expect, it } from 'vitest';
import { loginAs, makeTestApi } from '../../testing';
import { ForbiddenError } from '../../../contracts/errors';

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
