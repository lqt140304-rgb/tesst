import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Icon } from './Icon';
import { APPROVED_ICONS, CUSTOM_ICONS, LUCIDE_ICONS } from './names';

const html = (props: Parameters<typeof Icon>[0]) => renderToStaticMarkup(createElement(Icon, props));

/** Owner chose Phosphor Duotone (21/10/2026): the duotone weight draws a second layer at 20% opacity. */
describe('Icon — Phosphor Duotone', () => {
  it('draws every general icon in the duotone weight', () => {
    for (const n of LUCIDE_ICONS) expect(html({ name: n }), n).toContain('opacity="0.2"');
  });
  it('keeps the hand-drawn vet icons and the owner-approved service icons', () => {
    for (const n of [...CUSTOM_ICONS, ...APPROVED_ICONS] as const) expect(html({ name: n }), n).toContain(`data-icon="${n}"`);
  });
  it('is decorative unless it has a label', () => {
    expect(html({ name: 'phone' })).toContain('aria-hidden="true"');
    const labelled = html({ name: 'phone', label: 'Gọi' });
    expect(labelled).toContain('role="img"');
    expect(labelled).toContain('aria-label="Gọi"');
    expect(labelled).not.toContain('aria-hidden');
  });
  it('takes its size', () => {
    expect(html({ name: 'phone', size: 28 })).toMatch(/width="28"/);
  });
});
