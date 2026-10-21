import { describe, expect, it } from 'vitest';
import { foldVi, matchPet } from './search';

const bong = { name: 'Bông', species: 'dog' as const, breed: 'Poodle' };
const miu = { name: 'Miu', species: 'cat' as const, breed: 'Mèo ta lông trắng' };

describe('pet search', () => {
  it('folds case, diacritics, đ and extra spaces', () => {
    expect(foldVi('Đức  Anh ')).toBe('duc anh');
    expect(foldVi('MÈO Ta')).toBe('meo ta');
  });
  it('finds a name typed without diacritics', () => {
    expect(matchPet(bong, 'bong')).toBe(true);
  });
  it('finds by species, in any case', () => {
    expect(matchPet(miu, 'MÈO')).toBe(true);
    expect(matchPet(miu, 'chó')).toBe(false);
  });
  it('needs every word to match, across name, species and breed', () => {
    expect(matchPet(bong, 'poodle cho')).toBe(true);
    expect(matchPet(bong, 'poodle meo')).toBe(false);
  });
  it('a blank query matches everything', () => {
    expect(matchPet(miu, '   ')).toBe(true);
    expect(matchPet(miu, '')).toBe(true);
  });
  it('a pet without a breed still matches by name', () => {
    expect(matchPet({ name: 'Na', species: 'cat' }, 'na')).toBe(true);
  });
});
