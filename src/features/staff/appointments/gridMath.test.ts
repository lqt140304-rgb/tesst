import { describe, expect, it } from 'vitest';
import { ROW, layoutColumn, mondayOf, weekDays, windowOf } from './gridMath';

// Times are Vietnam time (+07:00).
const a = (id: string, hhmm: string, min = 30) => ({ id, start_at: `2026-10-21T${hhmm}:00+07:00`, duration_min: min });

describe('layoutColumn', () => {
  it('places a 09:00 30-minute appointment at the right offset', () => {
    expect(layoutColumn([a('x', '09:00')], 7)).toEqual([{ id: 'x', top: 4 * ROW, height: ROW - 4, col: 0, cols: 1 }]);
  });
  it('stretches a long appointment', () => {
    expect(layoutColumn([a('x', '09:00', 90)], 7)[0]!.height).toBe(3 * ROW - 4);
  });
  it('puts two appointments at the same time side by side', () => {
    const p = layoutColumn([a('x', '10:00'), a('y', '10:00')], 7);
    expect(p.map((q) => [q.col, q.cols])).toEqual([[0, 2], [1, 2]]);
  });
  it('puts partly overlapping appointments side by side', () => {
    const p = layoutColumn([a('x', '09:00'), a('y', '09:15')], 7);
    expect(p.map((q) => [q.col, q.cols])).toEqual([[0, 2], [1, 2]]);
  });
  it('does not split appointments that only touch', () => {
    expect(layoutColumn([a('x', '10:00'), a('y', '10:30')], 7).every((q) => q.cols === 1)).toBe(true);
  });
  it('gives a lone appointment after a busy group the full width again', () => {
    const p = layoutColumn([a('x', '09:00'), a('y', '09:00'), a('z', '11:00')], 7);
    expect(p.find((q) => q.id === 'z')).toMatchObject({ col: 0, cols: 1 });
  });
  it('keeps input order out of it', () => {
    const p = layoutColumn([a('y', '09:15'), a('x', '09:00')], 7);
    expect(p.map((q) => q.id).sort()).toEqual(['x', 'y']);
    expect(p.every((q) => q.cols === 2)).toBe(true);
  });
});

describe('windowOf', () => {
  it('widens the window for early and late appointments', () => {
    expect(windowOf([a('x', '06:30'), a('y', '21:30', 60)])).toEqual({ startH: 6, endH: 23 });
  });
  it('keeps 07:00–21:00 when everything fits', () => {
    expect(windowOf([a('x', '09:00')])).toEqual({ startH: 7, endH: 21 });
    expect(windowOf([])).toEqual({ startH: 7, endH: 21 });
  });
  it('rounds the end up to the next full hour', () => {
    expect(windowOf([a('x', '20:15', 45)])).toEqual({ startH: 7, endH: 21 });
    expect(windowOf([a('x', '20:30', 45)])).toEqual({ startH: 7, endH: 22 });
  });
});

describe('weeks', () => {
  it('finds the Monday of a week from any day', () => {
    expect(mondayOf('2026-10-21')).toBe('2026-10-19'); // Wednesday
    expect(mondayOf('2026-10-25')).toBe('2026-10-19'); // Sunday
    expect(mondayOf('2026-10-19')).toBe('2026-10-19');
  });
  it('lists seven days from the start', () => {
    expect(weekDays('2026-10-19')).toEqual(['2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23', '2026-10-24', '2026-10-25']);
  });
});
