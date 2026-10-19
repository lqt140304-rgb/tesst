import { useState } from 'react';
import { staff, type WebAccountForLinking } from '@/data/staff';
import { useQuery } from '@/data/hooks/useQuery';
import { SPECIES_LABEL } from '@/data/contracts/enums';
import { formatDateVi } from '@/lib/dates';
import { formatPhoneVi } from '@/lib/phone';
import { Button, Checkbox, Dialog, Field, Icon, Input, Select, Textarea, useToast } from '@/ui';
import { cx } from '@/lib/cx';
import { FormError, saveError } from '../ui';
import s from '../Staff.module.css';

const NEW = '__new__';
const fold = (x: string) => x.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').toLowerCase().trim();

/** "Liên kết tài khoản web" (staff §4.4): code → record → pet matching → verification. Never automatic. */
export function LinkDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const toast = useToast();
  const [code, setCode] = useState('');
  const [found, setFound] = useState<WebAccountForLinking | null>(null);
  const [lookupErr, setLookupErr] = useState('');
  const [looking, setLooking] = useState(false);
  const [q, setQ] = useState('');
  const [customer, setCustomer] = useState('');
  const [matches, setMatches] = useState<Record<string, string>>({});
  const [method, setMethod] = useState<'in_person_app' | 'other'>('in_person_app');
  const [methodNote, setMethodNote] = useState('');
  const [checked, setChecked] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const search = useQuery(() => (q.trim().length >= 2 ? staff.customers.list(q) : Promise.resolve([])), [q]);
  const record = useQuery(() => (customer && customer !== NEW ? staff.customers.get(customer) : Promise.resolve(null)), [customer]);
  const pets = record.data?.pets ?? [];
  /** Name + species matches are suggested, never forced: an explicit choice (even "Không ghép") wins. */
  const matchFor = (webPet: WebAccountForLinking['webPets'][number]) =>
    matches[webPet.id] ?? pets.find((p) => p.species === webPet.species && fold(p.name) === fold(webPet.name))?.id ?? '';

  async function lookup() {
    setLooking(true);
    setLookupErr('');
    setFound(null);
    setCustomer('');
    setMatches({});
    try {
      const r = await staff.accounts.findByLinkCode(code);
      if (!r) setLookupErr('Không tìm thấy tài khoản với mã này. Vui lòng kiểm tra lại với khách.');
      else if (r.alreadyLinked) setLookupErr(`Tài khoản ${r.account.username} đã được liên kết với một hồ sơ.`);
      else setFound(r);
    } catch (e) {
      setLookupErr(saveError(e));
    } finally {
      setLooking(false);
    }
  }

  async function submit() {
    const e: Record<string, string> = {};
    if (!found) e.code = 'Bạn tìm tài khoản bằng mã kết nối trước nhé.';
    if (!customer) e.customer = 'Bạn chọn hồ sơ khách hàng nhé.';
    if (method === 'other' && !methodNote.trim()) e.method = 'Bạn ghi rõ cách xác minh nhé.';
    if (!checked) e.checked = 'Vui lòng xác nhận đã đối chiếu người đến quầy.';
    setErrors(e);
    if (Object.keys(e).length || !found) return;
    setBusy(true);
    try {
      let customerId = customer;
      if (customer === NEW) customerId = await staff.customers.create({ full_name: found.account.display_name, phone: found.account.phone });
      const pet_matches = customer === NEW ? [] : found.webPets.map((w) => ({ account_pet_id: w.id, pet_id: matchFor(w) })).filter((x) => x.pet_id);
      await staff.accounts.link(found.account.id, { customer_id: customerId, pet_matches, method, method_note: method === 'other' ? methodNote.trim() : undefined, confirmed: true });
      const linked = await staff.customers.get(customerId);
      toast({ message: `Đã liên kết tài khoản ${found.account.username} với hồ sơ ${linked.code}.` });
      onClose();
    } catch (x) {
      setErrors({ form: saveError(x) });
    } finally {
      setBusy(false);
    }
  }

  const options = found ? [
    ...found.phoneMatches.map((c) => ({ id: c.id, label: `${c.full_name} · ${c.code}`, sub: `Cùng số điện thoại · ${c.pets.map((p) => p.name).join(', ') || 'chưa có thú cưng'}` })),
    ...(search.data ?? []).filter((c) => !found.phoneMatches.some((m) => m.id === c.id)).slice(0, 5)
      .map((c) => ({ id: c.id, label: `${c.full_name} · ${c.code}`, sub: `${formatPhoneVi(c.phone)} · ${c.petNames.join(', ') || 'chưa có thú cưng'}${c.linkedUsername ? ' · đã liên kết tài khoản khác' : ''}` })),
  ] : [];

  return (
    <Dialog open={open} onClose={onClose} wide title="Liên kết tài khoản web"
      footer={<>
        <Button variant="ghost" onClick={onClose}>Để sau</Button>
        <Button icon="link-2" loading={busy} disabled={!found} onClick={() => void submit()}>Liên kết tài khoản</Button>
      </>}>
      <ol className={s.steps}>
        <li className={s.step}>
          <p className={s.stepTitle}>Mã kết nối khách đưa cho bạn</p>
          <form className={s.inline} onSubmit={(e) => { e.preventDefault(); void lookup(); }}>
            <Field label="Mã kết nối khách đưa cho bạn" error={lookupErr || errors.code}>
              <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="VD: LS-7K2Q" autoComplete="off" autoCapitalize="characters" data-autofocus />
            </Field>
            <Button type="submit" variant="secondary" icon="search" loading={looking}>Tìm tài khoản</Button>
          </form>
          {found && (
            <div className={s.accountCard}>
              <strong>{found.account.display_name}</strong>
              <span>Tên đăng nhập: <span className={s.code}>{found.account.username}</span></span>
              <span className={s.meta}>{formatPhoneVi(found.account.phone)} · đăng ký {formatDateVi(found.account.created_at)}</span>
              {found.webPets.length > 0 && <span className={s.meta}>Thú cưng khách tự thêm: {found.webPets.map((p) => p.name).join(', ')}</span>}
            </div>
          )}
        </li>

        <li className={cx(s.step, !found && s.stepOff)} aria-disabled={!found}>
          <p className={s.stepTitle}>Chọn hồ sơ khách hàng</p>
          {found && (
            <>
              <Field label="Tìm hồ sơ khác" optional>
                <Input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tên, số điện thoại, tên thú cưng" />
              </Field>
              <fieldset className={s.radioList}>
                <legend className="sr-only">Hồ sơ khách hàng</legend>
                {options.map((o) => (
                  <label key={o.id} className={s.radio}>
                    <input type="radio" name="link-customer" checked={customer === o.id} onChange={() => setCustomer(o.id)} />
                    <span>{o.label}<small>{o.sub}</small></span>
                  </label>
                ))}
                <label className={s.radio}>
                  <input type="radio" name="link-customer" checked={customer === NEW} onChange={() => setCustomer(NEW)} />
                  <span>Tạo hồ sơ mới<small>{found.account.display_name} · {formatPhoneVi(found.account.phone)}</small></span>
                </label>
                {errors.customer && <p className={s.warn}>{errors.customer}</p>}
              </fieldset>
            </>
          )}
        </li>

        <li className={cx(s.step, !customer && s.stepOff)} aria-disabled={!customer}>
          <p className={s.stepTitle}>Ghép thú cưng</p>
          {found && customer && (found.webPets.length === 0 ? <p className={s.meta}>Khách chưa tự thêm thú cưng nào.</p> : customer === NEW ? <p className={s.meta}>Hồ sơ mới chưa có thú cưng để ghép.</p> : (
            <div className={s.form}>
              {found.webPets.map((w) => (
                <Field key={w.id} label={`${w.name} (khách tự thêm)`} hint={`${SPECIES_LABEL[w.species]}${w.breed ? ` · ${w.breed}` : ''}`}>
                  <Select value={matchFor(w)} onChange={(e) => setMatches((m) => ({ ...m, [w.id]: e.target.value }))}>
                    <option value="">Không ghép</option>
                    {pets.map((p) => <option key={p.id} value={p.id}>{p.name} · {SPECIES_LABEL[p.species]} (hồ sơ tại bệnh viện)</option>)}
                  </Select>
                </Field>
              ))}
            </div>
          ))}
        </li>

        <li className={cx(s.step, !customer && s.stepOff)} aria-disabled={!customer}>
          <p className={s.stepTitle}>Cách xác minh</p>
          {customer && (
            <div className={s.form}>
              <fieldset className={s.radioList}>
                <legend className="sr-only">Cách xác minh</legend>
                <label className={s.radio}>
                  <input type="radio" name="link-method" checked={method === 'in_person_app'} onChange={() => setMethod('in_person_app')} />
                  <span>Khách có mặt tại quầy và mở tài khoản trên điện thoại của mình</span>
                </label>
                <label className={s.radio}>
                  <input type="radio" name="link-method" checked={method === 'other'} onChange={() => setMethod('other')} />
                  <span>Cách khác (ghi rõ)</span>
                </label>
              </fieldset>
              {method === 'other' && <Field label="Cách xác minh" error={errors.method}><Textarea rows={2} value={methodNote} onChange={(e) => setMethodNote(e.target.value)} /></Field>}
              <Checkbox label="Tôi đã đối chiếu người đến quầy đúng là chủ của hồ sơ này." checked={checked} onChange={(e) => setChecked(e.target.checked)} />
              {errors.checked && <p className={s.warn}><Icon name="info" size={16} />{errors.checked}</p>}
              <p className={s.hint}><Icon name="eye" size={16} />Sau khi liên kết, khách sẽ xem được hóa đơn, nhật ký nội trú và video của các bé trong hồ sơ này.</p>
            </div>
          )}
        </li>
      </ol>
      <FormError>{errors.form}</FormError>
    </Dialog>
  );
}
