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
