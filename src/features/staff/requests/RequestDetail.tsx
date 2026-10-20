import { useRef, useState } from 'react';
import { AnimatePresence, m } from 'motion/react';
import { AppLink } from '@/app/nav';
import { paths } from '@/app/routes';
import { system } from '@/data/public';
import { staff, type StaffRequestDetail } from '@/data/staff';
import { useQuery } from '@/data/hooks/useQuery';
import { CALL_OUTCOME_LABEL, SERVICE_LABEL, SPECIES_LABEL, type CallOutcome } from '@/data/contracts/enums';
import { formatDateVi, formatLongDayVi, formatTimeVi } from '@/lib/dates';
import { Button, ButtonLink, Checkbox, ChipGroup, Field, Icon, StatusPill, Textarea, statusPill, useToast, type IconName } from '@/ui';
import { cx } from '@/lib/cx';
import { FlagBanner, FormError, LoadingBlocks, PageProblem, Tel, Timeline, atWhen, dayLabel, saveError, whenShort } from '../ui';
import { ConfirmDialog } from './ConfirmDialog';
import { CloseDialog } from './CloseDialog';
import s from './Requests.module.css';
import st from '../Staff.module.css';

const OUTCOMES: CallOutcome[] = ['talked', 'no_answer', 'busy', 'call_back_later'];
const EVENT_ICON: Record<StaffRequestDetail['events'][number]['kind'], IconName> = { created: 'send', status: 'arrow-right', call: 'phone', resubmit: 'phone-redo' };

export function RequestDetail({ id, backTo }: { id: string; backTo: string }) {
  const q = useQuery(() => staff.requests.get(id), [id]);
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  /** Which dialog is open and the version it opened on (a newer change elsewhere becomes a conflict, not an overwrite). */
  const [dialog, setDialogState] = useState<{ kind: 'confirm' | 'cancel' | 'reject'; version: number } | null>(null);
  const composer = useRef<HTMLDivElement>(null);
  const kind = dialog?.kind ?? null;
  if (q.error) return <PageProblem error={q.error} onRetry={q.refetch} />;
  if (!q.data) return <LoadingBlocks rows={2} />;
  const r = q.data;
  const now = system.now();
  const setDialog = (k: 'confirm' | 'cancel' | 'reject' | null) => setDialogState(k ? { kind: k, version: r.version } : null);

  async function act(fn: () => Promise<void>, done: string, focusComposer = false) {
    setBusy(true);
    try {
      await fn();
      toast({ message: done });
      if (focusComposer) setTimeout(() => composer.current?.querySelector<HTMLElement>('[role="radio"]')?.focus(), 80);
    } catch (e) {
      toast({ tone: 'error', message: saveError(e) });
    } finally {
      setBusy(false);
    }
  }

  const primary = {
    pending: <Button icon="phone-outgoing" loading={busy} onClick={() => void act(() => staff.requests.startContact(r.id, r.version), `Bạn đang liên hệ ${r.code}. Ghi lại cuộc gọi sau khi gọi nhé.`, true)}>Bắt đầu liên hệ</Button>,
    contacting: <Button icon="calendar-check" onClick={() => setDialog('confirm')}>Xác nhận lịch hẹn…</Button>,
    unreachable: <Button icon="phone-outgoing" loading={busy} onClick={() => void act(() => staff.requests.startContact(r.id, r.version), `${r.code} chuyển sang Đang liên hệ.`, true)}>Liên hệ lại</Button>,
    confirmed: r.appointment ? <ButtonLink to={calendarLink(r.appointment.start_at, r.appointment.id)} icon="calendar-days">Xem lịch hẹn</ButtonLink> : null,
    cancelled: null,
    rejected: null,
  }[r.status];
  const open = r.status === 'pending' || r.status === 'contacting' || r.status === 'unreachable';
  const calls = r.events.filter((e) => e.kind === 'call');

  return (
    <article className={s.detailCard} data-request-detail>
      <AppLink to={backTo} className={cx(st.linkBtn, s.back)}><Icon name="arrow-left" size={16} /> Danh sách yêu cầu</AppLink>
      <header className={s.detailHead}>
        <div className={s.detailTitle}>
          <h2 className={s.detailCode}>{r.code}</h2>
          <StatusPill pill={statusPill('request', r.status)} />
        </div>
        <div className={s.actions}>
          {primary}
          {r.status === 'contacting' && (
            <Button variant="secondary" icon="phone-missed" loading={busy} onClick={() => void act(() => staff.requests.markUnreachable(r.id, r.version), `${r.code} chuyển sang Không liên lạc được.`)}>Không liên lạc được</Button>
          )}
          {(open || r.status === 'confirmed') && <Button variant="ghost" onClick={() => setDialog('cancel')}>Hủy yêu cầu…</Button>}
          {open && <Button variant="ghost" onClick={() => setDialog('reject')}>Từ chối…</Button>}
        </div>
      </header>
      <AnimatePresence initial={false}>
        {r.flaggedAt && (
          <m.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <FlagBanner>Khách vừa gửi lại — cần gọi lại · {atWhen(r.flaggedAt, now)}</FlagBanner>
          </m.div>
        )}
      </AnimatePresence>
      {!open && r.status !== 'confirmed' && <p className={s.closed}><Icon name="lock" size={16} /> Yêu cầu đã đóng. Khách có thể gửi yêu cầu mới nếu cần.</p>}

      <section className={s.block}>
        <h3 className={st.h2}>Thông tin khách đã gửi</h3>
        <p className={st.meta}>Giữ nguyên như lúc gửi, không chỉnh sửa. Gửi lúc {formatTimeVi(r.createdAt)}, {formatDateVi(r.createdAt)}.</p>
        <dl className={st.kv}>
          <dt>Họ tên</dt><dd>{r.snapshot.contact_name}</dd>
          <dt>Số điện thoại</dt><dd><Tel e164={r.snapshot.phone_e164} /></dd>
          <dt>Thú cưng</dt><dd>{r.snapshot.pet_name} · {SPECIES_LABEL[r.snapshot.species]}{r.snapshot.breed ? ` · ${r.snapshot.breed}` : ''}</dd>
          <dt>Dịch vụ</dt><dd>{SERVICE_LABEL[r.snapshot.service]}</dd>
          <dt>Ngày mong muốn</dt><dd>{formatLongDayVi(`${r.snapshot.desired_date}T12:00:00+07:00`)}</dd>
          <dt>Ghi chú của khách</dt><dd>{r.snapshot.note || <span className={st.meta}>Không có</span>}</dd>
          {r.account && (<><dt>Tài khoản web</dt><dd>{r.account.username} · {r.account.linkedCustomerCode ? `Đã liên kết với hồ sơ ${r.account.linkedCustomerCode}` : 'Chưa liên kết'}</dd></>)}
        </dl>
      </section>

      {r.appointment && (
        <section className={cx(s.block, s.aptCard)}>
          <Icon name="calendar-check" size={20} />
          <div>
            <p className={s.aptLine}>Lịch hẹn: {formatTimeVi(r.appointment.start_at)}, {dayLabel(r.appointment.start_at)}{r.appointment.assigneeName ? ` · ${r.appointment.assigneeName}` : ''}</p>
            {r.appointment.status === 'cancelled' && <p className={st.meta}>Lịch hẹn đã hủy</p>}
          </div>
          <ButtonLink to={calendarLink(r.appointment.start_at, r.appointment.id)} variant="secondary" size="sm">Xem trên lịch</ButtonLink>
        </section>
      )}

      <section className={s.block} ref={composer}>
        <h3 className={st.h2}>Cuộc gọi</h3>
        {calls.length === 0 ? <p className={st.empty}>Chưa có cuộc gọi nào.</p> : (
          <ul className={s.calls}>
            {calls.map((c, i) => (
              <li key={i} className={s.call}>
                <span className={s.outcome}>{c.label.replace('Cuộc gọi: ', '')}</span>
                {c.note && <span className={s.callNote}>{c.note}</span>}
                <span className={st.meta}>{c.actorName} · {whenShort(c.at)}</span>
              </li>
            ))}
          </ul>
        )}
        {(r.status === 'contacting' || r.status === 'unreachable') && <CallComposer r={r} />}
      </section>

      <section className={s.block}>
        <h3 className={st.h2}>Lịch sử</h3>
        <Timeline items={[...r.events].reverse().map((e) => ({ at: e.at, label: e.label, actor: e.actorName, note: e.kind === 'call' ? undefined : e.note, icon: EVENT_ICON[e.kind] }))} />
      </section>

      {r.status === 'contacting' && <ConfirmDialog r={r} version={dialog?.version ?? r.version} open={kind === 'confirm'} onClose={() => setDialog(null)} />}
      <CloseDialog r={r} version={dialog?.version ?? r.version} kind={kind === 'reject' ? 'reject' : 'cancel'} open={kind === 'cancel' || kind === 'reject'} onClose={() => setDialog(null)} />
    </article>
  );
}

