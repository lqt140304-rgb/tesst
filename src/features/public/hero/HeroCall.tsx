import { useState } from 'react';
import { InquiryDialog } from '../inquiry/LazyInquiryDialog';
import { useHospitalHours } from '../home/useHospitalHours';

/** The hero's second button: in opening hours the call link, outside them (and after 19:00 on a holiday) a way to leave a message. Holds its own state so the hero markup stays still. */
export function HeroCall() {
  const { state } = useHospitalHours();
  const [asking, setAsking] = useState(false);
  if (state.open) return <a className="btn btn--ghost" href="tel:+84973555105" data-measure="">Gọi 097 355 51 05</a>;
  return (
    <>
      <button type="button" className="btn btn--ghost" data-measure="" onClick={() => setAsking(true)}>Để lại lời nhắn</button>
      {asking && <InquiryDialog open onClose={() => setAsking(false)} />}
    </>
  );
}
