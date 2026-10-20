import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { DetailList, SectionCard, StatCard } from './Cards';

const render = (el: React.ReactNode) => renderToStaticMarkup(<MemoryRouter>{el}</MemoryRouter>);

describe('cards', () => {
  it('SectionCard is a section named by its heading, with a "Xem tất cả" link', () => {
    const html = render(<SectionCard title="Lịch hẹn sắp tới" action={{ label: 'Xem tất cả', to: '/khach-hang/lich-hen' }}><p>…</p></SectionCard>);
    const id = /aria-labelledby="([^"]+)"/.exec(html)?.[1];
    expect(id).toBeTruthy();
    expect(html).toContain(`<h2 id="${id}"`);
    expect(html).toContain('href="/khach-hang/lich-hen"');
    expect(html).toContain('Xem tất cả');
  });
  it('DetailList pairs each label with its value', () => {
    const html = render(<DetailList items={[{ label: 'Loài', value: 'Mèo' }, { label: 'Cân nặng', value: '4,2 kg' }]} />);
    expect(html.match(/<dt/g)).toHaveLength(2);
    expect(html.match(/<dd/g)).toHaveLength(2);
  });
  it('StatCard carries its figure', () => {
    const html = render(<StatCard icon="receipt" label="Hóa đơn đã thanh toán" value="100" />);
    expect(html).toContain('data-stat');
    expect(html).toContain('Hóa đơn đã thanh toán');
  });
});
