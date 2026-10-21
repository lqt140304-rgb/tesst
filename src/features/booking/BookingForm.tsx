import { useId, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { AnimatePresence, m } from 'motion/react';
import { AppLink } from '@/app/nav';
import { paths } from '@/app/routes';
import { useSession } from '@/app/session/SessionProvider';
import { useLogout } from '@/app/session/useLogout';
import { bookings, system, type BookingInput } from '@/data/public';
import { customer, type CustomerPetCard } from '@/data/customer';
import { useQuery } from '@/data/hooks/useQuery';
import { SERVICE_LABEL, SPECIES_LABEL, TIME_SLOTS, TIME_SLOT_LABEL, type Service, type Species, type TimeSlot } from '@/data/contracts/enums';
import { DATA_READY } from '@/features/data-ready';
import { ValidationError } from '@/data/contracts/errors';
import { BOOKING_FIELDS, NOTE_MAX, validateBooking, type BookingField } from '@/data/rules/booking';
import { todayVN } from '@/lib/dates';
import { Banner, Button, Checkbox, ChipGroup, Counter, DemoTag, Field, Icon, IconBadge, Input, Select, Textarea, type IconName } from '@/ui';
import type { BadgeTone } from '@/ui/kit/Misc';
import { dur, ease } from '@/ui/motion';
import { BookingFailure, BookingSuccess } from './BookingSuccess';
import s from './BookingForm.module.css';

type Phase = 'form' | 'sending' | 'success' | 'failure';
type Values = {
  contact_name: string; phone: string; pet: string; pet_name: string; species: Species | ''; breed: string;
  service: Service | ''; desired_date: string; preferred_slot: TimeSlot | ''; note: string; consent: boolean; save_pet: boolean;
};

const EMPTY: Omit<Values, 'service'> = {
  contact_name: '', phone: '', pet: '', pet_name: '', species: '', breed: '', desired_date: '', preferred_slot: '', note: '', consent: false, save_pet: true,
};
const NEW_PET = 'new';
const LABEL: Record<BookingField, string> = {
  contact_name: 'Họ và tên', phone: 'Số điện thoại', pet_name: 'Tên bé', species: 'Bé là', service: 'Dịch vụ',
  desired_date: 'Ngày bạn mong muốn', preferred_slot: 'Khung giờ', note: 'Ghi chú thêm', consent: 'Đồng ý liên hệ',
};
const SERVICE_CARDS: { value: Service; icon: IconName; tone: BadgeTone }[] = [
  { value: 'kham', icon: 'stethoscope', tone: 'peach' },
  { value: 'spa', icon: 'scissors', tone: 'mint' },
  { value: 'noi_tru', icon: 'house-paw', tone: 'lilac' },
];
const SPECIES_ICON: Record<Species, IconName> = { cat: 'cat-face', dog: 'dog-face', other: 'paw' };
const PICK_PET = 'Bạn chọn bé cần đặt lịch, hoặc chọn "+ Bé khác" nhé.';

const petKey = (p: CustomerPetCard) => `${p.source}:${p.id}`;

/**
 * Booking request form (customer §3a–3e). Guest, logged-in customer and staff (R28: read-only notice)
 * variants come from the session, so the same component serves the homepage and #/khach-hang/dat-lich.
 * A different session starts a fresh form: one person's answers or confirmation never carry over to the next.
 */
export type BookingPrefill = { service: Service; pet_name: string; species: Species; breed?: string; note?: string };

export function BookingForm({ initialService, prefill, initialPetId, bare = false }: { initialService?: Service; prefill?: BookingPrefill; initialPetId?: string; bare?: boolean }) {
  const { session } = useSession();
  const who = session ? (session.kind === 'customer' ? `c:${session.accountId}` : `s:${session.staffId}`) : 'guest';
  return <Form key={who} initialService={initialService} prefill={prefill} initialPetId={initialPetId} bare={bare} />;
}

function Form({ initialService, prefill, initialPetId, bare }: { initialService?: Service; prefill?: BookingPrefill; initialPetId?: string; bare: boolean }) {
  const { session, me } = useSession();
  const logout = useLogout();
  const variant = session?.kind === 'customer' ? 'customer' : session?.kind === 'staff' ? 'staff' : 'guest';
  const uid = useId();
  const id = (f: string) => `bk${uid}${f}`;

  const [values, setValues] = useState<Values>(() => (prefill
    ? { ...EMPTY, service: prefill.service, pet_name: prefill.pet_name, species: prefill.species, breed: prefill.breed ?? '', note: prefill.note ?? '' }
    : { ...EMPTY, service: initialService ?? '' }));
  const [seenInitial, setSeenInitial] = useState(initialService);
  if (initialService !== seenInitial) {
    setSeenInitial(initialService);
    if (initialService) setValues((v) => ({ ...v, service: initialService }));
  }
  const [touched, setTouched] = useState<Set<BookingField>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [serverErrors, setServerErrors] = useState<Partial<Record<BookingField, string>>>({});
  const [phase, setPhase] = useState<Phase>('form');
  const [sentPhone, setSentPhone] = useState('');
  const [height, setHeight] = useState<number>();
  const cardRef = useRef<HTMLDivElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);

  const accountKey = session?.kind === 'customer' ? session.accountId : null;
  const pets = useQuery(() => (accountKey ? customer.pets.list() : Promise.resolve([])), [accountKey]);
  const savedPets = accountKey ? pets.data ?? [] : [];
  // "Gửi lại yêu cầu tương tự": once the saved pets are known, pick the same bé if it is still on file.
  const [prefillDone, setPrefillDone] = useState(!prefill);
  if (!prefillDone && prefill && pets.data) {
    setPrefillDone(true);
    const same = savedPets.find((p) => p.name === prefill.pet_name && p.species === prefill.species);
    setValues((v) => ({ ...v, pet: same ? petKey(same) : NEW_PET }));
  }
  // "Đặt lịch cho bé": preselect that saved pet once the list is known (ignored when it is not on file).
  const [petPicked, setPetPicked] = useState(!initialPetId);
  if (!petPicked && pets.data) {
    setPetPicked(true);
    const wanted = savedPets.find((p) => p.id === initialPetId);
    if (wanted) setValues((v) => ({ ...v, pet: petKey(wanted) }));
  }
  const chosen = savedPets.find((p) => petKey(p) === values.pet);
  const newPet = variant !== 'customer' || values.pet === NEW_PET || (pets.data !== undefined && savedPets.length === 0);

  const today = todayVN(system.now());
  const guest = variant !== 'customer';
  const clientErrors = validateBooking(
    { ...values, pet_name: chosen ? chosen.name : newPet ? values.pet_name : '', species: chosen ? chosen.species : newPet ? values.species : 'other' },
    { today, guest },
  );
  if (!guest && !chosen && !newPet) clientErrors.pet_name = PICK_PET;
  const errors: Partial<Record<BookingField, string>> = {};
  for (const f of BOOKING_FIELDS) {
    const msg = serverErrors[f] ?? ((submitted || touched.has(f)) ? clientErrors[f] : undefined);
    if (msg) errors[f] = msg;
  }
  const errorKeys = BOOKING_FIELDS.filter((f) => errors[f]);

  function set<K extends keyof Values>(key: K, value: Values[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    setServerErrors((e) => {
      const f = (key === 'pet' ? 'pet_name' : key) as BookingField;
      if (!e[f]) return e;
      const next = { ...e };
      delete next[f];
      return next;
    });
  }
  const touch = (f: BookingField) => setTouched((t) => (t.has(f) ? t : new Set(t).add(f)));

  function focusField(f: BookingField) {
    const el = document.getElementById(id(f));
    const target = el?.getAttribute('role') === 'radiogroup'
      ? el.querySelector<HTMLElement>('[aria-checked="true"]') ?? el.querySelector<HTMLElement>('[role="radio"]')
      : el;
    target?.focus();
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (variant === 'staff' || phase === 'sending') return;
    setSubmitted(true);
    const first = BOOKING_FIELDS.find((f) => clientErrors[f]);
    if (first) { focusField(first); return; }
    const input: BookingInput = {
      contact_name: guest ? values.contact_name : '',
      phone: guest ? values.phone : '',
      pet_name: chosen ? chosen.name : values.pet_name,
      species: (chosen ? chosen.species : values.species) as Species,
      breed: !chosen && values.species === 'other' ? values.breed : undefined,
      service: values.service as Service,
      desired_date: values.desired_date,
      preferred_slot: values.preferred_slot || undefined,
      note: values.note,
      consent: guest ? values.consent : true,
      pet_id: chosen?.source === 'hospital' ? chosen.id : undefined,
      account_pet_id: chosen?.source === 'web' ? chosen.id : undefined,
      save_pet: !guest && !chosen ? values.save_pet : undefined,
    };
    setHeight(cardRef.current?.offsetHeight);
    setPhase('sending');
    try {
      await bookings.submit(input);
      setSentPhone(guest ? values.phone.trim() : me?.kind === 'customer' ? me.phoneMasked : '');
      setPhase('success');
    } catch (err) {
      if (err instanceof ValidationError) {
        setServerErrors(err.fields as Partial<Record<BookingField, string>>);
        setPhase('form');
        const f = BOOKING_FIELDS.find((k) => err.fields[k]);
        if (f) requestAnimationFrame(() => focusField(f));
      } else {
        setPhase('failure');
      }
    }
  }

  function again() {
    setValues((v) => ({ ...EMPTY, contact_name: v.contact_name, phone: v.phone, service: '' }));
    setSubmitted(false);
    setTouched(new Set());
    setServerErrors({});
    setPhase('form');
  }
  function retry() {
    setPhase('form');
    requestAnimationFrame(() => submitRef.current?.focus());
  }

  const showResult = phase === 'success' || phase === 'failure';
  return (
    <div id="form-dat-lich" className={bare ? s.bare : s.card} data-card="booking" ref={cardRef} style={showResult && height ? { minHeight: height } : undefined}>
      <AnimatePresence mode="wait" initial={false}>
        <m.div key={showResult ? phase : 'form'} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
          transition={{ duration: dur.m, ease: ease.out }} className={s.phase}>
          {phase === 'success' ? <BookingSuccess variant={guest ? 'guest' : 'customer'} phone={sentPhone} onAgain={again} />
            : phase === 'failure' ? <BookingFailure onRetry={retry} />
            : (
              <form noValidate onSubmit={onSubmit} className={s.form} aria-labelledby={id('title')}>
                <h3 id={id('title')} className={bare ? 'sr-only' : s.title}>Thông tin đặt lịch</h3>

                {variant === 'staff' && (
                  <Banner tone="warm" icon="shield-user">Bạn đang đăng nhập bằng tài khoản nhân viên. Hãy dùng “Tạo lịch hẹn” trong khu nhân viên.</Banner>
                )}
                {variant === 'customer' && me?.kind === 'customer' && (
                  <div className={s.account}>
                    <IconBadge icon="user-round" tone="lilac" size={40} />
                    <p>Gửi với tài khoản <strong>{me.name}</strong> · {me.phoneMasked}</p>
                    <button type="button" className={s.linkBtn} onClick={() => void logout({ stay: true })}>Không phải bạn? Đăng xuất</button>
                  </div>
                )}

                {submitted && errorKeys.length > 0 && (
                  <div className={s.summary} role="alert">
                    <p><Icon name="info" size={18} /> Còn {errorKeys.length} mục cần bổ sung</p>
                    <ul>
                      {errorKeys.map((f) => (
                        <li key={f}><button type="button" className={s.linkBtn} onClick={() => focusField(f)}>{LABEL[f]}</button></li>
                      ))}
                    </ul>
                  </div>
                )}

                <Group title="Về bạn">
                  {guest ? (
                    <div className={s.pair}>
                      <Field label="Họ và tên" error={errors.contact_name}>
                        <Input id={id('contact_name')} value={values.contact_name} onChange={(e) => set('contact_name', e.target.value)}
                          onBlur={() => touch('contact_name')} autoComplete="name" placeholder="Ví dụ: Nguyễn Thị Lan" />
                      </Field>
                      <Field label="Số điện thoại" hint="Lê Sơn sẽ gọi số này để xác nhận lịch." error={errors.phone}>
                        <Input id={id('phone')} type="tel" inputMode="tel" value={values.phone} onChange={(e) => set('phone', e.target.value)}
                          onBlur={() => touch('phone')} autoComplete="tel" placeholder="Ví dụ: 0912 345 678" />
                      </Field>
                    </div>
                  ) : (<>
                    <dl className={s.readonly}>
                      <div><dt>Họ và tên</dt><dd>{me?.kind === 'customer' ? me.name : '…'}</dd></div>
                      <div><dt>Số điện thoại</dt><dd>{me?.kind === 'customer' ? me.phoneMasked : '…'}</dd></div>
                    </dl>
                    <p className={s.hint}>Số liên hệ lấy từ tài khoản của bạn.</p>
                  </>)}
                </Group>

                <Group title="Về bé">
                  {!guest && savedPets.length > 0 && (
                    <GroupField label="Chọn bé" error={newPet ? undefined : errors.pet_name}>
                      <ChipGroup id={newPet ? undefined : id('pet_name')} label="Chọn bé" value={values.pet || undefined}
                        onChange={(v) => { set('pet', v); touch('pet_name'); }}
                        options={[
                          ...savedPets.map((p) => ({
                            value: petKey(p),
                            label: <>{p.name} <span className={s.muted}>{SPECIES_LABEL[p.species]}</span></>,
                            leading: <IconBadge icon={SPECIES_ICON[p.species]} tone={p.species === 'dog' ? 'peach' : 'lilac'} size={28} />,
                          })),
                          { value: NEW_PET, label: 'Bé khác', leading: <Icon name="plus" size={18} /> },
                        ]} />
                    </GroupField>
                  )}
                  {newPet && (
                    <>
                      <Field label="Tên bé" error={errors.pet_name}>
                        <Input id={id('pet_name')} value={values.pet_name} onChange={(e) => set('pet_name', e.target.value)}
                          onBlur={() => touch('pet_name')} placeholder="Ví dụ: Miu" />
                      </Field>
                      <GroupField label="Bé là" error={errors.species}>
                        <ChipGroup id={id('species')} label="Bé là" value={values.species || undefined}
                          onChange={(v) => { set('species', v); touch('species'); }}
                          options={(['cat', 'dog', 'other'] as const).map((v) => ({ value: v, label: SPECIES_LABEL[v], leading: <Icon name={SPECIES_ICON[v]} size={18} /> }))} />
                      </GroupField>
                      <AnimatePresence initial={false}>
                        {values.species === 'other' && (
                          <m.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: dur.m, ease: ease.out }} className={s.reveal}>
                            <Field label="Bé là loài gì?" optional>
                              <Input id={id('breed')} value={values.breed} onChange={(e) => set('breed', e.target.value)} placeholder="Ví dụ: thỏ, hamster" />
                            </Field>
                          </m.div>
                        )}
                      </AnimatePresence>
                      {!guest && (
                        <Checkbox label="Lưu bé vào hồ sơ của tôi" checked={values.save_pet} onChange={(e) => set('save_pet', e.target.checked)} />
                      )}
                    </>
                  )}
                </Group>

                <Group title="Bé cần gì">
                  <GroupField label="Dịch vụ" error={errors.service}>
                    <ChipGroup id={id('service')} label="Dịch vụ" variant="card" value={values.service || undefined}
                      onChange={(v) => { set('service', v); touch('service'); }}
                      options={SERVICE_CARDS.map((c) => ({
                        value: c.value, label: SERVICE_LABEL[c.value],
                        leading: <span data-service-choice={c.value} className={s.choiceBadge}><IconBadge icon={c.icon} tone={c.tone} size={40} /></span>,
                      }))} />
                    <p className={s.hint}><Icon name="heart-pulse" size={16} /> Cấp cứu? Gọi ngay <a href="tel:+84973555105">097 355 51 05</a></p>
                  </GroupField>
                  <Field label="Ngày bạn mong muốn" hint="Giờ cụ thể sẽ được thống nhất khi nhân viên gọi cho bạn." error={errors.desired_date}>
                    <Input id={id('desired_date')} type="date" min={today} value={values.desired_date}
                      onChange={(e) => set('desired_date', e.target.value)} onBlur={() => touch('desired_date')} className={s.date} />
                  </Field>
                  {DATA_READY.timeSlot && (
                    <Field label="Khung giờ" optional hint="Giờ tạm tính; Lê Sơn sẽ gọi lại để thống nhất." error={errors.preferred_slot}>
                      <Select id={id('preferred_slot')} value={values.preferred_slot} onChange={(e) => set('preferred_slot', e.target.value as TimeSlot | '')}>
                        <option value="">Không chọn</option>
                        {TIME_SLOTS.map((t) => <option key={t} value={t}>{TIME_SLOT_LABEL[t]}</option>)}
                      </Select>
                    </Field>
                  )}
                  <Field label="Ghi chú thêm" optional error={errors.note}>
                    <Textarea id={id('note')} value={values.note} onChange={(e) => set('note', e.target.value)} onBlur={() => touch('note')} rows={3}
                      placeholder="Ví dụ: bé bỏ ăn từ hôm qua; tôi tiện nghe máy sau 17 giờ." />
                  </Field>
                  <Counter value={values.note.length} max={NOTE_MAX} />
                </Group>

                {guest && (
                  <div className={s.consent}>
                    <Checkbox id={id('consent')} checked={values.consent} onChange={(e) => { set('consent', e.target.checked); touch('consent'); }}
                      aria-invalid={errors.consent ? true : undefined} aria-describedby={errors.consent ? id('consent-err') : undefined}
                      label={<>Tôi đồng ý để Lê Sơn dùng thông tin trên để liên hệ và sắp xếp lịch hẹn. <DemoTag>Nội dung mẫu</DemoTag></>} />
                    {errors.consent && <p id={id('consent-err')} className={s.error}><Icon name="info" size={16} />{errors.consent}</p>}
                  </div>
                )}

                <div className={s.submit}>
                  <Button ref={submitRef} type="submit" size="lg" icon="send" full loading={phase === 'sending'} loadingText="Đang gửi…" disabled={variant === 'staff'}>
                    Gửi yêu cầu
                  </Button>
                  <p className={s.hint}>Lịch chỉ được xác nhận sau khi nhân viên gọi cho bạn.</p>
                  {variant === 'guest' && (
                    <p className={s.hint}>Đã có tài khoản? <AppLink to={`${paths.login}?tiep=${paths.book}`}>Đăng nhập</AppLink> để điền sẵn thông tin.</p>
                  )}
                </div>
              </form>
            )}
        </m.div>
      </AnimatePresence>
    </div>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className={s.group}>
      <legend className={s.legend}>{title}</legend>
      {children}
    </fieldset>
  );
}

function GroupField({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <div className={s.groupField}>
      <p className={s.label} aria-hidden="true">{label}</p>
      {children}
      {error && <p className={s.error}><Icon name="info" size={16} />{error}</p>}
    </div>
  );
}
