import { auth } from '@/data/public';
import { useToast } from '@/ui';
import { useAppNavigate } from '../nav';
import { paths } from '../routes';

/** One logout for every surface: back to the homepage (unless `stay`) with the locked goodbye toast. */
export function useLogout() {
  const navigate = useAppNavigate();
  const toast = useToast();
  return async (opts?: { stay?: boolean }) => {
    await auth.logout();
    if (!opts?.stay) navigate(paths.home);
    toast({ message: 'Bạn đã đăng xuất. Hẹn gặp lại bạn và bé!' });
  };
}
