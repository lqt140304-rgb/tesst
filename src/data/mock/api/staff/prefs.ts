import { ValidationError } from '../../../contracts/errors';
import type { StaffPrefs, StaffPrefsApi } from '../../../contracts/staff';
import { mergePatch, resolvePrefs, validatePrefsPatch } from '../../../rules/staff-prefs';
import type { Env } from '../../env';
import { sleepRead, sleepWrite } from '../../latency';
import { anyStaff } from './common';

export function staffPrefsApi(env: Env): StaffPrefsApi {
  const { db } = env;
  const read = (a: ReturnType<typeof anyStaff>): StaffPrefs =>
    resolvePrefs(db.read().t.staff_prefs.find((r) => r.staff_id === a.staff.id)?.values, a.caps);
  return {
    async get() {
      const a = anyStaff(env);
      await sleepRead();
      return read(a);
    },

    async save(patch) {
      const a = anyStaff(env);
      await sleepWrite();
      const errors = validatePrefsPatch(patch, a.caps);
      if (Object.keys(errors).length) throw new ValidationError(errors);
      if (Object.keys(patch).length === 0) return read(a);
      // The row is read again inside the write, so two tabs saving different options do not overwrite each other.
      db.transact('staff.prefs.save', (d) => {
        let row = d.t.staff_prefs.find((r) => r.staff_id === a.staff.id);
        if (!row) d.t.staff_prefs.push((row = { staff_id: a.staff.id, values: {} }));
        row.values = mergePatch(row.values, patch);
      });
      return read(a);
    },

    async reset() {
      const a = anyStaff(env);
      await sleepWrite();
      // Another tab may have saved since this one last looked; without this the row is not seen and not removed.
      db.reloadFromStorage();
      if (db.read().t.staff_prefs.some((r) => r.staff_id === a.staff.id)) {
        db.transact('staff.prefs.reset', (d) => { d.t.staff_prefs = d.t.staff_prefs.filter((r) => r.staff_id !== a.staff.id); });
      }
      return read(a);
    },
  };
}
