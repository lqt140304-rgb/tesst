import { describe, expect, it } from 'vitest';
import { loginAs, makeTestApi } from '../../testing';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../../../contracts/errors';
import { MSG } from '../../../rules/validation';
import { currentActor } from '../../guard';
import { PET_MSG } from '../../../rules/pet';

describe('staff customers', () => {
  it('lists and searches customers accent-insensitively', async () => {
    const { api } = makeTestApi();
    await loginAs(api, 'spa_ngocanh');
    expect(await api.staff.customers.list()).toHaveLength(18);
    expect((await api.staff.customers.list('nguyen thi lan')).map((c) => c.code)).toEqual(['KH-0001']);
    expect((await api.staff.customers.list('Sói')).map((c) => c.code)).toEqual(['KH-0008']);
  });

  it('list rows carry the amount owed, an inpatient marker and the nearest appointment', async () => {
    const { api } = makeTestApi();
    await loginAs(api, 'quanly_ha');
    const rows = await api.staff.customers.list();
    const open = [...(await api.staff.invoices.list({ state: 'unpaid' })), ...(await api.staff.invoices.list({ state: 'partial' }))];
    for (const r of rows) expect(r.outstanding, r.code).toBe(open.filter((i) => i.customerId === r.id).reduce((n, i) => n + i.remaining, 0));
    expect(rows.some((r) => r.outstanding > 0)).toBe(true);
    const board = await api.staff.inpatient.board();
    const owners = new Set(board.flatMap((t) => (t.stay ? [t.stay.ownerName] : [])));
    expect(new Set(rows.filter((r) => r.inpatient).map((r) => r.full_name))).toEqual(owners);
    const lan = rows.find((r) => r.code === 'KH-0001')!;
    expect(lan.nearestAppointment).toBeDefined();
    expect(typeof lan.nearestAppointment!.upcoming).toBe('boolean');
  });

  it('record shows pets with alerts, appointments and linked account', async () => {
    const { api } = makeTestApi();
    await loginAs(api, 'bacsi_mai');
    const c = await api.staff.customers.get('cus-01');
    expect(c.pets.map((p) => p.name).sort()).toEqual(['Bông', 'Miu']);
    expect(c.linkedAccount?.username).toBe('lan_nguyen');
    expect(c.appointments.length).toBeGreaterThan(0);
    const huy = await api.staff.customers.get('cus-08');
    expect(huy.pets[0]!.alerts).toEqual(['Có thể cắn — cần rọ mõm']);
  });

  it('creates a customer and a pet; spa cannot', async () => {
    const { api } = makeTestApi();
    await loginAs(api, 'bacsi_duc');
    const id = await api.staff.customers.create({ full_name: 'Lê Văn Mới', phone: '0911 222 333' });
    const petId = await api.staff.customers.createPet(id, { name: 'Bơ Nhỏ', species: 'dog', breed: 'Chó ta' });
    const c = await api.staff.customers.get(id);
    expect(c.code).toBe('KH-0019');
    expect(c.pets.map((p) => p.id)).toEqual([petId]);
    await expect(api.staff.customers.create({ full_name: '', phone: '1' })).rejects.toThrow(ValidationError);
    await loginAs(api, 'spa_ngocanh');
    await expect(api.staff.customers.create({ full_name: 'X', phone: '0911 222 334' })).rejects.toThrow(ForbiddenError);
  });
});

