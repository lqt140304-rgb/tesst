import { describe, expect, it } from 'vitest';
import { loginAs, makeTestApi } from '../../testing';
import { ConflictError, ForbiddenError, NotFoundError, type ValidationError } from '../../../contracts/errors';
import type { FeaturedCaseInput, FeaturedProductInput } from '../../../contracts/staff';
import { CONTENT_MSG, FEATURED_MAX } from '../../../rules/content';

const fieldsOf = async (p: Promise<unknown>) => ((await p.catch((e) => e)) as ValidationError).fields;
const okProduct: FeaturedProductInput = { name: 'Bánh thưởng cho chó', category: 'food', note: 'Giòn, ít ngọt', priceVnd: 55000 };
const okCase: FeaturedCaseInput = { title: 'Bé Xoài khỏe lại', story: 'Bé về nhà vui vẻ cùng gia đình.', petName: 'Xoài', species: 'dog', consent: true };
const audits = (db: ReturnType<typeof makeTestApi>['db'], action: string) => db.read().t.audit_events.filter((e) => e.action === action);

async function as(username: string) {
  const t = makeTestApi();
  await loginAs(t.api, username);
  return t;
}

describe('who may use staff.content', () => {
  it('the manager and the doctor may; the spa may not until the right is granted', async () => {
    for (const u of ['quanly_ha', 'bacsi_duc']) {
      const { api } = await as(u);
      expect((await api.staff.content.products.list()).length).toBeGreaterThan(0);
      expect((await api.staff.content.cases.list()).length).toBeGreaterThan(0);
    }
    const spa = await as('spa_ngocanh');
    await expect(spa.api.staff.content.products.list()).rejects.toThrow(ForbiddenError);
    await expect(spa.api.staff.content.cases.create(okCase)).rejects.toThrow(ForbiddenError);
    spa.db.transact('grant', (d) => { d.t.staff_users.find((s) => s.username === 'spa_ngocanh')!.extra_capabilities.push('content.publish'); });
    expect((await spa.api.staff.content.products.list()).length).toBeGreaterThan(0);
  });
  it('a customer and a signed-out visitor are refused everywhere', async () => {
    const t = makeTestApi();
    await expect(t.api.staff.content.products.list()).rejects.toThrow(ForbiddenError);
    await loginAs(t.api, 'lan_nguyen');
    for (const list of [t.api.staff.content.products, t.api.staff.content.cases]) {
      await expect(list.list()).rejects.toThrow(ForbiddenError);
      await expect(list.setVisible('fp-1', 1, false)).rejects.toThrow(ForbiddenError);
      await expect(list.remove('fp-1', 1)).rejects.toThrow(ForbiddenError);
    }
  });
});

