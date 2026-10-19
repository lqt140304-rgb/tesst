import { FrozenOutlet } from '@/app/transition';
import { Placeholder } from '@/features/shared/Placeholder';

export function AuthLayout() {
  return <FrozenOutlet />;
}
export const LoginPage = () => <Placeholder title="Đăng nhập" />;
export const SignupPage = () => <Placeholder title="Tạo tài khoản" />;
