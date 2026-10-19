import { useLocation } from 'react-router';
import { BookingForm } from '@/features/booking/BookingForm';
import { SERVICES, type Service } from '@/data/contracts/enums';

/** Mounts the booking form; `?dich-vu=<service>` (from a service card) preselects the service. */
export function BookingSlot() {
  const { search } = useLocation();
  const raw = new URLSearchParams(search).get('dich-vu');
  const service = (SERVICES as readonly string[]).includes(raw ?? '') ? (raw as Service) : undefined;
  return <BookingForm initialService={service} />;
}
