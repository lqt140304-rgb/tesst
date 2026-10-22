import { describe, expect, it } from 'vitest';
import { loginAs, makeTestApi } from '../testing';
import { ForbiddenError, NotFoundError } from '../../contracts/errors';
import { cleanOrphanBlobs } from './media';

/** A device video of Miu (shared with Lan), stored as "local:<id>". */
async function withLocalVideo(id = 'video-L1') {
  const t = makeTestApi();
  t.db.transact('test', (d) => {
    const v2 = d.t.videos.find((v) => v.id === 'video-V2')!;
    d.t.videos.push({ ...v2, id, media_key: `local:${id}` });
  });
  await t.media.put(`local:${id}`, new Blob(['x'], { type: 'video/webm' }));
  return t;
}

describe('media api', () => {
  it('staff read local files; demo keys and deleted videos give null', async () => {
    const { api, db } = await withLocalVideo();
    await loginAs(api, 'bacsi_mai');
    expect((await api.media.local('local:video-L1'))!.video.size).toBe(1);
    expect(await api.media.local('demo:v1-mieu-an-sang')).toBeNull();
    db.transact('test', (d) => { d.t.videos.find((v) => v.id === 'video-L1')!.deleted_at = '2026-10-19T08:00:00+07:00'; });
    expect(await api.media.local('local:video-L1')).toBeNull();
  });

  it('a customer reads only files of videos shared with them', async () => {
    const { api, db } = await withLocalVideo();
    await expect(api.media.local('local:video-L1')).rejects.toThrow(ForbiddenError);
    await loginAs(api, 'lan_nguyen');
    expect((await api.media.local('local:video-L1'))!.video.size).toBe(1);
    await loginAs(api, 'thuy_pham');
    await expect(api.media.local('local:video-L1')).rejects.toThrow(NotFoundError);
    db.transact('test', (d) => { d.t.videos.find((v) => v.id === 'video-L1')!.share_status = 'draft'; });
    await loginAs(api, 'lan_nguyen');
    await expect(api.media.local('local:video-L1')).rejects.toThrow(NotFoundError);
  });

  it('auto-delete removes the local file', async () => {
    const { api, media, setNow } = await withLocalVideo();
    setNow('2026-12-30T09:00:00+07:00');
    expect(api.system.purgeExpiredVideos()).toBeGreaterThan(0);
    expect(await media.keys()).toEqual([]);
  });

  it('deleting a video removes its local file', async () => {
    const { api, media } = await withLocalVideo();
    await loginAs(api, 'bacsi_mai');
    await api.staff.inpatient.videos.delete('video-L1');
    expect(await media.keys()).toEqual([]);
  });

  it('restoring the demo data removes every local file', async () => {
    const { api, media } = await withLocalVideo();
    await api.system.resetDemo();
    expect(await media.keys()).toEqual([]);
  });

  it('cleanOrphanBlobs removes files whose video is gone', async () => {
    const { db, media } = await withLocalVideo();
    await media.put('local:ghost', new Blob(['g']));
    expect(await cleanOrphanBlobs(db, media)).toBe(1);
    expect(await media.keys()).toEqual(['local:video-L1']);
  });
});

describe('featured pictures', () => {
  const png = () => new Blob(['x'], { type: 'image/png' });
  async function withPicture(visible = true) {
    const t = makeTestApi();
    await loginAs(t.api, 'quanly_ha');
    await t.api.staff.content.products.setImage('fp-1', 1, png());
    const key = t.db.read().t.featured_products.find((p) => p.id === 'fp-1')!.image_key!;
    if (!visible) await t.api.staff.content.products.setVisible('fp-1', 2, false);
    else await t.api.staff.content.products.setVisible('fp-1', 2, true);
    await t.api.auth.logout();
    return { ...t, key };
  }

  it('a shown picture is served to a signed-out visitor, a customer and any staff member', async () => {
    const { api, key } = await withPicture();
    expect((await api.media.local(key))!.video.size).toBe(1);
    await loginAs(api, 'lan_nguyen');
    expect((await api.media.local(key))!.video.size).toBe(1);
    await loginAs(api, 'spa_ngocanh');
    expect((await api.media.local(key))!.video.size).toBe(1);
  });

  it('a hidden picture is served only to staff who may publish', async () => {
    const { api, key } = await withPicture(false);
    await expect(api.media.local(key)).rejects.toThrow(NotFoundError);
    await loginAs(api, 'lan_nguyen');
    await expect(api.media.local(key)).rejects.toThrow(NotFoundError);
    await loginAs(api, 'spa_ngocanh');
    await expect(api.media.local(key)).rejects.toThrow(NotFoundError);
    await loginAs(api, 'bacsi_duc');
    expect((await api.media.local(key))!.video.size).toBe(1);
  });

  it('a picture key no item carries is NotFound for the public and null for a publisher', async () => {
    const { api } = await withPicture();
    await expect(api.media.local('local:img-nothing')).rejects.toThrow(NotFoundError);
    await loginAs(api, 'quanly_ha');
    expect(await api.media.local('local:img-nothing')).toBeNull();
  });

  it('cleanOrphanBlobs keeps the pictures of every item, hidden ones too, and drops unattached ones', async () => {
    const { db, media, api, key } = await withPicture(false);
    await media.put('local:img-stray', png());
    expect(await cleanOrphanBlobs(db, media)).toBe(1);
    expect(await media.keys()).toEqual([key]);
    expect(api).toBeDefined();
  });
});
