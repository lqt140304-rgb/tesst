import { m, useReducedMotion } from 'motion/react';
import { petPhoto } from '@/assets/media';
import { ButtonAnchor, DemoTag, Icon, type IconName } from '@/ui';
import { inView, preset } from '@/ui/motion';
import { MAPS_URL } from './Contact';
import s from './About.module.css';

const POINTS: [IconName, string, string][] = [
  ['heart', 'Lắng nghe', 'Hiểu câu chuyện của từng bé'],
  ['stethoscope', 'Chăm sóc', 'Tận tâm với chuyên môn'],
  ['users-round', 'Đồng hành', 'Cùng bạn trong suốt hành trình'],
];
const FACTS: { icon: IconName; text: string; href?: string }[] = [
  { icon: 'clock', text: 'Nhận cấp cứu 24/24' },
  { icon: 'map-pin', text: '101 Khuất Duy Tiến, Nhân Chính, Thanh Xuân, Hà Nội' },
  { icon: 'phone', text: '097 355 51 05', href: 'tel:+84973555105' },
];

/** "Giới thiệu" right after the hero (part 2 §3.1.2): text and three points beside a clinic photo; appears once. */
export function About() {
  const reduced = useReducedMotion() ?? false;
  const reveal = (index: number) => {
    const p = preset('enterList', { reduced, index });
    return { initial: p.initial, whileInView: p.animate, viewport: inView, transition: p.transition };
  };
  return (
    <section id="gioi-thieu" className={s.section} aria-labelledby="gt-title">
      <div className={s.inner}>
        <div className={s.text}>
          <p className={s.eyebrow}>VỀ BỆNH VIỆN THÚ Y LÊ SƠN</p>
          <m.h2 id="gt-title" className={s.title} {...reveal(0)}>Chăm sóc bằng chuyên môn, đồng hành bằng <em>sự thấu hiểu</em>.</m.h2>
          <p className={s.lead}>
            Mỗi lần đưa bé đi khám là một lần cả nhà cùng lo. Ở Lê Sơn, chúng tôi bắt đầu bằng việc lắng nghe: bé đang thế nào, bạn
            đang băn khoăn điều gì. Sau đó mới đến thăm khám, giải thích rõ ràng và cùng bạn chọn cách chăm sóc phù hợp cho bé.
          </p>
          <ul className={s.points}>
            {POINTS.map(([icon, title, line], i) => (
              <m.li key={title} className={s.point} data-about-point {...reveal(i + 1)}>
                <span className={s.pointIcon} aria-hidden="true"><Icon name={icon} size={20} /></span>
                <span><h3 className={s.pointTitle}>{title}</h3><span className={s.pointLine}>{line}</span></span>
              </m.li>
            ))}
          </ul>
          <ul className={s.facts}>
            {FACTS.map((f) => (
              <li key={f.text}>
                <Icon name={f.icon} size={16} aria-hidden="true" />
                {f.href ? <a href={f.href} aria-label={`Gọi ${f.text}`}>{f.text}</a> : <span>{f.text}</span>}
              </li>
            ))}
            <li><ButtonAnchor href={MAPS_URL} external variant="ghost" size="sm" icon="navigation">Chỉ đường</ButtonAnchor></li>
          </ul>
          <DemoTag>Nội dung mẫu · Lê Sơn sẽ cập nhật bài giới thiệu chính thức</DemoTag>
        </div>
        <m.figure className={s.photo} {...reveal(1)}>
          <img src={petPhoto('meo-trang-ngu', 'card')} alt="Bé mèo trắng nằm nghỉ trên máy ở phòng khám" width={960} height={1280} loading="lazy" decoding="async" />
          <DemoTag className={s.tag}>Ảnh minh họa</DemoTag>
        </m.figure>
      </div>
    </section>
  );
}
