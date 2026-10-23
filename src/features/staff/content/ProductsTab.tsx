import { useState } from 'react';
import { usePageSize } from '@/app/prefs';
import { FEATURED_CATEGORY_LABEL } from '@/data/contracts/enums';
import { CONTENT_MSG, FEATURED_MAX } from '@/data/rules/content';
import { staff, type StaffFeaturedProductRow } from '@/data/staff';
import { useQuery } from '@/data/hooks/useQuery';
import { Button, DataTable, EmptyState, useToast, type Column } from '@/ui';
import { LoadingBlocks, MiniTag, PageProblem } from '../ui';
import s from '../Staff.module.css';
import c from './Content.module.css';
import { updatedLine, usedText } from './contentView';
import { ProductDialog } from './ProductDialog';
import { RowActions } from './RowActions';
import { Thumb } from './Thumb';

export function ProductsTab() {
  const pageSize = usePageSize();
  const toast = useToast();
  const q = useQuery(() => staff.content.products.list(), []);
  const [editing, setEditing] = useState<StaffFeaturedProductRow | 'new' | null>(null);
  if (q.error && !q.data) return <PageProblem error={q.error} onRetry={q.refetch} />;
  if (!q.data) return <LoadingBlocks />;
  const rows = q.data;
  const columns: Column<StaffFeaturedProductRow>[] = [
    { key: 'image', header: 'Ảnh', cell: (p) => <Thumb imageKey={p.imageKey} /> },
    { key: 'name', header: 'Sản phẩm', primary: true, cell: (p) => (
      <span className={c.nameCell}><strong>{p.name}</strong>{p.note && <span className={s.meta}>{p.note}</span>}</span>
    ) },
    { key: 'category', header: 'Nhóm', hideOnPhone: true, cell: (p) => FEATURED_CATEGORY_LABEL[p.category] },
    { key: 'status', header: 'Trạng thái', cell: (p) => (
      <span className={c.tags}>
        {p.visible ? <MiniTag tone="teal" icon="eye">Đang hiện</MiniTag> : <MiniTag icon="eye-off">Đang ẩn</MiniTag>}
        {p.sample && <MiniTag tone="plum">Nội dung mẫu</MiniTag>}
      </span>
    ) },
    { key: 'updated', header: 'Cập nhật', hideOnPhone: true, cell: (p) => <span className={s.meta}>{updatedLine(p)}</span> },
    { key: 'actions', header: 'Thao tác', align: 'end', cell: (p) => (
      <RowActions row={p} name={p.name} noun="sản phẩm" list={staff.content.products} onEdit={() => setEditing(p)} />
    ) },
  ];
  return (
    <>
      <div className={c.toolbar}>
        <p className={c.counter}>{usedText(rows.length)}{rows.length >= FEATURED_MAX && ' (đã đầy)'}</p>
        <Button icon="plus" onClick={() => (rows.length >= FEATURED_MAX ? toast({ tone: 'error', message: CONTENT_MSG.limit }) : setEditing('new'))}>Thêm sản phẩm</Button>
      </div>
      {rows.length === 0
        ? <EmptyState icon="image" title="Chưa có sản phẩm nào." body="Bạn thêm sản phẩm để khách xem ở trang giới thiệu." />
        : <DataTable pageSize={pageSize} rows={rows} columns={columns} rowKey={(p) => p.id} caption="Sản phẩm nổi bật" noun="sản phẩm" />}
      {editing !== null && <ProductDialog key={editing === 'new' ? 'new' : editing.id} open onClose={() => setEditing(null)} row={editing === 'new' ? undefined : editing} />}
    </>
  );
}
