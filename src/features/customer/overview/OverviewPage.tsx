import { m } from 'motion/react';
import { AppLink } from '@/app/nav';
import { paths } from '@/app/routes';
import { customer, type CustomerBookingRow, type CustomerOverview } from '@/data/customer';
import { useQuery } from '@/data/hooks/useQuery';
import { system } from '@/data/public';
import { daysBetween, dayOf, formatDayVi, formatTimeVi } from '@/lib/dates';
import { Button, ButtonLink, Icon, IconBadge, Money, StatusPill, statusPill, EmptyState } from '@/ui';
import { cx } from '@/lib/cx';
import { ease, riseIn } from '@/ui/motion';
import { svgArt } from '@/assets/media';
import { DateBlock, DrawCheck, HOTLINE, LinkCode, LoadingBlocks, PageProblem, PetAvatar, TEL, serviceLabel } from '../ui';
import { rowPill } from '../appointments/BookingRow';
import s from '../Customer.module.css';

const RECENT_DAYS = 14;

export function greeting(o: Pick<CustomerOverview, 'greetingName' | 'salutation'>) {
  const last = o.greetingName.trim().split(/\s+/).pop() ?? '';
  return o.salutation === 'anh' ? `Chào anh ${last}` : o.salutation === 'chi' ? `Chào chị ${last}` : `Xin chào, ${last}`;
}

/** "Thứ Hai, 19 tháng 10" */
function longToday(now: Date) {
  const d = dayOf(now);
  return `${formatDayVi(now).split(',')[0]}, ${Number(d.slice(8, 10))} tháng ${Number(d.slice(5, 7))}`;
}

