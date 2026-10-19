import { PublicHeader } from '@/features/public/header/PublicHeader';
import { Footer } from '@/features/public/footer/Footer';
import { FrozenOutlet } from '../transition';
import { StorageBanner } from '../system/System';

export function PublicLayout() {
  return (
    <>
      <StorageBanner />
      <PublicHeader />
      <FrozenOutlet />
      <Footer />
    </>
  );
}
