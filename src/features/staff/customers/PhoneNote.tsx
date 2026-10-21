import { AppLink } from '@/app/nav';
import { paths } from '@/app/routes';
import { staff } from '@/data/staff';
import { useQuery } from '@/data/hooks/useQuery';
import { normalizeVnPhone } from '@/lib/phone';
import { Icon } from '@/ui';
import s from '../Staff.module.css';

/** Soft warning when another record already uses this phone (families share numbers, so it never blocks saving). */
export function PhoneNote({ phone, excludeId, onNavigate, closing }: { phone: string; excludeId?: string; onNavigate?: () => void; closing: string }) {
  const e164 = normalizeVnPhone(phone);
  const dupes = useQuery(() => (e164 ? staff.customers.findByPhone(phone, excludeId) : Promise.resolve([])), [e164, excludeId]);
  const list = dupes.data ?? [];
  if (list.length === 0) return null;
  return (
    <p className={s.hint}><Icon name="info" size={16} />
      <span>Đã có hồ sơ dùng số này: {list.map((c, i) => <span key={c.id}>{i > 0 && ', '}<AppLink to={paths.nv.customer(c.id)} onClick={onNavigate} className={s.cellLink}>{c.full_name} ({c.code})</AppLink></span>)}. {closing}</span>
    </p>
  );
}