describe('staff web-account linking', () => {
  it('findByLinkCode is case-insensitive and trims', async () => {
    const { api } = makeTestApi();
    await loginAs(api, 'quanly_ha');
    const found = await api.staff.accounts.findByLinkCode('  ls-7k2q ');
    expect(found?.account.username).toBe('minh_khoa');
    expect(found?.webPets.map((p) => p.name)).toEqual(['Gạo']);
    expect(found?.phoneMatches.map((c) => c.code)).toEqual(['KH-0006']);
    expect(await api.staff.accounts.findByLinkCode('LS-AAAA')).toBeNull();
  });

  it('link requires confirmation', async () => {
    const { api } = makeTestApi();
    await loginAs(api, 'quanly_ha');
    await expect(api.staff.accounts.link('acc-minh_khoa', { customer_id: 'cus-06', pet_matches: [], method: 'in_person_app', confirmed: false as never })).rejects.toThrow(ValidationError);
  });

  it('link creates the link and pet links atomically with a sensitive audit entry', async () => {
    const { api, db } = makeTestApi();
    await loginAs(api, 'quanly_ha');
    await api.staff.accounts.link('acc-minh_khoa', { customer_id: 'cus-06', pet_matches: [{ account_pet_id: 'apet-gao', pet_id: 'pet-gao' }], method: 'in_person_app', method_note: 'Khách đưa mã tại quầy', confirmed: true });
    const t = db.read().t;
    const link = t.account_links.find((l) => l.account_id === 'acc-minh_khoa')!;
    expect(link.customer_id).toBe('cus-06');
    expect(t.pet_links).toEqual([expect.objectContaining({ account_pet_id: 'apet-gao', pet_id: 'pet-gao', link_id: link.id })]);
    expect(t.audit_events.some((e) => e.action === 'account.link' && e.entity_id === 'acc-minh_khoa' && e.sensitive)).toBe(true);
    await loginAs(api, 'minh_khoa');
    expect(currentActor(db, api.auth.current())).toMatchObject({ customerId: 'cus-06' });
  });

  it('a pet match must belong to the account and the customer', async () => {
    const { api } = makeTestApi();
    await loginAs(api, 'quanly_ha');
    await expect(api.staff.accounts.link('acc-minh_khoa', { customer_id: 'cus-06', pet_matches: [{ account_pet_id: 'apet-bap', pet_id: 'pet-gao' }], method: 'in_person_app', confirmed: true })).rejects.toThrow(ValidationError);
  });

  it('cannot link an account that is already linked', async () => {
    const { api } = makeTestApi();
    await loginAs(api, 'quanly_ha');
    await expect(api.staff.accounts.link('acc-lan_nguyen', { customer_id: 'cus-01', pet_matches: [], method: 'in_person_app', confirmed: true })).rejects.toThrow('Tài khoản này đã được liên kết.');
  });

  it('a doctor cannot link', async () => {
    const { api } = makeTestApi();
    await loginAs(api, 'bacsi_duc');
    await expect(api.staff.accounts.findByLinkCode('LS-7K2Q')).rejects.toThrow(ForbiddenError);
    await expect(api.staff.accounts.link('acc-minh_khoa', { customer_id: 'cus-06', pet_matches: [], method: 'in_person_app', confirmed: true })).rejects.toThrow(ForbiddenError);
  });

  it('lists web accounts with link state', async () => {
    const { api } = makeTestApi();
    await loginAs(api, 'quanly_ha');
    const unlinked = await api.staff.accounts.list({ linked: false });
    expect(unlinked.map((a) => a.username).sort()).toEqual(['maianh_do', 'minh_khoa']);
  });

  it('createPet keeps weight, colour, neutered and the internal note, and refuses a bad weight', async () => {
    const { api, db } = makeTestApi();
    await loginAs(api, 'bacsi_duc');
    const id = await api.staff.customers.createPet('cus-01', { name: 'Kẹo', species: 'dog', weight_kg: 3.5, color: 'Nâu', neutered: true, note_internal: 'Sợ máy sấy' });
    expect(db.read().t.pets.find((p) => p.id === id)).toMatchObject({ weight_kg: 3.5, color: 'Nâu', neutered: true, note_internal: 'Sợ máy sấy', version: 1 });
    await expect(api.staff.customers.createPet('cus-01', { name: 'Kẹo', species: 'dog', weight_kg: 0 })).rejects.toThrow(PET_MSG.weight);
    expect(db.read().t.pets.filter((p) => p.name === 'Kẹo')).toHaveLength(1);
  });

  describe('edit customers and pets', () => {
    it('updates a customer, bumps the version, and a stale version is refused', async () => {
      const { api, db } = makeTestApi();
      await loginAs(api, 'bacsi_duc');
      await api.staff.customers.update('cus-01', 1, { full_name: ' Nguyễn Thị Lan B ', phone: '0912 345 678', address: '', note_internal: 'Gọi sau 17h' });
      expect(db.read().t.customers.find((c) => c.id === 'cus-01')).toMatchObject({ full_name: 'Nguyễn Thị Lan B', phone_e164: '+84912345678', address: undefined, note_internal: 'Gọi sau 17h', version: 2 });
      expect(db.read().t.audit_events.at(-1)).toMatchObject({ action: 'customer.update', summary_vi: 'BS. Trần Minh Đức cập nhật hồ sơ KH-0001' });
      await expect(api.staff.customers.update('cus-01', 1, { full_name: 'X', phone: '0912345678' })).rejects.toThrow(ConflictError);
      const err = await api.staff.customers.update('cus-01', 2, { full_name: '', phone: '123' }).catch((e) => e);
      expect(err.fields).toEqual({ full_name: 'Vui lòng nhập họ tên khách hàng.', phone: MSG.phoneInvalid });
      expect(db.read().t.customers.find((c) => c.id === 'cus-01')!.version).toBe(2);
    });

    it('updates a pet (weight shows on get), keeps the photo, and leaves an existing stay alone', async () => {
      const { api, db } = makeTestApi();
      await loginAs(api, 'bacsi_duc');
      await api.staff.customers.updatePet('pet-miu', 1, { name: 'Miu', species: 'cat', weight_kg: 4.6, color: 'Trắng' });
      const miu = (await api.staff.customers.get('cus-01')).pets.find((p) => p.id === 'pet-miu')!;
      expect(miu).toMatchObject({ weight_kg: 4.6, color: 'Trắng', version: 2, photoKey: 'meo-trang-ngu', code: 'TC-0001' });
      expect(db.read().t.stays.find((s) => s.code === 'NT-0041')!.day_price_item_id).toBe('pi-LT01');
      expect(db.read().t.audit_events.at(-1)!.action).toBe('pet.update');
      await expect(api.staff.customers.updatePet('pet-miu', 1, { name: 'Miu', species: 'cat' })).rejects.toThrow(ConflictError);
      await expect(api.staff.customers.updatePet('pet-miu', 2, { name: 'Miu', species: 'cat', weight_kg: 0 })).rejects.toThrow(PET_MSG.weight);
      await expect(api.staff.customers.updatePet('pet-none', 1, { name: 'A', species: 'cat' })).rejects.toThrow(NotFoundError);
    });

    it('only people with customers.edit may write, and nothing is written when refused', async () => {
      const { api, db } = makeTestApi();
      const snap = () => JSON.stringify([db.read().t.customers, db.read().t.pets]); // a staff login itself writes an audit row
      const before = snap();
      for (const who of ['spa_ngocanh', 'lan_nguyen']) {
        await loginAs(api, who);
        await expect(api.staff.customers.update('cus-01', 1, { full_name: 'X', phone: '0912345678' })).rejects.toThrow(ForbiddenError);
        await expect(api.staff.customers.updatePet('pet-miu', 1, { name: 'X', species: 'cat' })).rejects.toThrow(ForbiddenError);
      }
      expect(snap()).toBe(before);
    });

    it('finds customers by phone however it is written, except the one being edited', async () => {
      const { api } = makeTestApi();
      await loginAs(api, 'spa_ngocanh');
      for (const p of ['0900000001', '0900 000 001', '+84 900000001']) expect(await api.staff.customers.findByPhone(p)).toEqual([{ id: 'cus-01', code: 'KH-0001', full_name: 'Nguyễn Thị Lan' }]);
      expect(await api.staff.customers.findByPhone('0900000001', 'cus-01')).toEqual([]);
      expect(await api.staff.customers.findByPhone('12')).toEqual([]);
    });

    it('the table row carries the pets with their photos', async () => {
      const { api } = makeTestApi();
      await loginAs(api, 'spa_ngocanh');
      expect((await api.staff.customers.list('lan'))[0]!.pets).toEqual([
        { id: 'pet-miu', name: 'Miu', species: 'cat', photoKey: 'meo-trang-ngu' }, { id: 'pet-bong', name: 'Bông', species: 'dog', photoKey: 'cho-poodle-xe' },
      ]);
    });
  });
});
