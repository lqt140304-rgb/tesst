import { ValidationError } from '../../../contracts/errors';
import type { Checklist, StaffHelpApi } from '../../../contracts/staff';
import { FEATURES, checklistFor, explainMissing, searchArticles, visibleArticles } from '../../../rules/help';
import { mergePatch } from '../../../rules/staff-prefs';
import type { Env } from '../../env';
import { sleepRead, sleepWrite } from '../../latency';
import { anyStaff, type StaffActor } from './common';

const HELP_MSG = { feature: 'Tính năng này không có.', q: 'Từ khóa cần là chữ.', key: 'Việc này không có trong danh sách của bạn.' } as const;
const DONE_MAX = 50;

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
/** The stored options are not trusted: a damaged row reads as "nothing done, not hidden". */
const doneOf = (values: unknown): string[] => (isObject(values) && Array.isArray(values.onboarding_done) ? Array.from(values.onboarding_done).filter((x): x is string => typeof x === 'string') : []);
const hiddenOf = (values: unknown): boolean => isObject(values) && values.onboarding_hidden === true;

export function staffHelpApi(env: Env): StaffHelpApi {
  const { db } = env;
  const valuesOf = (a: StaffActor) => db.read().t.staff_prefs.find((r) => r.staff_id === a.staff.id)?.values;
  const view = (a: StaffActor): Checklist => checklistFor(a.caps, doneOf(valuesOf(a)), hiddenOf(valuesOf(a)));
  return {
    async articles() {
      const a = anyStaff(env);
      await sleepRead();
      return visibleArticles(a.caps);
    },

    async search(q) {
      const a = anyStaff(env);
      await sleepRead();
      if (typeof q !== 'string') throw new ValidationError({ q: HELP_MSG.q });
      return searchArticles(a.caps, q);
    },

    async whyNot(feature) {
      const a = anyStaff(env);
      await sleepRead();
      if (typeof feature !== 'string' || !Object.hasOwn(FEATURES, feature)) throw new ValidationError({ feature: HELP_MSG.feature });
      return explainMissing(a.caps, feature);
    },

    async checklist() {
      const a = anyStaff(env);
      await sleepRead();
      return view(a);
    },

    async markDone(key) {
      const a = anyStaff(env);
      await sleepWrite();
      if (typeof key !== 'string' || !checklistFor(a.caps, [], false).items.some((i) => i.key === key)) throw new ValidationError({ key: HELP_MSG.key });
      // Another tab may have marked it already; judge "nothing to do" on the latest values.
      db.reloadFromStorage();
      if (doneOf(valuesOf(a)).includes(key)) return view(a);
      db.transact('help.markDone', (d) => {
        let row = d.t.staff_prefs.find((r) => r.staff_id === a.staff.id);
        if (!row) d.t.staff_prefs.push((row = { staff_id: a.staff.id, values: {} }));
        const done = doneOf(row.values);
        if (done.includes(key)) return;
        // Adds one item and keeps the rest; the personal options' own save replaces the whole list.
        row.values = mergePatch(isObject(row.values) ? row.values : {}, { onboarding_done: [...done, key].slice(-DONE_MAX) });
      });
      return view(a);
    },
  };
}
