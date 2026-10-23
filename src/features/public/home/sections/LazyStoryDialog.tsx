import { lazy, Suspense } from 'react';
import type { PublicFeaturedCase } from '@/data/public';

const Loaded = lazy(() => import('./StoryDialog').then((m) => ({ default: m.StoryDialog })));

/** Read only after a click: fetched then, kept out of the first download (size budget). */
export function StoryDialog(props: { open: boolean; onClose: () => void; story: PublicFeaturedCase }) {
  return <Suspense fallback={null}><Loaded {...props} /></Suspense>;
}
