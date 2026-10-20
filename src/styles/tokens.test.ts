import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('./tokens.css', import.meta.url), 'utf8');
const tokens: Record<string, string> = Object.fromEntries([...css.matchAll(/(--[\w-]+):\s*(#[0-9A-Fa-f]{6})\b/g)].map((m) => [m[1]!, m[2]!]));

const lum = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
};
const contrast = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x! + 0.05) / (y! + 0.05); };

describe('work-area tokens (redesign §5.1)', () => {
  it('work-area surfaces exist', () => {
    for (const n of ['--canvas-work', '--surface-card', '--line-soft']) expect(tokens[n]).toMatch(/^#[0-9A-F]{6}$/i);
  });
  it('body and secondary text stay ≥ 4.5:1 on the work surfaces (review §4.5)', () => {
    for (const bg of ['--canvas-work', '--surface-card', '--plum-50']) {
      for (const fg of ['--ink-900', '--ink-600', '--plum-700']) expect(contrast(tokens[fg]!, tokens[bg]!), `${fg} on ${bg}`).toBeGreaterThanOrEqual(4.5);
    }
  });
});
