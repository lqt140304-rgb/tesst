import { PublicHeader } from '@/features/public/header/PublicHeader';
import { Footer } from '@/features/public/footer/Footer';
import { FrozenOutlet } from '../transition';

export function PublicLayout() {
  return (
    <>
      <PublicHeader />
      <FrozenOutlet />
      <Footer />
    </>
  );
}
