import { describe, expect, it } from 'vitest';
import { captionHints, readVideoDuration } from './videoProbe';

describe('captionHints', () => {
  it('suggests three different short messages, the first about the sun', () => {
    const hints = captionHints('Miu');
    expect(hints[0]).toBe('Miu sưởi nắng buổi sáng');
    expect(new Set(hints).size).toBe(3);
    for (const h of hints) expect(h.length).toBeLessThanOrEqual(120);
  });
});

describe('readVideoDuration', () => {
  it('gives 0 (unknown) when there is no video element to ask, instead of throwing', async () => {
    await expect(readVideoDuration(new Blob(['x'], { type: 'video/webm' }), 50)).resolves.toBe(0);
  });
});
