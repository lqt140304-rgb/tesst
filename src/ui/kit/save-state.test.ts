import { describe, expect, it } from 'vitest';
import { SAVE_LABEL, saveReducer } from './save-state';

describe('save state (tick only after a real save)', () => {
  it('editing makes a draft, saving shows progress, success shows saved', () => {
    expect(saveReducer('clean', 'edit')).toBe('dirty');
    expect(saveReducer('dirty', 'start')).toBe('saving');
    expect(saveReducer('saving', 'ok')).toBe('saved');
  });
  it('a failed save never reads as saved', () => {
    expect(saveReducer('saving', 'fail')).toBe('error');
    expect(saveReducer('dirty', 'ok')).toBe('dirty');
    expect(saveReducer('error', 'ok')).toBe('error');
  });
  it('editing again after saved or error is a draft; editing while saving keeps saving', () => {
    expect(saveReducer('saved', 'edit')).toBe('dirty');
    expect(saveReducer('error', 'edit')).toBe('dirty');
    expect(saveReducer('saving', 'edit')).toBe('saving');
    expect(saveReducer('saved', 'reset')).toBe('clean');
  });
  it('labels', () => {
    expect(SAVE_LABEL).toEqual({ dirty: 'Bản nháp · Chưa lưu thay đổi', saving: 'Đang lưu…', saved: 'Đã lưu', error: 'Chưa lưu thay đổi' });
  });
});
