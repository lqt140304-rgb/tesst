import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { PageHeader } from './PageHeader';

const render = (el: React.ReactNode) => renderToStaticMarkup(<MemoryRouter>{el}</MemoryRouter>);

describe('PageHeader', () => {
  it('a breadcrumb trail ends on the current page, with one h1', () => {
    const html = render(<PageHeader title="Hồ sơ khách hàng" crumbs={[{ label: 'Khách hàng', to: '/nv/khach-hang' }, { label: 'Hồ sơ khách hàng' }]} />);
    expect(html).toContain('aria-label="Đường dẫn"');
    expect(html).toContain('href="/nv/khach-hang"');
    expect(html).toMatch(/aria-current="page"[^>]*>Hồ sơ khách hàng/);
    expect(html.match(/<h1/g)).toHaveLength(1);
  });
  it('without crumbs there is no breadcrumb; sub and actions render', () => {
    const html = render(<PageHeader title="Khách hàng" sub="Quản lý thông tin khách hàng và thú cưng" actions={<button>Thêm khách hàng</button>} size="lg" />);
    expect(html).not.toContain('Đường dẫn');
    expect(html).toContain('Quản lý thông tin khách hàng và thú cưng');
    expect(html).toContain('Thêm khách hàng');
    expect(html).toContain('data-size="lg"');
  });
});
