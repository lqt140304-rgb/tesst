import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Tabs } from './Tabs';

describe('Tabs', () => {
  it('with idPrefix, each tab gets a stable id and controls its panel', () => {
    const html = renderToStaticMarkup(<Tabs label="Dịch vụ" variant="underline" idPrefix="dv" value="kham" onChange={() => {}}
      items={[{ value: 'kham', label: 'Khám & điều trị' }, { value: 'spa', label: 'Spa & grooming' }]} />);
    expect(html).toContain('id="dv-kham"');
    expect(html).toContain('aria-controls="dv-kham-panel"');
    expect(html).toContain('id="dv-spa"');
  });
});
