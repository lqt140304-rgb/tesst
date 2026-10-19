import { describe, expect, it } from 'vitest';
import { loginAs, makeTestApi } from '../../testing';
import { NotFoundError, ValidationError } from '../../../contracts/errors';

describe('customer zone additions', () => {
  it('a web pet is created with a note, edited and removed', async () => {
    const { api } = makeTestApi();
    await loginAs(api, 'minh_khoa');
    const id = await api.customer.pets.create({ name: 'Na', species: 'cat', note: 'Bé nhát người lạ' });
    expect((await api.customer.pets.list()).find((p) => p.id === id)).toMatchObject({ name: 'Na', note: 'Bé nhát người lạ', source: 'web' });
    await api.customer.pets.update(id, { name: 'Na Na', species: 'cat', breed: 'Mèo ta', birth_year: 2024, note: '' });
    const pet = (await api.customer.pets.list()).find((p) => p.id === id)!;
    expect(pet).toMatchObject({ name: 'Na Na', breed: 'Mèo ta', birthYear: 2024 });
    expect(pet.note).toBeUndefined();
    await expect(api.customer.pets.update(id, { name: ' ', species: 'cat' })).rejects.toThrow(ValidationError);
    await api.customer.pets.remove(id);
    expect((await api.customer.pets.list()).some((p) => p.id === id)).toBe(false);
  });

  it('hospital pets and other accounts’ pets cannot be edited or removed', async () => {
    const { api } = makeTestApi();
    await loginAs(api, 'lan_nguyen');
    await expect(api.customer.pets.update('pet-miu', { name: 'X', species: 'cat' })).rejects.toThrow(NotFoundError);
    await expect(api.customer.pets.remove('pet-miu')).rejects.toThrow(NotFoundError);
    await expect(api.customer.pets.remove('apet-gao')).rejects.toThrow(NotFoundError);
  });

  it('an active stay card carries the latest shared diary line without clock times', async () => {
    const { api } = makeTestApi();
    await loginAs(api, 'lan_nguyen');
    const o = await api.customer.overview();
    const miu = o.activeStays.find((s) => s.petName === 'Miu')!;
    expect(miu.latestText).toEqual(expect.any(String));
    expect(miu.latestText).not.toMatch(/\d{1,2}:\d{2}/);
  });

  it('overview reports seen cards per account, link date and account age', async () => {
    const { api } = makeTestApi();
    await loginAs(api, 'lan_nguyen');
    let o = await api.customer.overview();
    expect(o.seen).toEqual([]);
    expect(o.linkedAt).toEqual(expect.any(String));
    expect(o.accountCreatedAt).toEqual(expect.any(String));
    await api.customer.markSeen('welcome');
    await api.customer.markSeen('welcome');
    o = await api.customer.overview();
    expect(o.seen).toEqual(['welcome']);
    await loginAs(api, 'minh_khoa');
    o = await api.customer.overview();
    expect(o.seen).toEqual([]);
    expect(o.linkedAt).toBeUndefined();
  });
});
