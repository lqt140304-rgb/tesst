import { useState } from 'react';
import { useParams } from 'react-router';
import { useAppNavigate } from '@/app/nav';
import { paths } from '@/app/routes';
import { useSession } from '@/app/session/SessionProvider';
import { customer } from '@/data/customer';
import { useQuery } from '@/data/hooks/useQuery';
import { DIARY_CATEGORY_LABEL, SEX_LABEL, SERVICE_LABEL, SPECIES_LABEL, type DiaryCategory } from '@/data/contracts/enums';
import { DATA_READY } from '@/features/data-ready';
import { formatDateVi } from '@/lib/dates';
import { formatKg } from '@/lib/units';
import { Button, ButtonLink, Dialog, Icon, PetAvatar, SectionCard, StatusPill, useToast, type IconName } from '@/ui';
import { cx } from '@/lib/cx';
import type { CustomerBookingRow } from '@/data/customer';
import { rowPill } from '../appointments/BookingRow';
import { HOTLINE, LoadingBlocks, PageHeader, PageProblem, TEL } from '../ui';
import { PetForm } from './PetForm';
import s from '../Customer.module.css';
import o from './Profile.module.css';

const COND_ICON: Record<Exclude<DiaryCategory, 'loi_nhan'>, IconName> = { an_uong: 'utensils', nghi_ngoi: 'moon', tinh_than: 'smile', van_dong: 'footprints' };

/** Past rows say "Đã qua" (never "Hoàn thành"); a refused, unreachable or cancelled one keeps its own word. */
const pastPill = (r: CustomerBookingRow) => (r.status === 'confirmed' && !r.appointmentCancelled
  ? { label: 'Đã qua', tone: 'grey' as const, icon: 'clock' as const }
  : rowPill(r));

const when = (r: CustomerBookingRow) => (r.appointmentAt ? formatDateVi(r.appointmentAt) : r.desiredDate ? formatDateVi(`${r.desiredDate}T12:00:00+07:00`) : '—');

