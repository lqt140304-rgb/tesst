import { describe, expect, it } from 'vitest';
import { VIDEO_CLIP_SECONDS, VIDEO_MAX_BYTES, clipOf, videoFileProblem } from './video-upload';

describe('video upload checks (owner, 22/10: a long video is cut, not refused; the file may be up to 100 MB)', () => {
  it('the limits', () => {
    expect(VIDEO_MAX_BYTES).toBe(100 * 1024 * 1024);
    expect(VIDEO_CLIP_SECONDS).toBe(15);
  });
  it('accepts a video of any length up to 100 MB', () => {
    expect(videoFileProblem({ type: 'video/quicktime', size: VIDEO_MAX_BYTES }, 15)).toBeNull();
    expect(videoFileProblem({ type: 'video/mp4', size: 50 * 1024 * 1024 }, 3600)).toBeNull();
    expect(videoFileProblem({ type: 'video/webm', size: 10 }, 0)).toBeNull();
    expect(videoFileProblem({ type: 'video/mp4', size: 10 })).toBeNull();
  });
  it('names the first problem: not a video, or bigger than 100 MB', () => {
    expect(videoFileProblem({ type: 'image/png', size: 10 })).toBe('Tệp này không phải video. Bạn chọn tệp MP4, MOV hoặc WebM nhé.');
    expect(videoFileProblem({ type: '', size: 10 })).toBe('Tệp này không phải video. Bạn chọn tệp MP4, MOV hoặc WebM nhé.');
    expect(videoFileProblem({ type: 'video/mp4', size: VIDEO_MAX_BYTES + 1 })).toBe('Video lớn hơn 100 MB. Bạn chọn video khác nhé.');
  });
});

describe('clipOf', () => {
  it('plays at most the first 15 seconds and says when it was cut', () => {
    expect(clipOf(40)).toEqual({ clip_end_s: 15, trimmed: true });
    expect(clipOf(16)).toEqual({ clip_end_s: 15, trimmed: true });
    expect(clipOf(15)).toEqual({ clip_end_s: 15, trimmed: false });
    expect(clipOf(10)).toEqual({ clip_end_s: 10, trimmed: false });
  });
  it('an unknown length (0, missing, odd) plays up to 15 seconds and is not called cut', () => {
    for (const d of [0, undefined, NaN, -3, Infinity]) expect(clipOf(d as never)).toEqual({ clip_end_s: 15, trimmed: false });
  });
});
