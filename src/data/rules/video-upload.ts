/** Device video limits (R25 + redesign §3.2): video files only, ≤ 20 MB, ≤ 15 seconds. */
export const VIDEO_MAX_BYTES = 20 * 1024 * 1024;
export const VIDEO_MAX_SECONDS = 15;
export const VIDEO_CAPTION_MAX = 120;

/** media_key of a file kept only in this browser: "local:<video id>". */
export const isLocalKey = (key: string) => key.startsWith('local:');

export const VIDEO_MSG = {
  notVideo: 'Tệp này không phải video. Bạn chọn tệp MP4, MOV hoặc WebM nhé.',
  tooBig: 'Video lớn hơn 20 MB. Bạn cắt ngắn hoặc chọn video khác nhé.',
  tooLong: 'Video dài hơn 15 giây. Bạn cắt ngắn hoặc chọn video khác nhé.',
  storage: 'Trình duyệt này không lưu được video. Bạn dùng video mẫu nhé.',
} as const;

/** The first problem with a device file, or null. A duration the browser could not read (0 / absent) passes. */
export function videoFileProblem(file: { type: string; size: number }, duration_s?: number): string | null {
  if (!file.type.startsWith('video/')) return VIDEO_MSG.notVideo;
  if (file.size > VIDEO_MAX_BYTES) return VIDEO_MSG.tooBig;
  if (duration_s && duration_s > VIDEO_MAX_SECONDS) return VIDEO_MSG.tooLong;
  return null;
}
