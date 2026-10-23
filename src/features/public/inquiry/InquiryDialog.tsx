import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { ForbiddenError, ValidationError } from '@/data/contracts/errors';
import { inquiries } from '@/data/public';
import { useSession } from '@/app/session/SessionProvider';
import { Button, Counter, Dialog, Field, Icon, Input, Textarea } from '@/ui';
import { INQUIRY_MAX } from './inquiryView';
import s from './Inquiry.module.css';

type Phase = 'form' | 'sending' | 'sent';
const FIELDS = ['name', 'phone', 'text'] as const;
const SENT = 'Đã gửi. Lê Sơn sẽ gọi lại cho bạn.';
const FAILED = 'Chưa gửi được. Bạn thử lại giúp nhé.';

/**
 * "Để lại lời nhắn": a visitor or customer leaves name, phone and a few words for Lê Sơn to call back.
 * Callers mount it only while it is open, so every opening starts empty (a signed-in customer's name is filled in).
 * The words of every refusal come from the data layer.
 */
export function InquiryDialog({ open, onClose, about }: { open: boolean; onClose: () => void; about?: string }) {
  const { session, me } = useSession();
  const uid = useId();
  const [name, setName] = useState(() => (session?.kind === 'customer' ? me?.name ?? '' : ''));
  const [phone, setPhone] = useState('');
  const [text, setText] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [phase, setPhase] = useState<Phase>('form');
  const closeRef = useRef<HTMLButtonElement>(null);
  // When the form is replaced by the confirmation, the focused button or box disappears: put focus on "Đóng" so it stays inside the dialog.
  useEffect(() => { if (phase === 'sent') closeRef.current?.focus(); }, [phase]);
  const sending = useRef(false); // a second click while the first is on its way sends nothing
  const formId = `inq${uid}`;
  const topic = about?.slice(0, INQUIRY_MAX.about);

  async function submit(e?: FormEvent) {
    e?.preventDefault();
    if (sending.current) return;
    sending.current = true;
    setPhase('sending');
    setErrors({});
    try {
      await inquiries.submit({ name, phone, text, ...(topic ? { about: topic } : {}) });
      setPhase('sent');
    } catch (err) {
      setPhase('form');
      if (err instanceof ValidationError) {
        const extra = Object.entries(err.fields).filter(([k]) => !(FIELDS as readonly string[]).includes(k)).map(([, v]) => v);
        setErrors({ ...err.fields, ...(extra.length ? { form: extra[0]! } : {}) });
        const first = FIELDS.find((f) => err.fields[f]);
        if (first) requestAnimationFrame(() => document.getElementById(`${formId}${first}`)?.focus());
      } else setErrors({ form: err instanceof ForbiddenError ? err.message : FAILED });
    } finally {
      sending.current = false;
    }
  }
  const clear = (k: string) => setErrors((x) => (k in x || 'form' in x ? Object.fromEntries(Object.entries(x).filter(([key]) => key !== k && key !== 'form')) : x));

  return (
    <Dialog open={open} onClose={onClose} title="Để lại lời nhắn"
      intro="Lê Sơn sẽ gọi lại cho bạn trong giờ làm việc (08:00–21:00)."
      footer={phase === 'sent'
        ? <Button ref={closeRef} onClick={onClose}>Đóng</Button>
        : <><Button variant="ghost" onClick={onClose}>Để sau</Button><Button type="submit" form={formId} icon="send" loading={phase === 'sending'} loadingText="Đang gửi…">Gửi lời nhắn</Button></>}>
      <div role="status" className={s.status}>
        {phase === 'sent' && <p className={s.sent}><Icon name="check" size={18} aria-hidden="true" /> {SENT}</p>}
      </div>
      {phase !== 'sent' && (
        <form id={formId} className={s.form} onSubmit={(e) => void submit(e)} noValidate>
          {errors.form && <p className={s.formError} role="alert"><Icon name="info" size={16} aria-hidden="true" /> {errors.form}</p>}
          {topic && <p className={s.about}>Bạn hỏi về: {topic}</p>}
          <Field label="Tên của bạn" error={errors.name}>
            <Input id={`${formId}name`} value={name} autoComplete="name" maxLength={200} onChange={(e) => { setName(e.target.value); clear('name'); }} />
          </Field>
          <Field label="Số điện thoại" error={errors.phone}>
            <Input id={`${formId}phone`} type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => { setPhone(e.target.value); clear('phone'); }} />
          </Field>
          <Field label="Lời nhắn" error={errors.text}>
            <Textarea id={`${formId}text`} rows={4} value={text} onChange={(e) => { setText(e.target.value); clear('text'); }} />
          </Field>
          <Counter value={text.trim().length} max={INQUIRY_MAX.text} />
        </form>
      )}
    </Dialog>
  );
}
