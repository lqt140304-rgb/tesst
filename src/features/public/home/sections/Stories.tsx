import { useState } from 'react';
import { featured, type PublicFeaturedCase } from '@/data/public';
import { useQuery } from '@/data/hooks/useQuery';
import { SPECIES_LABEL } from '@/data/contracts/enums';
import { Button, DemoTag, Icon } from '@/ui';
import { cx } from '@/lib/cx';
import { PubSection } from '../PubSection';
import { excerpt, storyLayout } from '../homeView';
import { useFeaturedImage } from '../useFeaturedImage';
import { Reveal } from './Decor';
import { StoryDialog } from './LazyStoryDialog';
import p from '../Pub.module.css';

function Story({ story, lead, onRead }: { story: PublicFeaturedCase; lead: boolean; onRead: (s: PublicFeaturedCase, opener: HTMLElement) => void }) {
  const src = useFeaturedImage(story.imageKey);
  return (
    <article data-story={lead ? 'lead' : 'side'} className={cx(p.story, lead && p.storyLead)}>
      <figure className={p.fig}>
        {src ? <img src={src} alt={`Bé ${story.petName}`} loading="lazy" decoding="async" />
          : <div className={p.storyArt}><Icon name="paw-heart" size={40} aria-hidden="true" /></div>}
        {!src && <DemoTag className={p.figTag}>Ảnh minh họa</DemoTag>}
      </figure>
      <div className={p.storyInfo}>
        <h3 className={p.storyTitle}>{story.title}</h3>
        <p className={p.storyMeta}>Bé {story.petName} · {SPECIES_LABEL[story.species]}</p>
        <p className={p.storyExcerpt}>{excerpt(story.story, lead ? 220 : 130)}</p>
        {story.sample && <DemoTag>Nội dung mẫu</DemoTag>}
        <Button variant="secondary" iconRight="arrow-right" className={p.btn} aria-label={`Đọc câu chuyện: ${story.title}`}
          onClick={(e) => onRead(story, e.currentTarget)}>Đọc câu chuyện</Button>
      </div>
    </article>
  );
}

/** "Câu chuyện điều trị" (part 6A §6.4): one lead and up to two beside it; nothing shown means no section at all. */
export function Stories() {
  const q = useQuery(() => featured.cases(), []);
  const [reading, setReading] = useState<PublicFeaturedCase | null>(null);
  const items = q.data ?? [];
  const layout = storyLayout(items.length);
  if (layout.lead === null) return null;
  return (
    <PubSection id="cau-chuyen" label="CÂU CHUYỆN ĐIỀU TRỊ" title="Mỗi hành trình, một sự đồng hành.">
      <div className={cx(p.stories, layout.side.length > 0 && p.storiesSplit)}>
        <Reveal><Story story={items[layout.lead]!} lead onRead={(s) => setReading(s)} /></Reveal>
        {layout.side.length > 0 && (
          <div className={p.storySide}>
            {layout.side.map((i, n) => <Reveal key={items[i]!.id} delay={0.06 * (n + 1)}><Story story={items[i]!} lead={false} onRead={(s) => setReading(s)} /></Reveal>)}
          </div>
        )}
      </div>
      {reading && <StoryDialog open onClose={() => setReading(null)} story={reading} />}
    </PubSection>
  );
}
