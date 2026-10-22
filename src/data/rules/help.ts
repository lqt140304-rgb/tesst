import type { Checklist, ChecklistItem, FeatureKey, HelpArticle, WhyNot } from '../contracts/staff';
import { CAPS, CAP_LABEL, type Cap } from './capabilities';
import { ARTICLES } from './help-articles';

export type { FeatureKey } from '../contracts/staff';

export const FEATURE_KEYS: readonly FeatureKey[] = [...CAPS, 'stock.write'];

/** What each feature needs, all of it: one feature per capability, plus changing the stock (both stock rights). */
export const FEATURES: Record<FeatureKey, { label: string; caps: readonly Cap[] }> = {
  ...(Object.fromEntries(CAPS.map((c) => [c, { label: CAP_LABEL[c], caps: [c] }])) as unknown as Record<Cap, { label: string; caps: readonly Cap[] }>),
  'stock.write': { label: 'Thêm, sửa, nhập, xuất kho', caps: ['stock.view', 'stock.manage'] },
};

export function explainMissing(caps: ReadonlySet<Cap>, feature: FeatureKey): WhyNot {
  const missing = FEATURES[feature].caps.filter((c) => !caps.has(c));
  if (missing.length === 0) return { allowed: true, missing: [], missingLabels: [], hint: '' };
  const missingLabels = missing.map((c) => CAP_LABEL[c]);
  return { allowed: false, missing: [...missing], missingLabels, hint: `Bạn chưa có quyền ${missingLabels.map((l) => `"${l}"`).join(' và ')}, nhờ Quản lý cấp.` };
}

const fits = (caps: ReadonlySet<Cap>, needsAny: readonly Cap[]) => needsAny.length === 0 || needsAny.some((c) => caps.has(c));

export const CHECKLIST: readonly { key: string; label: string; detail: string; needsAny: readonly Cap[] }[] = [
  { key: 'xem-tong-quan', label: 'Xem Tổng quan', detail: 'Mở Tổng quan để biết việc cần làm hôm nay.', needsAny: [] },
  { key: 'xem-lich', label: 'Xem lịch hẹn', detail: 'Mở Lịch hẹn và xem lịch hôm nay.', needsAny: ['appointments.view'] },
  { key: 'xu-ly-yeu-cau', label: 'Xử lý một yêu cầu đặt lịch', detail: 'Mở một yêu cầu và bấm Bắt đầu liên hệ.', needsAny: ['requests.handle'] },
  { key: 'mo-ho-so-khach', label: 'Mở hồ sơ một khách hàng', detail: 'Tìm một khách ở mục Khách hàng và mở hồ sơ.', needsAny: ['customers.view'] },
  { key: 'xem-bang-noi-tru', label: 'Xem bảng nội trú', detail: 'Mở Nội trú để xem các chuồng và các bé đang ở.', needsAny: ['inpatient.view'] },
  { key: 'viet-nhat-ky', label: 'Viết một dòng nhật ký nội trú', detail: 'Mở một bé nội trú và bấm Viết nhật ký.', needsAny: ['inpatient.diary_write'] },
  { key: 'lap-hoa-don-nhap', label: 'Lập một hóa đơn nháp', detail: 'Vào Hóa đơn, bấm Tạo hóa đơn và thêm dịch vụ.', needsAny: ['invoices.create'] },
  { key: 'thu-tien', label: 'Thu tiền cho một hóa đơn', detail: 'Mở hóa đơn đã phát hành và bấm Ghi nhận thanh toán.', needsAny: ['payments.record'] },
  { key: 'xem-bang-gia', label: 'Xem bảng giá', detail: 'Mở Bảng giá để biết giá dịch vụ.', needsAny: [] },
];

/** Only what fits the rights; "done" counts only items still on the list (a right lost later hides the item, the mark stays stored). */
export function checklistFor(caps: ReadonlySet<Cap>, done: readonly string[], hidden: boolean): Checklist {
  const items: ChecklistItem[] = CHECKLIST.filter((i) => fits(caps, i.needsAny)).map((i) => ({ key: i.key, label: i.label, detail: i.detail, done: done.includes(i.key) }));
  return { items, doneCount: items.filter((i) => i.done).length, total: items.length, hidden };
}

const strip = (a: (typeof ARTICLES)[number]): HelpArticle => ({ id: a.id, title: a.title, summary: a.summary, steps: [...a.steps], badge: a.badge });

export function visibleArticles(caps: ReadonlySet<Cap>): HelpArticle[] {
  return ARTICLES.filter((a) => fits(caps, a.needsAny)).map(strip);
}

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();

export function searchArticles(caps: ReadonlySet<Cap>, q: string): HelpArticle[] {
  const needle = fold(q.trim());
  const list = visibleArticles(caps);
  if (!needle) return list;
  return list.filter((a) => fold(`${a.title} ${a.summary} ${a.steps.join(' ')}`).includes(needle));
}
