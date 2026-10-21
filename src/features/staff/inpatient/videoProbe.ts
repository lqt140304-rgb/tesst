/** Length in seconds (one decimal) of a video file as the browser reads it; 0 when it cannot be read in time ("—" on screen). */
export function readVideoDuration(file: Blob, timeoutMs = 3000): Promise<number> {
  if (typeof document === 'undefined') return Promise.resolve(0);
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    let done = false;
    const finish = (seconds: number) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      video.removeAttribute('src');
      video.load();
      URL.revokeObjectURL(url);
      resolve(seconds);
    };
    const timer = setTimeout(() => finish(0), timeoutMs);
    video.preload = 'metadata';
    video.muted = true;
    video.onloadedmetadata = () => finish(Number.isFinite(video.duration) ? Math.round(video.duration * 10) / 10 : 0);
    video.onerror = () => finish(0);
    video.src = url;
  });
}

/** Three short messages staff can tap instead of typing. */
export const captionHints = (petName: string): string[] => [`${petName} sưởi nắng buổi sáng`, `${petName} ăn ngon miệng`, `${petName} đang nghỉ ngơi thoải mái`];
