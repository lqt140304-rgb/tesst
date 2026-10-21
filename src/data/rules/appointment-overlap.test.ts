import { describe, expect, it } from 'vitest';
import { findOverlap, overlapMessage, type BusySlot } from './appointment-overlap';

const slot = (o: Partial<BusySlot> & { start_at: string }): BusySlot => ({ id: 'a1', assignee_id: 'stf-duc', duration_min: 30, status: 'scheduled', pet_id: 'pet-1', ...o });
const at = (hhmm: string) => `2026-10-26T${hhmm}:00+07:00`;

describe('findOverlap', () => {
  const busy = [slot({ id: 'a1', start_at: at('09:00') })];

  it('finds a partial overlap at either end', () => {
    expect(findOverlap(busy, { assignee_id: 'stf-duc', start_at: at('09:15'), duration_min: 30 })?.id).toBe('a1');
    expect(findOverlap(busy, { assignee_id: 'stf-duc', start_at: at('08:45'), duration_min: 30 })?.id).toBe('a1');
  });

  it('finds a slot that contains or sits inside the other', () => {
    expect(findOverlap(busy, { assignee_id: 'stf-duc', start_at: at('08:00'), duration_min: 120 })?.id).toBe('a1');
    expect(findOverlap(busy, { assignee_id: 'stf-duc', start_at: at('09:10'), duration_min: 10 })?.id).toBe('a1');
  });

  it('finds the same start', () => {
    expect(findOverlap(busy, { assignee_id: 'stf-duc', start_at: at('09:00'), duration_min: 30 })?.id).toBe('a1');
  });

  it('lets back-to-back slots touch', () => {
    expect(findOverlap(busy, { assignee_id: 'stf-duc', start_at: at('09:30'), duration_min: 30 })).toBeUndefined();
    expect(findOverlap(busy, { assignee_id: 'stf-duc', start_at: at('08:30'), duration_min: 30 })).toBeUndefined();
  });

  it('ignores other people, unassigned candidates and cancelled slots', () => {
    expect(findOverlap(busy, { assignee_id: 'stf-mai', start_at: at('09:00'), duration_min: 30 })).toBeUndefined();
    expect(findOverlap(busy, { start_at: at('09:00'), duration_min: 30 })).toBeUndefined();
    expect(findOverlap([slot({ start_at: at('09:00'), status: 'cancelled' })], { assignee_id: 'stf-duc', start_at: at('09:00'), duration_min: 30 })).toBeUndefined();
  });

  it('skips the appointment being moved', () => {
    expect(findOverlap(busy, { assignee_id: 'stf-duc', start_at: at('09:10'), duration_min: 30, ignoreId: 'a1' })).toBeUndefined();
  });

  it('compares real instants, not clock text', () => {
    const utc = [slot({ start_at: '2026-10-26T02:00:00Z' })]; // 09:00 in Vietnam
    expect(findOverlap(utc, { assignee_id: 'stf-duc', start_at: at('09:15'), duration_min: 30 })?.id).toBe('a1');
  });

  it('returns the earliest when several overlap', () => {
    const two = [slot({ id: 'late', start_at: at('09:20') }), slot({ id: 'early', start_at: at('09:00') })];
    expect(findOverlap(two, { assignee_id: 'stf-duc', start_at: at('09:10'), duration_min: 30 })?.id).toBe('early');
  });
});

describe('overlapMessage', () => {
  it('names the busy window and the pet', () => {
    expect(overlapMessage(slot({ start_at: at('09:00'), duration_min: 45 }), 'Bin')).toBe('Người phụ trách đã có lịch 09:00–09:45 (bé Bin). Bạn chọn giờ khác hoặc người khác nhé.');
  });
});
