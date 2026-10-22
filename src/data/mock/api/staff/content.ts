import { FEATURED_CATEGORIES } from '../../../contracts/enums';
import { ConflictError, ValidationError } from '../../../contracts/errors';
import type { FeaturedCaseInput, FeaturedProductInput, StaffContentApi, StaffContentList, StaffFeaturedCaseRow, StaffFeaturedProductRow } from '../../../contracts/staff';
import { toIsoVN } from '../../../../lib/dates';
import { CONTENT_MSG, FEATURED_MAX, sensitiveHits, validateCaseInput, validateProductInput } from '../../../rules/content';
import type { Env } from '../../env';
import { newId } from '../../ids';
import { sleepRead, sleepWrite } from '../../latency';
import type { Doc, FeaturedCase, FeaturedProduct } from '../../store/schema';
import { audit, find, staffActor } from './common';
import { lintCustomerText } from './inpatient';

const CAP = 'content.publish' as const;
const SPECIES = ['dog', 'cat', 'other'] as const;

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (v: unknown) => (typeof v === 'string' ? v : '');
const optStr = (v: unknown) => (typeof v === 'string' && v ? v : undefined);
const version = (v: unknown) => (Number.isInteger(v) ? (v as number) : 1);

/** Why a text must not go public (drug name or dose, phone number, customer full name), or null. Medicine first, then phone, then name. */
function sensitiveMessage(text: string, doc: Readonly<Doc>): string | null {
  if (lintCustomerText(text, doc).length) return CONTENT_MSG.medicine;
  const { phone, names } = sensitiveHits(text, doc.t.customers.map((c) => c.full_name));
  if (phone) return CONTENT_MSG.phone;
  return names.length ? CONTENT_MSG.customerName : null;
}

type Stored = { id: string; visible: boolean; sample: boolean; created_at: string; created_by_name: string; updated_at: string; updated_by_name: string; version: number };

/** Everything that differs between products and cases; the list logic below is shared. */
type Spec<T extends Stored, Row, Input> = {
  noun: 'product' | 'case';
  nounVi: string;
  table: (d: Doc) => T[];
  validate: (input: unknown) => Record<string, string>;
  /** The keys read from what was sent; any other key is passed on as unknown so the check can name it. */
  keys: readonly string[];
  /** The field that carries the "full" message. */
  limitField: string;
  texts: (i: Input) => Record<string, string | undefined>;
  toRow: (t: T) => Row;
  build: (i: Input, base: Stored) => T;
  apply: (t: T, i: Input, who: string, at: string) => void;
  label: (t: T) => string;
};

function contentList<T extends Stored, Row, Input>(env: Env, spec: Spec<T, Row, Input>): StaffContentList<Row, Input> {
  const { db } = env;
  const action = (what: string) => `content.${spec.noun}.${what}`;

  /** Reads each known key once, so what is checked is exactly what is stored. */
  function copy(input: unknown): unknown {
    if (!isObject(input)) return input;
    const own = (k: string) => (Object.hasOwn(input, k) ? input[k] : undefined);
    return { ...Object.fromEntries(Object.keys(input).map((k) => [k, undefined])), ...Object.fromEntries(spec.keys.map((k) => [k, own(k)])) };
  }

  /** Throws ValidationError when the shape is wrong or a text holds something that must not go public. */
  function check(d: Doc, raw: unknown): Input {
    const input = copy(raw);
    const errors = new Map(Object.entries(spec.validate(input)));
    if (!errors.size) {
      for (const [field, value] of Object.entries(spec.texts(input as Input))) {
        const msg = value ? sensitiveMessage(value, d) : null;
        if (msg) errors.set(field, msg);
      }
    }
    if (errors.size) throw new ValidationError(Object.fromEntries(errors));
    return input as Input;
  }

  /** Strict: a row never changes without the exact whole number that was read. */
  function open(d: Doc, id: string, expected: unknown): T {
    const row = find(spec.table(d), id);
    if (!Number.isInteger(expected) || row.version !== expected) throw new ConflictError();
    return row;
  }

  return {
    async list() {
      staffActor(env, CAP);
      await sleepRead();
      return spec.table(db.read()).map((t, i) => ({ t, i }))
        .sort((x, y) => y.t.created_at.localeCompare(x.t.created_at) || y.i - x.i)
        .map(({ t }) => spec.toRow(t));
    },

    async create(raw) {
      const a = staffActor(env, CAP);
      await sleepWrite();
      return db.transact(action('create'), (d) => {
        const input = check(d, raw);
        if (spec.table(d).length >= FEATURED_MAX) throw new ValidationError({ [spec.limitField]: CONTENT_MSG.limit });
        const at = toIsoVN(env.clock());
        const id = newId();
        const row = spec.build(input, { id, visible: true, sample: false, created_at: at, created_by_name: a.staff.display_name, updated_at: at, updated_by_name: a.staff.display_name, version: 1 });
        spec.table(d).push(row);
        audit(d, env, a, action('create'), spec.noun, id, `${a.staff.display_name} đăng ${spec.nounVi} "${spec.label(row)}"`);
        return id;
      });
    },

    async update(id, expected, raw) {
      const a = staffActor(env, CAP);
      await sleepWrite();
      db.transact(action('update'), (d) => {
        const row = open(d, id, expected);
        const input = check(d, raw);
        spec.apply(row, input, a.staff.display_name, toIsoVN(env.clock()));
        row.version += 1;
        audit(d, env, a, action('update'), spec.noun, id, `${a.staff.display_name} sửa ${spec.nounVi} "${spec.label(row)}"`);
      });
    },

    async setVisible(id, expected, visible) {
      const a = staffActor(env, CAP);
      await sleepWrite();
      db.transact(action('visible'), (d) => {
        const row = open(d, id, expected);
        row.visible = visible === true;
        row.updated_at = toIsoVN(env.clock());
        row.updated_by_name = a.staff.display_name;
        row.version += 1;
        audit(d, env, a, action('visible'), spec.noun, id, `${a.staff.display_name} ${row.visible ? 'hiện' : 'ẩn'} ${spec.nounVi} "${spec.label(row)}"`);
      });
    },

    async remove(id, expected) {
      const a = staffActor(env, CAP);
      await sleepWrite();
      db.transact(action('remove'), (d) => {
        const row = open(d, id, expected);
        spec.table(d).splice(spec.table(d).indexOf(row), 1);
        audit(d, env, a, action('remove'), spec.noun, id, `${a.staff.display_name} xóa ${spec.nounVi} "${spec.label(row)}"`);
      });
    },
  };
}