const calendarLink = (startAt: string, aptId: string) => `${paths.nv.calendar}?view=ngay&date=${startAt.slice(0, 10)}&lich=${aptId}`;

function CallComposer({ r }: { r: StaffRequestDetail }) {
  const toast = useToast();
  const [outcome, setOutcome] = useState<CallOutcome | undefined>();
  const [note, setNote] = useState('');
  const [unreachable, setUnreachable] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const canMark = r.status === 'contacting' && (outcome === 'no_answer' || outcome === 'busy');

  async function save() {
    if (!outcome) { setErr('Bạn chọn kết quả cuộc gọi trước nhé.'); return; }
    setBusy(true);
    setErr('');
    try {
      await staff.requests.logCall(r.id, r.version, { outcome, note: note.trim() || undefined, markUnreachable: canMark && unreachable });
      toast({ message: canMark && unreachable ? `Đã lưu cuộc gọi. ${r.code} chuyển sang Không liên lạc được.` : 'Đã lưu cuộc gọi.' });
      setOutcome(undefined);
      setNote('');
      setUnreachable(false);
    } catch (e) {
      setErr(saveError(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={s.composer}>
      <p className={s.composerTitle}>Ghi cuộc gọi</p>
      <ChipGroup<CallOutcome> label="Kết quả cuộc gọi" value={outcome} onChange={(v) => { setOutcome(v); setErr(''); }}
        options={OUTCOMES.map((o) => ({ value: o, label: CALL_OUTCOME_LABEL[o] }))} />
      <Field label="Ghi chú" optional>
        <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ví dụ: Khách muốn đổi sang buổi chiều, gọi lại sau 11 giờ." />
      </Field>
      {canMark && <Checkbox label="Chuyển sang Không liên lạc được" checked={unreachable} onChange={(e) => setUnreachable(e.target.checked)} />}
      <FormError>{err}</FormError>
      <div><Button variant="secondary" icon="check" loading={busy} onClick={() => void save()}>Lưu cuộc gọi</Button></div>
    </div>
  );
}
