import { addDays, formatTimeVi } from '@/lib/dates';
import type { StaffAppointment } from '@/data/staff';

/** The visible hours (07:00–21:00, not opening hours) and the height of a 30-minute row; the window widens for appointments outside it. */
export const START_H = 7;
export const END_H = 21;
export const ROW = 48;

type Span = Pick<StaffAppointment, 'start_at' | 'duration_min'>;

/** Minutes since midnight, Vietnam time. */
export const minutesOf = (iso: string): number => {
  const [h, m] = formatTimeVi(iso).split(':').map(Number);
  return h! * 60 + m!;
};

export const mondayOf = (date: string): string => addDays(date, -((new Date(`${date}T00:00:00Z`).getUTCDay() + 6) % 7));
export const weekDays = (from: string): string[] => Array.from({ length: 7 }, (_, i) => addDays(from, i));

/** The hour window: 07–21 unless an appointment starts earlier or ends later (then the nearest full hours). */
export function windowOf(items: Span[]): { startH: number; endH: number } {
  let startH = START_H;
  let endH = END_H;
  for (const a of items) {
    const start = minutesOf(a.start_at);
    startH = Math.min(startH, Math.floor(start / 60));
    endH = Math.max(endH, Math.ceil((start + a.duration_min) / 60));
  }
  return { startH, endH };
}

export type Placed = { id: string; top: number; height: number; col: number; cols: number };

/** Tops, heights and side-by-side lanes for one day column: appointments that overlap in time share the width, touching ones do not. */
export function layoutColumn(items: (Pick<StaffAppointment, 'id'> & Span)[], startH: number): Placed[] {
  const sorted = items
    .map((a) => ({ id: a.id, start: minutesOf(a.start_at), end: minutesOf(a.start_at) + a.duration_min, duration: a.duration_min }))
    .sort((x, y) => x.start - y.start || y.duration - x.duration);
  const out: Placed[] = [];
  let group: typeof sorted = [];
  let groupEnd = -1;
  const flush = () => {
    const laneEnds: number[] = [];
    const lanes = group.map((a) => {
      let lane = laneEnds.findIndex((end) => end <= a.start);
      if (lane < 0) lane = laneEnds.length;
      laneEnds[lane] = a.end;
      return lane;
    });
    group.forEach((a, i) => out.push({
      id: a.id, top: Math.max(0, ((a.start - startH * 60) / 30) * ROW), height: Math.max(ROW - 4, (a.duration / 30) * ROW - 4), col: lanes[i]!, cols: laneEnds.length,
    }));
    group = [];
  };
  for (const a of sorted) {
    if (group.length > 0 && a.start >= groupEnd) { flush(); groupEnd = -1; }
    group.push(a);
    groupEnd = Math.max(groupEnd, a.end);
  }
  if (group.length > 0) flush();
  return out;
}
