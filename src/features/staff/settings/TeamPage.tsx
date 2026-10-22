import { useState } from 'react';
import { paths } from '@/app/routes';
import { staff, type StaffAdminRow } from '@/data/staff';
import { useQuery } from '@/data/hooks/useQuery';
import { Button, DataTable, EmptyState, Icon, useToast, type Column } from '@/ui';
import { LoadingBlocks, MiniTag, PageHeader, PageProblem, saveError } from '../ui';
import { ResetPasswordDialog } from './ResetPasswordDialog';
import { TeamActiveDialog } from './TeamActiveDialog';
import { TeamDialog } from './TeamDialog';
import { extraText, rolesText } from './settingsView';
import ss from '../Staff.module.css';
import s from './Settings.module.css';

type Open = { kind: 'add' } | { kind: 'edit' | 'reset' | 'off'; row: StaffAdminRow } | null;

/** Tài khoản nhân viên (`staff.manage`): who can sign in, in which role, with which rights beyond the role. */
export function TeamPage() {
  const q = useQuery(() => staff.team.list(), []);
  const toast = useToast();
  const [open, setOpen] = useState<Open>(null);
  const close = () => setOpen(null);
  const rows = q.data;

  async function switchOn(row: StaffAdminRow) {
    try {
      await staff.team.setActive(row.id, row.version, true);
      toast({ message: `Đã bật lại tài khoản ${row.username}.` });
    } catch (e) {
      toast({ tone: 'error', message: saveError(e) });
    }
  }

  const columns: Column<StaffAdminRow>[] = [
    {
      key: 'name', header: 'Tên', primary: true,
      cell: (r) => (
        <span className={s.person}>
          <span className={s.personName}><strong>{r.name}</strong>{r.isSelf && <MiniTag tone="plum">Bạn</MiniTag>}</span>
          <span className={`${s.personUser} num`}>{r.username}</span>
        </span>
      ),
    },
    { key: 'roles', header: 'Vai', cell: (r) => rolesText(r.presets) },
    { key: 'extra', header: 'Quyền thêm', cell: (r) => extraText(r.extraCaps.length) },
    { key: 'state', header: 'Trạng thái', cell: (r) => (r.active ? <MiniTag tone="teal">Đang dùng</MiniTag> : <MiniTag>Đã tắt</MiniTag>) },
    {
      key: 'actions', header: 'Việc khác', align: 'end',
      cell: (r) => (r.isSelf ? null : (
        <span className={s.rowActions}>
          <Button variant="ghost" size="sm" icon="lock" aria-label={`Đặt lại mật khẩu của ${r.name}`} onClick={() => setOpen({ kind: 'reset', row: r })}>Đặt lại mật khẩu</Button>
          {r.active
            ? <Button variant="ghost" size="sm" icon="eye-off" aria-label={`Tắt tài khoản của ${r.name}`} onClick={() => setOpen({ kind: 'off', row: r })}>Tắt</Button>
            : <Button variant="ghost" size="sm" icon="eye" aria-label={`Bật lại tài khoản của ${r.name}`} onClick={() => void switchOn(r)}>Bật lại</Button>}
        </span>
      )),
    },
  ];

  return (
    <>
      <PageHeader title="Tài khoản nhân viên" sub="Ai được đăng nhập, ở vai nào và có thêm những quyền gì." parent={{ label: 'Cài đặt', to: paths.nv.settings }}
        actions={<Button icon="plus" onClick={() => setOpen({ kind: 'add' })}>Thêm nhân viên</Button>} />
      {q.error && !rows ? <PageProblem error={q.error} onRetry={q.refetch} /> : !rows ? <LoadingBlocks rows={3} /> : (
        <div className={ss.stack}>
          {rows.length === 0
            ? <EmptyState icon="users-round" title="Chưa có tài khoản nhân viên nào." />
            : <DataTable rows={rows} columns={columns} rowKey={(r) => r.id} caption="Tài khoản nhân viên" noun="tài khoản" onOpen={(r) => setOpen({ kind: 'edit', row: r })} />}
          <p className={s.readonlyNote}><Icon name="info" size={16} />Tài khoản tạo mới là tài khoản mẫu của bản demo; mọi thay đổi chỉ nằm trong trình duyệt này.</p>
        </div>
      )}
      <TeamDialog key={open?.kind === 'add' ? 'add' : 'closed-add'} open={open?.kind === 'add'} onClose={close} />
      {open?.kind === 'edit' && <TeamDialog key={open.row.id} open onClose={close} row={open.row} />}
      {open?.kind === 'reset' && <ResetPasswordDialog key={open.row.id} open onClose={close} row={open.row} />}
      {open?.kind === 'off' && <TeamActiveDialog key={open.row.id} open onClose={close} row={open.row} />}
    </>
  );
}
