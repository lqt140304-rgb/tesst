import { describe, expect, it } from 'vitest';
import { generateLinkCode, isLinkCode, normalizeLinkCode } from './linking';

describe('link codes', () => {
  it('generates LS- plus 4 unambiguous characters', () => {
    let i = 0;
    const seq = [0, 0.5, 0.99, 0.2];
    const code = generateLinkCode(() => seq[i++ % seq.length]!);
    expect(isLinkCode(code)).toBe(true);
    expect(code).toMatch(/^LS-[A-Z2-9]{4}$/);
  });
  it('accepts valid and rejects ambiguous characters', () => {
    expect(isLinkCode('LS-7K2Q')).toBe(true);
    expect(isLinkCode('LS-0O1I')).toBe(false);
  });
  it('normalises user input', () => {
    expect(normalizeLinkCode('  ls-7k2q ')).toBe('LS-7K2Q');
    expect(normalizeLinkCode('7k2q')).toBe('LS-7K2Q');
  });
});
