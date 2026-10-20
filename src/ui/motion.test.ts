import { describe, expect, it } from 'vitest';
import { preset, type PresetName } from './motion';

const ALL: PresetName[] = ['enterList', 'enterPanel', 'tabSlide', 'flashOnce', 'chartRise', 'fadeSwap'];

describe('motion presets (per-screen motion proposal)', () => {
  it('list rows rise 8 px over 280 ms, 60 ms apart, only the first five', () => {
    const first = preset('enterList', { index: 0 });
    expect(first.initial).toMatchObject({ y: 8, opacity: 0 });
    expect(first.transition).toMatchObject({ duration: 0.28, delay: 0 });
    expect(preset('enterList', { index: 4 }).transition.delay).toBeCloseTo(0.24);
    expect(preset('enterList', { index: 5 }).initial).toBe(false);
  });

  it('the detail panel comes 12 px from the side over 220 ms', () => {
    const p = preset('enterPanel');
    expect(p.initial).toMatchObject({ x: 12 });
    expect(p.transition.duration).toBe(0.22);
  });

  it('tabs 180 ms, chart 450 ms, flash 600 ms, data swap within 120–200 ms', () => {
    expect(preset('tabSlide').transition.duration).toBe(0.18);
    expect(preset('chartRise').transition.duration).toBe(0.45);
    expect(preset('flashOnce').transition.duration).toBe(0.6);
    const swap = preset('fadeSwap').transition.duration as number;
    expect(swap).toBeGreaterThanOrEqual(0.12);
    expect(swap).toBeLessThanOrEqual(0.2);
  });

  it('reduced motion: opacity only, at most 100 ms (the flash is colour, not movement)', () => {
    for (const n of ALL.filter((x) => x !== 'flashOnce')) {
      const p = preset(n, { reduced: true, index: 1 });
      const json = JSON.stringify(p);
      expect(json, n).not.toMatch(/"(x|y|scale\w*)":/);
      expect(p.transition.duration as number, n).toBeLessThanOrEqual(0.1);
    }
  });

  it('no spring or bounce on work screens', () => {
    for (const n of ALL) expect(JSON.stringify(preset(n)), n).not.toMatch(/spring|bounce/);
  });
});
