import { describe, expect, it } from 'vitest';
import { loginAs, makeTestApi, TEST_NOW } from '../../testing';
import { ForbiddenError, ValidationError } from '../../../contracts/errors';
import { memoryBlobStore } from '../../store/blobs';
import type { VideoUploadInput } from '../../../contracts/staff';

const webm = (bytes = 10) => new Blob([new Uint8Array(bytes)], { type: 'video/webm' });
const BOTH = { only_this_pet: true, no_people_or_private_info: true } as const;
const fields = async (p: Promise<unknown>) => ((await p.catch((e) => e)) as ValidationError).fields;

describe('video upload', () => {
  it('uploads a sample clip as a draft', async () => {
    const { api, db } = makeTestApi();
    await loginAs(api, 'spa_ngocanh');
    const id = await api.staff.inpatient.videos.upload('stay-NT-0044', { source: { kind: 'demo', key: 'demo:v4-kem-uong-nuoc' }, caption: ' Kem chơi bóng ', duration_s: 99 });
    const v = db.read().t.videos.find((x) => x.id === id)!;
    expect(v).toMatchObject({ media_key: 'demo:v4-kem-uong-nuoc', duration_s: 10, caption: 'Kem chơi bóng', share_status: 'draft', audio_removed: true, pet_id: 'pet-kem', customer_id: 'cus-02', uploaded_by: 'stf-ngocanh', uploaded_at: TEST_NOW, recorded_at: TEST_NOW });
    expect(v.expires_at).toBe('2026-12-18T09:00:00+07:00');
    expect(db.read().t.audit_events.at(-1)).toMatchObject({ action: 'video.upload', entity_id: id, summary_vi: 'Lê Ngọc Anh tải lên 1 video của Kem' });
  });

  it('uploads a device file, shares it, and the owner sees it with isLocal', async () => {
    const { api, db, media } = makeTestApi();
    await loginAs(api, 'bacsi_mai');
    const id = await api.staff.inpatient.videos.upload('stay-NT-0041', { source: { kind: 'device', file: webm() }, duration_s: 9.6, share: BOTH });
    const v = db.read().t.videos.find((x) => x.id === id)!;
    expect(v).toMatchObject({ media_key: `local:${id}`, duration_s: 10, share_status: 'shared', shared_by: 'stf-mai' });
    expect(await media.keys()).toEqual([`local:${id}`]);
    expect((await api.staff.inpatient.getStay('stay-NT-0041')).videos.find((x) => x.id === id)!.isLocal).toBe(true);
    expect((await api.staff.inpatient.getStay('stay-NT-0041')).videos.find((x) => x.id === 'video-V1')!.isLocal).toBe(false);
    await loginAs(api, 'lan_nguyen');
    const mine = (await api.customer.stays.get('stay-NT-0041')).videos;
    expect(mine[0]).toMatchObject({ id, isLocal: true, durationS: 10 });
    expect(mine.find((x) => x.id === 'video-V1')!.isLocal).toBe(false);
  });

  it('refuses wrong files, long videos, long captions, future times, unknown clips', async () => {
    const { api, db, media } = makeTestApi();
    await loginAs(api, 'bacsi_mai');
    const count = db.read().t.videos.length;
    const up = (input: VideoUploadInput) => fields(api.staff.inpatient.videos.upload('stay-NT-0041', input));
    expect((await up({ source: { kind: 'device', file: new Blob(['x'], { type: 'image/png' }) } })).file).toBe('Tệp này không phải video. Bạn chọn tệp MP4, MOV hoặc WebM nhé.');
    expect((await up({ source: { kind: 'device', file: webm(20 * 1024 * 1024 + 1) } })).file).toBe('Video lớn hơn 20 MB. Bạn cắt ngắn hoặc chọn video khác nhé.');
    expect((await up({ source: { kind: 'device', file: webm() }, duration_s: 16 })).file).toBe('Video dài hơn 15 giây. Bạn cắt ngắn hoặc chọn video khác nhé.');
    expect((await up({ source: { kind: 'demo', key: 'demo:v1-mieu-an-sang' }, caption: 'a'.repeat(121) })).caption).toBe('Lời nhắn tối đa 120 ký tự.');
    expect((await up({ source: { kind: 'demo', key: 'demo:v1-mieu-an-sang' }, recorded_at: '2026-10-19T10:00:00+07:00' })).recorded_at).toBe('Thời điểm quay không được sau bây giờ.');
    expect((await up({ source: { kind: 'demo', key: 'demo:nope' } })).source).toBe('Không tìm thấy video mẫu này.');
    expect(db.read().t.videos).toHaveLength(count);
    expect(await media.keys()).toEqual([]);
  });

  it('refuses sharing without inpatient.share or with one box', async () => {
    const { api, db } = makeTestApi();
    db.transact('test', (d) => { Object.assign(d.t.staff_users.find((u) => u.id === 'stf-ngocanh')!, { preset_ids: [], extra_capabilities: ['inpatient.view', 'inpatient.diary_write'] }); });
    await loginAs(api, 'spa_ngocanh');
    await expect(api.staff.inpatient.videos.upload('stay-NT-0044', { source: { kind: 'demo', key: 'demo:v4-kem-uong-nuoc' }, share: BOTH })).rejects.toThrow(ForbiddenError);
    await loginAs(api, 'bacsi_mai');
    const one = { only_this_pet: true, no_people_or_private_info: false } as unknown as typeof BOTH;
    expect((await fields(api.staff.inpatient.videos.upload('stay-NT-0044', { source: { kind: 'demo', key: 'demo:v4-kem-uong-nuoc' }, share: one }))).checks).toBe('Vui lòng kiểm tra đủ hai mục trước khi chia sẻ.');
  });

  it('says the browser cannot store videos when storage is unavailable', async () => {
    const { api } = makeTestApi(TEST_NOW, memoryBlobStore({ available: false }));
    await loginAs(api, 'bacsi_mai');
    expect(await api.staff.inpatient.videos.deviceUploadAvailable()).toBe(false);
    expect((await fields(api.staff.inpatient.videos.upload('stay-NT-0041', { source: { kind: 'device', file: webm() } }))).file).toBe('Trình duyệt này không lưu được video. Bạn dùng video mẫu nhé.');
    await api.staff.inpatient.videos.upload('stay-NT-0041', { source: { kind: 'demo', key: 'demo:v2-mieu-suoi-nang' } });
  });

  it('removes the stored file when the write fails', async () => {
    const { api, media } = makeTestApi();
    await loginAs(api, 'bacsi_mai');
    expect(await api.staff.inpatient.videos.deviceUploadAvailable()).toBe(true);
    await expect(api.staff.inpatient.videos.upload('stay-NT-0035', { source: { kind: 'device', file: webm() } })).rejects.toThrow('Bé đã xuất viện.');
    expect(await media.keys()).toEqual([]);
  });

  it('lists the sample clips', async () => {
    const { api } = makeTestApi();
    await loginAs(api, 'spa_ngocanh');
    const clips = await api.staff.inpatient.videos.demoClips();
    expect(clips).toHaveLength(6);
    expect(clips[0]).toEqual({ key: 'demo:v1-mieu-an-sang', label: 'Mèo ăn sáng', duration_s: 10 });
  });
});
