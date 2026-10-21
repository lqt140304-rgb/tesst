import type { PetInput } from '../contracts/staff';

export const PET_MSG = {
  name: 'Vui lòng nhập tên thú cưng.',
  weight: 'Cân nặng chưa đúng. Bạn nhập số kg, ví dụ 4,2.',
  year: 'Năm sinh chưa đúng. Bạn kiểm tra lại giúp nhé.',
} as const;

export const PET_WEIGHT_MAX = 120;

/** Staff-side pet fields (add and edit). Weight is optional, 0,1–120 kg with at most one decimal; birth year 1990 to next year. */
export function validatePetInput(input: Pick<PetInput, 'name' | 'weight_kg' | 'birth_year'>, year: number): Partial<Record<'name' | 'weight_kg' | 'birth_year', string>> {
  const e: Partial<Record<'name' | 'weight_kg' | 'birth_year', string>> = {};
  if (!input.name.trim()) e.name = PET_MSG.name;
  const w = input.weight_kg;
  if (w !== undefined && !(Number.isFinite(w) && w > 0 && w <= PET_WEIGHT_MAX && Math.abs(w * 10 - Math.round(w * 10)) < 1e-9)) e.weight_kg = PET_MSG.weight;
  const y = input.birth_year;
  if (y !== undefined && !(Number.isInteger(y) && y >= 1990 && y <= year + 1)) e.birth_year = PET_MSG.year;
  return e;
}
