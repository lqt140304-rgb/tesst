import { useState } from 'react';
import { usePageSize } from '@/app/prefs';
import { SPECIES_LABEL } from '@/data/contracts/enums';
import { FEATURED_MAX } from '@/data/rules/content';
import { staff, type StaffFeaturedCaseRow } from '@/data/staff';
import { useQuery } from '@/data/hooks/useQuery';
import { Button, DataTable, EmptyState, type Column } from '@/ui';
import { LoadingBlocks, MiniTag, PageProblem } from '../ui';
import s from '../Staff.module.css';
import c from './Content.module.css';
import { CaseDialog } from './CaseDialog';
import { consentLine, updatedLine, usedText } from './contentView';
import { RowActions } from './RowActions';
import { Thumb } from './Thumb';

export function CasesTab() {
  const pageSize = usePageSize();
  const q = useQuery(() => staff.content.cases.list(), []);
  const [editing, setEditing] = useState<StaffFeaturedCaseRow | 'new' | null>(null);
  if (q.error && !q.data) return <PageProblem error={q.error} onRetry={q.refetch} />;
  if (!q.data) return <LoadingBlocks />;
  const rows = q.data;
  const columns: Column<StaffFeaturedCaseRow>[] = [
    { key: 'image', header: 'Ảnh', cell: (r) => <Thumb imageKey={r.imageKey} /> },
    { key: 'title', header: 'Câu chuyện', primary: true, cell: (r) => (
      <span className={c.nameCell}><strong>{r.title}</strong><span className={s.meta}>Bé {r.petName} · {SPECIES_LABEL[r.species]}</span></span>
    ) },
    { key: 'status', header: 'Trạng thái', cell: (r) => (
      <span className={c.tags}>
        {r.visible ? <MiniTag tone="teal" icon="eye">Đang hiện</MiniTag> : <MiniTag icon="eye-off">Đang ẩn</MiniTag>}
        {r.sample && <MiniTag tone="plum">Nội dung mẫu</MiniTag>}
      </span>
    ) },
    { key: 'consent', header: 'Đồng ý', cell: (r) => <span className={s.meta}>{consentLine(r)}</span> },
    { key: 'updated', header: 'Cập nhật', hideOnPhone: true, cell: (r) => <span className={s.meta}>{updatedLine(r)}</span> },
    { key: 'actions', header: 'Thao tác', align: 'end', cell: (r) => (
      <RowActions row={r} name={r.title} noun="câu chuyện" list={staff.content.cases} onEdit={() => setEditing(r)} />
    ) },
  ];
  return (
    <>
      <div className={c.toolbar}>
        <p className={c.counter}>{usedText(rows.length)}{rows.length >= FEATURED_MAX && ' (đã đầy)'}</p>
        <Button icon="plus" onClick={() => setEditing('new')}>Thêm câu chuyện</Button>
      </div>
      {rows.length === 0
        ? <EmptyState icon="image" title="Chưa có câu chuyện nào." body="Bạn thêm câu chuyện để khách xem ở trang giới thiệu." />
        : <DataTable pageSize={pageSize} rows={rows} columns={columns} rowKey={(r) => r.id} caption="Câu chuyện điều trị" noun="câu chuyện" />}
      {editing !== null && <CaseDialog key={editing === 'new' ? 'new' : editing.id} open onClose={() => setEditing(null)} row={editing === 'new' ? undefined : editing} />}
    </>
  );
}
