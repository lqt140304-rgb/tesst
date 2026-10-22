import { AppLink } from '@/app/nav';
import { useSession } from '@/app/session/SessionProvider';
import type { OperationsReport } from '@/data/staff';
import { Icon } from '@/ui';
import { attentionItems } from './reportsView';
import r from './Reports.module.css';

/** What needs a person right now. It does not depend on the period, and says so. */
export function AttentionList({ report }: { report: OperationsReport }) {
  const { can } = useSession();
  const items = attentionItems(report, can);
  return (
    <section className={r.panel} aria-labelledby="bc-chu-y">
      <div className={r.panelHead}>
        <h2 id="bc-chu-y" className={r.h2}>Cần chú ý lúc này</h2>
        <p className={r.sub}>Không phụ thuộc kỳ đã chọn.</p>
      </div>
      {items.length === 0 ? (
        <p className={r.allClear}><Icon name="circle-check" size={18} />Hiện chưa có việc nào cần chú ý.</p>
      ) : (
        <ul className={r.rows}>
          {items.map((i) => (
            <li key={i.key} className={r.row} data-attention={i.key}>
              {i.to
                ? <AppLink to={i.to} className={r.rowLink}><span>{i.text}</span><Icon name="arrow-right" size={16} /></AppLink>
                : <span>{i.text}</span>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
