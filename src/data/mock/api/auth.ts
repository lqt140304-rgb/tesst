import type { AuthApi, Me, Session, SignupInput } from '../../contracts/api';
import { formatPhoneVi } from '../../../lib/phone';
import { PRESET_LABEL } from '../../rules/capabilities';
import { AuthError, ValidationError } from '../../contracts/errors';
import { normalizeVnPhone } from '../../../lib/phone';
import { generateLinkCode } from '../../rules/linking';
import { MSG, validateName, validatePassword, validatePhoneInput, validateUsername } from '../../rules/validation';
import { toIsoVN } from '../../../lib/dates';
import { appendAudit } from '../audit';
import type { Env } from '../env';
import { currentActor } from '../guard';
import { newId } from '../ids';
import { sleepWrite } from '../latency';
import { hashPassword, newSalt } from '../password';

export function authApi(env: Env): AuthApi {
  const { db, session } = env;

  function current(): Session | null {
    const s = session.get();
    if (!s) return null;
    if (currentActor(db, s).type === 'guest') {
      session.clear();
      return null;
    }
    return s;
  }

  return {
    current,
    subscribe: (cb) => session.subscribe(cb),

    async me(): Promise<Me | null> {
      const actor = currentActor(db, current());
      if (actor.type === 'staff') {
        return { kind: 'staff', name: actor.staff.display_name, username: actor.staff.username, title: actor.staff.title, caps: [...actor.caps], presets: actor.staff.preset_ids.map((p) => PRESET_LABEL[p]) };
      }
      if (actor.type === 'customer') {
        const ph = formatPhoneVi(actor.account.phone_e164);
        return { kind: 'customer', name: actor.account.display_name, username: actor.account.username, linked: !!actor.customerId, phoneMasked: `${ph.slice(0, 3)} ••• •• ${ph.slice(-2)}`, salutation: actor.account.salutation };
      }
      return null;
    },

    async login({ identifier, password }) {
      await sleepWrite();
      const id = identifier.trim();
      const { t } = db.read();
      const phone = normalizeVnPhone(id);
      const lower = id.toLowerCase();
      const staff = phone ? undefined : t.staff_users.find((s) => s.username === lower && s.active);
      const account = staff ? undefined : t.web_accounts.find((a) => (phone ? a.phone_e164 === phone : a.username === lower));
      const subject = staff ?? account;
      if (!subject || (account && account.status !== 'active')) throw new AuthError();
      if ((await hashPassword(subject.password_salt, password)) !== subject.password_hash) throw new AuthError();
      const s: Session = staff ? { kind: 'staff', staffId: staff.id } : { kind: 'customer', accountId: account!.id };
      session.set(s);
      if (staff) {
        db.transact('staff.login', (d) => appendAudit(d, env.clock(), { actor_type: 'staff', actor_id: staff.id, actor_name_snapshot: staff.display_name, action: 'staff.login', entity_type: 'staff_user', entity_id: staff.id, summary_vi: `${staff.display_name} đăng nhập`, sensitive: false }), { markDirty: false });
      }
      return s;
    },

    async checkUsername(username: string) {
      const u = username.trim();
      const { t } = db.read();
      return validateUsername(u) ?? (t.web_accounts.some((a) => a.username === u) || t.staff_users.some((s) => s.username === u) ? MSG.usernameTaken : null);
    },

    async signup(input: SignupInput) {
      await sleepWrite();
      const { t } = db.read();
      const username = input.username.trim();
      const phone = normalizeVnPhone(input.phone);
      const fields: Record<string, string> = {};
      const nameErr = validateName(input.full_name);
      if (nameErr) fields.full_name = nameErr;
      const phoneErr = validatePhoneInput(input.phone);
      if (phoneErr) fields.phone = phoneErr;
      else if (t.web_accounts.some((a) => a.phone_e164 === phone)) fields.phone = MSG.phoneTaken;
      const userErr = validateUsername(username);
      if (userErr) fields.username = userErr;
      else if (t.web_accounts.some((a) => a.username === username) || t.staff_users.some((s) => s.username === username)) fields.username = MSG.usernameTaken;
      const pwErr = validatePassword(input.password);
      if (pwErr) fields.password = pwErr;
      if (input.password !== input.password2) fields.password2 = MSG.passwordMismatch;
      if (!input.consent) fields.consent = MSG.consent;
      if (Object.keys(fields).length) throw new ValidationError(fields);

      const salt = newSalt();
      const hash = await hashPassword(salt, input.password);
      const id = db.transact('auth.signup', (d) => {
        // Re-checked on the stored document: another sign-up may have taken the name or phone while the password was hashing.
        const taken: Record<string, string> = {};
        if (d.t.web_accounts.some((a) => a.phone_e164 === phone)) taken.phone = MSG.phoneTaken;
        if (d.t.web_accounts.some((a) => a.username === username) || d.t.staff_users.some((x) => x.username === username)) taken.username = MSG.usernameTaken;
        if (Object.keys(taken).length) throw new ValidationError(taken);
        const used = new Set(d.t.web_accounts.map((a) => a.link_code));
        let code = generateLinkCode(Math.random);
        while (used.has(code)) code = generateLinkCode(Math.random);
        const accountId = newId();
        d.t.web_accounts.push({
          id: accountId, username, phone_e164: phone!, display_name: input.full_name.trim(), salutation: input.salutation ?? 'ban',
          link_code: code, status: 'active', created_at: toIsoVN(env.clock()), password_salt: salt, password_hash: hash,
        });
        appendAudit(d, env.clock(), { actor_type: 'customer', actor_id: accountId, actor_name_snapshot: input.full_name.trim(), action: 'account.signup', entity_type: 'web_account', entity_id: accountId, summary_vi: `Tạo tài khoản web ${username}`, sensitive: false });
        return accountId;
      });
      const s: Session = { kind: 'customer', accountId: id };
      session.set(s);
      return s;
    },

    async logout() {
      session.clear();
    },
  };
}
