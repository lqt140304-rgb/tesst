import { useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { SUPPORT_KINDS, SUPPORT_KIND_LABEL, type SupportKind } from '@/data/contracts/enums';
import { staff } from '@/data/staff';
import { useQuery } from '@/data/hooks/useQuery';
import { ValidationError } from '@/data/contracts/errors';
import { Button, ChipGroup, Field, Input, Textarea, useToast } from '@/ui';
import { FormError, LoadingBlocks, PageProblem, Panel, saveError } from '../ui';
import { LIMITS, countText } from './helpView';
import { TicketRow } from './TicketRow';
import h from './Help.module.css';

const FIELDS = ['kind', 'title', 'body', 'screen'];

/** Góp ý của tôi: ask or tell something to the manager, and follow what became of earlier tickets. */
export function SupportTab() {
  const [params] = useSearchParams();
  const toast = useToast();
  const list = useQuery(() => staff.support.mine(), []);
  const [kind, setKind] = useState<SupportKind>('howto');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [screen, setScreen] = useState(params.get('man') ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const sending = useRef(false); // a second click while the first ticket is on its way sends nothing

  async function submit() {
    if (sending.current) return;
    sending.current = true;
    setBusy(true);
    setErrors({});
    try {
      const code = await staff.support.submit({ kind, title, body, screen: screen.trim() || undefined });
      toast({ message: `Đã gửi phiếu ${code}.` });
      setTitle(''); setBody(''); setScreen('');
    } catch (e) {
      if (e instanceof ValidationError) {
        const extra = Object.entries(e.fields).filter(([k]) => !FIELDS.includes(k)).map(([, v]) => v);
        setErrors({ ...e.fields, ...(extra.length ? { form: extra[0]! } : {}) });
      } else setErrors({ form: saveError(e) });
    } finally {
      sending.current = false;
      setBusy(false);
    }
  }
  const clear = (k: string) => setErrors((x) => (k in x || 'form' in x ? Object.fromEntries(Object.entries(x).filter(([key]) => key !== k && key !== 'form')) : x));

  return (
    <>
      <Panel title="Gửi phiếu" icon="message-circle">
        <form className={h.form} onSubmit={(e) => { e.preventDefault(); void submit(); }} noValidate>
          <ChipGroup<SupportKind> label="Loại phiếu" value={kind} onChange={(v) => { setKind(v); clear('kind'); }} options={SUPPORT_KINDS.map((k) => ({ value: k, label: SUPPORT_KIND_LABEL[k] }))} />
          <Field label="Tiêu đề" error={errors.title} hint={countText(title, LIMITS.title)}>
            <Input value={title} autoComplete="off" onChange={(e) => { setTitle(e.target.value); clear('title'); }} />
          </Field>
          <Field label="Nội dung" error={errors.body} hint={countText(body, LIMITS.body)}>
            <Textarea rows={5} value={body} onChange={(e) => { setBody(e.target.value); clear('body'); }} />
          </Field>
          <Field label="Màn hình" optional error={errors.screen} hint={countText(screen, LIMITS.screen)}>
            <Input value={screen} autoComplete="off" onChange={(e) => { setScreen(e.target.value); clear('screen'); }} />
          </Field>
          <FormError>{errors.form}</FormError>
          <div className={h.actions}><Button type="submit" icon="send" loading={busy} loadingText="Đang gửi…">Gửi phiếu</Button></div>
        </form>
      </Panel>
      <Panel title="Phiếu của tôi" icon="clipboard-list">
        {list.error && !list.data ? <PageProblem error={list.error} onRetry={list.refetch} /> : !list.data ? <LoadingBlocks rows={2} /> : list.data.length === 0 ? (
          <p className={h.hint}>Bạn chưa gửi phiếu nào.</p>
        ) : (
          <ul className={h.tickets}>{list.data.map((t) => <TicketRow key={t.id} t={t} />)}</ul>
        )}
      </Panel>
    </>
  );
}
