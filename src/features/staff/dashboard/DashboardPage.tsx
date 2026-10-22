import type { ReactNode } from 'react';
import { m } from 'motion/react';
import { AppLink } from '@/app/nav';
import { paths } from '@/app/routes';
import { useSession } from '@/app/session/SessionProvider';
import { system } from '@/data/public';
import { staff, type StaffAppointment } from '@/data/staff';
import { useQuery } from '@/data/hooks/useQuery';
import { formatLongDayVi, formatTimeVi, partOfDay, todayVN } from '@/lib/dates';
import { formatVnd } from '@/lib/money';
import { CountUp, Icon, StatusPill, statusPill, type IconName } from '@/ui';
import type { BadgeTone } from '@/ui/kit/Misc';
import { cx } from '@/lib/cx';
import { riseIn } from '@/ui/motion';
import { Panel, PetChip, ServiceChip, Tel } from '../ui';
import { NudgeList } from './NudgeList';
import s from '../Staff.module.css';

const GREETING = { sang: 'Chào buổi sáng', chieu: 'Chào buổi chiều', toi: 'Chào buổi tối' } as const;
const TONE_BG: Record<BadgeTone, string> = { peach: 'var(--badge-peach)', mint: 'var(--badge-mint)', lilac: 'var(--badge-lilac)', rose: 'var(--badge-rose)', cream: 'var(--cream-100)' };

