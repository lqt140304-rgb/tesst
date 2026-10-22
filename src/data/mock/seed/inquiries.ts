import type { InquiryStatus } from '../../contracts/enums';
import { nextCode } from '../ids';
import type { SeedCtx } from './ctx';

// Sample data ("Nội dung mẫu"): made-up visitors and numbers. Two waiting (one past the overdue limit), one called back.
const ROWS: { name: string; phone: string; text: string; about?: string; status: InquiryStatus; hoursAgo: number; calledHoursAgo?: number }[] = [
  { name: 'Chị Hạnh (mẫu)', phone: '+84901234501', text: 'Sản phẩm này còn hàng không, mình ghé lấy được lúc nào?', about: 'Thức ăn hạt cho chó trưởng thành (mẫu)', status: 'new', hoursAgo: 3 },
  { name: 'Anh Quân (mẫu)', phone: '+84901234502', text: 'Tối qua mình nhắn ngoài giờ, nhờ bệnh viện gọi lại cho mình giúp.', status: 'new', hoursAgo: 30 },
  { name: 'Chị Thảo (mẫu)', phone: '+84901234503', text: 'Mình muốn hỏi giờ đưa mèo đi tiêm phòng.', status: 'called', hoursAgo: 52, calledHoursAgo: 48 },
];

/** Three sample visitor messages, LN-0001..0003. */
export function seedInquiries(c: SeedCtx) {
  for (const r of ROWS) {
    c.doc.t.inquiries.push({
      id: `iq-${c.doc.t.inquiries.length + 1}`, code: nextCode(c.doc, 'LN'), name: r.name, phone_e164: r.phone, text: r.text, ...(r.about ? { about: r.about } : {}),
      status: r.status, created_at: c.ago(r.hoursAgo * 60),
      ...(r.status === 'called' ? { handled_by_name: 'Nguyễn Thu Hà', handled_at: c.ago(r.calledHoursAgo! * 60) } : {}),
      version: 1,
    });
  }
}