/** A stored row is not trusted: an odd kind or species reads as the plain default and a missing text as empty. */
function productRow(t: FeaturedProduct): StaffFeaturedProductRow {
  return {
    id: t.id, name: str(t.name), category: FEATURED_CATEGORIES.includes(t.category) ? t.category : 'food', note: optStr(t.note),
    priceVnd: Number.isInteger(t.price_vnd) ? t.price_vnd : undefined, imageKey: optStr(t.image_key), visible: t.visible === true, sample: t.sample === true,
    updatedAt: str(t.updated_at), updatedByName: str(t.updated_by_name), version: version(t.version),
  };
}

function caseRow(t: FeaturedCase): StaffFeaturedCaseRow {
  return {
    id: t.id, title: str(t.title), story: str(t.story), petName: str(t.pet_name), species: SPECIES.includes(t.species) ? t.species : 'other', imageKey: optStr(t.image_key),
    visible: t.visible === true, sample: t.sample === true, consentByName: str(t.consent_by_name), consentAt: str(t.consent_at),
    updatedAt: str(t.updated_at), updatedByName: str(t.updated_by_name), version: version(t.version),
  };
}

export function staffContentApi(env: Env): StaffContentApi {
  return {
    products: contentList<FeaturedProduct, StaffFeaturedProductRow, FeaturedProductInput>(env, {
      noun: 'product', nounVi: 'sản phẩm', table: (d) => d.t.featured_products, validate: validateProductInput, keys: ['name', 'category', 'note', 'priceVnd'], limitField: 'name',
      texts: (i) => ({ name: i.name, note: i.note }), toRow: productRow, label: (t) => t.name,
      build: (i, base) => ({ ...base, name: i.name.trim(), category: i.category, note: i.note?.trim() || undefined, price_vnd: i.priceVnd }),
      apply: (t, i, who, at) => { t.name = i.name.trim(); t.category = i.category; t.note = i.note?.trim() || undefined; t.price_vnd = i.priceVnd; t.updated_at = at; t.updated_by_name = who; },
    }),
    cases: contentList<FeaturedCase, StaffFeaturedCaseRow, FeaturedCaseInput>(env, {
      noun: 'case', nounVi: 'ca bệnh', table: (d) => d.t.featured_cases, validate: validateCaseInput, keys: ['title', 'story', 'petName', 'species', 'consent'], limitField: 'title',
      texts: (i) => ({ title: i.title, story: i.story, petName: i.petName }), toRow: caseRow, label: (t) => t.title,
      build: (i, base) => ({ ...base, title: i.title.trim(), story: i.story.trim(), pet_name: i.petName.trim(), species: i.species, consent_by_name: base.created_by_name, consent_at: base.created_at }),
      apply: (t, i, who, at) => { t.title = i.title.trim(); t.story = i.story.trim(); t.pet_name = i.petName.trim(); t.species = i.species; t.consent_by_name = who; t.consent_at = at; t.updated_at = at; t.updated_by_name = who; },
    }),
  };
}
