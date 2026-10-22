import { useSearchParams } from 'react-router';
import { useSession } from '@/app/session/SessionProvider';
import { staff } from '@/data/staff';
import { useQuery } from '@/data/hooks/useQuery';
import { Tabs } from '@/ui';
import type { TabItem } from '@/ui/kit/Tabs';
import { PageHeader } from '../ui';
import { ArticlesTab } from './ArticlesTab';
import { InboxTab } from './InboxTab';
import { SupportTab } from './SupportTab';
import { helpTab, type HelpTab } from './helpView';
import h from './Help.module.css';

const ID = 'tro-giup';

/** Trợ giúp: the guides, the person's own questions and, for whoever may answer them, the inbox. The tab lives in the address. */
export function HelpPage() {
  const { can } = useSession();
  const [params, setParams] = useSearchParams();
  const tab = helpTab(params.get('tab'), can('support.inbox'));
  const inbox = can('support.inbox');
  const fresh = useQuery(() => (inbox ? staff.support.inbox({ status: 'new' }) : Promise.resolve([])), [inbox]);
  const items: TabItem<HelpTab>[] = [{ value: 'huong-dan', label: 'Hướng dẫn' }, { value: 'gop-y', label: 'Góp ý của tôi' },
    ...(inbox ? [{ value: 'hop-thu' as const, label: fresh.data?.length ? `Hộp thư ${fresh.data.length}` : 'Hộp thư' }] : [])];
  return (
    <>
      <PageHeader title="Trợ giúp" sub="Cách làm từng việc, và nơi hỏi khi bạn bí." />
      <Tabs<HelpTab> label="Mục của Trợ giúp" idPrefix={ID} items={items} value={tab} className={h.tabs}
        onChange={(v) => setParams(v === 'huong-dan' ? {} : { tab: v }, { replace: true })} />
      <div role="tabpanel" id={`${ID}-${tab}-panel`} aria-labelledby={`${ID}-${tab}`} className={h.panel}>
        {tab === 'huong-dan' && <ArticlesTab />}
        {tab === 'gop-y' && <SupportTab />}
        {tab === 'hop-thu' && <InboxTab />}
      </div>
    </>
  );
}
