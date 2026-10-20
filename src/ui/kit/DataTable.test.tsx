import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { DataTable, type Column } from './DataTable';

type Row = { id: string; name: string; phone: string };
const data: Row[] = Array.from({ length: 7 }, (_, i) => ({ id: `c${i + 1}`, name: `Khách ${i + 1}`, phone: `090 *** 00${i}` }));
const columns: Column<Row>[] = [
  { key: 'name', header: 'Tên khách hàng', cell: (r) => r.name, primary: true },
  { key: 'phone', header: 'Số điện thoại', cell: (r) => r.phone },
];

describe('DataTable', () => {
  it('one table (no duplicate card markup), labelled cells, selection, range and current page', () => {
    const html = renderToStaticMarkup(<DataTable rows={data} columns={columns} rowKey={(r) => r.id} caption="Danh sách khách hàng" noun="khách hàng" pageSize={5} selectedKey="c2" />);
    expect(html.match(/<table/g)).toHaveLength(1);
    expect(html).toContain('<caption');
    expect(html.match(/aria-selected="true"/g)).toHaveLength(1);
    expect(html).toContain('data-label="Tên khách hàng"');
    expect(html).toContain('Hiển thị 1–5 của 7 khách hàng');
    expect(html).toMatch(/aria-current="page"[^>]*>1</);
    expect(html.match(/<tr[^>]*data-row/g)).toHaveLength(5);
  });
  it('no pager when everything fits; the empty slot shows when there are no rows', () => {
    const one = renderToStaticMarkup(<DataTable rows={data.slice(0, 3)} columns={columns} rowKey={(r) => r.id} caption="Danh sách" noun="khách hàng" pageSize={5} />);
    expect(one).not.toContain('Trang sau');
    const none = renderToStaticMarkup(<DataTable rows={[]} columns={columns} rowKey={(r) => r.id} caption="Danh sách" noun="khách hàng" empty={<p>Chưa có khách hàng.</p>} />);
    expect(none).toContain('Chưa có khách hàng.');
  });
});
