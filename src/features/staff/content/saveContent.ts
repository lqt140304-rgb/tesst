import type { StaffContentList } from '@/data/staff';
import { saveError } from '../ui';

/** The picture step: nothing yet to change (`undefined`), take it away (`null`) or a new file. */
export type ImageChange = File | null | undefined;

export type Saved = { id: string; version: number; imageError?: string };

/**
 * Words first, picture second. A refused text throws; a refused picture does not undo the words,
 * so the caller can keep the dialog open on the saved item and say so.
 */
export async function saveWithImage<Row extends { id: string; version: number }, Input>(
  list: StaffContentList<Row, Input>, input: Input, change: ImageChange, at?: { id: string; version: number },
): Promise<Saved> {
  let id: string;
  if (at) { await list.update(at.id, at.version, input); id = at.id; } else id = await list.create(input);
  const fresh = async () => (await list.list()).find((r) => r.id === id)?.version ?? 0;
  if (change === undefined) return { id, version: await fresh() };
  try {
    await list.setImage(id, await fresh(), change);
  } catch (e) {
    return { id, version: await fresh(), imageError: `Đã lưu nội dung, nhưng ảnh chưa tải được: ${saveError(e)}` };
  }
  return { id, version: await fresh() };
}
