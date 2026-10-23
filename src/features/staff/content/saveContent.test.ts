import { describe, expect, it } from 'vitest';
import { ConflictError, ForbiddenError, NotFoundError } from '@/data/contracts/errors';
import { contentError } from './saveContent';

describe('contentError', () => {
  it('says an item was deleted elsewhere', () => expect(contentError(new NotFoundError('x'))).toBe('Mục này vừa bị xóa ở nơi khác.'));
  it('says the right is gone', () => expect(contentError(new ForbiddenError('x'))).toBe('Bạn không còn quyền đăng nội dung.'));
  it('keeps the standard sentence for a stale save', () => expect(contentError(new ConflictError('x'))).toContain('vừa được người khác cập nhật'));
  it('falls back to the generic failure', () => expect(contentError(new Error('x'))).toBe('Chưa lưu được. Vui lòng thử lại.'));
});
