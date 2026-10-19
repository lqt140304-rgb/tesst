import { photo } from '@/assets/media';
import { DemoTag, Icon, IconBadge, type IconName } from '@/ui';
import type { BadgeTone } from '@/ui/kit/Misc';
import { cx } from '@/lib/cx';
import { DrawArc, Reveal } from './Decor';
import s from '../Home.module.css';

const PILLARS: [IconName, BadgeTone, string, string][] = [
  ['message-circle', 'peach', 'Lắng nghe trước', 'Hỏi kỹ thói quen và biểu hiện của bé trước khi đưa ra lời khuyên.'],
  ['notebook-pen', 'mint', 'Giải thích dễ hiểu', 'Bạn biết bé đang gặp vấn đề gì và vì sao cần chăm sóc như vậy.'],
  ['house-paw', 'lilac', 'Cập nhật khi bé ở lại', 'Khi bé nội trú, nhật ký chăm sóc và video của bé được cập nhật trong tài khoản của bạn.'],
];

export function About() {
  return (
    <section id="gioi-thieu" className={cx(s.section, s.cream)} aria-labelledby="gioi-thieu-title">
      <div className={cx(s.wrap, s.aboutGrid)}>
        <Reveal className={s.aboutArt}>
          <DrawArc className={s.aboutArc} viewBox="0 0 200 240" d="M30 8 C 150 10, 196 110, 170 232" width={2.2} />
          <div className={s.aboutFrame}>
            <img src={photo('pet_left')} alt="Bé mèo đeo khăn vàng cười tươi" loading="lazy" width={480} height={600} />
          </div>
          <span className={s.aboutYarn}><Icon name="yarn-ball" size={44} /></span>
          <DemoTag className={s.aboutTag}>Ảnh minh họa</DemoTag>
        </Reveal>
        <Reveal delay={0.1} className={s.aboutText}>
          <p className={s.eyebrow}>VỀ LÊ SƠN</p>
          <h2 id="gioi-thieu-title" className={s.h2}>Đón bé bằng sự <em>dịu dàng</em></h2>
          <p className={s.sub}>
            Mỗi lần đưa bé đi khám là một lần cả nhà cùng lo. Ở Lê Sơn, chúng tôi bắt đầu bằng việc lắng nghe: bé đang thế nào, bạn đang
            băn khoăn điều gì. Sau đó mới đến thăm khám, giải thích rõ ràng và cùng bạn chọn cách chăm sóc phù hợp cho bé.
          </p>
          <ul className={s.pillars}>
            {PILLARS.map(([icon, tone, title, text]) => (
              <li key={title} className={s.pillar}>
                <IconBadge icon={icon} tone={tone} size={40} />
                <div><p className={s.pillarTitle}>{title}</p><p className={s.pillarText}>{text}</p></div>
              </li>
            ))}
          </ul>
          <DemoTag>Nội dung mẫu · Lê Sơn sẽ cập nhật bài giới thiệu chính thức</DemoTag>
        </Reveal>
      </div>
    </section>
  );
}
