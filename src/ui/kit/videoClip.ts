/** Where playback may reach: the shorter of the file's real length and the clip end (seconds). The real length can be unknown until the browser has read it. */
export function clipLimit(duration: number, clipEnd?: number): number {
  const known = Number.isFinite(duration) && duration > 0 ? duration : 0;
  const end = clipEnd !== undefined && Number.isFinite(clipEnd) && clipEnd > 0 ? clipEnd : 0;
  if (known && end) return Math.min(known, end);
  return known || end;
}

/** True once playback has reached the end of the clip, so the player pauses there instead of running to the end of a longer file. */
export const shouldStop = (time: number, limit: number): boolean => limit > 0 && time >= limit;
