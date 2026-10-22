import { ValidationError } from '../../../contracts/errors';
import type { StaffAdminRow, StaffTeamApi } from '../../../contracts/staff';
import { CAP_LABEL, PRESET_LABEL, effectiveCaps } from '../../../rules/capabilities';
import { grantExceeds, hasActiveManager, normalizeExtraCaps, STAFF_MSG, validateNewStaff, validateStaffInput } from '../../../rules/staff-admin';
import { MSG, validatePassword } from '../../../rules/validation';
import type { Env } from '../../env';
import { newId } from '../../ids';
import { sleepRead, sleepWrite } from '../../latency';
import { hashPassword, newSalt } from '../../password';
import type { Doc, StaffUser } from '../../store/schema';
import { checkVersion } from '../../store/version';
import { audit, find, staffActor, type StaffActor } from './common';

const fail = (e: Record<string, string>) => {
  if (Object.keys(e).length) throw new ValidationError(e);
};

const isManager = (u: Pick<StaffUser, 'preset_ids'>) => u.preset_ids.includes('quan_ly');
const labels = (presets: readonly StaffUser['preset_ids'][number][], extras: readonly (keyof typeof CAP_LABEL)[]) =>
  `vai ${presets.map((p) => PRESET_LABEL[p]).join(' + ') || '—'}; quyền lẻ ${extras.map((c) => CAP_LABEL[c]).join(', ') || '—'}`;

const nameTaken = (d: Readonly<Doc>, username: string) => d.t.web_accounts.some((a) => a.username === username) || d.t.staff_users.some((u) => u.username === username);

export function staffTeamApi(env: Env): StaffTeamApi {
  const { db } = env;
  const CAP = 'staff.manage' as const;

  /** After a change, someone who can manage must still be active (checked on the stored document, inside the write). */
  function keepAManager(d: Doc, target: StaffUser, next: { active: boolean; preset_ids: StaffUser['preset_ids'] }, field: 'active' | 'preset_ids') {
    const after = d.t.staff_users.map((u) => (u.id === target.id ? { active: next.active, preset_ids: next.preset_ids } : u));
    if (!hasActiveManager(after)) throw new ValidationError({ [field]: STAFF_MSG.lastManager });
  }

  /** staff.manage alone is not the manager role: only a manager touches a manager account, and nobody grants what they do not hold. */
  function mayTouch(d: Doc, a: StaffActor, target: StaffUser, field: 'active' | 'password' | 'preset_ids') {
    const me = find(d.t.staff_users, a.staff.id);
    if (isManager(target) && !isManager(me)) throw new ValidationError({ [field]: STAFF_MSG.managerOnly });
  }
  function mayGrant(d: Doc, a: StaffActor, before: Pick<StaffUser, 'preset_ids' | 'extra_capabilities'> | null, after: Pick<StaffUser, 'preset_ids' | 'extra_capabilities'>) {
    const me = find(d.t.staff_users, a.staff.id);
    const field = grantExceeds(effectiveCaps(me), { presets: before?.preset_ids ?? [], extras: before?.extra_capabilities ?? [] }, { presets: after.preset_ids, extras: after.extra_capabilities });
    if (field) throw new ValidationError({ [field]: STAFF_MSG.beyondYou });
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
        const presets = [...new Set(input.preset_ids)];
        const extras = normalizeExtraCaps(presets, input.extra_capabilities);
        mayGrant(d, a, null, { preset_ids: presets, extra_capabilities: extras });
        const id = newId();
        d.t.staff_users.push({
          id, username, display_name: input.display_name.trim(), title: input.title.trim(), preset_ids: presets,
          extra_capabilities: extras, is_sample: true, active: true, password_salt: salt, password_hash: hash, version: 1,
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
        mayTouch(d, a, u, 'preset_ids');
        const presets = [...new Set(input.preset_ids)];
        const extras = normalizeExtraCaps(presets, input.extra_capabilities);
        mayGrant(d, a, u, { preset_ids: presets, extra_capabilities: extras });
        keepAManager(d, u, { active: u.active, preset_ids: presets }, 'preset_ids');
        const before = labels(u.preset_ids, u.extra_capabilities);
        u.display_name = input.display_name.trim();
        u.title = input.title.trim();
        u.preset_ids = presets;
        u.extra_capabilities = extras;
        u.version += 1;
        audit(d, env, a, 'staff.update', 'staff_user', id, `${a.staff.display_name} sửa tài khoản nhân viên ${u.username}: ${before} → ${labels(presets, extras)}`, { sensitive: true });
      });
    },

    async setActive(id, version, active) {
      const a = staffActor(env, CAP);
      await sleepWrite();
      db.transact('staff.setActive', (d) => {
        const u = find(d.t.staff_users, id);
        checkVersion(u, version);
        mayTouch(d, a, u, 'active');
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
        mayTouch(d, a, u, 'password');
        u.password_salt = salt;
        u.password_hash = hash;
        u.version += 1;
        audit(d, env, a, 'staff.password_reset', 'staff_user', id, `${a.staff.display_name} đặt lại mật khẩu của ${u.username}`, { sensitive: true });
      });
    },
  };
}
