import { describe, expect, it } from 'vitest';
import { CAPS, effectiveCaps } from './capabilities';
import { ARTICLES } from './help-articles';
import { CHECKLIST, FEATURE_KEYS, checklistFor, explainMissing, searchArticles, visibleArticles } from './help';

const mgr = effectiveCaps({ preset_ids: ['quan_ly'], extra_capabilities: [] });
const doctor = effectiveCaps({ preset_ids: ['bac_si'], extra_capabilities: [] });
const spa = effectiveCaps({ preset_ids: ['spa'], extra_capabilities: [] });
const ids = (list: { id: string }[]) => list.map((a) => a.id);

describe('explainMissing', () => {
  it('names the missing right and tells the person to ask the manager', () => {
    expect(explainMissing(spa, 'appointments.manage')).toEqual({
      allowed: false, missing: ['appointments.manage'], missingLabels: ['Sắp xếp lịch hẹn'],
      hint: 'Bạn chưa có quyền "Sắp xếp lịch hẹn", nhờ Quản lý cấp.',
    });
  });
  it('the manager may do everything', () => {
    for (const f of FEATURE_KEYS) expect(explainMissing(mgr, f)).toEqual({ allowed: true, missing: [], missingLabels: [], hint: '' });
  });
  it('each way of writing the stock is its own feature: the doctor may look but not receive, and a person given only that right may', () => {
    expect(explainMissing(doctor, 'stock.view').allowed).toBe(true);
    expect(explainMissing(doctor, 'stock.receive')).toEqual({ allowed: false, missing: ['stock.receive'], missingLabels: ['Nhập thêm kho'], hint: 'Bạn chưa có quyền "Nhập thêm kho", nhờ Quản lý cấp.' });
    const onlyReceive = effectiveCaps({ preset_ids: ['spa'], extra_capabilities: ['stock.receive'] });
    expect(explainMissing(onlyReceive, 'stock.receive').allowed).toBe(true);
    expect(explainMissing(onlyReceive, 'stock.issue').allowed).toBe(false);
  });
  it('every capability is a feature', () => {
    for (const c of CAPS) expect(FEATURE_KEYS).toContain(c);
  });
});

describe('articles', () => {
  it('ids are unique and safe, every article is a sample with 3–6 real steps, and none uses words the project forbids', () => {
    expect(new Set(ids(ARTICLES)).size).toBe(ARTICLES.length);
    for (const a of ARTICLES) {
      expect(a.id).toMatch(/^[a-z0-9_.-]{1,40}$/);
      expect(a.badge).toBe('Nội dung mẫu');
      expect(a.steps.length).toBeGreaterThanOrEqual(3);
      expect(a.steps.length).toBeLessThanOrEqual(6);
      expect(a.steps.every((s) => s.trim().length > 0)).toBe(true);
      expect(`${a.title} ${a.summary} ${a.steps.join(' ')}`).not.toMatch(/097 355 51 05|quý khách|lễ tân/i);
    }
  });
  it('each role sees only the articles that fit its rights', () => {
    expect(ids(visibleArticles(spa))).toEqual(['tong-quan', 'lich-hen', 'ho-so-khach', 'noi-tru-bang-chuong', 'noi-tru-nhat-ky', 'bang-gia', 'kho', 'ho-so-mat-khau', 'tuy-chon-cua-toi', 'cai-dat-he-thong', 'tro-giup-gop-y', 'quyen-cua-toi']);
    expect(ids(visibleArticles(mgr))).toHaveLength(20);
    expect(ids(visibleArticles(spa))).not.toContain('bao-cao-van-hanh');
    expect(ids(visibleArticles(spa))).not.toContain('tai-khoan-nhan-vien');
    expect(ids(visibleArticles(doctor))).not.toContain('tai-khoan-nhan-vien');
    expect(ids(visibleArticles(mgr))).toEqual(expect.arrayContaining(['bao-cao-van-hanh', 'tai-khoan-nhan-vien']));
    expect(ids(visibleArticles(doctor))).not.toContain('thu-tien');
    expect(ids(visibleArticles(doctor))).toContain('hoa-don-lap-phat-hanh');
  });
  it('the output carries no rights list', () => {
    for (const a of visibleArticles(mgr)) expect(Object.keys(a).sort()).toEqual(['badge', 'id', 'steps', 'summary', 'title']);
  });
});

describe('searchArticles', () => {
  it('never finds an article the person may not see, even by its exact title', () => {
    // "Bảng giá" talks about invoices and Spa may read it, so the list is not empty; the two invoice articles must not be in it.
    for (const q of ['hóa đơn', 'thu tiền', 'Lập và phát hành hóa đơn', 'Thu tiền tại quầy']) {
      const found = ids(searchArticles(spa, q));
      expect(found).not.toContain('hoa-don-lap-phat-hanh');
      expect(found).not.toContain('thu-tien');
    }
    expect(ids(searchArticles(spa, 'Lập và phát hành hóa đơn'))).toEqual([]);
  });
  it('ignores accents and case, and an empty search is the full list', () => {
    const a = ids(searchArticles(mgr, 'hoa don'));
    expect(a).toEqual(ids(searchArticles(mgr, 'HÓA ĐƠN')));
    expect(a).toContain('hoa-don-lap-phat-hanh');
    expect(a).toContain('thu-tien');
    expect(searchArticles(mgr, '')).toEqual(visibleArticles(mgr));
    expect(searchArticles(mgr, '   ')).toEqual(visibleArticles(mgr));
  });
});

