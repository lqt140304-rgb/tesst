import { useParams } from 'react-router';
import { StayToday } from './StayToday';

/** `#/khach-hang/noi-tru/:stayId` — the same page opened on that stay. */
export function StayPage() {
  const { stayId = '' } = useParams();
  return <StayToday key={stayId} stayId={stayId} />;
}
