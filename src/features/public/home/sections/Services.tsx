import { useState, type FocusEvent } from 'react';
import { AnimatePresence, m } from 'motion/react';
import { AppLink } from '@/app/nav';
import { paths } from '@/app/routes';
import { petPhoto, photo } from '@/assets/media';
import { ButtonAnchor, ButtonLink, DemoTag, Icon, type IconName } from '@/ui';
import { useReducedMotion } from '@/ui/motion';
import { cx } from '@/lib/cx';
import { InquiryDialog } from '../../inquiry/LazyInquiryDialog';
import { PubSection } from '../PubSection';
import { useHospitalHours } from '../useHospitalHours';
import { Reveal } from './Decor';
import p from '../Pub.module.css';

type Key = 'kham' | 'noi_tru' | 'spa';
type Info = { name: string; line: string; photo: string; alt: string; pos?: string; items: [IconName, string, string][] };

/** Names, order and items as in the mockup (R34); the items are sample copy. */
const SERVICES: Record<Key, Info> = {
  kham: {
    name: 'Khám & điều trị', line: 'Thăm khám và tư vấn theo tình trạng của bé.',
    photo: photo('kham', 'card'), alt: 'Bàn tay nhẹ nhàng vuốt ve một bé mèo mướp',
    items: [
      ['stethoscope', 'Khám tổng quát', 'Kiểm tra sức khỏe định kỳ, phát hiện sớm điều bất thường.'],
      ['clipboard-list', 'Chẩn đoán & điều trị', 'Hướng điều trị phù hợp với tình trạng của từng bé.'],
      ['house-heart', 'Tư vấn chăm sóc tại nhà', 'Hướng dẫn chi tiết để bé mau khỏe khi về nhà.'],
    ],
  },
  noi_tru: {
    name: 'Nội trú', line: 'Theo dõi và chăm sóc khi bé cần ở lại.',
    photo: petPhoto('cho-poodle-chuong', 'card')!, alt: 'Bé Poodle nâu đứng trong khu nội trú', pos: '50% 62%',
    items: [
      ['activity', 'Theo dõi hằng ngày', 'Nhân viên theo dõi bé suốt thời gian lưu trú.'],
      ['video', 'Nhật ký & video cho chủ nuôi', 'Bạn xem tình trạng chung và video của bé trong tài khoản.'],
      ['pet-bowl', 'Ăn uống, vệ sinh đều đặn', 'Bé được cho ăn, vệ sinh và nghỉ ngơi đúng giờ.'],
    ],
  },
  spa: {
    name: 'Spa & grooming', line: 'Tắm, chải lông và cắt tỉa nhẹ nhàng.',
    photo: petPhoto('cho-poodle-xe', 'card')!, alt: 'Bé Poodle lông xoăn vừa được chải chuốt', pos: '50% 30%',
    items: [
      ['paw-heart', 'Tắm & sấy', 'Sữa tắm dịu nhẹ, sấy khô vừa phải.'],
      ['scissors', 'Cắt tỉa lông', 'Gọn gàng theo giống và mong muốn của bạn.'],
      ['footprints', 'Vệ sinh tai, móng', 'Làm sạch nhẹ nhàng, bé thoải mái hơn.'],
    ],
  },
};
const ORDER: Key[] = ['kham', 'noi_tru', 'spa'];

