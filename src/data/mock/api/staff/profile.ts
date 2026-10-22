import { ValidationError } from '../../../contracts/errors';
import type { StaffProfile, StaffProfileApi, StaffSettingsApi } from '../../../contracts/staff';
import { HOSPITAL_INFO } from '../../../rules/hospital';
import { STAFF_MSG, validateNameChange, validatePasswordChange } from '../../../rules/staff-admin';
import type { Env } from '../../env';
import { sleepRead, sleepWrite } from '../../latency';
import { hashPassword, newSalt } from '../../password';
import { audit, anyStaff, find } from './common';

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
  return {
    async hospital() {
      anyStaff(env);
      await sleepRead();
      return { ...HOSPITAL_INFO };
    },
  };
}
