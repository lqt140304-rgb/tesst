import { useRef } from 'react';
import { m, useScroll, useTransform } from 'motion/react';
import { DemoTag } from '@/ui';
import { useReducedMotion } from '@/ui/motion';
import { PubSection } from '../PubSection';
import { Reveal } from './Decor';
import p from '../Pub.module.css';

const STEPS: [string, string][] = [
  ['Gửi yêu cầu', 'Điền yêu cầu đặt lịch ngay trên web.'],
  ['Lê Sơn liên hệ xác nhận', 'Lê Sơn gọi lại để xác nhận ngày và giờ.'],
  ['Đến khám', 'Đưa bé đến đúng hẹn.'],
  ['Hướng dẫn chăm sóc', 'Nhận hướng dẫn để chăm bé khi về nhà.'],
];

/** "Quy trình đến khám" (part 6A §6.7): four steps joined by a line that is drawn as the page scrolls past; wording is sample until confirmed. */
export function Process() {
  const reduced = useReducedMotion();
  const list = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({ target: list, offset: ['start 80%', 'end 55%'] });
  const progress = useTransform(scrollYProgress, [0, 1], [0, 1]);
  return (
    <PubSection id="quy-trinh" label="QUY TRÌNH" title={<>Bốn bước <em>nhẹ nhàng</em></>}>
      <ol ref={list} className={p.steps}>
        <m.li aria-hidden="true" data-process-line className={p.stepsLine} style={{ '--p': reduced ? 1 : progress } as never} />
        {STEPS.map(([title, line], i) => (
          <li key={title} data-step className={p.step}>
            <Reveal delay={0.07 * i} className={p.stepIn}>
              <span className={`${p.stepNo} num`}>{i + 1}</span>
              <span data-step-title className={p.stepTitle}>{title}</span>
              <span className={p.stepLine}>{line}</span>
            </Reveal>
          </li>
        ))}
      </ol>
      <DemoTag>Nội dung mẫu · Lê Sơn sẽ xác nhận quy trình chính thức</DemoTag>
    </PubSection>
  );
}
