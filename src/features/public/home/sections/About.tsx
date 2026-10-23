import { paths } from '@/app/routes';
import { petPhoto, photo } from '@/assets/media';
import { ButtonAnchor, ButtonLink, DemoTag, Icon, type IconName } from '@/ui';
import { Drift } from '../Drift';
import { PubSection } from '../PubSection';
import { Reveal } from './Decor';
import { MAPS_URL } from './Contact';
import p from '../Pub.module.css';

const FACTS: { icon: IconName; text: string; href?: string }[] = [
  { icon: 'clock', text: 'Nhận cấp cứu 24/24' },
  { icon: 'map-pin', text: '101 Khuất Duy Tiến, Nhân Chính, Thanh Xuân, Hà Nội' },
  { icon: 'phone', text: '097 355 51 05', href: 'tel:+84973555105' },
];

/** "Giới thiệu" right after the hero (part 6A §6.1): a short promise and two different moments. */
export function About() {
  return (
    <PubSection id="gioi-thieu" label="VỀ LÊ SƠN" title={<>An tâm <em>gửi gắm</em></>} className={p.about} ask="Bé không khỏe, mình nên làm gì?">
      <div className={p.aboutGrid}>
        <Reveal className={p.aboutText}>
          <p className={p.lead}>
            Mỗi lần đưa bé đi khám là một lần cả nhà cùng lo. Ở Lê Sơn, chúng tôi bắt đầu bằng việc lắng nghe: bé đang thế nào, bạn đang
            băn khoăn điều gì. Sau đó mới đến thăm khám, giải thích rõ ràng và cùng bạn chọn cách chăm sóc phù hợp.
          </p>
          <div><ButtonLink to={paths.section('dich-vu')} iconRight="arrow-right" className={p.btn}>Tìm hiểu Lê Sơn</ButtonLink></div>
          <ul className={p.facts}>
            {FACTS.map((f) => (
              <li key={f.text}>
                <Icon name={f.icon} size={16} aria-hidden="true" />
                {f.href ? <a href={f.href} aria-label={`Gọi ${f.text}`}>{f.text}</a> : <span>{f.text}</span>}
              </li>
            ))}
            <li><ButtonAnchor href={MAPS_URL} external variant="ghost" size="sm" icon="navigation">Chỉ đường</ButtonAnchor></li>
          </ul>
          <DemoTag>Nội dung mẫu · Lê Sơn sẽ cập nhật bài giới thiệu chính thức</DemoTag>
        </Reveal>
        <div data-bridge className={p.aboutStage}>
          <Reveal delay={0.05} className={p.photoMain}>
            <Drift><figure className={p.fig}>
              <img src={petPhoto('meo-trang-ngu', 'card')} alt="Bé mèo trắng nằm nghỉ trên máy ở phòng khám" width={960} height={1280} loading="lazy" decoding="async" />
              <DemoTag className={p.figTag}>Ảnh minh họa</DemoTag>
              <figcaption className={p.glass}>Chăm sóc tận tâm</figcaption>
            </figure></Drift>
          </Reveal>
          <Reveal delay={0.12} className={p.photoSide}>
            <figure className={p.fig}>
              <img src={photo('kham', 'card')} alt="Bàn tay nhẹ nhàng vuốt ve một bé mèo mướp" width={960} height={720} loading="lazy" decoding="async" />
              <DemoTag className={p.figTag}>Ảnh minh họa</DemoTag>
            </figure>
          </Reveal>
        </div>
      </div>
    </PubSection>
  );
}
