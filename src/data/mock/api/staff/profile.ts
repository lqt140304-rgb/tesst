import { ValidationError } from '../../../contracts/errors';
import { APP_SETTING_LABEL } from '../../../contracts/enums';
import type { AppSettings, StaffProfile, StaffProfileApi, StaffSettingsApi } from '../../../contracts/staff';
import { FIXED_RULES, applySettingsPatch, changedSettings, describeSetting, validateSettingsPatch } from '../../../rules/app-settings';
import { HOSPITAL_INFO } from '../../../rules/hospital';
import { STAFF_MSG, validateNameChange, validatePasswordChange } from '../../../rules/staff-admin';
import type { Env } from '../../env';
import { sleepRead, sleepWrite } from '../../latency';
import { hashPassword, newSalt } from '../../password';
import { readSettings } from '../../settings';
import { checkVersion } from '../../store/version';
import { audit, anyStaff, find, staffActor } from './common';

export function staffProfileApi(env: Env): StaffProfileApi {
  const { db } = env;
  return {
    async get(): Promise<StaffProfile> {
      const a = anyStaff(env);
      await sleepRead();
      return { username: a.staff.username, name: a.staff.display_name, title: a.staff.title, presets: [...a.staff.preset_ids], caps: [...a.caps] };
    },

    async updateName(name) {
      const a = anyStaff(env);
      await sleepWrite();
      const err = validateNameChange(name);
      if (err) throw new ValidationError({ name: err });
      db.transact('staff.rename', (d) => {
        const u = find(d.t.staff_users, a.staff.id);
        const before = u.display_name;
        u.display_name = name.trim();
        u.version += 1;
        audit(d, env, a, 'staff.rename', 'staff_user', u.id, `${before} đổi tên hiển thị thành ${u.display_name}`);
      });
    },

    async changePassword(input) {
      const a = anyStaff(env);
      await sleepWrite();
      const stored = a.staff;
      const currentHash = await hashPassword(stored.password_salt, input.current);
      const currentOk = currentHash === stored.password_hash;
      const errors = validatePasswordChange(input, currentOk);
      if (Object.keys(errors).length) throw new ValidationError(errors);
      const salt = newSalt();
      const hash = await hashPassword(salt, input.next);
      db.transact('staff.changePassword', (d) => {
        const u = find(d.t.staff_users, a.staff.id);
        // The password may have been changed while this one was hashing.
        if (u.password_hash !== currentHash) throw new ValidationError({ current: STAFF_MSG.currentWrong });
        u.password_salt = salt;
        u.password_hash = hash;
        u.version += 1;
        audit(d, env, a, 'staff.password_change', 'staff_user', u.id, `${u.display_name} đổi mật khẩu của mình`, { sensitive: true });
      });
    },
  };
}

export function staffSettingsApi(env: Env): StaffSettingsApi {
  const { db } = env;
  const view = (): AppSettings => ({ ...readSettings(db.read().t), fixedRules: FIXED_RULES.map((r) => ({ ...r })) });
  return {
    async hospital() {
      anyStaff(env);
      await sleepRead();
      return { ...HOSPITAL_INFO };
    },

    async get() {
      anyStaff(env);
      await sleepRead();
      return view();
    },

    async update(version, patch) {
      const a = staffActor(env, 'settings.manage');
      await sleepWrite();
      // Another tab may have saved since this one last looked; "nothing changed" must be judged on the latest values.
      db.reloadFromStorage();
      const before = readSettings(db.read().t).values;
      const errors = validateSettingsPatch(patch, before);
      if (Object.keys(errors).length) throw new ValidationError(errors);
      if (changedSettings(before, applySettingsPatch(before, patch)).length === 0) return view();
      db.transact('settings.update', (d) => {
        let row = d.t.app_settings.find((r) => r.id === 'main');
        if (!row) d.t.app_settings.push((row = { id: 'main', version: 1, values: readSettings(d.t).values }));
        checkVersion(row, version);
        const current = readSettings(d.t).values;
        // Same rules again on the values as they are now inside the write.
        const fresh = validateSettingsPatch(patch, current);
        if (Object.keys(fresh).length) throw new ValidationError(fresh);
        const next = applySettingsPatch(current, patch);
        row.values = next;
        row.version += 1;
        for (const k of changedSettings(current, next)) {
          audit(d, env, a, 'settings.update', 'app_settings', 'main', `${a.staff.display_name} đổi "${APP_SETTING_LABEL[k]}" từ ${describeSetting(k, current)} sang ${describeSetting(k, next)}`);
        }
      });
      return view();
    },
  };
}
