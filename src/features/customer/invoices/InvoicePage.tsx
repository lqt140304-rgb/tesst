import { useParams } from 'react-router';
import { InvoicesPage } from './InvoicesPage';

/** `#/khach-hang/hoa-don/:id` — the same page with that invoice open. Keyed so a link to another invoice starts over. */
export function InvoicePage() {
  const { id } = useParams();
  return <InvoicesPage key={id} />;
}
