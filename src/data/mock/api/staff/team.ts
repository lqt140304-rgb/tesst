import { ValidationError } from '../../../contracts/errors';
import type { StaffAdminRow, StaffTeamApi } from '../../../contracts/staff';
import { hasActiveManager, normalizeExtraCaps, STAFF_MSG, validateNewStaff, validateStaffInput } from '../../../rules/staff-admin';
import { MSG, validatePassword } from '../../../rules/validation';
import type { Env } from '../../env';
import { newId } from '../../ids';
import { sleepRead, sleepWrite } from '../../latency';
import { hashPassword, newSalt } from '../../password';
import type { Doc, StaffUser } from '../../store/schema';
import { checkVersion } from '../../store/version';
import { audit, find, staffActor } from './common';

const fail = (e: Record<string, string>) => {
  if (Object.keys(e).length) throw new ValidationError(e);
};

const nameTaken = (d: Readonly<Doc>, username: string) => d.t.web_accounts.some((a) => a.username === username) || d.t.staff_users.some((u) => u.username === username);

export function staffTeamApi(env: Env): StaffTeamApi {
  const { db } = env;
  const CAP = 'staff.manage' as const;

  /** After a change, someone who can manage must still be active (checked on the stored document, inside the write). */
  function keepAManager(d: Doc, target: StaffUser, next: { active: boolean; preset_ids: StaffUser['preset_ids'] }, field: 'active' | 'preset_ids') {
    const after = d.t.staff_users.map((u) => (u.id === target.id ? { active: next.active, preset_ids: next.preset_ids } : u));
    if (!hasActiveManager(after)) throw new ValidationError({ [field]: STAFF_MSG.lastManager });
  }

  return {
    async list() {
      const a = staffActor(env, CAP);
      await sleepRead();
      const rows = db.read().t.staff_users.map((u): StaffAdminRow => ({
        id: u.id, username: u.username, name: u.display_name, title: u.title, presets: [...u.preset_ids], extraCaps: [...u.extra_capabilities],
        active: u.active, isSelf: u.id === a.staff.id, version: u.version,
      }));
      return [...rows.filter((r) => r.active), ...rows.filter((r) => !r.active)];
    },

    async create(input) {
      const a = staffActor(env, CAP);
      await sleepWrite();
      const username = input.username.trim();
      const errors = validateNewStaff({ ...input, username });
      if (!errors.username && nameTaken(db.read(), username)) errors.username = MSG.usernameTaken;
      fail(errors);
      const salt = newSalt();
      const hash = await hashPassword(salt, input.password);
      return db.transact('staff.create', (d) => {
        // Checked again on the stored document: another create may have taken the name while the password was hashing.
        if (nameTaken(d, username)) throw new ValidationError({ username: MSG.usernameTaken });
        const id = newId();
        d.t.staff_users.push({
          id, username, display_name: input.display_name.trim(), title: input.title.trim(), preset_ids: [...input.preset_ids],
          extra_capabilities: normalizeExtraCaps(input.preset_ids, input.extra_capabilities), is_sample: true, active: true,
          password_salt: salt, password_hash: hash, version: 1,
        });
        audit(d, env, a, 'staff.create', 'staff_user', id, `${a.staff.display_name} thêm tài khoản nhân viên ${username}`, { sensitive: true });
        return id;
      });
    },

    async update(id, version, input) {
      const a = staffActor(env, CAP);
      await sleepWrite();
      db.transact('staff.update', (d) => {
        const u = find(d.t.staff_users, id);
        checkVersion(u, version);
        fail(validateStaffInput(input));
        keepAManager(d, u, { active: u.active, preset_ids: input.preset_ids }, 'preset_ids');
        u.display_name = input.display_name.trim();
        u.title = input.title.trim();
        u.preset_ids = [...input.preset_ids];
        u.extra_capabilities = normalizeExtraCaps(input.preset_ids, input.extra_capabilities);
        u.version += 1;
        audit(d, env, a, 'staff.update', 'staff_user', id, `${a.staff.display_name} sửa tài khoản nhân viên ${u.username} (vai, quyền hoặc thông tin)`, { sensitive: true });
      });
    },

    async setActive(id, version, active) {
      const a = staffActor(env, CAP);
      await sleepWrite();
      db.transact('staff.setActive', (d) => {
        const u = find(d.t.staff_users, id);
        checkVersion(u, version);
        if (!active) {
          if (u.id === a.staff.id) throw new ValidationError({ active: STAFF_MSG.selfOff });
          keepAManager(d, u, { active: false, preset_ids: u.preset_ids }, 'active');
        }
        u.active = active;
        u.version += 1;
        audit(d, env, a, active ? 'staff.activate' : 'staff.deactivate', 'staff_user', id, `${a.staff.display_name} ${active ? 'bật' : 'tắt'} tài khoản nhân viên ${u.username}`, { sensitive: true });
      });
    },

    async resetPassword(id, version, { password }) {
      const a = staffActor(env, CAP);
      await sleepWrite();
      if (id === a.staff.id) throw new ValidationError({ password: STAFF_MSG.selfPassword });
      const pwErr = validatePassword(password);
      if (pwErr) throw new ValidationError({ password: pwErr });
      const salt = newSalt();
      const hash = await hashPassword(salt, password);
      db.transact('staff.resetPassword', (d) => {
        const u = find(d.t.staff_users, id);
        checkVersion(u, version);
        u.password_salt = salt;
        u.password_hash = hash;
        u.version += 1;
        audit(d, env, a, 'staff.password_reset', 'staff_user', id, `${a.staff.display_name} đặt lại mật khẩu của ${u.username}`, { sensitive: true });
      });
    },
  };
}
