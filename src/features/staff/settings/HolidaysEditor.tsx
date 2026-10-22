import { useState, type KeyboardEvent } from 'react';
import { inYears } from '@/data/rules/calendar';
import { SETTINGS_MSG, HOLIDAY_NOTE_MAX } from '@/data/rules/app-settings';
import { Button, Field, Icon, Input } from '@/ui';
import { formatDateVi } from '@/lib/dates';
import { FormError } from '../ui';
import { isRealDay } from './settingsForm';
import { sortHolidays } from './settingsView';
import s from './Settings.module.css';

type Row = { date: string; note: string };

/**
 * Days off, listed by date. A day that is not real or already listed is refused at once, under the box, before anything is sent;
 * what the rules say about a row (by its place in the list) shows beside that row.
 */
export function HolidaysEditor({ value, onChange, rowErrors, error }: {
  value: Row[]; onChange: (next: Row[]) => void; rowErrors: Record<number, string>; error?: string;
}) {
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');
  const [problem, setProblem] = useState<string>();

  function add() {
    const d = date.trim();
    if (!isRealDay(d) || !inYears(d)) return setProblem(SETTINGS_MSG.holiday_date);
    if (value.some((h) => h.date === d)) return setProblem(SETTINGS_MSG.holiday_twice);
    onChange(sortHolidays([...value, { date: d, note: note.trim() }]));
    setDate(''); setNote(''); setProblem(undefined);
  }
  // Enter here adds the day; it must not send the whole settings form.
  const onEnter = (e: KeyboardEvent) => { if (e.key === 'Enter') { e.preventDefault(); add(); } };

  return (
    <div className={s.holidays}>
      <p className={s.sub}>Ngày lễ bệnh viện vẫn làm nhưng chỉ đến 19:00. Khách vẫn đặt được, ngoài các khung giờ sau 19:00. Ghi chú chỉ nhân viên thấy.</p>
      {value.length === 0 ? <p className={s.sub}>Chưa có ngày lễ nào.</p> : (
        <ul className={s.holidayList}>
          {value.map((h, i) => (
            <li key={h.date} className={s.holiday} data-holiday>
              <span className={`${s.holidayDate} num`}>{formatDateVi(`${h.date}T12:00:00+07:00`)}</span>
              <span className={s.holidayNote}>{h.note}</span>
              <Button variant="ghost" size="sm" icon="trash-2" aria-label={`Xóa ngày lễ ${formatDateVi(`${h.date}T12:00:00+07:00`)}`} onClick={() => onChange(value.filter((x) => x.date !== h.date))}>Xóa</Button>
              {rowErrors[i] && <p className={s.holidayError}><Icon name="info" size={16} />{rowErrors[i]}</p>}
            </li>
          ))}
        </ul>
      )}
      <div className={s.holidayAdd}>
        <Field label="Ngày lễ mới" error={problem} hint="Ví dụ: 2026-12-25.">
          <Input value={date} autoComplete="off" onKeyDown={onEnter} onChange={(e) => { setDate(e.target.value); setProblem(undefined); }} />
        </Field>
        <Field label="Ghi chú ngày lễ" optional>
          <Input value={note} maxLength={HOLIDAY_NOTE_MAX} autoComplete="off" onKeyDown={onEnter} onChange={(e) => setNote(e.target.value)} />
        </Field>
        <Button variant="secondary" icon="plus" onClick={add}>Thêm ngày lễ</Button>
      </div>
      <FormError>{error}</FormError>
    </div>
  );
}
