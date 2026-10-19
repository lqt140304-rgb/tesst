import { describe, expect, it } from 'vitest';
import { APPROVED_ICONS, CUSTOM_ICONS, LUCIDE_ICONS } from './names';
import { hasIcon, opticalStroke } from './Icon';

describe('icon registry', () => {
  it('every declared icon name renders something', () => {
    for (const n of [...LUCIDE_ICONS, ...CUSTOM_ICONS, ...APPROVED_ICONS]) expect(hasIcon(n), n).toBe(true);
  });
  it('optical stroke follows the size table', () => {
    expect([14, 16, 20, 24, 28, 48].map(opticalStroke)).toEqual([2.5, 2.25, 2, 2, 2, 1.5]);
  });
});
