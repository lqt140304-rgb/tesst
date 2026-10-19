import { normalizeVnPhone } from '../../lib/phone';

const RESERVED = new Set(['admin', 'leson', 'quanly', 'nhanvien', 'bacsi', 'root', 'support', 'system', 'hethong']);
const COMMON_PASSWORDS = new Set(['12345678', '123456789', '1234567890', 'password', 'matkhau123', 'matkhau', 'qwertyui', '11111111', '00000000', 'abc12345', 'iloveyou']);

export const MSG = {
  usernameLength: 'Tên đăng nhập cần từ 4 đến 30 ký tự.',
  usernameDiacritics: 'Tên đăng nhập không dùng dấu tiếng Việt. Bạn thử: nguyenlan.',
  usernameChars: 'Chỉ dùng chữ thường không dấu, số, dấu _ hoặc -.',
  usernamePhone: 'Tên đăng nhập không được giống số điện thoại. Bạn thêm ít nhất một chữ cái nhé.',
  usernameReserved: 'Tên này không dùng được. Bạn chọn tên khác nhé.',
  usernameTaken: 'Tên này đã có người dùng. Bạn thử một tên khác, ví dụ: nguyenlan2.',
  passwordShort: 'Mật khẩu cần ít nhất 8 ký tự.',
  passwordCommon: 'Mật khẩu này quá dễ đoán. Bạn chọn mật khẩu khác nhé.',
  passwordMismatch: 'Hai mật khẩu chưa khớp nhau.',
  nameEmpty: 'Bạn cho Lê Sơn biết tên của bạn nhé.',
  phoneInvalid: 'Số điện thoại chưa đúng. Bạn kiểm tra lại giúp nhé (ví dụ: 0912 345 678).',
  phoneTaken:
    'Số điện thoại này đã có tài khoản. Nếu là bạn, hãy đăng nhập. Nếu bạn chưa từng đăng ký, xin gọi 097 355 51 05 để Lê Sơn hỗ trợ.',
  consent: 'Bạn cần đồng ý để Lê Sơn có thể lưu thông tin của bạn.',
} as const;

export function looksLikePhone(s: string): boolean {
  return normalizeVnPhone(s) !== null || /^[+\d\s._-]+$/.test(s.trim());
}

export function validateUsername(u: string): string | null {
  if (u.length < 4 || u.length > 30) return MSG.usernameLength;
  if (/[^ -~]/.test(u)) return MSG.usernameDiacritics;
  if (!/^[a-z0-9_-]+$/.test(u)) return MSG.usernameChars;
  if (!/[a-z]/.test(u) || looksLikePhone(u)) return MSG.usernamePhone;
  if (RESERVED.has(u)) return MSG.usernameReserved;
  return null;
}

export function validatePassword(p: string): string | null {
  if (p.length < 8) return MSG.passwordShort;
  if (COMMON_PASSWORDS.has(p.toLowerCase())) return MSG.passwordCommon;
  return null;
}

export function validateName(n: string): string | null {
  return n.trim() ? null : MSG.nameEmpty;
}

export function validatePhoneInput(p: string): string | null {
  return normalizeVnPhone(p) ? null : MSG.phoneInvalid;
}

/** Username suggestion from a Vietnamese name: "Nguyễn Thị Lan" → "nguyenthilan". */
export function suggestUsername(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 30);
}