/** Hồ sơ bé (spec 2026-10-21 §3.4): hospital records are read-only; self-added pets can be edited or removed. */
export function PetPage() {
  const { petId = '' } = useParams();
  const q = useQuery(() => customer.pets.get(petId), [petId]);
  const { me } = useSession();
  const navigate = useAppNavigate();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  if (q.error) return <PageProblem error={q.error} onRetry={q.refetch} />;
  if (!q.data) return <LoadingBlocks />;
  const { pet, bookings, condition } = q.data;
  const hospital = pet.source === 'hospital';
  const linked = me?.kind === 'customer' && me.linked;
  const past = bookings.filter((r) => r.group === 'past').slice(0, 5);
  const showWeight = DATA_READY.petWeight && pet.weightKg !== undefined;
  const showCondition = DATA_READY.petCondition && (condition.length > 0 || showWeight);

  return (
    <>
      <PageHeader title={`Hồ sơ của ${pet.name}`} sub="Thông tin chi tiết và lịch sử chăm sóc của bé."
        crumbs={[{ label: 'Trang chủ', to: paths.kh.home }, { label: 'Thú cưng', to: paths.kh.pets }, { label: `Hồ sơ của ${pet.name}` }]}
        actions={<>
          {!hospital && <Button variant="secondary" icon="pencil" onClick={() => setEditing(true)}>Chỉnh sửa</Button>}
          <ButtonLink to={`${paths.kh.book}?thu-cung=${encodeURIComponent(pet.id)}`} icon="calendar-plus">Đặt lịch cho {pet.name}</ButtonLink>
        </>} />

      <section className={o.info} data-block="info" aria-label={`Thông tin của ${pet.name}`}>
        <span className={o.photo}><PetAvatar name={pet.name} species={pet.species} photoKey={pet.photoKey} size={160} /></span>
        <dl className={o.rows}>
          <div><dt>Tên</dt><dd>{pet.name}</dd></div>
          <div><dt>Loài</dt><dd>{SPECIES_LABEL[pet.species]}</dd></div>
          <div><dt>Giống</dt><dd>{pet.breed || '—'}</dd></div>
          <div><dt>Giới tính</dt><dd>{pet.sex ? SEX_LABEL[pet.sex] : 'Chưa rõ'}</dd></div>
          <div><dt>Năm sinh</dt><dd>{pet.birthYear ? `${pet.birthYear}${pet.ageYears !== undefined ? ` (${pet.ageYears < 1 ? 'dưới 1 tuổi' : `${pet.ageYears} tuổi`})` : ''}` : '—'}</dd></div>
          {showWeight && <div><dt>Cân nặng</dt><dd className="num">{formatKg(pet.weightKg!)}</dd></div>}
          {!hospital && <div><dt>Điều Lê Sơn nên biết</dt><dd>{pet.note || 'Bạn chưa ghi gì. Bấm "Chỉnh sửa" để thêm.'}</dd></div>}
          {hospital && <div><dt>Hồ sơ</dt><dd><span className={o.tag}><Icon name="circle-check" size={14} /> Hồ sơ tại Lê Sơn</span></dd></div>}
        </dl>
        {hospital && <p className={o.small}>Thông tin này do Lê Sơn cập nhật. Cần chỉnh sửa? Bạn báo nhân viên khi đến hoặc gọi <a href={TEL}>{HOTLINE}</a>.</p>}
      </section>

      <div className={o.cols}>
        <div className={o.cell} data-block="past">
          <SectionCard title="Lịch hẹn đã qua" action={{ label: 'Xem tất cả', to: `${paths.kh.appts}?tab=lich-su` }}>
            {past.length ? (
              <table className={o.table}>
                <thead><tr><th scope="col">Ngày</th><th scope="col">Dịch vụ</th><th scope="col">Trạng thái</th></tr></thead>
                <tbody>
                  {past.map((r) => (
                    <tr key={r.id}>
                      <td className="num">{when(r)}</td>
                      <td>{SERVICE_LABEL[r.service]}</td>
                      <td><StatusPill pill={pastPill(r)} dense /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <p className={o.none}>Bé chưa có lịch hẹn nào đã qua.</p>}
          </SectionCard>
        </div>
        {showCondition && (
          <div className={o.cell} data-block="condition">
            <SectionCard title={`Tình trạng chung của ${pet.name}`}>
              <ul className={o.cond}>
                {condition.map((c) => (
                  <li key={c.category} className={o.condRow}>
                    <span className={o.condIcon} aria-hidden="true"><Icon name={COND_ICON[c.category]} size={20} /></span>
                    <span>
                      <span className={o.condTitle}>{DIARY_CATEGORY_LABEL[c.category]} <span className={o.condDate}>· {c.dateLabel}</span></span>
                      <span className={o.condText}>{c.text}</span>
                    </span>
                  </li>
                ))}
                {showWeight && (
                  <li className={o.condRow}>
                    <span className={o.condIcon} aria-hidden="true"><Icon name="scales" size={20} /></span>
                    <span><span className={o.condTitle}>Cân nặng</span><span className={cx('num', o.condText)}>{formatKg(pet.weightKg!)}</span></span>
                  </li>
                )}
              </ul>
            </SectionCard>
          </div>
        )}
      </div>
      {!linked && <p className={s.lockLine} style={{ marginTop: 16 }}><Icon name="lock" size={16} /> Nội trú và hóa đơn của bé sẽ hiện sau khi liên kết hồ sơ.</p>}
      {!hospital && (
        <div className={cx(s.dangerZone, o.danger)}>
          <button type="button" className={s.quiet} onClick={() => setConfirm(true)}>Xóa hồ sơ bé</button>
        </div>
      )}

      <PetForm open={editing} onClose={() => setEditing(false)} pet={pet} />
      <Dialog open={confirm} onClose={() => setConfirm(false)} title={`Xóa hồ sơ bé ${pet.name} khỏi tài khoản?`} intro="Các yêu cầu đã gửi vẫn được giữ nguyên."
        footer={<>
          <Button variant="ghost" onClick={() => setConfirm(false)}>Giữ lại</Button>
          <Button variant="danger" icon="trash-2" loading={busy} onClick={async () => {
            setBusy(true);
            try {
              await customer.pets.remove(pet.id);
              setConfirm(false);
              toast({ message: `Đã xóa hồ sơ bé ${pet.name}.` });
              navigate(paths.kh.pets);
            } catch {
              toast({ message: 'Chưa lưu được thay đổi. Bạn thử lại nhé.', tone: 'error' });
            } finally { setBusy(false); }
          }}>Xóa hồ sơ</Button>
        </>} />
    </>
  );
}
