import { describe, expect, it } from 'vitest';
import { memoryBlobStore } from './blobs';

describe('memory blob store', () => {
  it('keeps, lists and removes files', async () => {
    const s = memoryBlobStore();
    expect(await s.available()).toBe(true);
    await s.put('local:a', new Blob(['x'], { type: 'video/webm' }));
    expect((await s.get('local:a'))!.video.size).toBe(1);
    expect(await s.get('local:b')).toBeNull();
    expect(await s.keys()).toEqual(['local:a']);
    void s.remove(['local:a']);
    expect(await s.keys()).toEqual([]); // removal is immediate
    await s.put('local:c', new Blob(['y']));
    await s.clear();
    expect(await s.keys()).toEqual([]);
  });
  it('can pretend storage is unavailable', async () => {
    expect(await memoryBlobStore({ available: false }).available()).toBe(false);
  });
});
