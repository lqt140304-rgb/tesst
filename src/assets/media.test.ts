import { describe, expect, it } from 'vitest';
import { petPhoto } from './media';

describe('pet photos', () => {
  it('a processed pet has its avatar size', () => {
    expect(petPhoto('meo-tam-the', 'avatar')).toMatch(/pet-meo-tam-the-avatar.*\.webp/);
  });
  it('an unknown key or a size that was not produced is undefined — callers choose the fallback', () => {
    expect(petPhoto('khong-co', 'avatar')).toBeUndefined();
    expect(petPhoto('meo-tam-the', 'banner')).toBeUndefined();
  });
});