/** Tổng quan (customer §9.1–9.3): only cards with content, most important first. */
export function OverviewPage() {
  const q = useQuery(() => Promise.all([customer.overview(), customer.appointments.list()]), []);
  if (q.error) return <PageProblem error={q.error} onRetry={q.refetch} />;
  if (!q.data) return <LoadingBlocks rows={4} />;
  const [o, lists] = q.data;
  const now = system.now();
  const recent = (iso?: string) => !!iso && daysBetween(iso, now) <= RECENT_DAYS;
  const showWelcome = !o.seen.includes('welcome') && recent(o.accountCreatedAt);
  const showLinked = o.linked && !o.seen.includes('linked') && recent(o.linkedAt);
  const processing = lists.processing;
  const nothing = o.linked && !o.activeStays.length && !o.nextAppointment && !processing.length && !o.unpaid.count;

  return (
    <>
      <header className={s.greet}>
        <div>
          <h1 className={s.greetTitle}>{greeting(o)}</h1>
          <p className={s.pageSub}>{longToday(now)} · Đây là những cập nhật mới nhất về các bé.</p>
        </div>
        <ButtonLink to={paths.kh.book} icon="calendar-plus">Gửi yêu cầu đặt lịch</ButtonLink>
      </header>

      <div className={s.cards}>
        {showLinked && (
          <m.section className={cx(s.card, s.full, s.celebrate)} {...riseIn(12)}>
            <DrawCheck />
            <div>
              <h2 className={s.cardTitle}>Đã liên kết hồ sơ</h2>
              <p>Từ nay bạn xem được hóa đơn, nhật ký nội trú và video của bé ngay tại đây.</p>
            </div>
            <Button size="sm" variant="secondary" onClick={() => void customer.markSeen('linked')}>Đã hiểu</Button>
          </m.section>
        )}

        {!o.linked && <UnlinkedBanner code={o.linkCode} />}

        {showWelcome && <Welcome o={o} hasRequests={!!o.nextAppointment || processing.length > 0 || lists.past.length > 0} />}

        {o.activeStays.map((st, i) => (
          <m.section key={st.id} className={cx(s.card, s.full, s.stayCard)} {...riseIn(12, i * 0.05)}>
            <IconBadge icon="house-paw" tone="lilac" size={56} />
            <div className={s.stayBody}>
              <div className={s.rowTop}>
                <h2 className={s.cardTitle}>Bé {st.petName} đang nội trú</h2>
                <span className={s.muted}>· ngày thứ {st.dayNumber}</span>
                {st.latestStatus && <StatusPill pill={statusPill('general', st.latestStatus)} />}
              </div>
              {st.latestText && <p className={s.stayLatest}><strong>{st.updatedLabel}:</strong> {st.latestText}</p>}
              <div className={s.rowActions}>
                {st.videoCount > 0 && <span className={s.softChip}><Icon name="video" size={15} /> {st.videoCount} video</span>}
                <ButtonLink to={paths.kh.stay(st.id)} size="sm" iconRight="arrow-right">Xem nhật ký & video</ButtonLink>
              </div>
            </div>
          </m.section>
        ))}

        {o.nextAppointment && <NextAppointment r={o.nextAppointment} />}

        {processing.length > 0 && (
          <m.section className={s.card} {...riseIn(12, 0.08)}>
            <h2 className={s.cardTitle}>Yêu cầu đang xử lý ({processing.length})</h2>
            <ul className={s.miniList}>
              {processing.slice(0, 3).map((r) => (
                <li key={r.id}>
                  <AppLink to={r.kind === 'request' ? paths.kh.request(r.id) : paths.kh.appts} className={s.miniRow}>
                    <span>{serviceLabel(r.service)} · bé {r.petName}{r.desiredDate ? ` · mong muốn ${r.desiredDate.slice(8, 10)}/${r.desiredDate.slice(5, 7)}` : ''}</span>
                    <StatusPill pill={rowPill(r)} dense />
                  </AppLink>
                </li>
              ))}
            </ul>
            <AppLink to={paths.kh.appts} className={s.more}>Xem tất cả <Icon name="chevron-right" size={16} /></AppLink>
          </m.section>
        )}

        {o.linked && (
          <m.section className={s.card} {...riseIn(12, 0.12)}>
            <h2 className={s.cardTitle}><Icon name="receipt" size={20} /> Hóa đơn</h2>
            {o.unpaid.count > 0 ? (
              <>
                <p className={s.bigLine}><strong>{o.unpaid.count} hóa đơn chưa thanh toán</strong> · <Money value={o.unpaid.remaining} /></p>
                <p className={s.note}>Bạn thanh toán tại quầy khi đến Lê Sơn nhé.</p>
              </>
            ) : <p className={s.note}>Bạn không có hóa đơn nào cần thanh toán.</p>}
            <AppLink to={paths.kh.invoices} className={s.more}>Xem hóa đơn <Icon name="chevron-right" size={16} /></AppLink>
          </m.section>
        )}

        <m.section className={s.card} {...riseIn(12, 0.16)}>
          <h2 className={s.cardTitle}><Icon name="paw" size={20} /> Các bé của bạn</h2>
          <ul className={s.petRow}>
            {o.pets.map((p) => (
              <li key={p.id}><AppLink to={paths.kh.pet(p.id)} className={s.petChip}><PetAvatar name={p.name} species={p.species} size={40} /><span>{p.name}</span></AppLink></li>
            ))}
            <li><AppLink to={`${paths.kh.pets}?them=1`} className={cx(s.petChip, s.addPet)}><span className={s.addCircle}><Icon name="plus" size={20} /></span><span>Thêm bé</span></AppLink></li>
          </ul>
        </m.section>

        {nothing && (
          <div className={s.full}>
            <EmptyState art={<img src={svgArt('cat-pose-booking')} alt="" className={s.problemArt} />} title="Chưa có gì mới"
              body="Khi bạn gửi yêu cầu hoặc bé có cập nhật từ Lê Sơn, mọi thứ sẽ hiện ở đây."
              action={<ButtonLink to={paths.kh.book} icon="calendar-plus">Gửi yêu cầu đặt lịch</ButtonLink>} />
          </div>
        )}
      </div>
    </>
  );
}

