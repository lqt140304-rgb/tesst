import { m, useReducedMotion } from 'motion/react';
import { AppLink } from '@/app/nav';
import { paths } from '@/app/routes';
import { customer, type CustomerBookingRow, type CustomerOverview } from '@/data/customer';
import type { CustomerInvoiceRow, CustomerPetCard, CustomerStayCard } from '@/data/customer';
import { useQuery } from '@/data/hooks/useQuery';
import { system } from '@/data/public';
import { daysBetween, dayOf, formatDateVi, formatDayVi, formatTimeVi } from '@/lib/dates';
import { Button, ButtonLink, DemoTag, Icon, IconBadge, Money, PetAvatar, SectionCard, StatusPill, statusPill, EmptyState } from '@/ui';
import { cx } from '@/lib/cx';
import { ease, preset, riseIn } from '@/ui/motion';
import { petPhoto, svgArt } from '@/assets/media';
import { DrawCheck, HOTLINE, LinkCode, LoadingBlocks, PageProblem, TEL, petLine, serviceLabel } from '../ui';
import { rowPill } from '../appointments/BookingRow';
import s from '../Customer.module.css';
import o from './Overview.module.css';

const RECENT_DAYS = 14;

export function greeting(o: Pick<CustomerOverview, 'greetingName' | 'salutation'>) {
  const last = o.greetingName.trim().split(/\s+/).pop() ?? '';
  return o.salutation === 'anh' ? `Chào anh ${last}` : o.salutation === 'chi' ? `Chào chị ${last}` : `Xin chào, ${last}`;
}

/** Tổng quan (spec 2026-10-21 §3.2): greeting band, then Bé hôm nay · Lịch hẹn sắp tới · Thú cưng của bạn · Hóa đơn gần đây. */
export function OverviewPage() {
  const q = useQuery(async () => {
    const [ov, lists] = await Promise.all([customer.overview(), customer.appointments.list()]);
    const invoices = ov.linked ? await customer.invoices.list() : [];
    return [ov, lists, invoices] as const;
  }, []);
  const reduced = useReducedMotion() ?? false;
  if (q.error) return <PageProblem error={q.error} onRetry={q.refetch} />;
  if (!q.data) return <LoadingBlocks rows={4} />;
  const [ov, lists, invoices] = q.data;
  const now = system.now();
  const recent = (iso?: string) => !!iso && daysBetween(iso, now) <= RECENT_DAYS;
  const showWelcome = !ov.seen.includes('welcome') && recent(ov.accountCreatedAt);
  const showLinked = ov.linked && !ov.seen.includes('linked') && recent(ov.linkedAt);
  const processing = lists.processing;
  const nothing = ov.linked && !ov.activeStays.length && !ov.nextAppointment && !processing.length && !ov.unpaid.count;
  const cell = (i: number) => preset('enterList', { reduced, index: i });

  return (
    <>
      <section className={o.band} aria-labelledby="kh-greeting">
        <div className={o.bandText}>
          <h1 id="kh-greeting" className={o.h1}>{greeting(ov)}.</h1>
          <p className={o.sub}>Cảm ơn bạn đã tin tưởng Lê Sơn đồng hành cùng các bé.</p>
        </div>
        <div className={o.art} aria-hidden="true">
          <svg className={o.orbit} viewBox="0 0 100 100" preserveAspectRatio="none" fill="none">
            <ellipse cx="50" cy="50" rx="49" ry="34" stroke="var(--plum-300)" strokeWidth="1.2" vectorEffect="non-scaling-stroke" transform="rotate(-12 50 50)" />
          </svg>
          <figure className={cx(o.photo, o.dog)}><img src={petPhoto('cho-vang', 'card')} alt="" width={128} height={150} /></figure>
          <figure className={cx(o.photo, o.cat)}><img src={petPhoto('meo-tam-the', 'card')} alt="" width={112} height={112} /></figure>
          <DemoTag className={o.tag}>Ảnh minh họa</DemoTag>
        </div>
      </section>

      {showLinked && (
        <m.section className={cx(s.card, s.full, s.celebrate, o.full)} {...riseIn(12)}>
          <DrawCheck />
          <div>
            <h2 className={s.cardTitle}>Đã liên kết hồ sơ</h2>
            <p>Từ nay bạn xem được hóa đơn, nhật ký nội trú và video của bé ngay tại đây.</p>
          </div>
          <Button size="sm" variant="secondary" onClick={() => void customer.markSeen('linked')}>Đã hiểu</Button>
        </m.section>
      )}
      {!ov.linked && <div className={o.full}><UnlinkedBanner code={ov.linkCode} /></div>}
      {showWelcome && <div className={o.full}><Welcome o={ov} hasRequests={!!ov.nextAppointment || processing.length > 0 || lists.past.length > 0} /></div>}

      <div className={o.grid}>
        {ov.activeStays.map((st, i) => (
          <m.div key={st.id} className={o.cell} data-card="pet-today" {...cell(i)}>
            <PetToday st={st} />
          </m.div>
        ))}
        <m.div className={o.cell} data-card="next-appointment" {...cell(1)}>
          <NextAppointment next={ov.nextAppointment} processing={processing} pets={ov.pets} />
        </m.div>
        <m.div className={o.cell} data-card="pets" {...cell(2)}>
          <PetsCard pets={ov.pets} stays={ov.activeStays} />
        </m.div>
        <m.div className={o.cell} data-card="invoices" {...cell(3)}>
          <InvoicesCard linked={ov.linked} code={ov.linkCode} invoices={invoices} />
        </m.div>
      </div>

      {nothing && (
        <div className={s.full}>
          <EmptyState art={<img src={svgArt('cat-pose-booking')} alt="" className={s.problemArt} />} title="Chưa có gì mới"
            body="Khi bạn gửi yêu cầu hoặc bé có cập nhật từ Lê Sơn, mọi thứ sẽ hiện ở đây."
            action={<ButtonLink to={paths.kh.book} icon="calendar-plus">Gửi yêu cầu đặt lịch</ButtonLink>} />
        </div>
      )}
    </>
  );
}

