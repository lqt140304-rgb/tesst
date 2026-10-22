import { photo } from '@/assets/media';
import { DemoTag } from '@/ui';
import { PubSection } from '../PubSection';
import { Reveal } from './Decor';
import p from '../Pub.module.css';

const SHOTS = [
  { src: photo('kham', 'card'), alt: 'Bàn tay nhẹ nhàng vuốt ve một bé mèo mướp', caption: 'Thăm khám nhẹ nhàng' },
  { src: photo('noitru', 'card'), alt: 'Bé mèo vằn ngủ yên giữa chăn gối', caption: 'Một chỗ nghỉ yên tâm' },
  { src: photo('grooming', 'card'), alt: 'Bé chó lông vàng đang được tắm', caption: 'Tắm gội dịu nhẹ' },
];

/** "Không gian & chăm sóc" (part 6A §6.5): until the hospital's own photos arrive these are stock pictures, each labelled. */
export function Space() {
  return (
    <PubSection id="khong-gian" label="KHÔNG GIAN" title={<>Nơi bé <em>thấy dễ chịu</em></>}>
      <div className={p.space}>
        {SHOTS.map((s, i) => (
          <Reveal key={s.caption} delay={0.06 * i} className={i === 0 ? p.spaceMain : p.spaceSide}>
            <figure className={p.fig}>
              <img src={s.src} alt={s.alt} width={960} height={720} loading="lazy" decoding="async" />
              <DemoTag className={p.figTag}>Ảnh minh họa</DemoTag>
              <figcaption className={p.caption}>{s.caption}</figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </PubSection>
  );
}
