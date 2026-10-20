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