describe('products', () => {
  it('list: newest first, with the stored fields and version', async () => {
    const { api } = await as('quanly_ha');
    const rows = await api.staff.content.products.list();
    expect(rows).toHaveLength(4);
    expect(rows.map((r) => r.id)).toEqual(['fp-4', 'fp-3', 'fp-2', 'fp-1']);
    expect(rows[1]).toMatchObject({ category: 'litter', priceVnd: 120000, visible: true, sample: true, version: 1 });
  });
  it('create: shown at once, in the creator\'s name, trimmed, audited without the note or the price', async () => {
    const { api, db } = await as('bacsi_duc');
    const id = await api.staff.content.products.create({ ...okProduct, name: `  ${okProduct.name}  ` });
    const first = (await api.staff.content.products.list())[0]!;
    expect(first).toMatchObject({ id, name: okProduct.name, note: 'Giòn, ít ngọt', priceVnd: 55000, visible: true, sample: false, version: 1, updatedByName: 'BS. Trần Minh Đức' });
    const line = audits(db, 'content.product.create');
    expect(line).toHaveLength(1);
    expect(line[0]!.summary_vi).toContain(okProduct.name);
    expect(JSON.stringify(line[0])).not.toContain('Giòn');
    expect(JSON.stringify(line[0])).not.toContain('55000');
  });
  it('update: right version moves it on; an old or odd version is refused and nothing is written', async () => {
    const { api, db } = await as('quanly_ha');
    await api.staff.content.products.update('fp-1', 1, { name: 'Tên mới', category: 'accessory' });
    expect((await api.staff.content.products.list()).find((r) => r.id === 'fp-1')).toMatchObject({ name: 'Tên mới', category: 'accessory', version: 2, updatedByName: 'Nguyễn Thu Hà' });
    const rev = db.read().rev;
    await expect(api.staff.content.products.update('fp-1', 1, okProduct)).rejects.toThrow(ConflictError);
    for (const v of [1.5, '2', undefined, Number.NaN]) await expect(api.staff.content.products.update('fp-1', v as never, okProduct)).rejects.toThrow(ConflictError);
    await expect(api.staff.content.products.update('nope', 1, okProduct)).rejects.toThrow(NotFoundError);
    expect(db.read().rev).toBe(rev);
  });
  it('update can take the note and the price away', async () => {
    const { api } = await as('quanly_ha');
    await api.staff.content.products.update('fp-3', 1, { name: 'Cát vệ sinh', category: 'litter' });
    const row = (await api.staff.content.products.list()).find((r) => r.id === 'fp-3')!;
    expect(row.priceVnd).toBeUndefined();
    expect(row.note).toBeUndefined();
  });
  it('a refused product writes nothing and names each wrong field', async () => {
    const { api, db } = await as('quanly_ha');
    const rev = db.read().rev;
    expect(await fieldsOf(api.staff.content.products.create({ name: '', category: 'medicine', priceVnd: -1, colour: 1 } as never)))
      .toEqual({ name: CONTENT_MSG.name, category: CONTENT_MSG.category, priceVnd: CONTENT_MSG.price, colour: CONTENT_MSG.unknown });
    expect(Object.keys(await fieldsOf(api.staff.content.products.create(JSON.parse('{"name":"A","category":"food","__proto__":{}}'))))).toEqual(['__proto__']);
    expect(db.read().rev).toBe(rev);
  });
  it('show / hide uses the strict version, is audited, and two taps on the same version leave one winner', async () => {
    const { api, db } = await as('quanly_ha');
    await api.staff.content.products.setVisible('fp-4', 1, true);
    expect((await api.staff.content.products.list()).find((r) => r.id === 'fp-4')).toMatchObject({ visible: true, version: 2 });
    expect(audits(db, 'content.product.visible')).toHaveLength(1);
    const results = await Promise.allSettled([api.staff.content.products.setVisible('fp-4', 2, false), api.staff.content.products.setVisible('fp-4', 2, false)]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((r) => r.status === 'rejected')).toHaveLength(1);
  });
  it('remove: gone from the list, audited, and an edit after it is NotFound', async () => {
    const { api, db } = await as('bacsi_mai');
    await expect(api.staff.content.products.remove('fp-2', 7)).rejects.toThrow(ConflictError);
    await api.staff.content.products.remove('fp-2', 1);
    expect((await api.staff.content.products.list()).map((r) => r.id)).not.toContain('fp-2');
    expect(audits(db, 'content.product.remove')).toHaveLength(1);
    await expect(api.staff.content.products.update('fp-2', 1, okProduct)).rejects.toThrow(NotFoundError);
  });
  it('the 31st product is refused even when the thirty before it are hidden; room comes back after a removal', async () => {
    const { api, db } = await as('quanly_ha');
    for (let i = 0; db.read().t.featured_products.length < FEATURED_MAX; i++) await api.staff.content.products.create({ ...okProduct, name: `Hàng ${i}` });
    for (const p of db.read().t.featured_products) p.visible = false;
    const rev = db.read().rev;
    expect(await fieldsOf(api.staff.content.products.create(okProduct))).toEqual({ name: CONTENT_MSG.limit });
    expect(db.read().rev).toBe(rev);
    await api.staff.content.products.remove('fp-1', 1);
    await api.staff.content.products.create(okProduct);
    expect(db.read().t.featured_products).toHaveLength(FEATURED_MAX);
  });
});

