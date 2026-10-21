import { useState } from 'react';
import { staff, type StaffCustomerDetail } from '@/data/staff';
import { ConflictError, ValidationError } from '@/data/contracts/errors';
import { Button, Dialog, Field, Input, Textarea, useToast } from '@/ui';
import { FormError, saveError } from '../ui';
import s from '../Staff.module.css';
import { PhoneNote } from './PhoneNote';

/** Edit a customer's name, phone, address and internal note. Sends the version the form opened with, so a newer save elsewhere is reported, never overwritten. */
export function CustomerForm({ open, onClose, customer }: { open: boolean; onClose: () => void; customer: StaffCustomerDetail }) {
  const toast = useToast();
  const [name, setName] = useState(customer.full_name);
  const [phone, setPhone] = useState(customer.phone);
  const [address, setAddress] = useState(customer.address ?? '');
  const [note, setNote] = useState(customer.note_internal ?? '');
  const [version] = useState(customer.version);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    setErrors({});
    try {
      await staff.customers.update(customer.id, version, { full_name: name, phone, address: address.trim() || undefined, note_internal: note.trim() || undefined });
      toast({ message: 'Đã lưu hồ sơ.' });
      onClose();
    } catch (e) {
      if (e instanceof ConflictError) { toast({ tone: 'error', message: saveError(e) }); onClose(); return; } // the record reloads itself: reopen to edit the new data
      setErrors(e instanceof ValidationError ? e.fields : { form: saveError(e) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Chỉnh sửa hồ sơ khách"
      footer={<><Button variant="ghost" onClick={onClose}>Để sau</Button><Button icon="check" loading={busy} onClick={() => void save()}>Lưu hồ sơ</Button></>}>
      <div className={s.form}>
        <FormError>{errors.form}</FormError>
        <Field label="Họ tên" error={errors.full_name}><Input value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" /></Field>
        <Field label="Số điện thoại" error={errors.phone}><Input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" autoComplete="off" /></Field>
        <PhoneNote phone={phone} excludeId={customer.id} onNavigate={onClose} closing="Bạn vẫn có thể lưu số này." />
        <Field label="Địa chỉ" optional><Input value={address} onChange={(e) => setAddress(e.target.value)} /></Field>
        <Field label="Ghi chú nội bộ" optional hint="Chỉ nhân viên thấy."><Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
      </div>
    </Dialog>
  );
}
