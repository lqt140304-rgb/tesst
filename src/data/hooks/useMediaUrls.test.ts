import { describe, expect, it } from 'vitest';
import { resolveLocalMedia } from './useMediaUrls';

const toUrl = (b: Blob) => `blob:${b.type}`;

describe('resolveLocalMedia', () => {
  it('makes urls for the video and its poster', async () => {
    const r = await resolveLocalMedia('local:x', async () => ({ video: new Blob([], { type: 'video/webm' }), poster: new Blob([], { type: 'image/jpeg' }) }), toUrl);
    expect(r).toEqual({ urls: { mp4: 'blob:video/webm', poster: 'blob:image/jpeg', thumb: 'blob:image/jpeg' }, created: ['blob:video/webm', 'blob:image/jpeg'] });
  });
  it('works without a poster', async () => {
    const r = await resolveLocalMedia('local:x', async () => ({ video: new Blob([], { type: 'video/mp4' }) }), toUrl);
    expect(r).toEqual({ urls: { mp4: 'blob:video/mp4', poster: undefined, thumb: undefined }, created: ['blob:video/mp4'] });
  });
  it('reports a missing file as null', async () => {
    expect(await resolveLocalMedia('local:x', async () => null, toUrl)).toBeNull();
  });
});
