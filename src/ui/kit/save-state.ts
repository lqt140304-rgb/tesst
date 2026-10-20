import { useCallback, useReducer, useRef } from 'react';

/** Save status for editors (redesign §5.2, motion proposal "Phản hồi thao tác"): the tick shows only after a real save. */
export type SaveStatus = 'clean' | 'dirty' | 'saving' | 'saved' | 'error';
/** `run` numbers each save so only the latest one decides; an edit during a save means the result is a draft again. */
export type SaveModel = { status: SaveStatus; run: number; editedWhileSaving: boolean };
export type SaveEvent = { type: 'edit' } | { type: 'reset' } | { type: 'start' | 'ok' | 'fail'; run: number };

export const SAVE_LABEL: Record<Exclude<SaveStatus, 'clean'>, string> = {
  dirty: 'Bản nháp · Chưa lưu thay đổi', saving: 'Đang lưu…', saved: 'Đã lưu', error: 'Chưa lưu thay đổi',
};

export const initialSave = (status: SaveStatus = 'clean'): SaveModel => ({ status, run: 0, editedWhileSaving: false });

export function saveReducer(m: SaveModel, e: SaveEvent): SaveModel {
  switch (e.type) {
    case 'edit': return m.status === 'saving' ? { ...m, editedWhileSaving: true } : { ...m, status: 'dirty' };
    case 'start': return { status: 'saving', run: e.run, editedWhileSaving: false };
    case 'ok': return m.status === 'saving' && e.run === m.run ? { ...m, status: m.editedWhileSaving ? 'dirty' : 'saved' } : m;
    case 'fail': return m.status === 'saving' && e.run === m.run ? { ...m, status: 'error' } : m;
    case 'reset': return initialSave();
  }
}

export function useSaveStatus(initial: SaveStatus = 'clean') {
  const [model, dispatch] = useReducer(saveReducer, initial, initialSave);
  const seq = useRef(0);
  const edit = useCallback(() => dispatch({ type: 'edit' }), []);
  const reset = useCallback(() => dispatch({ type: 'reset' }), []);
  const run = useCallback(async <T,>(fn: () => Promise<T>): Promise<T> => {
    const id = ++seq.current;
    dispatch({ type: 'start', run: id });
    try {
      const out = await fn();
      dispatch({ type: 'ok', run: id });
      return out;
    } catch (e) {
      dispatch({ type: 'fail', run: id });
      throw e;
    }
  }, []);
  return { status: model.status, edit, reset, run };
}
