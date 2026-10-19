import { cloneElement, forwardRef, isValidElement, useId, useState, type InputHTMLAttributes, type ReactElement, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cx } from '@/lib/cx';
import { Icon } from '../icons/Icon';
import s from './Field.module.css';

type FieldProps = { label: ReactNode; hint?: ReactNode; error?: string; optional?: boolean; children: ReactElement<{ id?: string; 'aria-invalid'?: boolean; 'aria-describedby'?: string }>; className?: string; id?: string };

/** Label + control + helper + error, wired with ids and aria for screen readers. */
export function Field({ label, hint, error, optional, children, className, id: idProp }: FieldProps) {
  const auto = useId();
  const id = idProp ?? children.props.id ?? `f${auto}`;
  const hintId = hint ? `${id}-hint` : undefined;
  const errId = error ? `${id}-err` : undefined;
  const control = isValidElement(children)
    ? cloneElement(children, { id, 'aria-invalid': error ? true : undefined, 'aria-describedby': [hintId, errId].filter(Boolean).join(' ') || undefined })
    : children;
  return (
    <div className={cx(s.field, className)} data-field={id}>
      <label htmlFor={id} className={s.label}>
        {label} {optional && <span className={s.optional}>(không bắt buộc)</span>}
      </label>
      {control}
      {hint && <p id={hintId} className={s.hint}>{hint}</p>}
      {error && (
        <p id={errId} className={s.error}>
          <Icon name="info" size={16} />
          {error}
        </p>
      )}
    </div>
  );
}

export const Input = (p: InputHTMLAttributes<HTMLInputElement>) => <input {...p} className={cx(s.control, p.className)} />;
export const Textarea = (p: TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea {...p} className={cx(s.control, p.className)} />;
export const Select = (p: SelectHTMLAttributes<HTMLSelectElement>) => <select {...p} className={cx(s.control, p.className)} />;

/** Password input with a "Hiện" / "Ẩn" toggle inside the field (aria-pressed). */
export const PasswordInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function PasswordInput(p, ref) {
  const [shown, setShown] = useState(false);
  return (
    <div className={s.pw}>
      <input {...p} ref={ref} type={shown ? 'text' : 'password'} className={cx(s.control, s.pwInput, p.className)} />
      <button type="button" className={s.pwToggle} aria-pressed={shown} aria-controls={p.id} onClick={() => setShown((v) => !v)}>
        <Icon name={shown ? 'eye-off' : 'eye'} size={18} />{shown ? 'Ẩn' : 'Hiện'}
      </button>
    </div>
  );
});

export function Counter({ value, max }: { value: number; max: number }) {
  return <span className={s.counter} aria-live="polite">{value}/{max}</span>;
}

export function Checkbox({ label, ...rest }: InputHTMLAttributes<HTMLInputElement> & { label: ReactNode }) {
  return (
    <label className={s.check}>
      <input type="checkbox" {...rest} />
      <span>{label}</span>
    </label>
  );
}
