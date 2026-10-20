import { describe, expect, it } from 'vitest';
import { makeTestApi, loginAs } from './testing';
import { AuthError, ForbiddenError, ValidationError } from '../contracts/errors';
import { assertCap, currentActor } from './guard';

const signupInput = {
  full_name: 'Nguyễn Văn An', phone: '0912 345 678', username: 'van_an', password: 'meo-con-thich-nang', password2: 'meo-con-thich-nang', consent: true,
};

describe('auth', () => {
  it('two sign-ups racing for the same username or phone create only one account (F04)', async () => {
    const { api, db } = makeTestApi();
    const byName = await Promise.allSettled([api.auth.signup(signupInput), api.auth.signup({ ...signupInput, phone: '0912 345 679' })]);
    expect(byName.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    const lost = byName.find((r) => r.status === 'rejected') as PromiseRejectedResult;
    expect(lost.reason).toBeInstanceOf(ValidationError);
    expect((lost.reason as ValidationError).fields.username).toBe('Tên này đã có người dùng. Bạn thử một tên khác, ví dụ: nguyenlan2.');
    const byPhone = await Promise.allSettled([api.auth.signup({ ...signupInput, username: 'an_mot', phone: '0912 000 111' }), api.auth.signup({ ...signupInput, username: 'an_hai', phone: '0912 000 111' })]);
    expect(byPhone.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    const users = db.read().t.web_accounts.map((a) => a.username);
    expect(users.filter((u) => u === 'van_an')).toHaveLength(1);
    expect(db.read().t.web_accounts.filter((a) => a.phone_e164 === '+84912000111')).toHaveLength(1);
  });
  it('logs in by username', async () => {
    const { api } = makeTestApi();
    expect(await loginAs(api, 'lan_nguyen')).toEqual({ kind: 'customer', accountId: 'acc-lan_nguyen' });
  });
  it('logs in by phone in any format', async () => {
    const { api } = makeTestApi();
    for (const identifier of ['0900 000 001', '+84900000001', '0900.000.001']) {
      expect(await api.auth.login({ identifier, password: 'leson-demo' })).toEqual({ kind: 'customer', accountId: 'acc-lan_nguyen' });
    }
  });
  it('wrong password throws AuthError with the generic message', async () => {
    const { api } = makeTestApi();
    await expect(api.auth.login({ identifier: 'lan_nguyen', password: 'sai-mat-khau' })).rejects.toThrow(AuthError);
    await expect(api.auth.login({ identifier: 'khong_ton_tai', password: 'x' })).rejects.toThrow('Thông tin đăng nhập chưa đúng. Bạn kiểm tra lại rồi thử lần nữa nhé.');
  });
  it('staff login returns a staff session', async () => {
    const { api } = makeTestApi();
    expect(await loginAs(api, 'quanly_ha')).toEqual({ kind: 'staff', staffId: 'stf-ha' });
    expect(api.auth.current()).toEqual({ kind: 'staff', staffId: 'stf-ha' });
  });
  it('sign-up rejects a phone-like username', async () => {
    const { api } = makeTestApi();
    const err = await api.auth.signup({ ...signupInput, username: '0912345678' }).catch((e) => e);
    expect(err).toBeInstanceOf(ValidationError);
    expect(err.fields.username).toBe('Tên đăng nhập không được giống số điện thoại. Bạn thêm ít nhất một chữ cái nhé.');
  });
  it('sign-up rejects a registered phone with the locked message', async () => {
    const { api } = makeTestApi();
    const err = await api.auth.signup({ ...signupInput, phone: '0900000001' }).catch((e) => e);
    expect(err.fields.phone).toMatch(/^Số điện thoại này đã có tài khoản/);
  });
  it('sign-up rejects a taken username, mismatched passwords and missing consent', async () => {
    const { api } = makeTestApi();
    const err = await api.auth.signup({ ...signupInput, username: 'lan_nguyen', password2: 'khac-nhau-roi', consent: false }).catch((e) => e);
    expect(err.fields).toMatchObject({
      username: 'Tên này đã có người dùng. Bạn thử một tên khác, ví dụ: nguyenlan2.',
      password2: 'Hai mật khẩu chưa khớp nhau.',
      consent: 'Bạn cần đồng ý để Lê Sơn có thể lưu thông tin của bạn.',
    });
  });
  it('checkUsername reports format problems and taken names, null when free', async () => {
    const { api } = makeTestApi();
    expect(await api.auth.checkUsername('0912345678')).toBe('Tên đăng nhập không được giống số điện thoại. Bạn thêm ít nhất một chữ cái nhé.');
    expect(await api.auth.checkUsername('lan_nguyen')).toBe('Tên này đã có người dùng. Bạn thử một tên khác, ví dụ: nguyenlan2.');
    expect(await api.auth.checkUsername('quanly_ha')).toBe('Tên này đã có người dùng. Bạn thử một tên khác, ví dụ: nguyenlan2.');
    expect(await api.auth.checkUsername('hoangminh')).toBeNull();
  });
  it('sign-up creates an account with a link code and logs in', async () => {
    const { api, db } = makeTestApi();
    const session = await api.auth.signup(signupInput);
    expect(session.kind).toBe('customer');
    const acc = db.read().t.web_accounts.find((a) => a.username === 'van_an')!;
    expect(acc.link_code).toMatch(/^LS-[A-Z2-9]{4}$/);
    expect(acc.phone_e164).toBe('+84912345678');
    expect(acc.password_hash).not.toContain('meo');
    expect(api.auth.current()).toEqual(session);
  });
  it('session for a missing subject resolves to null', async () => {
    const { api, db } = makeTestApi();
    await api.auth.signup(signupInput);
    db.reset();
    expect(api.auth.current()).toBeNull();
  });
  it('logout clears the session', async () => {
    const { api } = makeTestApi();
    await loginAs(api, 'lan_nguyen');
    await api.auth.logout();
    expect(api.auth.current()).toBeNull();
  });
});

describe('guard', () => {
  it('assertCap throws ForbiddenError for spa on payments.record', async () => {
    const { api, db } = makeTestApi();
    await loginAs(api, 'spa_ngocanh');
    const actor = currentActor(db, api.auth.current());
    expect(() => assertCap(actor, 'payments.record')).toThrow(ForbiddenError);
    expect(() => assertCap(actor, 'inpatient.view')).not.toThrow();
  });
  it('customer actor carries the linked customer id or null', async () => {
    const { api, db } = makeTestApi();
    await loginAs(api, 'lan_nguyen');
    expect(currentActor(db, api.auth.current())).toMatchObject({ type: 'customer', customerId: 'cus-01' });
    await loginAs(api, 'minh_khoa');
    expect(currentActor(db, api.auth.current())).toMatchObject({ type: 'customer', customerId: null });
  });
});

describe('auth.me and session subscription', () => {
  it('describes the signed-in customer, staff or nobody', async () => {
    const { api } = makeTestApi();
    expect(await api.auth.me()).toBeNull();
    await loginAs(api, 'lan_nguyen');
    expect(await api.auth.me()).toMatchObject({ kind: 'customer', name: 'Nguyễn Thị Lan', username: 'lan_nguyen', linked: true, phoneMasked: '090 ••• •• 01' });
    await loginAs(api, 'bacsi_duc');
    const me = await api.auth.me();
    expect(me).toMatchObject({ kind: 'staff', name: 'BS. Trần Minh Đức', title: 'Bác sĩ' });
    expect(me?.kind === 'staff' && me.caps).toContain('requests.handle');
  });
  it('notifies subscribers on login and logout', async () => {
    const { api } = makeTestApi();
    let n = 0;
    const off = api.auth.subscribe(() => { n += 1; });
    await loginAs(api, 'lan_nguyen');
    await api.auth.logout();
    off();
    await loginAs(api, 'lan_nguyen');
    expect(n).toBe(2);
  });
});

describe('looking around is not editing (day-rollover reseed stays possible)', () => {
  it('staff login, customer seen markers and the video purge leave the demo untouched', async () => {
    const { api, db } = makeTestApi();
    expect(db.read().dirty).toBe(false);
    await loginAs(api, 'bacsi_duc');
    expect(db.read().dirty).toBe(false);
    await api.auth.logout();
    await loginAs(api, 'lan_nguyen');
    await api.customer.markSeen('welcome');
    api.system.purgeExpiredVideos();
    expect(db.read().dirty).toBe(false);
  });
});
