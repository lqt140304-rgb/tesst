import { describe, expect, it } from 'vitest';
import { PET_MSG, validatePetInput } from './pet';

const ok = { name: 'Miu', species: 'cat' } as const;

describe('pet input', () => {
  it('accepts a minimal pet and a pet with weight and a birth year up to next year', () => {
    expect(validatePetInput(ok, 2026)).toEqual({});
    expect(validatePetInput({ ...ok, weight_kg: 4.2, birth_year: 2027 }, 2026)).toEqual({});
    expect(validatePetInput({ ...ok, weight_kg: 120 }, 2026)).toEqual({});
  });
  it('refuses weights that are not 0,1–120 kg with at most one decimal', () => {
    for (const w of [0, -1, 121, 4.25, Number.NaN]) expect(validatePetInput({ ...ok, weight_kg: w }, 2026).weight_kg).toBe(PET_MSG.weight);
  });
  it('refuses birth years outside 1990 to next year', () => {
    for (const y of [1989, 2028, 2020.5]) expect(validatePetInput({ ...ok, birth_year: y }, 2026).birth_year).toBe(PET_MSG.year);
  });
  it('needs a name', () => {
    expect(validatePetInput({ ...ok, name: '  ' }, 2026).name).toBe(PET_MSG.name);
  });
});
