import { describe, expect, it } from 'vitest';
import { SAVE_LABEL, initialSave, saveReducer, type SaveEvent, type SaveModel } from './save-state';

const run = (events: SaveEvent[], from: SaveModel = initialSave()) => events.reduce(saveReducer, from).status;

describe('save state (tick only after a real save)', () => {
  it('editing makes a draft, saving shows progress, success shows saved', () => {
    expect(run([{ type: 'edit' }])).toBe('dirty');
    expect(run([{ type: 'edit' }, { type: 'start', run: 1 }])).toBe('saving');
    expect(run([{ type: 'edit' }, { type: 'start', run: 1 }, { type: 'ok', run: 1 }])).toBe('saved');
  });
  it('a failed save never reads as saved', () => {
    expect(run([{ type: 'start', run: 1 }, { type: 'fail', run: 1 }])).toBe('error');
    expect(run([{ type: 'edit' }, { type: 'ok', run: 1 }])).toBe('dirty');
  });
  it('overlapping saves: only the latest one decides (final review I1)', () => {
    expect(run([{ type: 'start', run: 1 }, { type: 'start', run: 2 }, { type: 'ok', run: 1 }])).toBe('saving');
    expect(run([{ type: 'start', run: 1 }, { type: 'start', run: 2 }, { type: 'ok', run: 1 }, { type: 'fail', run: 2 }])).toBe('error');
    expect(run([{ type: 'start', run: 1 }, { type: 'start', run: 2 }, { type: 'ok', run: 2 }, { type: 'fail', run: 1 }])).toBe('saved');
  });
  it('typing during a save leaves a draft after it succeeds, not "Đã lưu" (final review I1)', () => {
    expect(run([{ type: 'start', run: 1 }, { type: 'edit' }])).toBe('saving');
    expect(run([{ type: 'start', run: 1 }, { type: 'edit' }, { type: 'ok', run: 1 }])).toBe('dirty');
  });
  it('editing again after saved or error is a draft; reset clears', () => {
    expect(run([{ type: 'start', run: 1 }, { type: 'ok', run: 1 }, { type: 'edit' }])).toBe('dirty');
    expect(run([{ type: 'start', run: 1 }, { type: 'fail', run: 1 }, { type: 'edit' }])).toBe('dirty');
    expect(run([{ type: 'edit' }, { type: 'reset' }])).toBe('clean');
  });
  it('labels', () => {
    expect(SAVE_LABEL).toEqual({ dirty: 'Bản nháp · Chưa lưu thay đổi', saving: 'Đang lưu…', saved: 'Đã lưu', error: 'Chưa lưu thay đổi' });
  });
});