/** "Dịch vụ" (part 6A §6.2): numbered rows, one sticky photo that follows the chosen row, the Cấp cứu strip, then a booking (or call) CTA. */
export function Services() {
  const [open, setOpen] = useState<Key>('kham');
  const reduced = useReducedMotion();
  const { state } = useHospitalHours();
  const [asking, setAsking] = useState(false);
  const t = SERVICES[open];
  // Mouse hover and keyboard focus preview a row on wide screens; a plain tap or Enter is what opens it everywhere.
  const preview = (k: Key) => (e: { pointerType?: string }) => { if (e.pointerType === 'mouse') setOpen(k); };
  const onFocus = (k: Key) => (e: FocusEvent<HTMLElement>) => { if (e.currentTarget.matches(':focus-visible')) setOpen(k); };
  return (
    <PubSection id="dich-vu" label="DỊCH VỤ" title={<>Dịch vụ <em>dành cho bé</em></>}>
      <div className={p.svcGrid}>
        <ul className={p.svcList}>
          {ORDER.map((k, i) => {
            const s = SERVICES[k];
            return (
              <li key={k} data-service className={cx(p.svc, open === k && p.svcOpen)}>
                <Reveal>
                  <div className={p.svcRow}>
                    <button type="button" className={p.svcPick} aria-expanded={open === k} aria-controls={`dv-${k}`}
                      onClick={() => setOpen(k)} onPointerEnter={preview(k)} onFocus={onFocus(k)}>
                      <span data-service-no className={cx(p.svcNo, 'num')}>{`0${i + 1}`}</span>
                      <span className={p.svcText}>
                        <span data-service-name className={p.svcName}>{s.name}</span>
                        <span data-service-line className={p.svcLine}>{s.line}</span>
                      </span>
                    </button>
                    <AppLink to={`${paths.book}?dich-vu=${k}`} className={p.svcGo} aria-label={`Đặt lịch ${s.name}`}><Icon name="arrow-right" size={20} /></AppLink>
                  </div>
                  <div id={`dv-${k}`} hidden={open !== k} className={p.svcItems}>
                    <ul>
                      {s.items.map(([icon, title, line]) => (
                        <li key={title}>
                          <span className={p.svcItemIcon} aria-hidden="true"><Icon name={icon} size={18} /></span>
                          <span><strong>{title}</strong><span>{line}</span></span>
                        </li>
                      ))}
                    </ul>
                    <DemoTag>Nội dung mẫu</DemoTag>
                  </div>
                </Reveal>
              </li>
            );
          })}
        </ul>
        <figure data-service-stage className={p.svcStage}>
          <AnimatePresence mode="wait" initial={false}>
            <m.img key={open} src={t.photo} alt={t.alt} width={960} height={720} loading="lazy" decoding="async"
              style={t.pos ? { objectPosition: t.pos } : undefined}
              initial={{ opacity: reduced ? 1 : 0 }} animate={{ opacity: 1 }} exit={{ opacity: reduced ? 1 : 0 }} transition={{ duration: reduced ? 0 : 0.25 }} />
          </AnimatePresence>
          <DemoTag className={p.figTag}>Ảnh minh họa</DemoTag>
        </figure>
      </div>
      <aside className={p.emergency} aria-labelledby="cap-cuu-title">
        <span className={p.emIcon} aria-hidden="true"><Icon name="heart-pulse" size={24} /></span>
        <div className={p.emText}>
          <h3 id="cap-cuu-title" className={p.emTitle}>Cấp cứu 24/24</h3>
          <p>Bé gặp tình huống khẩn cấp? Gọi ngay để được hướng dẫn và tiếp nhận.</p>
        </div>
        <ButtonAnchor href="tel:+84973555105" icon="phone" className={p.emCall}>Gọi ngay 097 355 51 05</ButtonAnchor>
      </aside>
      <div data-services-cta className={p.svcCta}>
        {state.open
          ? <ButtonLink to={paths.book} iconRight="arrow-right" size="lg" className={p.btn}>Đặt lịch khám</ButtonLink>
          : <ButtonAnchor href="tel:+84973555105" icon="phone" size="lg" className={p.btn}>Gọi 097 355 51 05</ButtonAnchor>}
        <p className={p.svcCtaNote}>
          <span>Chưa chắc chọn dịch vụ nào? Lê Sơn sẽ tư vấn khi gọi lại.</span>
          {!state.open && <> <button type="button" className={p.linkBtn} onClick={() => setAsking(true)}>Hoặc để lại lời nhắn</button></>}
        </p>
        {asking && <InquiryDialog open onClose={() => setAsking(false)} />}
      </div>
    </PubSection>
  );
}
