import { m } from 'motion/react';
import { paths } from '@/app/routes';
import { photo } from '@/assets/media';
import { ButtonAnchor, ButtonLink, DemoTag, IconBadge, type IconName } from '@/ui';
import type { BadgeTone } from '@/ui/kit/Misc';
import type { Service } from '@/data/contracts/enums';
import { ease, inView } from '@/ui/motion';
import { cx } from '@/lib/cx';
import { DrawArc, Reveal } from './Decor';
import s from '../Home.module.css';

type Card = { title: string; icon: IconName; tone: BadgeTone; theme: string; img: string; alt: string; desc: string; service?: Service };
/** Locked names and order (R15): Khám và điều trị · Spa & Grooming · Nội trú · Cấp cứu 24/24. */
const CARDS: Card[] = [
  { title: 'Khám và điều trị', icon: 'stethoscope', tone: 'peach', theme: s.tPeach!, img: photo('kham'), alt: 'Bàn tay nhẹ nhàng vuốt ve một bé mèo mướp', service: 'kham',
    desc: 'Khi bé mệt, bỏ ăn hay có biểu hiện lạ, hãy để bác sĩ thăm khám và cùng bạn tìm hướng chăm sóc phù hợp.' },
  { title: 'Spa & Grooming', icon: 'scissors', tone: 'mint', theme: s.tMint!, img: photo('grooming'), alt: 'Chú chó Golden Retriever đang được chải lông', service: 'spa',
    desc: 'Tắm, chải lông và cắt tỉa nhẹ nhàng để bé sạch sẽ, thơm tho và dễ chịu hơn.' },
  { title: 'Nội trú', icon: 'house-paw', tone: 'lilac', theme: s.tLilac!, img: photo('noitru'), alt: 'Bé mèo cam ngủ ngon trong chăn ấm', service: 'noi_tru',
    desc: 'Khi bé cần ở lại để theo dõi và chăm sóc, bạn vẫn xem được nhật ký và video của bé trong tài khoản Lê Sơn.' },
  { title: 'Cấp cứu 24/24', icon: 'heart-pulse', tone: 'rose', theme: s.tRose!, img: photo('capcuu'), alt: 'Chú cún Golden Retriever ngậm bông hoa',
    desc: 'Bé gặp tình huống khẩn cấp? Đừng chờ, hãy gọi ngay để được hướng dẫn và tiếp nhận.' },
];

export function Services() {
  return (
    <section id="dich-vu" className={cx(s.section, s.white)} aria-labelledby="dich-vu-title">
      <DrawArc className={s.arc} />
      <div className={s.wrap}>
        <Reveal className={s.head}>
          <p className={s.eyebrow}>DỊCH VỤ</p>
          <h2 id="dich-vu-title" className={s.h2}>Lê Sơn có thể giúp gì cho bé?</h2>
          <p className={s.sub}>Chọn điều bé cần và gửi yêu cầu, nhân viên sẽ gọi lại để hẹn thời gian phù hợp. Nếu bé cần cấp cứu, xin gọi ngay cho Lê Sơn.</p>
        </Reveal>
        <ul className={s.grid4} style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {CARDS.map((c, i) => (
            <m.li key={c.title} className={s.svc} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={inView}
              transition={{ duration: 0.6, ease: ease.out, delay: i * 0.085 }} data-service-card={c.title}>
              <div className={cx(s.arch, c.theme)}>
                <img src={c.img} alt={c.alt} loading="lazy" width={600} height={440} />
                {!c.service && <span className={s.svcChip}>Tiếp nhận 24/24</span>}
              </div>
              <IconBadge icon={c.icon} tone={c.tone} size={52} className={s.svcBadge} />
              <div className={s.svcBody}>
                <h3 className={s.svcTitle}>{c.title}</h3>
                <p className={s.svcDesc}>{c.desc}</p>
                {c.service ? (
                  <ButtonLink to={`${paths.section('dat-lich')}?dich-vu=${c.service}`} variant="secondary" iconRight="arrow-right">Gửi yêu cầu đặt lịch</ButtonLink>
                ) : (
                  <>
                    <p className={s.svcNote}>Cấp cứu không cần đặt lịch.</p>
                    <ButtonAnchor href="tel:+84973555105" variant="emergency" icon="phone">Gọi 097 355 51 05</ButtonAnchor>
                  </>
                )}
              </div>
            </m.li>
          ))}
        </ul>
        <div className={s.captions}><DemoTag>Ảnh minh họa</DemoTag><DemoTag>Nội dung mẫu</DemoTag></div>
      </div>
    </section>
  );
}
