import { useState } from 'react';
import { staff, type StaffRequestDetail } from '@/data/staff';
import { Button, Dialog, Field, Input, Textarea, useToast } from '@/ui';
import { FormError, saveError } from '../ui';
import st from '../Staff.module.css';

const CANCEL = [
  ['customer_not_coming', 'Khách báo không đến'], ['other_plans', 'Khách đã có kế hoạch khác'],
  ['rebooked_by_phone', 'Khách đã đặt lại qua điện thoại'], ['other', 'Lý do khác'],
] as const;
const REJECT = [
  ['no_slot', 'Chưa thể sắp xếp lịch phù hợp'], ['service_mismatch', 'Dịch vụ chưa phù hợp với nhu cầu'], ['duplicate', 'Trùng với yêu cầu khác'],
  ['invalid', 'Thông tin không hợp lệ'], ['other', 'Lý do khác'],
] as const;

/** "Hủy yêu cầu" / "Từ chối yêu cầu" (staff §4.1). Reasons are internal; the customer only sees a gentle status. */
export function CloseDialog({ r, version, kind, open, onClose }: { r: StaffRequestDetail; version: number; kind: 'cancel' | 'reject'; open: boolean; onClose: () => void }) {
  const toast = useToast();
  const reasons = kind === 'cancel' ? CANCEL : REJECT;
  const [code, setCode] = useState<string>('');
  const [text, setText] = useState('');
  const [dup, setDup] = useState('');
  const [err, setErr] = useState<{ code?: string; text?: string; dup?: string; form?: string }>({});
  const [busy, setBusy] = useState(false);
  const label = reasons.find(([c]) => c === code)?.[1];

  async function submit() {
    const e: typeof err = {};
    if (!code) e.code = 'Bạn chọn một lý do nhé.';
    if (code === 'other' && !text.trim()) e.text = 'Bạn ghi rõ lý do nhé.';
    if (code === 'duplicate' && !/^YC-\d{4}$/i.test(dup.trim())) e.dup = 'Nhập mã yêu cầu trùng, ví dụ YC-0228.';
    setErr(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      const reason_text = code === 'other' ? text.trim() : label;
      if (kind === 'cancel') await staff.requests.cancel(r.id, version, { reason_code: code, reason_text });
      else await staff.requests.reject(r.id, version, { reason_code: code, reason_text: code === 'duplicate' ? `Trùng với ${dup.trim().toUpperCase()}` : reason_text, duplicate_of: code === 'duplicate' ? dup.trim().toUpperCase() : undefined });
      toast({ message: kind === 'cancel' ? `Đã hủy yêu cầu ${r.code}.` : `Đã từ chối yêu cầu ${r.code}.` });
      onClose();
    } catch (x) {
      setErr({ form: saveError(x) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title={kind === 'cancel' ? 'Hủy yêu cầu' : 'Từ chối yêu cầu'}
      intro={kind === 'cancel'
        ? `Dùng khi khách báo không đến hoặc muốn hủy.${r.status === 'confirmed' ? ' Lịch hẹn đã đặt cũng sẽ được hủy.' : ''}`
        : 'Dùng khi bệnh viện chưa thể tiếp nhận. Lý do chỉ nhân viên thấy.'}
      footer={<>
        <Button variant="ghost" onClick={onClose}>Quay lại</Button>
        <Button variant="danger" loading={busy} onClick={() => void submit()}>{kind === 'cancel' ? 'Hủy yêu cầu' : 'Từ chối yêu cầu'}</Button>
      </>}>
      <div className={st.form}>
        <FormError>{err.form}</FormError>
        <fieldset className={st.radioList}>
          <legend>Lý do</legend>
          {reasons.map(([c, l]) => (
            <label key={c} className={st.radio}>
              <input type="radio" name={`reason-${kind}`} checked={code === c} onChange={() => setCode(c)} />
              <span>{l}</span>
            </label>
          ))}
          {err.code && <p className={st.warn}>{err.code}</p>}
        </fieldset>
        {code === 'duplicate' && (
          <Field label="Mã yêu cầu trùng" error={err.dup} hint="Nếu yêu cầu của khách vãng lai trùng với yêu cầu có tài khoản, hãy từ chối yêu cầu vãng lai và giữ yêu cầu có tài khoản (khách chỉ thấy yêu cầu có tài khoản).">
            <Input value={dup} onChange={(e) => setDup(e.target.value)} placeholder="VD: YC-0228" />
          </Field>
        )}
        {code === 'other' && (
          <Field label="Lý do cụ thể" error={err.text}>
            <Textarea rows={2} value={text} onChange={(e) => setText(e.target.value)} />
          </Field>
        )}
      </div>
    </Dialog>
  );
}
