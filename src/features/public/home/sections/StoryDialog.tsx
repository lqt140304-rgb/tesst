import { SPECIES_LABEL } from '@/data/contracts/enums';
import type { PublicFeaturedCase } from '@/data/public';
import { Button, DemoTag, Dialog } from '@/ui';
import p from '../Pub.module.css';

/** A story read in full without leaving the page. Only what the public type holds: no owner, no medicine, no times. */
export function StoryDialog({ open, onClose, story }: { open: boolean; onClose: () => void; story: PublicFeaturedCase }) {
  return (
    <Dialog open={open} onClose={onClose} title={story.title} wide footer={<Button variant="secondary" onClick={onClose}>Đóng</Button>}>
      <div className={p.storyBody}>
        <p className={p.storyPet}>Bé {story.petName} · {SPECIES_LABEL[story.species]}</p>
        <p className={p.storyText}>{story.story}</p>
        {story.sample && <DemoTag>Nội dung mẫu</DemoTag>}
      </div>
    </Dialog>
  );
}
