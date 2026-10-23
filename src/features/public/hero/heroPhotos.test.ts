import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('./hero-photos.css', import.meta.url), 'utf8');

describe('hero photos', () => {
  it('map exactly five frames, in the chosen order', () => {
    const rules = [...css.matchAll(/\.ho__frames \.frame:nth-child\((\d+)\) \.frame__inner \{ background: url\('[^']*hero-(\d)\.webp'\)/g)].map((m) => [Number(m[1]), Number(m[2])]);
    expect(rules).toEqual([[1, 2], [2, 5], [3, 0], [4, 1], [5, 6]]);
  });
  it('keep no rule for the landing slots of the pinned section that no longer exists, which would keep four unused photos in the build', () => {
    expect(css).not.toContain('gt__slot-frame');
    for (const n of [3, 4, 7, 8]) expect(css).not.toContain(`hero-${n}.webp`);
  });
});
