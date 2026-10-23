import { useState } from 'react';
import { FEATURED_CATEGORY_LABEL, type FeaturedCategory } from '@/data/contracts/enums';
import { featured, type PublicFeaturedProduct } from '@/data/public';
import { useQuery } from '@/data/hooks/useQuery';
import { Button, DemoTag, Icon } from '@/ui';
import { cx } from '@/lib/cx';
import { InquiryDialog } from '../../inquiry/LazyInquiryDialog';
import { PubSection } from '../PubSection';
import { filterProducts, productCategories } from '../homeView';
import { useFeaturedImage } from '../useFeaturedImage';
import { Reveal } from './Decor';
import p from '../Pub.module.css';

/** What "Hỏi mua" does: open the leave-a-message dialog about this product. */
export function inquiryAction(about: string): { kind: 'message'; about: string } {
  return { kind: 'message', about };
}

function Product({ item }: { item: PublicFeaturedProduct }) {
  const src = useFeaturedImage(item.imageKey);
  const [asking, setAsking] = useState(false);
  const action = inquiryAction(item.name);
  return (
    <article data-product className={p.product}>
      <figure className={p.fig}>
        {src ? <img src={src} alt={item.name} loading="lazy" decoding="async" /> : <div className={p.productArt}><Icon name="pet-bowl" size={36} aria-hidden="true" /></div>}
        {!src && <DemoTag className={p.figTag}>Ảnh minh họa</DemoTag>}
      </figure>
      <h3 className={p.productName}>{item.name}</h3>
      <p className={p.productMeta}>{FEATURED_CATEGORY_LABEL[item.category]}</p>
      {item.note && <p className={p.productNote}>{item.note}</p>}
      {item.sample && <DemoTag>Nội dung mẫu</DemoTag>}
      <Button variant="secondary" size="sm" icon="message-circle" className={p.btn} aria-label={`Hỏi mua: ${item.name}`} onClick={() => setAsking(true)}>Hỏi mua</Button>
      {asking && <InquiryDialog open onClose={() => setAsking(false)} about={action.about} />}
    </article>
  );
}

/** "Sản phẩm nổi bật" (part 6A §6.6): at most six, no price, no best-seller claim; nothing shown means no section at all. */
export function Products() {
  const q = useQuery(() => featured.products(), []);
  const [group, setGroup] = useState<FeaturedCategory | 'all'>('all');
  const items = q.data ?? [];
  if (items.length === 0) return null;
  const groups = productCategories(items) as FeaturedCategory[];
  // A chosen group that has since disappeared (items hidden elsewhere) falls back to all, so the list is never empty with no way out.
  const active = group !== 'all' && groups.includes(group) ? group : 'all';
  const shown = filterProducts(items, active);
  return (
    <PubSection id="san-pham" label="SẢN PHẨM NỔI BẬT" title={<>Chăm sóc tiếp nối <em>tại nhà</em></>}>
      {groups.length >= 2 && (
        <div role="group" aria-label="Lọc theo nhóm" className={p.chips}>
          {(['all', ...groups] as const).map((g) => (
            <button key={g} type="button" aria-pressed={active === g} className={cx(p.chip, active === g && p.chipOn)} onClick={() => setGroup(g)}>
              {g === 'all' ? 'Tất cả' : FEATURED_CATEGORY_LABEL[g]}
            </button>
          ))}
        </div>
      )}
      <ul className={p.products}>
        {shown.map((item, i) => <li key={item.id}><Reveal delay={0.05 * Math.min(i, 5)}><Product item={item} /></Reveal></li>)}
      </ul>
    </PubSection>
  );
}