/** Tổng quan (staff §3) without check-in tiles (R8): each tile and panel appears only with its capability. */
export function DashboardPage() {
  const { me, can, session } = useSession();
  const now = system.now();
  const today = todayVN(now);
  const myId = session?.kind === 'staff' ? session.staffId : '';
  const isSpaOnly = me?.kind === 'staff' && !can('appointments.manage');
  const isManager = can('reports.revenue');

  const reqs = useQuery(() => (can('requests.handle') ? staff.requests.list({ tab: 'can_xu_ly' }) : Promise.resolve(null)), [can('requests.handle')]);
  const apts = useQuery(() => (can('appointments.view') ? staff.appointments.listRange(today, today) : Promise.resolve(null)), [can('appointments.view'), today]);
  const board = useQuery(() => (can('inpatient.view') ? staff.inpatient.board() : Promise.resolve(null)), [can('inpatient.view')]);
  const unpaid = useQuery(async () => (can('payments.record')
    ? [...await staff.invoices.list({ state: 'unpaid' }), ...await staff.invoices.list({ state: 'partial' })] : null), [can('payments.record')]);
  const revenue = useQuery(() => (isManager ? staff.reports.revenue({ from: today, to: today }) : Promise.resolve(null)), [isManager, today]);

  const first = (me?.name ?? '').trim().split(/\s+/).pop() ?? '';
  const live = (apts.data ?? []).filter((a) => a.status === 'scheduled');
  const mine = isManager ? live : live.filter((a) => a.assigneeId === myId || (isSpaOnly && !a.assigneeId && a.service === 'spa'));
  const stays = (board.data ?? []).flatMap((t) => (t.stay ? [t.stay] : []));
  const flagged = (reqs.data ?? []).filter((r) => r.flaggedAt);
  const callBack = [...flagged, ...(reqs.data ?? []).filter((r) => r.status === 'unreachable' && !r.flaggedAt)];
  const noDiary = stays.filter((x) => !x.diaryToday);
  const owed = (unpaid.data ?? []).reduce((n, i) => n + i.remaining, 0);
  const critical = stays.filter((x) => x.internalStatus === 'critical').length;
  const watch = stays.filter((x) => x.internalStatus === 'watch').length;

  const subParts = [
    apts.data && `Hôm nay có ${live.length} lịch hẹn`,
    board.data && `${stays.length} bé đang nội trú`,
  ].filter(Boolean);

  return (
    <>
      <header className={s.pageHead}>
        <div className={s.pageHeadText}>
          <h1 className={s.greet}>{GREETING[partOfDay(now)]}, {first}</h1>
          <p className={s.pageSub}>{formatLongDayVi(now)}{subParts.length > 0 && <> · {subParts.join(' và ')}.</>}</p>
        </div>
      </header>

      <NudgeList />

      <div className={s.tiles}>
        {reqs.data && (
          <Tile to={paths.nv.requests} icon="inbox" tone="lilac" label="Yêu cầu cần xử lý" value={reqs.data.length} index={0}
            sub={flagged.length > 0 ? <span className={s.tileWarm}>{flagged.length} khách vừa gửi lại — cần gọi lại</span> : 'Chờ xác nhận, đang liên hệ, chưa liên lạc được'} />
        )}
        {apts.data && (
          <Tile to={paths.nv.calendar} icon="calendar-days" tone="peach" label="Lịch hẹn hôm nay" value={live.length} index={1}
            sub={`${live.filter((a) => !a.past).length} lịch còn lại trong ngày`} />
        )}
        {board.data && (
          <Tile to={paths.nv.board} icon="house-paw" tone="mint" label="Đang nội trú" value={stays.length} unit="bé" index={2}
            sub={[critical && `${critical} bé tình trạng nặng`, watch && `${watch} cần theo dõi`].filter(Boolean).join(' · ') || 'Các bé đều ổn định'} />
        )}
        {unpaid.data && (
          <Tile to={paths.nv.invoices} icon="receipt" tone="rose" label="Chưa thu tiền" value={unpaid.data.length} unit="hóa đơn" index={3}
            sub={<>Còn <strong>{formatVnd(owed)}</strong></>} />
        )}
        {revenue.data && (
          <Tile to={paths.nv.revenue} icon="chart-column" tone="cream" label="Thu hôm nay" value={revenue.data.collected} money index={4} sub="Xem doanh thu" />
        )}
      </div>

      <div className={s.cols}>
        <div className={s.stack}>
          {reqs.data && (
            <Panel title="Cần gọi lại" icon="phone-redo" action={<AppLink to={paths.nv.requests} className={s.linkBtn}>Mở hàng đợi <Icon name="arrow-right" size={14} /></AppLink>}>
              {callBack.length === 0 ? <p className={s.empty}>Không có khách nào cần gọi lại.</p> : (
                <ul className={s.rows}>
                  {callBack.slice(0, 6).map((r) => (
                    <li key={r.id} className={s.row}>
                      <div className={s.rowMain}>
                        <span className={s.rowTitle}>{r.contactName} · {r.petName}</span>
                        <span className={s.meta}>
                          {r.flaggedAt ? <span className={s.tileWarm}>Khách vừa gửi lại · </span> : null}
                          {r.callCount > 0 ? `Đã gọi ${r.callCount} lần` : 'Chưa gọi'} · {r.code}
                        </span>
                      </div>
                      <Tel e164={r.phone} />
                      <AppLink to={paths.nv.request(r.id)} className={s.linkBtn}>Mở</AppLink>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          )}
          {apts.data && (
            <Panel title={isManager ? 'Lịch hôm nay' : 'Lịch của tôi hôm nay'} icon="calendar-days"
              action={<AppLink to={paths.nv.calendar} className={s.linkBtn}>Xem lịch <Icon name="arrow-right" size={14} /></AppLink>}>
              <Agenda items={(mine.some((a) => !a.past) ? mine.filter((a) => !a.past) : mine).slice(0, 5)} />
            </Panel>
          )}
        </div>
        <div className={s.stack}>
          {board.data && can('inpatient.share') && (
            <Panel title="Chưa gửi nhật ký hôm nay" icon="diary">
              {noDiary.length === 0 ? <p className={s.empty}>Các bé đều đã có nhật ký hôm nay.</p> : (
                <div className={s.chipsWrap}>
                  {noDiary.map((x) => (
                    <AppLink key={x.id} to={paths.nv.stay(x.id)} className={s.linkBtn} style={{ background: 'var(--plum-50)' }}>
                      <Icon name={x.species === 'cat' ? 'cat-face' : 'dog-face'} size={16} /> {x.petName}
                    </AppLink>
                  ))}
                </div>
              )}
            </Panel>
          )}
          {board.data && (
            <Panel title="Nội trú" icon="house-paw" action={<AppLink to={paths.nv.board} className={s.linkBtn}>Sơ đồ chuồng <Icon name="arrow-right" size={14} /></AppLink>}>
              {stays.length === 0 ? <p className={s.empty}>Hiện không có bé nào nội trú.</p> : (
                <ul className={s.rows}>
                  {stays.map((x) => (
                    <li key={x.id} className={s.row}>
                      <div className={s.rowMain}>
                        <span className={s.rowTitle}>{x.petName} · ngày thứ {x.dayNumber}</span>
                        <span className={s.meta}>{x.ownerName}{x.doctorName ? ` · ${x.doctorName}` : ''}</span>
                      </div>
                      <StatusPill pill={statusPill('internal', x.internalStatus)} dense />
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          )}
        </div>
      </div>
    </>
  );
}

function Tile({ to, icon, tone, label, value, unit, sub, money, index }: {
  to: string; icon: IconName; tone: BadgeTone; label: string; value: number; unit?: string; sub: ReactNode; money?: boolean; index: number;
}) {
  return (
    <m.div {...riseIn(8, index * 0.05)}>
      <AppLink to={to} className={s.tile} data-tile>
        <span className={s.tileLabel}><span className={s.tileIcon} style={{ background: TONE_BG[tone] }}><Icon name={icon} size={16} /></span>{label}</span>
        <span className={s.tileNum}><CountUp value={value} format={money ? formatVnd : undefined} />{unit && <small>{unit}</small>}</span>
        <span className={s.tileSub}>{sub}</span>
      </AppLink>
    </m.div>
  );
}

function Agenda({ items }: { items: StaffAppointment[] }) {
  if (items.length === 0) return <p className={s.empty}>Hôm nay chưa có lịch hẹn.</p>;
  return (
    <ul className={s.rows}>
      {items.map((a) => (
        <li key={a.id} className={cx(s.row, a.past && s.rowPast)}>
          <span className={s.rowTime}>{formatTimeVi(a.start_at)}</span>
          <div className={s.rowMain}>
            <span className={s.chipsWrap}><PetChip name={a.petName} species={a.species} /><ServiceChip service={a.service} short /></span>
            <span className={s.meta}>{a.customerName}{a.assigneeName ? ` · ${a.assigneeName}` : ' · Chưa phân công'}</span>
          </div>
          <AppLink to={`${paths.nv.calendar}?view=ngay&date=${a.start_at.slice(0, 10)}&lich=${a.id}`} className={s.linkBtn}>Mở</AppLink>
        </li>
      ))}
    </ul>
  );
}
