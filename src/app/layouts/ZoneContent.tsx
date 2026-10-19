import { AnimatePresence, m } from 'motion/react';
import { useHandle } from '../handle';
import { FrozenOutlet, TransitionScope } from '../transition';
import { ease } from '@/ui/motion';

/** Level 2: the shell stays mounted; only the content area transitions, keyed by pageKey (R5 in visual §4.4). */
export function ZoneContent({ distance = 8, className }: { distance?: number; className?: string }) {
  const { pageKey } = useHandle();
  return (
    <AnimatePresence mode="wait" initial={false} onExitComplete={() => window.scrollTo(0, 0)}>
      <m.div key={pageKey} className={className} data-page={pageKey}
        initial={{ opacity: 0, y: distance }}
        animate={{ opacity: 1, y: 0, transition: { duration: 0.22, ease: ease.out } }}
        exit={{ opacity: 0, transition: { duration: 0.12, ease: ease.in } }}>
        <TransitionScope><FrozenOutlet /></TransitionScope>
      </m.div>
    </AnimatePresence>
  );
}
