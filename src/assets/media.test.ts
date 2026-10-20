import { describe, expect, it } from 'vitest';
import { petPhoto, teamPhoto } from './media';

describe('pet photos', () => {
  it('a processed pet has its avatar size', () => {
    expect(petPhoto('meo-tam-the', 'avatar')).toMatch(/pet-meo-tam-the-avatar.*\.webp/);
  });
  it('an unknown key or a size that was not produced is undefined — callers choose the fallback', () => {
    expect(petPhoto('khong-co', 'avatar')).toBeUndefined();
    expect(petPhoto('meo-tam-the', 'banner')).toBeUndefined();
  });
  it("the owner's photos have their sizes; the head-doctor photo has its own card (part 2)", () => {
    expect(petPhoto('cho-poodle-xe', 'card')).toMatch(/pet-cho-poodle-xe-card.*\.webp/);
    expect(petPhoto('meo-trang-ngu', 'avatar')).toBeDefined();
    expect(teamPhoto()).toMatch(/team-le-thai-son-card.*\.webp/);
  });
});