function PetToday({ st }: { st: CustomerStayCard }) {
  return (
    <SectionCard title={`Bé ${st.petName} hôm nay`} action={{ label: 'Xem nhật ký', to: paths.kh.stay(st.id) }}>
      <div className={o.today}>
        <PetAvatar name={st.petName} species={st.species} photoKey={st.photoKey} size={96} />
        <div className={o.todayBody}>
          <div className={o.chips}>
            {st.latestStatus && <StatusPill pill={statusPill('general', st.latestStatus)} />}
            <span className={s.muted}>Ngày thứ {st.dayNumber} nội trú</span>
          </div>
          {st.latestText && <p className={o.todayText}><strong>{st.updatedLabel}:</strong> {st.latestText}</p>}
          {st.videoCount > 0 && <div className={o.chips}><span className={o.softChip}><Icon name="video" size={15} /> {st.videoCount} video</span></div>}
        </div>
      </div>
    </SectionCard>
  );
}

function NextAppointment({ next, processing, pets }: { next?: CustomerBookingRow; processing: CustomerBookingRow[]; pets: CustomerPetCard[] }) {
  const r = next ?? processing[0];
  const pet = r ? pets.find((p) => p.name === r.petName) : undefined;
  const at = next?.appointmentAt;
  const day = at ? formatDayVi(at).replace(',', '') : '';
  return (
    <SectionCard title="Lịch hẹn sắp tới" action={{ label: 'Xem tất cả', to: paths.kh.appts }}>
      <div className={o.next}>
        {r ? (
          <>
            <div className={o.nextRow}>
              <PetAvatar name={r.petName} species={pet?.species ?? 'other'} photoKey={pet?.photoKey} size={56} />
              <div>
                <p className={o.when}>
                  {at ? `${formatTimeVi(at)} · ${day.charAt(0).toLowerCase()}${day.slice(1)}/${dayOf(at).slice(0, 4)}` : r.desiredDate ? `Mong muốn ${formatDateVi(`${r.desiredDate}T12:00:00+07:00`)}` : 'Chờ Lê Sơn gọi'}
                </p>
                <p className={o.line}>Bé {r.petName} · {serviceLabel(r.service)}</p>
                <StatusPill pill={rowPill(r)} dense />
              </div>
            </div>
            {next && <p className={o.note}>Cần đổi hoặc hủy lịch? Gọi <a href={TEL}>{HOTLINE}</a>.</p>}
            {!next && processing.length > 1 && <p className={o.note}>Còn {processing.length - 1} yêu cầu đang xử lý.</p>}
            {next && processing.length > 0 && <p className={o.note}>Còn {processing.length} yêu cầu đang xử lý.</p>}
          </>
        ) : <p className={o.empty}>Chưa có lịch hẹn nào.</p>}
        <div className={o.more}>
          <ButtonLink to={paths.kh.book} icon="calendar-plus">Đặt lịch mới</ButtonLink>
          {r && <AppLink to={r.kind === 'request' ? paths.kh.request(r.id) : paths.kh.appts} className={s.more}>Xem chi tiết <Icon name="chevron-right" size={16} /></AppLink>}
        </div>
      </div>
    </SectionCard>
  );
}

