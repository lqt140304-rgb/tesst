import { AnimatePresence, m, LazyMotion, domAnimation, MotionConfig } from 'motion/react';
import { Link, useMatches } from 'react-router';
import { FrozenOutlet, TransitionScope } from './transition';
import styles from './RootLayout.module.css';

type Handle = { zone?: string; pageKey?: string };
export function useZone() {
  const ms = useMatches();
  return (ms.map((x) => (x.handle as Handle | undefined)?.zone).filter(Boolean).pop() ?? 'public') as string;
}
// Level 1: zone transitions (public <-> auth <-> staff). Opacity + translateY only (no scale): keeps hero maths valid.
export function RootLayout() {
  const zone = useZone();
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <nav className={styles.nav}><Link to="/">Trang chủ</Link> · <Link to="/dang-nhap">Đăng nhập</Link> · <Link to="/nv">Khu nhân viên</Link> · <Link to="/nv/yeu-cau">Yêu cầu</Link></nav>
        <AnimatePresence mode="wait" initial={false}>
          <m.div key={zone} className={styles.page} data-testid="zone" data-zone={zone}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.2, 0.7, 0.2, 1] } }}
            exit={{ opacity: 0, y: -8, transition: { duration: 0.2, ease: 'easeIn' } }}>
            <TransitionScope><FrozenOutlet /></TransitionScope>
          </m.div>
        </AnimatePresence>
      </MotionConfig>
    </LazyMotion>
  );
}
