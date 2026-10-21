import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { useAppNavigate } from '@/app/nav';
import { paths } from '@/app/routes';
import { staff } from '@/data/staff';
import { useQuery } from '@/data/hooks/useQuery';
import { SPECIES_LABEL } from '@/data/contracts/enums';
import { formatPhoneVi } from '@/lib/phone';
import { Button, Field, Icon, Input } from '@/ui';
import { FormError, PageHeader, Panel, saveError } from '../ui';
import s from '../Staff.module.css';

/** "Lập hóa đơn" step 1: who and which pets (prefilled from an appointment or a record), then the draft opens in the editor. */
export function InvoiceNewPage() {
  const [params] = useSearchParams();
  const navigate = useAppNavigate();
  const [customerId, setCustomerId] = useState(params.get('khach') ?? '');
  const [q, setQ] = useState('');
  const [picked, setPicked] = useState<string[] | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const found = useQuery(() => (!customerId && q.trim().length >= 2 ? staff.customers.list(q) : Promise.resolve([])), [q, customerId]);
  const record = useQuery(() => (customerId ? staff.customers.get(customerId) : Promise.resolve(null)), [customerId]);
  const pets = record.data?.pets ?? [];
  const preset = params.get('be');
  // Default: the pet from the appointment, else the only pet; an explicit choice replaces it.
  const petIds = picked ?? (preset && pets.some((p) => p.id === preset) ? [preset] : pets.length === 1 ? [pets[0]!.id] : []);

  async function create() {
    if (!customerId) { setErr('Bạn chọn khách hàng trước nhé.'); return; }
    if (petIds.length === 0) { setErr('Bạn chọn ít nhất một bé nhé.'); return; }
    setBusy(true);
    setErr('');
    try {
      const lich = params.get('lich');
      const id = await staff.invoices.createDraft({ customer_id: customerId, pet_ids: petIds, source_type: lich ? 'appointment' : 'counter', source_id: lich ?? undefined });
      navigate(paths.nv.invoice(id), { replace: true });
    } catch (e) {
      setErr(saveError(e));
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader title="Lập hóa đơn" parent={{ label: 'Hóa đơn', to: paths.nv.invoices }}
        sub="Chọn khách hàng và thú cưng, sau đó thêm dịch vụ từ bảng giá." />
      <div className={s.stack} style={{ maxWidth: 640 }}>
        <Panel title="Khách hàng & thú cưng" icon="users-round">
          {customerId && record.data ? (
            <div className={s.recordHead}>
              <strong>{record.data.full_name}</strong><span className={s.code}>{record.data.code}</span><span className={s.meta}>{formatPhoneVi(record.data.phone)}</span>
              {!params.get('khach') && <Button size="sm" variant="ghost" onClick={() => { setCustomerId(''); setPicked(null); }}>Đổi khách</Button>}
            </div>
          ) : (
            <>
              <Field label="Tìm khách hàng" hint="Tên, số điện thoại hoặc tên thú cưng.">
                <Input type="search" value={q} onChange={(e) => setQ(e.target.value)} />
              </Field>
              <fieldset className={s.radioList}>
                <legend className="sr-only">Chọn khách hàng</legend>
                {(found.data ?? []).slice(0, 6).map((c) => (
                  <label key={c.id} className={s.radio}>
                    <input type="radio" name="inv-customer" checked={false} onChange={() => { setCustomerId(c.id); setPicked(null); }} />
                    <span>{c.full_name} · {c.code}<small>{formatPhoneVi(c.phone)} · {c.petNames.join(', ')}</small></span>
                  </label>
                ))}
              </fieldset>
            </>
          )}
          {record.data && (
            <fieldset className={s.radioList}>
              <legend>Thú cưng trên hóa đơn</legend>
              {pets.length === 0 && <p className={s.meta}>Hồ sơ chưa có thú cưng.</p>}
              {pets.map((p) => (
                <label key={p.id} className={s.radio}>
                  <input type="checkbox" checked={petIds.includes(p.id)} onChange={(e) => setPicked(e.target.checked ? [...petIds, p.id] : petIds.filter((x) => x !== p.id))} />
                  <span>{p.name}<small>{SPECIES_LABEL[p.species]}{p.breed ? ` · ${p.breed}` : ''}</small></span>
                </label>
              ))}
            </fieldset>
          )}
          <FormError>{err}</FormError>
          <div><Button icon="file-pen" loading={busy} onClick={() => void create()}>Tạo hóa đơn nháp</Button></div>
        </Panel>
        <p className={s.small}><Icon name="info" size={14} /> Hóa đơn nháp chỉ nhân viên thấy. Khách chỉ xem được sau khi phát hành.</p>
      </div>
    </>
  );
}
