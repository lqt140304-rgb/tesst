/** Device video (owner, 22/10/2026): any video file up to 100 MB; it always plays without sound and only its first 15 seconds (the real server cuts the file, the demo just stops playing). */
export const VIDEO_MAX_BYTES = 100 * 1024 * 1024;
export const VIDEO_CLIP_SECONDS = 15;
/** @deprecated the old name for the clip length; a longer video is no longer refused. */
export const VIDEO_MAX_SECONDS = VIDEO_CLIP_SECONDS;
export const VIDEO_CAPTION_MAX = 120;

/** Wording of the "Tải video lên" dialog, built from the constants so it cannot drift from the rules. */
export const VIDEO_LIMITS_TEXT = `MP4, MOV, WebM · tối đa ${VIDEO_MAX_BYTES / 1024 / 1024} MB · chủ nuôi xem ${VIDEO_CLIP_SECONDS} giây đầu, không có âm thanh`;
export const VIDEO_TRIM_NOTE = `Video dài hơn ${VIDEO_CLIP_SECONDS} giây: chủ nuôi chỉ xem ${VIDEO_CLIP_SECONDS} giây đầu.`;
export const VIDEO_DEMO_NOTE = `Bản demo: video tải từ máy phát tắt tiếng và dừng ở giây ${VIDEO_CLIP_SECONDS}; bản chính thức sẽ loại bỏ âm thanh và cắt tệp khi tải lên.`;

/** media_key of a file kept only in this browser: "local:<video id>". */
export const isLocalKey = (key: string) => key.startsWith('local:');

export const VIDEO_MSG = {
  notVideo: 'Tệp này không phải video. Bạn chọn tệp MP4, MOV hoặc WebM nhé.',
  tooBig: 'Video lớn hơn 100 MB. Bạn chọn video khác nhé.',
  storage: 'Trình duyệt này không lưu được video. Bạn dùng video mẫu nhé.',
} as const;

/** The first problem with a device file, or null. The length is never a problem: a longer video is cut, not refused. */
export function videoFileProblem(file: { type: string; size: number }): string | null {
  if (!file.type.startsWith('video/')) return VIDEO_MSG.notVideo;
  if (file.size > VIDEO_MAX_BYTES) return VIDEO_MSG.tooBig;
  return null;
}

/** Where playback stops: the first 15 seconds at most; `trimmed` when the real length is longer. A length nobody could read (0, odd) plays up to 15 and is not called cut. */
export function clipOf(duration_s: number): { clip_end_s: number; trimmed: boolean } {
  if (!Number.isFinite(duration_s) || duration_s <= 0) return { clip_end_s: VIDEO_CLIP_SECONDS, trimmed: false };
  return { clip_end_s: Math.min(duration_s, VIDEO_CLIP_SECONDS), trimmed: duration_s > VIDEO_CLIP_SECONDS };
}