function NextAppointment({ r }: { r: CustomerBookingRow }) {
  const at = r.appointmentAt!;
  const day = formatDayVi(at).replace(',', '');
  return (
    <m.section className={cx(s.card, s.nextCard)} data-card="next-appointment" {...riseIn(12, 0.04)}>
      <h2 className={s.cardTitle}>Lịch hẹn sắp tới</h2>
      <div className={s.nextBody}>
        <DateBlock iso={at} />
        <div>
          <p className={s.bigLine}><strong>{formatTimeVi(at)}</strong> · {day.charAt(0).toLowerCase()}{day.slice(1)}/{dayOf(at).slice(0, 4)}</p>
          <p>Bé {r.petName} · {serviceLabel(r.service)}</p>
          <StatusPill pill={rowPill(r)} dense />
        </div>
      </div>
      <p className={s.note}>Cần đổi hoặc hủy lịch? Gọi <a href={TEL}>{HOTLINE}</a>.</p>
      <AppLink to={r.kind === 'request' ? paths.kh.request(r.id) : paths.kh.appts} className={s.more}>Xem chi tiết <Icon name="chevron-right" size={16} /></AppLink>
    </m.section>
  );
}

/** Not-yet-linked banner (customer §9.3 with R1: link code, never automatic, never by phone). */
export function UnlinkedBanner({ code }: { code: string }) {
  return (
    <m.section className={cx(s.card, s.full, s.unlinked)} {...riseIn(12)}>
      <IconBadge icon="link-2" tone="lilac" size={52} />
      <div className={s.stack}>
        <h2 className={s.cardTitle}>Tài khoản của bạn chưa liên kết với hồ sơ tại Lê Sơn</h2>
        <p>Để giữ an toàn cho thông tin của bé, hóa đơn, nhật ký nội trú và video chỉ hiện sau khi nhân viên xác nhận bạn là chủ hồ sơ. Bạn chỉ cần làm việc này một lần.</p>
        <p><strong>Cách liên kết:</strong> lần tới khi đến Lê Sơn, bạn mở trang này và đưa mã cho nhân viên để được liên kết. Nếu bé chưa từng đến Lê Sơn, nhân viên sẽ liên kết giúp bạn trong lần đầu bạn đưa bé đến.</p>
        <LinkCode code={code} />
        <p>Trong lúc chờ, bạn vẫn có thể:</p>
        <p className={s.inlineLinks}>
          <AppLink to={`${paths.kh.pets}?them=1`}>Thêm hồ sơ bé</AppLink> · <AppLink to={paths.kh.book}>Gửi yêu cầu đặt lịch</AppLink> · <AppLink to={paths.kh.appts}>Theo dõi yêu cầu đã gửi</AppLink>
        </p>
        <p className={s.small}>Có thắc mắc? Gọi <a href={TEL}>{HOTLINE}</a>.</p>
      </div>
    </m.section>
  );
}

/** First-run welcome (customer §9.2): each row ticks itself when done; "Ẩn hướng dẫn" dismisses it for good. */
function Welcome({ o, hasRequests }: { o: CustomerOverview; hasRequests: boolean }) {
  const steps = [
    { done: o.pets.length > 0, text: 'Thêm hồ sơ bé đầu tiên', action: <ButtonLink size="sm" variant="secondary" to={`${paths.kh.pets}?them=1`}>Thêm bé</ButtonLink> },
    { done: hasRequests, text: 'Gửi yêu cầu đặt lịch khi bé cần', action: <ButtonLink size="sm" variant="secondary" to={paths.kh.book}>Gửi yêu cầu</ButtonLink> },
    { done: o.linked, text: 'Liên kết hồ sơ tại bệnh viện', action: <span className={s.small}>Lần tới khi đến Lê Sơn, bạn mở trang này và đưa mã {o.linkCode} cho nhân viên.</span> },
  ];
  return (
    <m.section className={cx(s.card, s.full, s.welcome)} {...riseIn(12)}>
      <div className={s.sectionHead}>
        <h2 className={s.cardTitle}>Chào mừng bạn đến với Lê Sơn!</h2>
        <button type="button" className={s.quiet} onClick={() => void customer.markSeen('welcome')}>Ẩn hướng dẫn</button>
      </div>
      <ol className={s.checklist}>
        {steps.map((st) => (
          <li key={st.text} className={cx(st.done && s.checkDone)}>
            <m.span className={s.checkBox} initial={false} animate={{ scale: st.done ? [0.8, 1.08, 1] : 1 }} transition={{ duration: 0.35, ease: ease.pop }}>
              {st.done && <Icon name="check" size={16} />}
            </m.span>
            <span className={s.checkText}>{st.text}</span>
            {!st.done && st.action}
          </li>
        ))}
      </ol>
    </m.section>
  );
}
