/** Order schedule times (F03): "HH:MM" within the day, shared by the order dialog and the API. */
export const isClockTime = (t: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(t);

export const badTimeMessage = (part: string) => `Giờ "${part}" không hợp lệ. Bạn nhập theo dạng giờ:phút (giờ 00–23, phút 00–59), ví dụ 08:00.`;

/** Reads "08:00, 20:00" (commas or spaces; "8:00" is padded). A part that is not a real time is reported, never dropped. */
export function parseScheduleTimes(text: string): { ok: true; times: string[] } | { ok: false; error: string } {
  const times = new Set<string>();
  for (const part of text.split(/[,\s]+/).filter(Boolean)) {
    const t = /^\d:\d{2}$/.test(part) ? `0${part}` : part;
    if (!isClockTime(t)) return { ok: false, error: badTimeMessage(part) };
    times.add(t);
  }
  return { ok: true, times: [...times].sort() };
}
