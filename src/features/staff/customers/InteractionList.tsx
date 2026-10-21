import { AppLink } from '@/app/nav';
import { useSession } from '@/app/session/SessionProvider';
import type { StaffInteraction } from '@/data/staff';
import { EmptyState, Icon } from '@/ui';
import { whenShort } from '../ui';
import s from '../Staff.module.css';
import cs from './Customers.module.css';
import { INTERACTION_ICON, interactionLink } from './interactions';

/** A customer's contacts, newest first. The API already leaves out what the viewer may not see. */
export function InteractionList({ items }: { items: StaffInteraction[] }) {
  const { can } = useSession();
  if (items.length === 0) return <EmptyState icon="clipboard-list" title="Chưa có hoạt động nào." />;
  return (
    <ol className={cs.history}>
      {items.map((i, n) => {
        const to = interactionLink(i, can);
        return (
          <li key={`${i.at}-${n}`} className={cs.event} data-interaction data-kind={i.kind}>
            <span className={cs.eventIcon}><Icon name={INTERACTION_ICON[i.kind]} size={18} /></span>
            <div className={cs.eventBody}>
              <span className={cs.eventLabel}>{to ? <AppLink to={to} className={s.cellLink}>{i.label}</AppLink> : i.label}</span>
              <span className={s.meta}>{i.actorName && <>{i.actorName} · </>}<time dateTime={i.at}>{whenShort(i.at)}</time></span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
