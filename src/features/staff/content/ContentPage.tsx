import { useSearchParams } from 'react-router';
import { Tabs } from '@/ui';
import { paths } from '@/app/routes';
import { PageHeader } from '../ui';
import s from '../Staff.module.css';
import c from './Content.module.css';
import { CasesTab } from './CasesTab';
import { ProductsTab } from './ProductsTab';
import { contentTab, type ContentTab } from './contentView';

/** Nội dung trang giới thiệu: what the public intro page shows as featured products and treatment stories. Needs content.publish. */
export function ContentPage() {
  const [params, setParams] = useSearchParams();
  const tab = contentTab(params.get('tab'));
  const change = (t: ContentTab) => setParams(t === 'san-pham' ? {} : { tab: t }, { replace: true });
  return (
    <>
      <PageHeader title="Nội dung trang giới thiệu" sub="Sản phẩm nổi bật và câu chuyện điều trị hiện cho khách xem ở trang giới thiệu."
        actions={<a className={c.outside} href={`#${paths.home}`} target="_blank" rel="noopener noreferrer">Xem trang giới thiệu</a>} />
      <div className={s.stack}>
        <Tabs<ContentTab> label="Mục của nội dung trang giới thiệu" variant="underline" idPrefix="noi-dung" value={tab} onChange={change}
          items={[{ value: 'san-pham', label: 'Sản phẩm' }, { value: 'cau-chuyen', label: 'Câu chuyện' }]} />
        <div role="tabpanel" id={`noi-dung-${tab}-panel`} aria-labelledby={`noi-dung-${tab}`} className={c.panel}>
          {tab === 'san-pham' ? <ProductsTab /> : <CasesTab />}
        </div>
      </div>
    </>
  );
}
