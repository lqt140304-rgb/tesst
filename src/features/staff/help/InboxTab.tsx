import { useState } from 'react';
import { SUPPORT_KIND_LABEL, SUPPORT_STATUSES, SUPPORT_STATUS_LABEL, type SupportStatus } from '@/data/contracts/enums';
import { staff, type SupportTicketRow } from '@/data/staff';
import { useQuery } from '@/data/hooks/useQuery';
import { formatDateVi } from '@/lib/dates';
import { ChipGroup, DataTable, EmptyState, type Column } from '@/ui';
import { LoadingBlocks, MiniTag, PageProblem } from '../ui';
import { TicketDialog } from './TicketDialog';
import { statusTone } from './helpView';

type Filter = 'all' | SupportStatus;

const columns: Column<SupportTicketRow>[] = [
  { key: 'code', header: 'Mã', cell: (t) => <span className="num">{t.code}</span> },
  { key: 'kind', header: 'Loại', cell: (t) => SUPPORT_KIND_LABEL[t.kind] },
  { key: 'title', header: 'Tiêu đề', primary: true, cell: (t) => t.title },
  { key: 'from', header: 'Người gửi', cell: (t) => t.createdByName },
  { key: 'date', header: 'Ngày gửi', cell: (t) => <span className="num">{formatDateVi(t.createdAt)}</span> },
  { key: 'status', header: 'Trạng thái', cell: (t) => <MiniTag tone={statusTone(t.status)}>{SUPPORT_STATUS_LABEL[t.status]}</MiniTag> },
];

/** Hộp thư: every ticket sent to the manager, filtered by state; a row opens its dialog. */
export function InboxTab() {
  const [filter, setFilter] = useState<Filter>('all');
  const [open, setOpen] = useState<SupportTicketRow | null>(null);
  const q = useQuery(() => staff.support.inbox(filter === 'all' ? undefined : { status: filter }), [filter]);
  return (
    <>
      <ChipGroup<Filter> label="Lọc theo trạng thái" value={filter} onChange={setFilter}
        options={[{ value: 'all', label: 'Tất cả' }, ...SUPPORT_STATUSES.map((s) => ({ value: s, label: SUPPORT_STATUS_LABEL[s] }))]} />
      {q.error && !q.data ? <PageProblem error={q.error} onRetry={q.refetch} />
        : !q.data ? <LoadingBlocks />
        : <DataTable rows={q.data} columns={columns} rowKey={(t) => t.id} caption="Phiếu gửi đến Quản lý" noun="phiếu"
            onOpen={(t) => setOpen(t)} empty={<EmptyState icon="message-circle" title="Chưa có phiếu nào." />} />}
      {open && <TicketDialog key={open.id} open onClose={() => setOpen(null)} row={open} />}
    </>
  );
}
