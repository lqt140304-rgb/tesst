import { lazy, Suspense } from 'react';

const Loaded = lazy(() => import('./InquiryDialog').then((m) => ({ default: m.InquiryDialog })));

/** The message dialog is only wanted after a click, so its code is fetched then and stays out of the first download (size budget). */
export function InquiryDialog(props: { open: boolean; onClose: () => void; about?: string }) {
  return <Suspense fallback={null}><Loaded {...props} /></Suspense>;
}
