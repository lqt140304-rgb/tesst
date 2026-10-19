import { useState } from 'react';
import { useParams } from 'react-router';
import { useAppNavigate } from '@/app/nav';
import { paths } from '@/app/routes';
import { useSession } from '@/app/session/SessionProvider';
import { customer } from '@/data/customer';
import { useQuery } from '@/data/hooks/useQuery';
import { SEX_LABEL, SPECIES_LABEL } from '@/data/contracts/enums';
import { Button, ButtonLink, Dialog, EmptyState, Icon, useToast } from '@/ui';
import { BookingRow } from '../appointments/BookingRow';
import { HOTLINE, LoadingBlocks, PageHeader, PageProblem, PetAvatar, Section, TEL, petLine } from '../ui';
import { PetForm } from './PetForm';
import s from '../Customer.module.css';

/** Pet profile (customer §9.4): hospital records are read-only; self-added pets can be edited or removed. */
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
  const { pet, bookings } = q.data;
  const hospital = pet.source === 'hospital';
  const linked = me?.kind === 'customer' && me.linked;

  return (
    <>
      <PageHeader eyebrow={<ButtonLink to={paths.kh.pets} variant="ghost" size="sm" icon="arrow-left">Thú cưng</ButtonLink>}
        title={<span className={s.petHead}><PetAvatar name={pet.name} species={pet.species} size={56} /><span>{pet.name}</span></span>}
        sub={<>{petLine(pet)}{hospital && <> · <span className={s.recordTag}><Icon name="circle-check" size={13} /> Hồ sơ tại Lê Sơn</span></>}</>}
        actions={!hospital && <Button variant="secondary" icon="pencil" onClick={() => setEditing(true)}>Sửa thông tin</Button>} />

      <div className={s.detailGrid}>
        <div className={s.stack}>
          <Section title="Thông tin">
            <dl className={s.dl}>
              <div><dt>Loài</dt><dd>{SPECIES_LABEL[pet.species]}</dd></div>
              <div><dt>Giống</dt><dd>{pet.breed || '—'}</dd></div>
              <div><dt>Giới tính</dt><dd>{pet.sex ? SEX_LABEL[pet.sex] : 'Chưa rõ'}</dd></div>
              <div><dt>Năm sinh</dt><dd>{pet.birthYear ?? '—'}</dd></div>
            </dl>
            {hospital && <p className={s.small}>Thông tin này do Lê Sơn cập nhật. Cần chỉnh sửa? Bạn báo nhân viên khi đến hoặc gọi <a href={TEL}>{HOTLINE}</a>.</p>}
          </Section>
          {!hospital && (
            <Section title="Điều Lê Sơn nên biết">
              <p className={s.noteText}>{pet.note || 'Bạn chưa ghi gì. Bấm "Sửa thông tin" để thêm.'}</p>
            </Section>
          )}
          <Section title="Lịch hẹn của bé">
            {bookings.length ? <div className={s.list}>{bookings.map((r) => <BookingRow key={r.id} r={r} />)}</div>
              : <EmptyState icon="calendar-days" title="Bé chưa có lịch hẹn nào" action={<ButtonLink to={paths.kh.book} icon="calendar-plus">Gửi yêu cầu đặt lịch</ButtonLink>} />}
          </Section>
          {!linked && <p className={s.lockLine}><Icon name="lock" size={16} /> Nội trú và hóa đơn của bé sẽ hiện sau khi liên kết hồ sơ.</p>}
        </div>
      </div>
      {!hospital && (
        <div className={s.dangerZone}>
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
