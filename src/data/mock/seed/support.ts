import type { SupportKind, SupportStatus } from '../../contracts/enums';
import { nextCode } from '../ids';
import { STAFF } from './accounts';
import type { SeedCtx } from './ctx';

type Row = {
  by: string; byName: string; kind: SupportKind; title: string; body: string; screen?: string; status: SupportStatus; minutesAgo: number;
  reply?: { text: string; minutesAgo: number };
};

// Sample data ("Dữ liệu mẫu"): generic, no real people or products. Two new, one seen, one answered.
const ROWS: Row[] = [
  { by: STAFF.duc, byName: 'BS. Trần Minh Đức', kind: 'howto', title: 'Hỏi cách đổi giờ một lịch hẹn (mẫu)', body: 'Mình muốn dời lịch hẹn của một bé sang chiều mai nhưng chưa thấy nút ở đâu.', screen: 'Lịch hẹn', status: 'answered', minutesAgo: 3 * 24 * 60,
    reply: { text: 'Bạn mở lịch hẹn đó ở khung bên phải, chọn Đổi lịch rồi chọn ngày giờ mới. Nếu không thấy nút, bạn cần quyền sắp xếp lịch hẹn.', minutesAgo: 2 * 24 * 60 } },
  { by: STAFF.mai, byName: 'BS. Phạm Thanh Mai', kind: 'howto', title: 'Hỏi cách chia sẻ nhật ký cho chủ nuôi (mẫu)', body: 'Nhật ký mình viết khi nào thì chủ nuôi xem được?', screen: 'Nội trú', status: 'seen', minutesAgo: 20 * 60 },
  { by: STAFF.duc, byName: 'BS. Trần Minh Đức', kind: 'bug', title: 'Bảng nội trú tải chậm khi mở lần đầu (mẫu)', body: 'Sáng nay mở bảng nội trú thấy trống vài giây rồi mới hiện chuồng.', screen: 'Nội trú', status: 'new', minutesAgo: 5 * 60 },
  { by: STAFF.ngocanh, byName: 'Lê Ngọc Anh', kind: 'idea', title: 'Gợi ý thêm ô ghi chú nhanh cho lịch spa (mẫu)', body: 'Nếu có ô ghi chú ngắn ngay trên lịch spa thì dặn nhau sẽ đỡ phải gọi.', screen: 'Lịch hẹn', status: 'new', minutesAgo: 90 },
];

/** Four sample tickets, HT-0001..0004. */
export function seedSupport(c: SeedCtx) {
  for (const r of ROWS) {
    c.doc.t.support_tickets.push({
      id: `tk-${c.doc.t.support_tickets.length + 1}`, code: nextCode(c.doc, 'HT'), kind: r.kind, title: r.title, body: r.body, screen: r.screen, status: r.status,
      created_at: c.ago(r.minutesAgo), created_by: r.by, created_by_name: r.byName,
      ...(r.reply ? { reply_text: r.reply.text, replied_by_name: 'Nguyễn Thu Hà', replied_at: c.ago(r.reply.minutesAgo) } : {}),
      version: 1,
    });
  }
}
