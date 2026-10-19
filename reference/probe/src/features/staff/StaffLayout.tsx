import { AnimatePresence, m } from 'motion/react';
import { useMatches } from 'react-router';
import { FrozenOutlet, TransitionScope, useStableLocation } from '../../app/transition';

// Level 2: shell (sidebar) stays mounted; only the content area transitions, keyed by the route's pageKey.
export default function StaffLayout() {
  const loc = useStableLocation();
  const ms = useMatches();
  const pageKey = (ms[ms.length - 1]?.handle as { pageKey?: string } | undefined)?.pageKey ?? loc.pathname;
  return (
    <div style={{ display: 'flex', gap: 24 }}>
      <aside data-testid="sidebar" style={{ width: 200, padding: 16, background: '#F1E8F3' }}>Thanh bên nhân viên</aside>
      <AnimatePresence mode="wait" initial={false}>
        <m.section key={pageKey} data-testid="staff-content"
          initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0, transition: { duration: 0.24 } }}
          exit={{ opacity: 0, x: -8, transition: { duration: 0.14 } }}>
          <TransitionScope><FrozenOutlet /></TransitionScope>
        </m.section>
      </AnimatePresence>
    </div>
  );
}
export function StaffHome() { return <h1>Tổng quan hôm nay</h1>; }
export function StaffRequests() { return <h1>Yêu cầu đặt lịch</h1>; }
