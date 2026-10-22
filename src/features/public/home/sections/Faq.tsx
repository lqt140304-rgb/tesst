import { useState } from 'react';
import { DemoTag, Icon } from '@/ui';
import { cx } from '@/lib/cx';
import { PubSection } from '../PubSection';
import p from '../Pub.module.css';

const QA: [string, string][] = [
  ['Đặt lịch rồi bao lâu thì được liên hệ?', 'Lê Sơn sẽ gọi lại để xác nhận lịch hẹn của bạn. Thời gian liên hệ cụ thể sẽ được cập nhật khi bệnh viện xác nhận.'],
  ['Nội trú có xem được bé không?', 'Khi bé nằm nội trú, bạn xem được tình trạng chung, nhật ký chăm sóc và video của bé ngay trong tài khoản Lê Sơn.'],
  ['Cấp cứu có phải đặt lịch trước không?', 'Không. Cấp cứu tiếp nhận 24/24; bạn gọi 097 355 51 05 để được hướng dẫn.'],
];

/** "Câu hỏi thường gặp" (part 6A §6.8): a keyboard-friendly accordion, any number open; answers are sample until confirmed. */
export function Faq() {
  const [open, setOpen] = useState<Set<number>>(new Set());
  const toggle = (i: number) => setOpen((s) => { const n = new Set(s); if (n.has(i)) n.delete(i); else n.add(i); return n; });
  return (
    <PubSection id="hoi-dap" label="HỎI ĐÁP" title={<>Bạn <em>hay hỏi</em></>}>
      <div className={p.faqList}>
        {QA.map(([q, a], i) => {
          const on = open.has(i);
          return (
            <div key={q} data-faq className={p.faq}>
              <h3 className={p.faqQ}>
                <button type="button" id={`hoi-dap-q${i}`} aria-expanded={on} aria-controls={`hoi-dap-a${i}`} className={p.faqBtn} onClick={() => toggle(i)}>
                  <span>{q}</span>
                  <Icon name={on ? 'chevron-up' : 'chevron-down'} size={20} aria-hidden="true" />
                </button>
              </h3>
              <div id={`hoi-dap-a${i}`} role="region" aria-labelledby={`hoi-dap-q${i}`} className={cx(p.faqPanel, on && p.faqOn)}>
                <div className={p.faqInner}><p>{a}</p></div>
              </div>
            </div>
          );
        })}
      </div>
      <DemoTag>Nội dung mẫu · Lê Sơn sẽ xác nhận câu trả lời</DemoTag>
    </PubSection>
  );
}
