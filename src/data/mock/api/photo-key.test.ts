import { describe, expect, it } from 'vitest';
import { loginAs, makeTestApi } from '../testing';

/** Redesign §5.3: pets carry a photo key (not a URL); every pet the UI shows passes it on as photoKey. */
describe('pet photo keys', () => {
  it('seeds photos on the pets that match them', () => {
    const { db } = makeTestApi();
    const keyed = db.read().t.pets.filter((p) => p.photo_key).map((p) => [p.id, p.photo_key]);
    expect(keyed).toEqual([
      ['pet-miu', 'meo-trang-ngu'], ['pet-bong', 'poodle-nau-xe'], ['pet-kem', 'cho-vang'], ['pet-mochi', 'poodle-nau-chuong'],
      ['pet-gao', 'meo-tam-the'], ['pet-mit', 'pom-trang'], ['pet-na', 'meo-trang-gang-tay'], ['pet-muop', 'meo-muop'],
    ]);
    expect(db.read().t.account_pets.find((p) => p.id === 'apet-gao')!.photo_key).toBe('meo-tam-the');
  });

  it('customers get photoKey on pet cards and stay cards', async () => {
    const { api } = makeTestApi();
    await loginAs(api, 'thuy_pham');
    expect((await api.customer.pets.list()).find((p) => p.name === 'Kem')!.photoKey).toBe('cho-vang');
    expect((await api.customer.pets.get('pet-kem')).pet.photoKey).toBe('cho-vang');
    expect((await api.customer.stays.list()).current[0]).toMatchObject({ petName: 'Kem', photoKey: 'cho-vang' });
    expect((await api.customer.overview()).activeStays[0]!.photoKey).toBe('cho-vang');
    await loginAs(api, 'minh_khoa');
    expect((await api.customer.pets.list()).find((p) => p.name === 'Gạo')!.photoKey).toBe('meo-tam-the');
    await loginAs(api, 'lan_nguyen');
    expect((await api.customer.pets.list()).map((p) => [p.name, p.photoKey])).toEqual([['Miu', 'meo-trang-ngu'], ['Bông', 'poodle-nau-xe']]);
  });

  it('staff get photoKey on customer pets, cages, stays, appointments and admission search', async () => {
    const { api } = makeTestApi();
    await loginAs(api, 'quanly_ha');
    expect((await api.staff.customers.get('cus-02')).pets.find((p) => p.id === 'pet-kem')!.photoKey).toBe('cho-vang');
    expect((await api.staff.inpatient.board()).find((c) => c.stay?.petName === 'Kem')!.stay!.photoKey).toBe('cho-vang');
    expect((await api.staff.inpatient.getStay('stay-NT-0043')).photoKey).toBe('meo-tam-the');
    const appts = await api.staff.appointments.listRange('2026-10-23', '2026-10-23');
    expect(appts.find((a) => a.petName === 'Kem')!.photoKey).toBe('cho-vang');
    expect((await api.staff.inpatient.findPets('mướp'))[0]!.photoKey).toBe('meo-muop');
  });
});