describe('checklistFor', () => {
  it('keys are unique and safe', () => {
    expect(new Set(CHECKLIST.map((i) => i.key)).size).toBe(CHECKLIST.length);
    for (const i of CHECKLIST) expect(i.key).toMatch(/^[a-z0-9_.-]{1,40}$/);
  });
  it('lists only what fits the rights, and counts only done items that are still in the list', () => {
    const c = checklistFor(spa, ['xem-lich', 'thu-tien', 'khong-co'], false);
    expect(c.items.map((i) => i.key)).toEqual(['xem-tong-quan', 'xem-lich', 'mo-ho-so-khach', 'xem-bang-noi-tru', 'viet-nhat-ky', 'xem-bang-gia']);
    expect(c.items.find((i) => i.key === 'xem-lich')!.done).toBe(true);
    expect(c).toMatchObject({ doneCount: 1, total: 6, hidden: false });
    expect(checklistFor(mgr, [], true)).toMatchObject({ doneCount: 0, total: CHECKLIST.length, hidden: true });
  });
});

describe('article wording follows the real screens', () => {
  const text = (id: string) => {
    const a = ARTICLES.find((x) => x.id === id)!;
    return `${a.title} ${a.summary} ${a.steps.join(' ')}`;
  };
  it('requests: cancelling and rejecting are two different buttons', () => {
    expect(text('yeu-cau-dat-lich')).toContain('"Hủy yêu cầu…"');
    expect(text('yeu-cau-dat-lich')).toContain('"Từ chối…"');
  });
  it('linking an account starts from the connection code and ends with the confirmation step', () => {
    const t = text('lien-ket-tai-khoan');
    expect(t).toContain('mã kết nối');
    expect(t).not.toContain('mã liên kết');
    expect(t).toContain('"Tìm tài khoản"');
    expect(t).toContain('xác minh');
  });
  it('the diary is written in its own tab; there is no such button as "Viết nhật ký" or "Dùng câu gợi ý" there', () => {
    const t = text('noi-tru-nhat-ky');
    expect(t).toContain('"Nhật ký cho chủ nuôi"');
    expect(t).not.toContain('"Viết nhật ký"');
    expect(t).not.toContain('Dùng câu gợi ý');
    expect(CHECKLIST.find((i) => i.key === 'viet-nhat-ky')!.detail).not.toContain('Bấm Viết nhật ký');
  });
  it('names panels and sections the way the screens do', () => {
    expect(text('hoa-don-lap-phat-hanh')).toContain('"Xem trước hóa đơn"');
    expect(text('sap-xep-lich')).toContain('"Khách xin đổi lịch"');
    expect(text('sap-xep-lich')).toContain('"Dời theo mong muốn"');
    expect(text('yeu-cau-dat-lich')).not.toContain('đang chờ bạn');
  });
  it('rights that gate a button are said out loud', () => {
    expect(text('noi-tru-nhat-ky')).toContain('Chia sẻ với khách');
    expect(text('noi-tru-bang-chuong')).toContain('Nhập viện, xuất viện');
  });
  it('the settings and help articles name the real screens and buttons', () => {
    const reports = text('bao-cao-van-hanh');
    expect(reports).toContain('"Báo cáo"');
    expect(reports).toContain('"Cần chú ý lúc này"');
    const profile = text('ho-so-mat-khau');
    expect(profile).toContain('"Hồ sơ của tôi"');
    expect(profile).toContain('"Đổi mật khẩu"');
    expect(profile).toContain('"Lưu tên"');
    const prefs = text('tuy-chon-cua-toi');
    expect(prefs).toContain('"Tùy chọn của tôi"');
    expect(prefs).toContain('"Về mặc định"');
    const team = text('tai-khoan-nhan-vien');
    expect(team).toContain('"Tài khoản nhân viên"');
    expect(team).toContain('"Thêm nhân viên"');
    expect(team).toContain('"Đặt lại mật khẩu"');
    expect(team).toContain('Quyền thêm');
    const system = text('cai-dat-he-thong');
    expect(system).toContain('"Cài đặt hệ thống"');
    expect(system).toContain('"Thêm ngày lễ"');
    expect(system).toContain('19:00');
    expect(system).toContain('"Lưu cài đặt"');
    const help = text('tro-giup-gop-y');
    expect(help).toContain('"Hướng dẫn"');
    expect(help).toContain('"Góp ý của tôi"');
    expect(help).toContain('"Gửi phiếu"');
    expect(help).toContain('"Hộp thư"');
  });
  it('review fixes: holidays are saved with the settings, the forms are filled before their buttons, revenue needs its right', () => {
    expect(text('cai-dat-he-thong')).toMatch(/chọn ngày[^.]*bấm "Thêm ngày lễ"[^.]*"Lưu cài đặt"/);
    expect(text('tro-giup-gop-y')).toMatch(/điền[^.]*rồi bấm "Gửi phiếu"/);
    expect(text('bao-cao-van-hanh')).toContain('Xem doanh thu');
  });
});
