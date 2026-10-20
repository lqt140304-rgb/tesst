import { useState } from 'react';
import { AnimatePresence, m, useReducedMotion } from 'motion/react';
import { paths } from '@/app/routes';
import { petPhoto, photo } from '@/assets/media';
import { ButtonAnchor, ButtonLink, DemoTag, Icon, Tabs, type IconName } from '@/ui';
import { inView, preset } from '@/ui/motion';
import s from './Services.module.css';

type Tab = 'kham' | 'noi_tru' | 'spa';
type Info = { label: string; photo: string; alt: string; pos?: string; desc: string; items: [IconName, string, string][] };

/** Mockup tabs (part 2 §3.1.3, R34): names, order and the three items per service; items are sample copy. */
const TABS: Record<Tab, Info> = {
  kham: {
    label: 'Khám & điều trị', photo: photo('kham', 'card'), alt: 'Bàn tay nhẹ nhàng vuốt ve một bé mèo mướp',
    desc: 'Khi bé mệt, bỏ ăn hay có biểu hiện lạ, hãy để bác sĩ thăm khám và cùng bạn tìm hướng chăm sóc phù hợp.',
    items: [
      ['stethoscope', 'Khám tổng quát', 'Kiểm tra sức khỏe định kỳ, phát hiện sớm điều bất thường.'],
      ['clipboard-list', 'Chẩn đoán & điều trị', 'Hướng điều trị phù hợp với tình trạng của từng bé.'],
      ['house-heart', 'Tư vấn chăm sóc tại nhà', 'Hướng dẫn chi tiết để bé mau khỏe khi về nhà.'],
    ],
  },
  noi_tru: {
    label: 'Nội trú', photo: petPhoto('cho-poodle-chuong', 'card')!, alt: 'Bé Poodle nâu đứng trong khu nội trú', pos: '50% 62%',
    desc: 'Khi bé cần ở lại để theo dõi và chăm sóc, bạn vẫn xem được nhật ký và video của bé trong tài khoản Lê Sơn.',
    items: [
      ['activity', 'Theo dõi hằng ngày', 'Nhân viên theo dõi bé suốt thời gian lưu trú.'],
      ['video', 'Nhật ký & video cho chủ nuôi', 'Bạn xem tình trạng chung và video của bé trong tài khoản.'],
      ['pet-bowl', 'Ăn uống, vệ sinh đều đặn', 'Bé được cho ăn, vệ sinh và nghỉ ngơi đúng giờ.'],
    ],
  },
  spa: {
    label: 'Spa & grooming', photo: petPhoto('cho-poodle-xe', 'card')!, alt: 'Bé Poodle lông xoăn vừa được chải chuốt', pos: '50% 30%',
    desc: 'Tắm, chải lông và cắt tỉa nhẹ nhàng để bé sạch sẽ, thơm tho và dễ chịu hơn.',
    items: [
      ['paw-heart', 'Tắm & sấy', 'Sữa tắm dịu nhẹ, sấy khô vừa phải.'],
      ['scissors', 'Cắt tỉa lông', 'Gọn gàng theo giống và mong muốn của bạn.'],
      ['footprints', 'Vệ sinh tai, móng', 'Làm sạch nhẹ nhàng, bé thoải mái hơn.'],
    ],
  },
};
const ORDER: Tab[] = ['kham', 'noi_tru', 'spa'];

/** "Dịch vụ" (part 2 §3.1.3): tabs with a photo and three items each, then the Cấp cứu 24/24 strip (call only). */
export function Services() {
  const [tab, setTab] = useState<Tab>('kham');
  const reduced = useReducedMotion() ?? false;
  const t = TABS[tab];
  const swap = preset('fadeSwap', { reduced });
  const rise = preset('enterList', { reduced });
  return (
    <section id="dich-vu" className={s.section} aria-labelledby="dich-vu-title">
      <div className={s.inner}>
        <m.header className={s.head} initial={rise.initial} whileInView={rise.animate} viewport={inView} transition={rise.transition}>
          <p className={s.eyebrow}>DỊCH VỤ</p>
          <h2 id="dich-vu-title" className={s.h2}>Dịch vụ <em>dành cho bé</em></h2>
          <p className={s.sub}>Các dịch vụ tại Lê Sơn được thiết kế để đáp ứng nhu cầu chăm sóc toàn diện, từ thăm khám, điều trị đến lưu trú và làm đẹp.</p>
        </m.header>
        <Tabs<Tab> label="Dịch vụ" variant="underline" idPrefix="dv" value={tab} onChange={setTab} className={s.tabs}
          items={ORDER.map((k) => ({ value: k, label: TABS[k].label }))} />
        <AnimatePresence mode="wait" initial={false}>
          <m.div key={tab} id={`dv-${tab}-panel`} role="tabpanel" aria-labelledby={`dv-${tab}`} className={s.panel}
            initial={swap.initial} animate={swap.animate} exit={{ opacity: 0 }} transition={swap.transition}>
            <figure className={s.photo}>
              <img src={t.photo} alt={t.alt} width={960} height={720} loading="lazy" decoding="async" style={t.pos ? { objectPosition: t.pos } : undefined} />
              <DemoTag className={s.tag}>Ảnh minh họa</DemoTag>
            </figure>
            <div className={s.body}>
              <h3 className={s.title}>{t.label}</h3>
              <p className={s.desc}>{t.desc}</p>
              <ul className={s.items}>
                {t.items.map(([icon, title, line]) => (
                  <li key={title}>
                    <span className={s.itemIcon} aria-hidden="true"><Icon name={icon} size={18} /></span>
                    <span><strong>{title}</strong><span className={s.itemLine}>{line}</span></span>
                  </li>
                ))}
              </ul>
              <DemoTag>Nội dung mẫu</DemoTag>
              <div><ButtonLink to={`${paths.book}?dich-vu=${tab}`} iconRight="arrow-right">Gửi yêu cầu đặt lịch</ButtonLink></div>
            </div>
          </m.div>
        </AnimatePresence>
        <aside className={s.emergency} aria-labelledby="cap-cuu-title">
          <span className={s.emIcon} aria-hidden="true"><Icon name="heart-pulse" size={24} /></span>
          <div className={s.emText}>
            <h3 id="cap-cuu-title" className={s.emTitle}>Cấp cứu 24/24</h3>
            <p>Bé gặp tình huống khẩn cấp? Gọi ngay để được hướng dẫn và tiếp nhận.</p>
          </div>
          <ButtonAnchor href="tel:+84973555105" icon="phone" className={s.emCall}>Gọi ngay 097 355 51 05</ButtonAnchor>
        </aside>
      </div>
    </section>
  );
}