function PetsCard({ pets, stays }: { pets: CustomerPetCard[]; stays: CustomerStayCard[] }) {
  const inStay = new Set(stays.map((st) => st.petName));
  return (
    <SectionCard title="Thú cưng của bạn" action={{ label: 'Quản lý thú cưng', to: paths.kh.pets }}>
      <ul className={o.list}>
        {pets.slice(0, 3).map((p) => (
          <li key={p.id}>
            <AppLink to={paths.kh.pet(p.id)} className={o.row}>
              <PetAvatar name={p.name} species={p.species} photoKey={p.photoKey} size={40} decorative />
              <span><span className={o.rowName}>{p.name}</span><span className={o.rowSub}>{petLine(p)}</span></span>
              {inStay.has(p.name) ? <StatusPill pill={{ label: 'Đang nội trú', tone: 'plum', icon: 'house-paw' }} dense /> : <Icon name="chevron-right" size={18} />}
            </AppLink>
          </li>
        ))}
      </ul>
      <AppLink to={`${paths.kh.pets}?them=1`} className={o.addPet}>
        <span className={o.addCircle}><Icon name="plus" size={20} /></span>
        <span><span className={o.rowName}>Thêm thú cưng</span><span className={o.rowSub}>Lưu thông tin để đặt lịch nhanh hơn</span></span>
      </AppLink>
    </SectionCard>
  );
}

function InvoicesCard({ linked, code, invoices }: { linked: boolean; code: string; invoices: CustomerInvoiceRow[] }) {
  const recent = [...invoices].sort((a, b) => b.issuedAt.localeCompare(a.issuedAt)).slice(0, 3);
  return (
    <SectionCard title="Hóa đơn gần đây" action={linked ? { label: 'Xem tất cả', to: paths.kh.invoices } : undefined}>
      {!linked ? (
        <p className={o.empty}>Hóa đơn của bé sẽ hiện ở đây sau khi nhân viên liên kết hồ sơ. Mã kết nối của bạn: <strong className="num">{code}</strong>.</p>
      ) : recent.length === 0 ? (
        <p className={o.empty}>Bạn chưa có hóa đơn nào.</p>
      ) : (
        <>
          <ul className={o.list}>
            {recent.map((inv) => (
              <li key={inv.id} data-invoice-row>
                <AppLink to={paths.kh.invoice(inv.id)} className={o.row}>
                  <span className={o.docIcon} aria-hidden="true"><Icon name="receipt" size={20} /></span>
                  <span>
                    <span className={cx(o.rowName, 'num')}>{inv.code}</span>
                    <span className={o.rowSub}>{inv.summary} · {inv.petNames.join(', ')}</span>
                  </span>
                  <span className={o.rowEnd}>
                    <span className={cx(o.rowSub, 'num')}>{formatDateVi(inv.issuedAt)}</span>
                    <span className={o.money}><Money value={inv.total} /></span>
                  </span>
                </AppLink>
              </li>
            ))}
          </ul>
          <p className={o.counter}><Icon name="info" size={18} /><span><strong>Thanh toán tại quầy.</strong> Bạn thanh toán khi đến Lê Sơn. Cảm ơn bạn!</span></p>
        </>
      )}
    </SectionCard>
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
