import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { open } from './helpers';

const FIXTURE = readFileSync(new URL('./fixtures/tiny.webm', import.meta.url));

type Demo = {
  api: {
    staff: { inpatient: { videos: { deviceUploadAvailable(): Promise<boolean>; upload(stayId: string, input: unknown): Promise<string> } } };
    media: { local(key: string): Promise<{ video: Blob; poster?: Blob } | null> };
  };
  blobKeys(): Promise<string[]>;
  cleanOrphans(): Promise<number>;
  reset(): Promise<void>;
};

/** Device videos really live in IndexedDB: kept across reloads, given a poster, dropped by "Khôi phục dữ liệu mẫu". */
test('a device video survives a reload and is removed by reset @desktop-only', async ({ page }) => {
  await open(page, '/nv/noi-tru', { as: 'bacsi_mai' });
  const uploaded = await page.evaluate(async (bytes) => {
    const d = (window as unknown as { __lesonDemo: Demo }).__lesonDemo;
    const available = await d.api.staff.inpatient.videos.deviceUploadAvailable();
    const file = new Blob([new Uint8Array(bytes)], { type: 'video/webm' });
    const id = await d.api.staff.inpatient.videos.upload('stay-NT-0041', { source: { kind: 'device', file }, duration_s: 1, caption: 'Miu tập đi' });
    const got = await d.api.media.local(`local:${id}`);
    return { available, key: `local:${id}`, size: got?.video.size, posterType: got?.poster?.type, keys: await d.blobKeys() };
  }, [...FIXTURE]);
  expect(uploaded).toMatchObject({ available: true, size: FIXTURE.length, posterType: 'image/jpeg' });
  expect(uploaded.keys).toContain(uploaded.key);

  await page.reload();
  await page.waitForFunction(() => '__lesonDemo' in window);
  const afterReload = await page.evaluate(async (key) => {
    const d = (window as unknown as { __lesonDemo: Demo }).__lesonDemo;
    const removed = await d.cleanOrphans();
    return { removed, size: (await d.api.media.local(key))?.video.size };
  }, uploaded.key);
  expect(afterReload).toEqual({ removed: 0, size: FIXTURE.length });

  const keysAfterReset = await page.evaluate(async () => {
    const d = (window as unknown as { __lesonDemo: Demo }).__lesonDemo;
    await d.reset();
    return d.blobKeys();
  });
  expect(keysAfterReset).toEqual([]);
});
