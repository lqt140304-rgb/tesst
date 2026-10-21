import { describe, expect, it } from 'vitest';
import { petLine } from './PetCard';

describe('petLine', () => {
  it('joins what is known, in order', () => {
    expect(petLine({ species: 'cat', breed: 'Mèo ta', sex: 'female', birth_year: 2022, weight_kg: 4.2, color: 'Tam thể', neutered: true }, 2026))
      .toBe('Mèo · Mèo ta · Cái · 4 tuổi · 4,2\u00A0kg · Tam thể · đã triệt sản');
  });
  it('drops the parts that are missing and never prints undefined or null', () => {
    const line = petLine({ species: 'dog', breed: undefined, sex: undefined, birth_year: undefined, weight_kg: undefined, color: undefined, neutered: undefined }, 2026);
    expect(line).toBe('Chó');
    expect(line).not.toMatch(/undefined|null/);
  });
  it('says "dưới 1 tuổi" for this year or a year ahead', () => {
    expect(petLine({ species: 'dog', birth_year: 2026 }, 2026)).toContain('dưới 1 tuổi');
    expect(petLine({ species: 'dog', birth_year: 2027 }, 2026)).toContain('dưới 1 tuổi');
  });
  it('does not claim "chưa triệt sản" for an unknown or false value', () => {
    expect(petLine({ species: 'dog', neutered: false }, 2026)).toBe('Chó');
  });
});
