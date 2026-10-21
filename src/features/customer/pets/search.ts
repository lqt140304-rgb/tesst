import { SPECIES_LABEL, type Species } from '@/data/contracts/enums';

/** Lowercase, no diacritics (đ → d), single spaces: so "bong" finds "Bông" and "MÈO" finds cats. */
export function foldVi(s: string): string {
  return s.normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().replace(/\s+/g, ' ').trim();
}

/** Every word of the query must appear in the pet's name, species label or breed; a blank query matches all. */
export function matchPet(p: { name: string; species: Species; breed?: string }, query: string): boolean {
  const words = foldVi(query).split(' ').filter(Boolean);
  if (words.length === 0) return true;
  const hay = foldVi(`${p.name} ${SPECIES_LABEL[p.species]} ${p.breed ?? ''}`);
  return words.every((w) => hay.includes(w));
}
