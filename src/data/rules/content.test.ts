import { describe, expect, it } from 'vitest';
import {
  CONTENT_MSG, FEATURED_IMAGE_MAX_BYTES, FEATURED_MAX, FEATURED_SHOW_PRICE, imageFileProblem, isImageKey, sensitiveHits, validateCaseInput, validateProductInput,
} from './content';

const product = { name: 'Thức ăn hạt', category: 'food', note: 'Hạt khô', priceVnd: 120000 };
const kase = { title: 'Bé khỏe lại', story: 'Bé về nhà vui vẻ.', petName: 'Bông', species: 'dog', consent: true };
const len = (n: number) => 'a'.repeat(n);

describe('constants', () => {
  it('pins the spec values', () => {
    expect(FEATURED_MAX).toBe(30);
    expect(FEATURED_IMAGE_MAX_BYTES).toBe(5 * 1024 * 1024);
    expect(FEATURED_SHOW_PRICE).toBe(false);
  });
});

describe('validateProductInput', () => {
  it('accepts a full and a minimal product', () => {
    expect(validateProductInput(product)).toEqual({});
    expect(validateProductInput({ name: 'A', category: 'litter' })).toEqual({});
    expect(validateProductInput({ ...product, note: undefined, priceVnd: undefined })).toEqual({});
  });
  it('checks the name at 60 / 61 characters after trimming, and rejects blank or non-text', () => {
    expect(validateProductInput({ ...product, name: len(60) })).toEqual({});
    expect(validateProductInput({ ...product, name: `  ${len(60)}  ` })).toEqual({});
    expect(validateProductInput({ ...product, name: len(61) })).toEqual({ name: CONTENT_MSG.name });
    for (const name of ['', '   ', 5, null, ['a'], { a: 1 }]) expect(validateProductInput({ ...product, name })).toEqual({ name: CONTENT_MSG.name });
  });
  it('checks the note at 120 / 121 and the category list', () => {
    expect(validateProductInput({ ...product, note: len(120) })).toEqual({});
    expect(validateProductInput({ ...product, note: len(121) })).toEqual({ note: CONTENT_MSG.note });
    expect(validateProductInput({ ...product, note: 7 })).toEqual({ note: CONTENT_MSG.note });
    for (const category of ['medicine', '', undefined, 3]) expect(validateProductInput({ ...product, category })).toEqual({ category: CONTENT_MSG.category });
  });
  it('accepts a whole price from 0 to 100,000,000 and nothing else', () => {
    for (const priceVnd of [0, 100_000_000]) expect(validateProductInput({ ...product, priceVnd })).toEqual({});
    for (const priceVnd of [-1, 1.5, Number.NaN, Infinity, '5', null, 100_000_001]) expect(validateProductInput({ ...product, priceVnd })).toEqual({ priceVnd: CONTENT_MSG.price });
  });
  it('rejects unknown keys by name, including __proto__ from JSON, and a wrong shape', () => {
    expect(validateProductInput({ ...product, extra: 1 })).toEqual({ extra: CONTENT_MSG.unknown });
    const fromJson = JSON.parse('{"name":"A","category":"food","__proto__":1}');
    expect(Object.keys(validateProductInput(fromJson))).toEqual(['__proto__']);
    for (const bad of [null, undefined, 'x', 5, [product]]) expect(validateProductInput(bad)).toEqual({ product: CONTENT_MSG.shape });
  });
});

describe('validateCaseInput', () => {
  it('accepts a full case', () => {
    expect(validateCaseInput(kase)).toEqual({});
  });
  it('checks title 80 / 81, story 600 / 601, pet name 30 / 31', () => {
    expect(validateCaseInput({ ...kase, title: len(80) })).toEqual({});
    expect(validateCaseInput({ ...kase, title: len(81) })).toEqual({ title: CONTENT_MSG.title });
    expect(validateCaseInput({ ...kase, story: len(600) })).toEqual({});
    expect(validateCaseInput({ ...kase, story: len(601) })).toEqual({ story: CONTENT_MSG.story });
    expect(validateCaseInput({ ...kase, petName: len(30) })).toEqual({});
    expect(validateCaseInput({ ...kase, petName: len(31) })).toEqual({ petName: CONTENT_MSG.petName });
    for (const key of ['title', 'story', 'petName'] as const) for (const v of ['', '  ', 4, null]) expect(Object.keys(validateCaseInput({ ...kase, [key]: v }))).toEqual([key]);
  });
  it('rejects an unknown species', () => {
    for (const species of ['bird', '', undefined]) expect(validateCaseInput({ ...kase, species })).toEqual({ species: CONTENT_MSG.species });
  });
  it('needs consent to be exactly true', () => {
    for (const consent of [false, 'true', 1, undefined, null]) expect(validateCaseInput({ ...kase, consent })).toEqual({ consent: CONTENT_MSG.consent });
    const { consent: _drop, ...without } = kase;
    expect(validateCaseInput(without)).toEqual({ consent: CONTENT_MSG.consent });
  });
  it('rejects unknown keys and a wrong shape', () => {
    expect(validateCaseInput({ ...kase, visible: true })).toEqual({ visible: CONTENT_MSG.unknown });
    for (const bad of [null, 'x', [kase]]) expect(validateCaseInput(bad)).toEqual({ case: CONTENT_MSG.shape });
  });
});

describe('sensitiveHits', () => {
  it.each(['Gọi 097 355 51 05', '0973.555.105', '+84 973 555 105', '(097)3555105', 'số 0973-555-105 nhé'])('finds a phone number in %s', (t) => {
    expect(sensitiveHits(t, []).phone).toBe(true);
  });
  it.each(['mua 10 kg năm 2026', '12345678', 'giá 120 000 đồng', ''])('does not flag %s', (t) => {
    expect(sensitiveHits(t, []).phone).toBe(false);
  });
  it('finds a customer full name whatever the case or accents, but not a single word of it', () => {
    const names = ['Nguyễn Thị Lan'];
    expect(sensitiveHits('chị nguyen thi lan dắt bé', names).names).toEqual(names);
    expect(sensitiveHits('NGUYỄN THỊ LAN', names).names).toEqual(names);
    expect(sensitiveHits('Lan rất thương bé', names).names).toEqual([]);
  });
  it('ignores names shorter than five characters', () => {
    expect(sensitiveHits('Tí A đi chơi', ['Tí A', 'Đỗ']).names).toEqual([]);
  });
});

describe('imageFileProblem and isImageKey', () => {
  it('accepts an image up to 5 MB', () => {
    expect(imageFileProblem({ type: 'image/png', size: FEATURED_IMAGE_MAX_BYTES })).toBeNull();
    expect(imageFileProblem({ type: 'image/png', size: FEATURED_IMAGE_MAX_BYTES + 1 })).toBe(CONTENT_MSG.tooBig);
  });
  it('refuses anything that is not an image', () => {
    for (const type of ['video/mp4', '', 'application/pdf']) expect(imageFileProblem({ type, size: 10 })).toBe(CONTENT_MSG.notImage);
  });
  it('tells picture keys from video keys', () => {
    expect(isImageKey('local:img-abc')).toBe(true);
    for (const k of ['local:abc', 'meo-tam-the', 'img-abc', '']) expect(isImageKey(k)).toBe(false);
  });
});
