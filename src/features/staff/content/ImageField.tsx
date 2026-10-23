import { useEffect, useRef, useState } from 'react';
import { imageFileProblem } from '@/data/rules/content';
import { Button, Field } from '@/ui';
import { useFeaturedImage } from '@/features/public/home/useFeaturedImage';
import c from './Content.module.css';
import type { ImageChange } from './saveContent';

/** Picks, previews and takes away one picture. Nothing is sent from here: the dialog sends `change` after the words are saved. */
export function ImageField({ imageKey, change, onChange, error }: { imageKey?: string; change: ImageChange; onChange: (c: ImageChange) => void; error?: string }) {
  const saved = useFeaturedImage(imageKey);
  const [preview, setPreview] = useState<string>();
  const [problem, setProblem] = useState('');
  const input = useRef<HTMLInputElement>(null);
  // The preview address is made when a file is picked and freed when it is replaced, dropped or the dialog closes.
  const live = useRef<string | undefined>(undefined);
  const drop = () => { if (live.current) URL.revokeObjectURL(live.current); live.current = undefined; setPreview(undefined); };
  useEffect(() => () => { if (live.current) URL.revokeObjectURL(live.current); }, []);
  const shown = change === null ? undefined : (preview ?? saved);
  function pick(file: File | undefined) {
    if (!file) return;
    const p = imageFileProblem(file);
    setProblem(p ?? '');
    if (p) return;
    drop();
    live.current = URL.createObjectURL(file);
    setPreview(live.current);
    onChange(file);
  }
  function remove() {
    drop();
    onChange(null);
    setProblem('');
    if (input.current) input.current.value = '';
  }
  return (
    <div className={c.imageField}>
      <Field label="Ảnh" optional hint="JPG, PNG hoặc WebP, tối đa 5 MB." error={problem || error}>
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => pick(e.target.files?.[0])} />
      </Field>
      {shown && <img className={c.preview} src={shown} alt="Ảnh đang chọn" />}
      {(change instanceof File || (change === undefined && imageKey)) && (
        <Button variant="ghost" size="sm" icon="trash-2" onClick={remove}>Gỡ ảnh</Button>
      )}
    </div>
  );
}
