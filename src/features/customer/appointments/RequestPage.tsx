import { useParams } from 'react-router';
import { AppointmentsPage } from './AppointmentsPage';

/** `#/khach-hang/lich-hen/:id` — the same page with that row open (and its tab chosen). Keyed so a link to another row starts over. */
export function RequestPage() {
  const { id } = useParams();
  return <AppointmentsPage key={id} />;
}
