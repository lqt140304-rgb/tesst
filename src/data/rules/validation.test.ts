import { describe, expect, it } from 'vitest';
import { looksLikePhone, validateName, validatePassword, validatePhoneInput, validateUsername } from './validation';

describe('validateUsername', () => {
  it.each([
    ['lan_nguyen', null],
    ['nguyen-lan2', null],
    ['abc', 'Tên đăng nhập cần từ 4 đến 30 ký tự.'],
    ['a'.repeat(31), 'Tên đăng nhập cần từ 4 đến 30 ký tự.'],
    ['nguyễnlan', 'Tên đăng nhập không dùng dấu tiếng Việt. Bạn thử: nguyenlan.'],
    ['Lan.Nguyen', 'Chỉ dùng chữ thường không dấu, số, dấu _ hoặc -.'],
    ['0912345678', 'Tên đăng nhập không được giống số điện thoại. Bạn thêm ít nhất một chữ cái nhé.'],
    ['1234_5678', 'Tên đăng nhập không được giống số điện thoại. Bạn thêm ít nhất một chữ cái nhé.'],
    ['admin', 'Tên này không dùng được. Bạn chọn tên khác nhé.'],
    ['nhanvien', 'Tên này không dùng được. Bạn chọn tên khác nhé.'],
  ])('%s → %s', (u, msg) => {
    expect(validateUsername(u)).toBe(msg);
  });
});

describe('other validators', () => {
  it('detects phone-like strings', () => {
    expect(looksLikePhone('+84 912 345 678')).toBe(true);
    expect(looksLikePhone('lan_nguyen')).toBe(false);
  });
  it('validates passwords', () => {
    expect(validatePassword('1234567')).toBe('Mật khẩu cần ít nhất 8 ký tự.');
    expect(validatePassword('12345678')).toBe('Mật khẩu này quá dễ đoán. Bạn chọn mật khẩu khác nhé.');
    expect(validatePassword('meo-con-thich-nang')).toBeNull();
  });
  it('validates name and phone input', () => {
    expect(validateName('  ')).toBe('Bạn cho Lê Sơn biết tên của bạn nhé.');
    expect(validateName('Lan')).toBeNull();
    expect(validatePhoneInput('12345')).toBe('Số điện thoại chưa đúng. Bạn kiểm tra lại giúp nhé (ví dụ: 0912 345 678).');
    expect(validatePhoneInput('0912 345 678')).toBeNull();
  });
});
