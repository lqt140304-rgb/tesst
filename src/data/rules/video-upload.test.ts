import { describe, expect, it } from 'vitest';
import { VIDEO_MAX_BYTES, videoFileProblem } from './video-upload';

describe('video upload checks', () => {
  it('accepts videos up to 20 MB and 15 seconds', () => {
    expect(videoFileProblem({ type: 'video/quicktime', size: VIDEO_MAX_BYTES }, 15)).toBeNull();
    expect(videoFileProblem({ type: 'video/webm', size: 10 }, 0)).toBeNull();
    expect(videoFileProblem({ type: 'video/mp4', size: 10 })).toBeNull();
  });
  it('names the first problem', () => {
    expect(videoFileProblem({ type: 'image/png', size: 10 })).toBe('Tệp này không phải video. Bạn chọn tệp MP4, MOV hoặc WebM nhé.');
    expect(videoFileProblem({ type: '', size: 10 })).toBe('Tệp này không phải video. Bạn chọn tệp MP4, MOV hoặc WebM nhé.');
    expect(videoFileProblem({ type: 'video/mp4', size: VIDEO_MAX_BYTES + 1 })).toBe('Video lớn hơn 20 MB. Bạn cắt ngắn hoặc chọn video khác nhé.');
    expect(videoFileProblem({ type: 'video/webm', size: 10 }, 15.4)).toBe('Video dài hơn 15 giây. Bạn cắt ngắn hoặc chọn video khác nhé.');
  });
});
