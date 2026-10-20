import { useCallback, useState } from 'react';

/** Save status for editors (redesign §5.2, motion proposal "Phản hồi thao tác"): the tick shows only after a real save. */
export type SaveStatus = 'clean' | 'dirty' | 'saving' | 'saved' | 'error';
export type SaveEvent = 'edit' | 'start' | 'ok' | 'fail' | 'reset';

export const SAVE_LABEL: Record<Exclude<SaveStatus, 'clean'>, string> = {
  dirty: 'Bản nháp · Chưa lưu thay đổi', saving: 'Đang lưu…', saved: 'Đã lưu', error: 'Chưa lưu thay đổi',
};

export function saveReducer(s: SaveStatus, e: SaveEvent): SaveStatus {
  switch (e) {
    case 'edit': return s === 'saving' ? s : 'dirty';
    case 'start': return 'saving';
    case 'ok': return s === 'saving' ? 'saved' : s;
    case 'fail': return s === 'saving' ? 'error' : s;
    case 'reset': return 'clean';
  }
}

export function useSaveStatus(initial: SaveStatus = 'clean') {
  const [status, setStatus] = useState(initial);
  const edit = useCallback(() => setStatus((s) => saveReducer(s, 'edit')), []);
  const reset = useCallback(() => setStatus('clean'), []);
  const run = useCallback(async <T,>(fn: () => Promise<T>): Promise<T> => {
    setStatus((s) => saveReducer(s, 'start'));
    try {
      const out = await fn();
      setStatus((s) => saveReducer(s, 'ok'));
      return out;
    } catch (e) {
      setStatus((s) => saveReducer(s, 'fail'));
      throw e;
    }
  }, []);
  return { status, edit, reset, run };
}
