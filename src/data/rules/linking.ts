/** No 0/O, 1/I/L — codes are read aloud and typed at the counter. */
export const LINK_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const RE = new RegExp(`^LS-[${LINK_CODE_ALPHABET}]{4}$`);

export function generateLinkCode(rand: () => number): string {
  let s = '';
  for (let i = 0; i < 4; i++) s += LINK_CODE_ALPHABET[Math.floor(rand() * LINK_CODE_ALPHABET.length)];
  return `LS-${s}`;
}

export const isLinkCode = (s: string) => RE.test(s);

export function normalizeLinkCode(input: string): string {
  const t = input.trim().toUpperCase().replace(/\s+/g, '');
  return t.startsWith('LS-') ? t : `LS-${t.replace(/^LS/, '')}`;
}
