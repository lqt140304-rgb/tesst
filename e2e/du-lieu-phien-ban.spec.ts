import { expect, test } from '@playwright/test';
import { open } from './helpers';

type Demo = { api: { staff: { customers: { update(id: string, v: number, i: unknown): Promise<void>; get(id: string): Promise<{ version: number }> } } } };

/** A document saved in the browser before customers, pets and price items had a version still loads and can be edited. */
test('a stored document without versions loads and customers can be edited @desktop-only', async ({ page }) => {
  await open(page, '/');
  await page.evaluate(() => {
    const raw = localStorage.getItem('leson-demo:v1')!;
    const doc = JSON.parse(raw) as { dirty: boolean; t: Record<string, { version?: number }[]> };
    for (const k of ['customers', 'pets', 'price_items']) for (const r of doc.t[k]!) delete r.version;
    doc.dirty = true; // a user's edited document is never reseeded
    localStorage.setItem('leson-demo:v1', JSON.stringify(doc));
  });
  await page.reload();
  await open(page, '/', { as: 'quanly_ha' });
  const after = await page.evaluate(async () => {
    const d = (window as unknown as { __lesonDemo: Demo }).__lesonDemo.api.staff.customers;
    const before = (await d.get('cus-01')).version;
    await d.update('cus-01', before, { full_name: 'Nguyễn Thị Lan', phone: '0900000001', note_internal: 'Đã gọi xác nhận' });
    return { before, after: (await d.get('cus-01')).version };
  });
  expect(after).toEqual({ before: 1, after: 2 });
});
