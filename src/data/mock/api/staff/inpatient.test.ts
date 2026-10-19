import { describe, expect, it } from 'vitest';
import { loginAs, makeTestApi } from '../../testing';
import { ForbiddenError, ValidationError } from '../../../contracts/errors';
import { purgeExpiredVideos } from './inpatient';

describe('staff inpatient', () => {
  it('board shows 12 cages, 5 occupied, and flags NT-0044 without a diary today', async () => {
    const { api } = makeTestApi();
    await loginAs(api, 'spa_ngocanh');
    const board = await api.staff.inpatient.board();
    expect(board).toHaveLength(12);
    expect(board.filter((c) => c.stay)).toHaveLength(5);
    const kem = board.find((c) => c.stay?.code === 'NT-0044')!.stay!;
    expect(kem).toMatchObject({ petName: 'Kem', diaryToday: false, ownerWeb: 'linked', internalStatus: 'watch' });
    expect(board.find((c) => c.stay?.code === 'NT-0040')!.stay!.ownerWeb).toBe('none');
    expect(board.find((c) => c.stay?.code === 'NT-0043')!.stay!.ownerWeb).toBe('unlinked');
  });

  it('spa getStay has no internal record keys', async () => {
    const { api } = makeTestApi();
    await loginAs(api, 'spa_ngocanh');
    const s = await api.staff.inpatient.getStay('stay-NT-0041');
    const json = JSON.stringify(s);
    for (const k of ['internal', 'care_orders', 'orders', 'administrations', 'notes', 'reason_internal']) expect(Object.keys(s)).not.toContain(k);
    expect(json).not.toContain('NaCl');
    expect(s.diary.length).toBeGreaterThan(0);
  });

  it('a doctor sees the internal record', async () => {
    const { api } = makeTestApi();
    await loginAs(api, 'bacsi_mai');
    const s = await api.staff.inpatient.getStay('stay-NT-0041');
    expect(s.internal!.orders.map((o) => o.item_name)).toContain('Dịch truyền NaCl 0,9%');
    expect(s.internal!.administrations.length).toBeGreaterThan(0);
  });

  it('spa can save a draft but cannot share', async () => {
    const { api, db } = makeTestApi();
    await loginAs(api, 'spa_ngocanh');
    const id = await api.staff.inpatient.diary.saveDraft('stay-NT-0044', { part_of_day: 'sang', category: 'an_uong', general_status: 'recovering', text: 'Kem ăn được nửa bát cháo.' });
    expect(db.read().t.diary_entries.find((e) => e.id === id)!.status).toBe('draft');
    await expect(api.staff.inpatient.diary.share(id)).rejects.toThrow(ForbiddenError);
    await loginAs(api, 'bacsi_duc');
    await api.staff.inpatient.diary.share(id);
    expect(db.read().t.diary_entries.find((e) => e.id === id)!).toMatchObject({ status: 'shared', shared_by: 'stf-duc' });
    await api.staff.inpatient.diary.withdraw(id);
    expect(db.read().t.diary_entries.find((e) => e.id === id)!.status).toBe('withdrawn');
  });

  it('a draft needs text', async () => {
    const { api } = makeTestApi();
    await loginAs(api, 'bacsi_duc');
    await expect(api.staff.inpatient.diary.saveDraft('stay-NT-0044', { part_of_day: 'sang', category: 'an_uong', general_status: 'stable', text: '  ' })).rejects.toThrow(ValidationError);
  });

  it('video share requires both checks', async () => {
    const { api, db } = makeTestApi();
    await loginAs(api, 'bacsi_mai');
    await expect(api.staff.inpatient.videos.share('video-V3', { only_this_pet: true, no_people_or_private_info: false } as never)).rejects.toThrow(ValidationError);
    await api.staff.inpatient.videos.share('video-V3', { only_this_pet: true, no_people_or_private_info: true });
    expect(db.read().t.videos.find((v) => v.id === 'video-V3')!.share_status).toBe('shared');
  });

  it('lint flags drug names and doses', async () => {
    const { api } = makeTestApi();
    await loginAs(api, 'bacsi_mai');
    expect(await api.staff.inpatient.diary.lint('Bé được truyền Dịch truyền NaCl 0,9% sáng nay')).toContain('Dịch truyền NaCl 0,9%');
    expect(await api.staff.inpatient.diary.lint('Tiêm 0,5 ml lúc 8 giờ')).toContain('0,5 ml');
    expect(await api.staff.inpatient.diary.lint('Bé ăn ngon và ngủ say')).toEqual([]);
  });

  it('records administrations and care notes; stops orders', async () => {
    const { api, db } = makeTestApi();
    await loginAs(api, 'bacsi_duc');
    await api.staff.inpatient.administrations.record('stay-NT-0044', { order_id: 'stay-NT-0044-o2', slot_time: '12:00' });
    expect(db.read().t.care_administrations.some((a) => a.order_id === 'stay-NT-0044-o2' && a.slot_time === '12:00')).toBe(true);
    await api.staff.inpatient.careNotes.create('stay-NT-0044', { type: 'observation', text: 'Phân đã thành khuôn.' });
    await api.staff.inpatient.orders.stop('stay-NT-0044-o2');
    expect(db.read().t.care_orders.find((o) => o.id === 'stay-NT-0044-o2')!.status).toBe('stopped');
    await loginAs(api, 'spa_ngocanh');
    await expect(api.staff.inpatient.careNotes.create('stay-NT-0044', { type: 'note', text: 'x' })).rejects.toThrow(ForbiddenError);
  });

  it('admits into a free cage and discharges', async () => {
    const { api, db } = makeTestApi();
    await loginAs(api, 'bacsi_mai');
    await expect(api.staff.inpatient.admit({ pet_id: 'pet-tom', cage_id: 'cage-C1', reason_internal: 'Theo dõi' })).rejects.toThrow('Chuồng này đang có bé ở.');
    const id = await api.staff.inpatient.admit({ pet_id: 'pet-tom', cage_id: 'cage-C2', reason_internal: 'Theo dõi hô hấp' });
    const s = db.read().t.stays.find((x) => x.id === id)!;
    expect(s.code).toBe('NT-0045');
    await api.staff.inpatient.discharge(id, s.version, {});
    expect(db.read().t.stays.find((x) => x.id === id)!.discharged_at).toBeTruthy();
  });

  it('purge deletes videos past 60 days and audits as Hệ thống', () => {
    const { db } = makeTestApi();
    const n = purgeExpiredVideos(db, new Date('2026-10-23T09:00:00+07:00'));
    expect(n).toBe(1);
    const v6 = db.read().t.videos.find((v) => v.id === 'video-V6')!;
    expect(v6.deleted_by).toBe('system');
    expect(db.read().t.audit_events.some((e) => e.entity_id === 'video-V6' && e.actor_name_snapshot === 'Hệ thống')).toBe(true);
  });
});
