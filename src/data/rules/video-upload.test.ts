import { describe, expect, it } from 'vitest';
import { VIDEO_CLIP_SECONDS, VIDEO_DEMO_NOTE, VIDEO_LIMITS_TEXT, VIDEO_MAX_BYTES, VIDEO_TRIM_NOTE, clipOf, videoFileProblem } from './video-upload';

describe('video upload checks (owner, 22/10: a long video is cut, not refused; the file may be up to 100 MB)', () => {
  it('the limits', () => {
    expect(VIDEO_MAX_BYTES).toBe(100 * 1024 * 1024);
    expect(VIDEO_CLIP_SECONDS).toBe(15);
  });
  it('accepts a video of any length up to 100 MB', () => {
    expect(videoFileProblem({ type: 'video/quicktime', size: VIDEO_MAX_BYTES })).toBeNull();
    expect(videoFileProblem({ type: 'video/mp4', size: 50 * 1024 * 1024 })).toBeNull();
    expect(videoFileProblem({ type: 'video/webm', size: 10 })).toBeNull();
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

describe('upload dialog wording (owner, 22/10: up to 100 MB, always muted, viewers see the first 15 seconds)', () => {
  it('says the real limits, built from the constants', () => {
    expect(VIDEO_LIMITS_TEXT).toBe('MP4, MOV, WebM · tối đa 100 MB · chủ nuôi xem 15 giây đầu, không có âm thanh');
    expect(VIDEO_TRIM_NOTE).toBe('Video dài hơn 15 giây: chủ nuôi chỉ xem 15 giây đầu.');
    expect(VIDEO_DEMO_NOTE).toBe('Bản demo: video tải từ máy phát tắt tiếng và dừng ở giây 15; bản chính thức sẽ loại bỏ âm thanh và cắt tệp khi tải lên.');
    expect(VIDEO_MAX_BYTES / 1024 / 1024).toBe(100);
    expect(VIDEO_CLIP_SECONDS).toBe(15);
  });
  it('never mentions the old limits', () => {
    for (const t of [VIDEO_LIMITS_TEXT, VIDEO_TRIM_NOTE, VIDEO_DEMO_NOTE]) expect(t).not.toMatch(/20 MB|tối đa 15 giây/);
  });
});
