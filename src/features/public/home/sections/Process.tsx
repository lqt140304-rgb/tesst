import { DemoTag } from '@/ui';
import { PubSection } from '../PubSection';
import { Reveal } from './Decor';
import p from '../Pub.module.css';

const STEPS: [string, string][] = [
  ['Gửi yêu cầu', 'Điền yêu cầu đặt lịch ngay trên web.'],
  ['Lê Sơn liên hệ xác nhận', 'Lê Sơn gọi lại để xác nhận ngày và giờ.'],
  ['Đến khám', 'Đưa bé đến đúng hẹn.'],
  ['Hướng dẫn chăm sóc', 'Nhận hướng dẫn để chăm bé khi về nhà.'],
];

/** "Quy trình đến khám" (part 6A §6.7): four numbered steps; wording is sample until confirmed. */
export function Process() {
  return (
    <PubSection id="quy-trinh" label="QUY TRÌNH" title={<>Bốn bước <em>nhẹ nhàng</em></>}>
      <ol className={p.steps}>
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
