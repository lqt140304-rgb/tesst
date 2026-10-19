import { memo } from 'react';
import { ButtonAnchor, DemoTag, Icon, type IconName } from '@/ui';
import { MAPS_URL } from './Contact';
import './gioi-thieu.css';

const FACTS: { icon: IconName; text: string; href?: string }[] = [
  { icon: 'clock', text: 'Nhận cấp cứu 24/24' },
  { icon: 'map-pin', text: '101 Khuất Duy Tiến, Nhân Chính, Thanh Xuân, Hà Nội' },
  { icon: 'phone', text: '097 355 51 05', href: 'tel:+84973555105' },
];

/**
 * "Giới thiệu" right after the hero (owner-approved v3, R30). The hero simulator flies its three largest frames into the
 * slots while this section is pinned, then the slots take over showing the same photos (data-photo, set by the simulator).
 * Static markup only (memo, no props/state): the simulator owns the slot contents, the pin variables and the state classes.
 */
export const About = memo(function About() {
  return (
    <div className="gt-wrap">
      <div className="gt-pin">
        <section className="gt" id="gioi-thieu" aria-labelledby="gt-title">
          <div className="gt__inner">
            <div className="gt__gallery">
              <figure className="gt__slot gt__slot--tall" aria-hidden="true"><div className="gt__slot-frame" /></figure>
              <figure className="gt__slot gt__slot--wide" aria-hidden="true"><div className="gt__slot-frame" /></figure>
              <figure className="gt__slot gt__slot--square" aria-hidden="true"><div className="gt__slot-frame" /></figure>
              <DemoTag className="gt__tag">Ảnh minh họa</DemoTag>
            </div>
            <div className="gt__text">
              <p className="gt__eyebrow">VỀ LÊ SƠN</p>
              <h2 className="gt__title" id="gt-title">Bệnh viện Thú y Lê Sơn</h2>
              <p className="gt__lead">
                Mỗi lần đưa bé đi khám là một lần cả nhà cùng lo. Ở Lê Sơn, chúng tôi bắt đầu bằng việc lắng nghe: bé đang thế nào, bạn
                đang băn khoăn điều gì. Sau đó mới đến thăm khám, giải thích rõ ràng và cùng bạn chọn cách chăm sóc phù hợp cho bé.
              </p>
              <ul className="gt__facts">
                {FACTS.map((f) => (
                  <li key={f.text}>
                    <span className="ico" aria-hidden="true"><Icon name={f.icon} size={20} /></span>
                    {f.href ? <a href={f.href} aria-label={`Gọi ${f.text}`}>{f.text}</a> : <span>{f.text}</span>}
                  </li>
                ))}
              </ul>
              <div className="gt__cta">
                <ButtonAnchor href={MAPS_URL} external variant="secondary" icon="navigation">Chỉ đường</ButtonAnchor>
              </div>
              <DemoTag>Nội dung mẫu · Lê Sơn sẽ cập nhật bài giới thiệu chính thức</DemoTag>
            </div>
          </div>
        </section>
        <div className="gt-pin__space" aria-hidden="true" />
      </div>
    </div>
  );
});