describe('cases', () => {
  it('create needs consent, records who ticked and when, and never links a pet record', async () => {
    const { api, db } = await as('bacsi_mai');
    const rev = db.read().rev;
    expect(await fieldsOf(api.staff.content.cases.create({ ...okCase, consent: false }))).toEqual({ consent: CONTENT_MSG.consent });
    expect(await fieldsOf(api.staff.content.cases.create({ ...okCase, consent: 'true' } as never))).toEqual({ consent: CONTENT_MSG.consent });
    expect(db.read().rev).toBe(rev);
    const id = await api.staff.content.cases.create(okCase);
    const row = (await api.staff.content.cases.list())[0]!;
    expect(row).toMatchObject({ id, title: okCase.title, petName: 'Xoài', species: 'dog', visible: true, sample: false, version: 1, consentByName: 'BS. Phạm Thanh Mai' });
    expect(Date.parse(row.consentAt)).not.toBeNaN();
    expect(Object.keys(db.read().t.featured_cases.find((c) => c.id === id)!)).not.toContain('pet_id');
    expect(JSON.stringify(audits(db, 'content.case.create')[0])).not.toContain('vui vẻ');
  });
  it('update needs consent again, refreshes who ticked, and a refusal keeps the old tick', async () => {
    const { api, db } = await as('bacsi_duc');
    expect(await fieldsOf(api.staff.content.cases.update('fc-1', 1, { ...okCase, consent: false }))).toEqual({ consent: CONTENT_MSG.consent });
    expect(db.read().t.featured_cases.find((c) => c.id === 'fc-1')).toMatchObject({ consent_by_name: 'Nguyễn Thu Hà', version: 1 });
    await api.staff.content.cases.update('fc-1', 1, okCase);
    expect((await api.staff.content.cases.list()).find((r) => r.id === 'fc-1')).toMatchObject({ title: okCase.title, consentByName: 'BS. Trần Minh Đức', version: 2 });
    await expect(api.staff.content.cases.update('fc-1', 1, okCase)).rejects.toThrow(ConflictError);
  });
  it('limits, show / hide and remove work like products', async () => {
    const { api, db } = await as('quanly_ha');
    for (let i = 0; db.read().t.featured_cases.length < FEATURED_MAX; i++) await api.staff.content.cases.create({ ...okCase, title: `Ca ${i}` });
    expect(await fieldsOf(api.staff.content.cases.create(okCase))).toEqual({ title: CONTENT_MSG.limit });
    await api.staff.content.cases.setVisible('fc-1', 1, false);
    expect((await api.staff.content.cases.list()).find((r) => r.id === 'fc-1')!.visible).toBe(false);
    await api.staff.content.cases.remove('fc-1', 2);
    await expect(api.staff.content.cases.setVisible('fc-1', 3, true)).rejects.toThrow(NotFoundError);
    expect(audits(db, 'content.case.remove')).toHaveLength(1);
  });
});

describe('text that must not go public', () => {
  const medicine = 'Men tiêu hóa';
  const customer = 'nguyen thi lan';
  const phones = ['097 355 51 05', '+84 973 555 105', '0973.555.105'];
  it('a medicine name, a dose, a customer name or a phone number is refused in the field that holds it, and nothing is written', async () => {
    const { api, db } = await as('quanly_ha');
    const rev = db.read().rev;
    expect(await fieldsOf(api.staff.content.products.create({ ...okProduct, name: `Bột ${medicine}` }))).toEqual({ name: CONTENT_MSG.medicine });
    expect(await fieldsOf(api.staff.content.products.create({ ...okProduct, note: 'Mỗi lần 5 mg' }))).toEqual({ note: CONTENT_MSG.medicine });
    expect(await fieldsOf(api.staff.content.products.create({ ...okProduct, note: `Cho chị ${customer}` }))).toEqual({ note: CONTENT_MSG.customerName });
    for (const p of phones) expect(await fieldsOf(api.staff.content.products.create({ ...okProduct, name: `Gọi ${p}` }))).toEqual({ name: CONTENT_MSG.phone });
    expect(await fieldsOf(api.staff.content.cases.create({ ...okCase, title: `Thuốc ${medicine}` }))).toEqual({ title: CONTENT_MSG.medicine });
    expect(await fieldsOf(api.staff.content.cases.create({ ...okCase, story: `Chị Nguyễn Thị Lan đưa bé đến` }))).toEqual({ story: CONTENT_MSG.customerName });
    expect(await fieldsOf(api.staff.content.cases.create({ ...okCase, petName: 'Bé 0973555105' }))).toEqual({ petName: CONTENT_MSG.phone });
    expect(await fieldsOf(api.staff.content.cases.update('fc-1', 1, { ...okCase, story: 'Cho uống 2 viên mỗi ngày' }))).toEqual({ story: CONTENT_MSG.medicine });
    expect(db.read().rev).toBe(rev);
  });
  it('ordinary numbers pass, and the price is not read as text', async () => {
    const { api } = await as('quanly_ha');
    await api.staff.content.products.create({ ...okProduct, name: 'Túi 10 kg', note: 'Năm 2026, bán 120 000 đồng', priceVnd: 99999999 });
    await api.staff.content.cases.create({ ...okCase, story: 'Bé nặng hơn 10 kg và rất khỏe.' });
  });
});

describe('reading a damaged row', () => {
  it('shows a plain default instead of crashing', async () => {
    const { api, db } = await as('quanly_ha');
    db.transact('damage', (d) => {
      Object.assign(d.t.featured_products[0]!, { category: 'weird', name: undefined, version: 'x' });
      Object.assign(d.t.featured_cases[0]!, { species: 'weird', story: undefined, title: 5 });
    });
    const p = (await api.staff.content.products.list()).find((r) => r.id === 'fp-1')!;
    expect(p).toMatchObject({ category: 'food', name: '', version: 1 });
    const c = (await api.staff.content.cases.list()).find((r) => r.id === 'fc-1')!;
    expect(c).toMatchObject({ species: 'other', story: '', title: '' });
  });
});
