# Phần 5 (đợt 1) — Dữ liệu Kho, Báo cáo vận hành, Cài đặt và Hỗ trợ nhân viên (thiết kế)

Ngày: 21/10/2026 · Nhánh `claude/du-lieu` · **Chủ dự án đã chọn hướng ở các câu hỏi (21/10/2026), chờ duyệt bản viết này.** Thuộc phần 5 của `2026-10-20-lam-lai-giao-dien-design.md` (§3.2 "Thêm Khám bệnh, Dịch vụ, Kho, Báo cáo, Cài đặt — trang dữ liệu mẫu có vài thao tác chính"). **Khám bệnh và Dịch vụ không nằm trong tài liệu này** (chờ danh sách dịch vụ mới của chủ dự án).

## 1. Mục tiêu

Lớp dữ liệu cho ba phân hệ của khu nhân viên, để bên giao diện dựng màn hình bấm được mà không phải bịa dữ liệu:

- **Kho** — thuốc và vật tư: danh sách, tồn, cảnh báo sắp hết / hết hàng / sắp hết hạn, nhập thêm, xuất kho, kiểm kê, lịch sử. **Độc lập**: không tự trừ tồn theo điều trị hay hóa đơn (chủ dự án chọn).
- **Báo cáo vận hành** — số liệu tính từ dữ liệu có sẵn (lịch hẹn, yêu cầu đặt lịch, nội trú, khách mới, kho, doanh thu tóm tắt), có "so với kỳ trước". Doanh thu chi tiết vẫn ở trang Doanh thu hiện có.
- **Cài đặt** — (A) tài khoản nhân viên và quyền, hồ sơ cá nhân, thông tin bệnh viện chỉ xem; (B) tùy chọn cá nhân; (C) cài đặt hệ thống của Quản lý; (D) hỗ trợ người dùng **chỉ cho nhân viên**.

**Thành công khi:** mọi thao tác chạy trọn trong demo; người thiếu quyền bị chặn **ở lớp dữ liệu**; tab khác không bị ghi đè (`version` / `ConflictError`); các con số báo cáo cộng khớp nhau; **khách không bao giờ thấy** dữ liệu của ba phân hệ (R7); dữ liệu và hành vi hiện có (bao gồm số lượng dữ liệu mẫu cũ, quyền Bác sĩ/Spa) không đổi.

Nguồn ràng buộc: `docs/thiet-ke/QUYET-DINH.md` (R1–R37) → thiết kế làm lại → tài liệu này. **Chưa có bảng mẫu giao diện** cho Kho, Báo cáo, Cài đặt; bên giao diện tự dựng theo phong cách chung, tài liệu này chỉ định nghĩa dữ liệu và thao tác.

## 2. Hiện trạng (đã đọc mã)

| Mảng | Đã có | Thiếu |
|---|---|---|
| Kho | không có | toàn bộ |
| Báo cáo | `reports.revenue({from,to})` (thu, theo phương thức, theo danh mục, theo ngày, còn nợ) | số liệu vận hành |
| Nhân viên | `staff_users` (tên đăng nhập, tên, chức danh, vai, quyền lẻ, đang dùng, mật khẩu băm); đăng nhập chỉ nhận `active`; `currentActor` đọc lại người dùng mỗi lần gọi nên đổi vai/tắt tài khoản có hiệu lực ngay | quản lý nhân viên, đổi tên, đổi mật khẩu, `version` |
| Quyền | 16 quyền, Quản lý = `CAPS` (tất cả), Bác sĩ và Spa là danh sách riêng | quyền cho phân hệ mới |
| Cài đặt | không có bảng cài đặt; khung giờ đặt lịch là hằng số `TIME_SLOTS` (kiểu `TimeSlot` cố định); thời lượng khám/spa mặc định nằm trong giao diện (`SERVICE_MINUTES`) | cài đặt lưu được |
| Thông tin bệnh viện | chữ rải ở giao diện (công khai, khách, đăng nhập, hóa đơn) | một nguồn trong lớp dữ liệu |
| Mã đếm | `nextCode` tăng `doc.counters[prefix]` | tiền tố mới; tài liệu cũ trong trình duyệt **không có** bộ đếm mới (sẽ ra `NaN`) |
| Bảng mới trên tài liệu cũ | `db.ts` điền bảng thiếu bằng **mảng rỗng** | Kho trống trên trình duyệt đã dùng bản cũ |

Bé (`Pet`) **không có ngày tạo** nên "bé mới" không tính được thật; Báo cáo chỉ đếm **khách mới** (`Customer.created_at`).

## 3. Quyết định thiết kế

### 3.0 Chung cho cả ba phân hệ

**Giai đoạn (mỗi giai đoạn gộp riêng khi `npm run verify` xanh):** 1 Kho → 2 Báo cáo → 3 Cài đặt A → 4 Cài đặt B → 5 Cài đặt C → 6 Hỗ trợ D → 7 (tùy chọn, **chờ chủ dự án**) khung giờ đặt lịch chỉnh được (§7 câu 1).

**Quyền mới** (thêm vào `CAPS`, `CAP_LABEL`; **chỉ Quản lý có sẵn qua `quan_ly: CAPS`; Bác sĩ và Spa giữ nguyên danh sách** — Quản lý cấp thêm quyền lẻ bằng chính Cài đặt):

| Quyền | Nhãn | Dùng cho |
|---|---|---|
| `stock.view` | Xem kho | xem danh sách, lịch sử, thẻ tóm tắt |
| `stock.manage` | Quản lý kho | thêm/sửa món, nhập thêm, xuất kho, kiểm kê |
| `reports.operations` | Xem báo cáo vận hành | Báo cáo vận hành |
| `staff.manage` | Quản lý tài khoản nhân viên | Cài đặt A |
| `settings.manage` | Quản lý cài đặt hệ thống | Cài đặt C |
| `support.inbox` | Xử lý góp ý, báo lỗi | hộp thư hỗ trợ (D) |

`stock.manage` không kéo theo `stock.view` (quyền lẻ cần cấp đủ cặp, nhãn nói rõ); các hàm xem kiểm `stock.view`, hàm ghi kiểm `stock.manage` **và** `stock.view`. Hồ sơ cá nhân, tùy chọn cá nhân, trợ giúp, gửi góp ý, thông tin bệnh viện và đọc cài đặt hệ thống: **mọi nhân viên đang dùng**, không cần quyền riêng.

**Bảng mới** (`Tables`): `stock_items`, `stock_moves`, `staff_prefs`, `app_settings`, `support_tickets`. Mã mới: `KHO` (món kho: `KHO-0001`) và `HT` (phiếu hỗ trợ: `HT-0001`), thêm vào `CodePrefix` và `counters`.

**Tài liệu cũ trong trình duyệt (di chuyển dữ liệu):** khi mở tài liệu đã lưu, (1) bảng mới thiếu thì **nạp phần mẫu của bảng đó** từ `buildSeed(new Date(doc.seededAt))` (cùng mốc ngày với tài liệu, nên ngày tương đối khớp), không để rỗng; (2) bộ đếm mã còn thiếu được đặt bằng số dòng đã nạp; (3) `staff_users[].version ??= 1`. `SCHEMA_VERSION` giữ nguyên (thay đổi chỉ thêm). Có test với một tài liệu "cũ" dựng tay.

**Không đổi dữ liệu mẫu hiện có:** số khách, lịch hẹn, hóa đơn… giữ nguyên (e2e và test của nhánh giao diện dựa vào). Dữ liệu mới nằm ở bảng riêng.

**Nhật ký thao tác:** mọi ghi dùng `audit(...)`; đổi mật khẩu, đặt lại mật khẩu, đổi vai/quyền, tắt/bật tài khoản đánh dấu `sensitive: true`; **không bao giờ ghi mật khẩu** vào nhật ký hay `summary_vi`.

### 3.1 Kho

**`StockItem`:** `id`, `code`, `name` (1–80 ký tự), `kind` (`'thuoc' | 'vat_tu'`), `unit` (1–20 ký tự: viên, ống, chai, hộp, cái…), `qty` (số nguyên 0–1 000 000), `min_qty` (số nguyên 0–1 000 000; 0 = không báo sắp hết, vẫn báo hết hàng), `expires_on?` (`YYYY-MM-DD`, hạn gần nhất đang có), `active`, `version`, `created_at`, `created_by`.

**`StockMove`:** `id`, `item_id`, `kind` (`'in' | 'out' | 'adjust'`), `delta` (số nguyên có dấu, khác 0), `qty_after`, `reason` (`'nhap_hang' | 'dung_tai_phong' | 'hu_hong' | 'het_han' | 'kiem_ke' | 'khac'`), `supplier?` (≤ 80), `note?` (≤ 200), `at`, `by`, `by_name` (tên chụp lúc ghi). **Bất biến:** `item.qty` = `qty_after` của dòng mới nhất; `qty_after` = `qty_after` dòng trước + `delta`; tồn không âm.

**Quy tắc thuần** `rules/stock.ts` (có test): `stockLevel(item)` → `'out'` (qty = 0), `'low'` (0 < qty ≤ min_qty, min_qty > 0), `'ok'`; `expiryState(item, todayVN, soonDays)` → `'expired'` (hạn < hôm nay), `'soon'` (hôm nay ≤ hạn ≤ hôm nay + soonDays), `'none'`; `validateStockInput`, `validateReceive`, `validateIssue`, `mergeExpiry(old, incoming, today)` — nhập kèm hạn mới thì giữ **hạn sớm hơn** nếu hạn cũ chưa qua, nếu hạn cũ đã qua hoặc chưa có thì lấy hạn mới (không có lô, nên đây là cách giữ "hạn gần nhất" hợp lý nhất). `soonDays` lấy từ cài đặt hệ thống (mặc định 30).

**Hàm `staff.stock`:**

| Hàm | Quyền | Việc |
|---|---|---|
| `summary()` | `stock.view` | `{ total, low, out, expiringSoon, expired }` (chỉ món đang dùng) |
| `list({ q?, kind?, status?, includeInactive? })` | `stock.view` | `status`: `'all' \| 'low' \| 'out' \| 'expiring'` (`expiring` = sắp hết hạn **hoặc** đã hết hạn); `q` tìm theo tên và mã, không dấu (`fold`); mặc định không hiện món đã ngừng; sắp xếp: hết hàng, sắp hết, sắp hết hạn, rồi theo tên |
| `get(id)` | `stock.view` | món + tối đa 100 dòng lịch sử, mới nhất trước |
| `create(input)` | `stock.manage` | tên, loại, đơn vị, tồn ban đầu, ngưỡng, hạn; tồn ban đầu > 0 ghi một dòng `in` lý do `nhap_hang`, ghi chú "Tồn ban đầu" |
| `update(id, version, input)` | `stock.manage` | tên, đơn vị, ngưỡng, hạn, `active`; **không sửa `qty`** (qua nhập/xuất/kiểm kê) |
| `receive(id, version, { qty, supplier?, note?, expires_on? })` | `stock.manage` | `qty` > 0 |
| `issue(id, version, { qty, reason, note? })` | `stock.manage` | `reason` ∈ `dung_tai_phong`, `hu_hong`, `het_han`, `khac`; `qty` > 0 và ≤ tồn, quá thì "Kho chỉ còn N <đơn vị>." |
| `adjust(id, version, { counted_qty, note? })` | `stock.manage` | ghi phần chênh (`delta` có dấu), lý do `kiem_ke`; số đếm bằng tồn thì "Số đếm trùng số tồn, chưa có gì để điều chỉnh." |

Món đã ngừng dùng: không nhập/xuất/kiểm kê ("Món đã ngừng dùng. Bật lại trước khi nhập hoặc xuất."), bật lại bằng `update`. Mọi hàm ghi trong `db.transact`, kiểm tra `version`; hai lần xuất cùng lúc thì lần sau bị từ chối khi hết hàng (kiểm tra trên tồn đã lưu). Mỗi thao tác ghi nhật ký (`stock.create/update/receive/issue/adjust`).

**Khách không thấy kho:** không thêm hàm nào ở `customer.*`; test `leak` mở rộng quét mọi kết quả của API khách tìm tên món kho. Tên thuốc trong kho **không** liên quan "Thuốc và vật tư điều trị" trên hóa đơn của khách (R7 giữ nguyên).

### 3.2 Báo cáo vận hành

`staff.reports.operations({ from, to })` (quyền `reports.operations`) → `OperationsReport`. **Khoảng ngày** `YYYY-MM-DD` theo giờ Việt Nam (`dayOf`): hợp lệ, `from ≤ to`, tối đa 366 ngày (lỗi `ValidationError` ở `from`/`to`). **Kỳ trước** = khoảng liền trước, dài bằng nhau (`previous: { from, to }`).

| Nhóm | Trường | Định nghĩa |
|---|---|---|
| Lịch hẹn | `scheduled`, `cancelled`, `total`, `cancelRate` | lịch có `start_at` rơi trong khoảng; `scheduled` = "Đã hẹn"; `total = scheduled + cancelled`; `cancelRate = cancelled / total` hoặc `null` nếu `total = 0` |
| | `daily`, `byService`, `bySource`, `byAssignee` | đếm **lịch "Đã hẹn"**, nên **mỗi nhóm cộng đúng bằng `scheduled`**; `byAssignee` gồm dòng `{ id: null, name: 'Chưa phân công' }` |
| | `previousScheduled` | `scheduled` của kỳ trước |
| Yêu cầu | `received`, `byStatus`, `confirmRate`, `avgFirstResponseMin`, `waitingNow`, `previousReceived` | `received` = yêu cầu có `created_at` trong khoảng; `byStatus` theo trạng thái hiện tại, **cộng đúng bằng `received`**; `confirmRate = confirmed / received` hoặc `null`; `avgFirstResponseMin` = trung bình số phút từ lúc gửi đến sự kiện đầu tiên của nhân viên (làm tròn phút, `null` nếu chưa có yêu cầu nào được xử lý); `waitingNow` = số yêu cầu "cần xử lý" tại lúc xem (cùng định nghĩa tab `can_xu_ly`, **không phụ thuộc khoảng**) |
| Nội trú | `admitted`, `discharged`, `currentlyAdmitted`, `bedDays`, `occupancyRate`, `previousAdmitted` | `admitted`/`discharged` theo ngày `admitted_at`/`discharged_at` trong khoảng; `currentlyAdmitted` tại lúc xem; `bedDays` = tổng thời gian giao nhau giữa `[admitted_at, discharged_at ?? bây giờ]` và khoảng (cắt ở bây giờ), tính bằng ngày, làm tròn 0,1; `occupancyRate = bedDays / (số chuồng đang hoạt động × số ngày đã trôi qua của khoảng)` hoặc `null` nếu mẫu số 0 (khoảng hoàn toàn ở tương lai) |
| Khách | `newCustomers`, `previousNewCustomers` | `Customer.created_at` trong khoảng |
| Kho | `stock: { low, out, expiringSoon, expired }` | tại lúc xem, không phụ thuộc khoảng; thiếu quyền `stock.view` vẫn trả (báo cáo đã chặn bằng `reports.operations`) |
| Doanh thu | `revenue: { collected, invoiced, outstanding, previousCollected }` | dùng **chính hàm tính** của `reports.revenue` (tách thành hàm thuần dùng chung, không viết lại), `outstanding` là số tại lúc xem |

Tỉ lệ có mẫu số 0 trả `null` (giao diện hiện "—", không hiện 0%). Mọi con số là kết quả tính từ dữ liệu, **không có số nhập tay**. Hàm thuần `rules/operations-report.ts` nhận mảng dòng và mốc "bây giờ", không đọc kho dữ liệu, để test bằng số tự tính tay. Dữ liệu mẫu hiện chỉ có lịch hẹn và yêu cầu khoảng một tuần trước đến một tuần sau (doanh thu từ tháng 8), nên khoảng 30 ngày sẽ thưa phần lịch/yêu cầu; **không thêm dữ liệu cũ** vì đổi số lượng đang được test và e2e dựa vào (§7 câu 3).

### 3.3 Cài đặt

#### A. Tài khoản nhân viên, hồ sơ cá nhân, thông tin bệnh viện

`StaffUser` thêm `version?` (mặc định 1, tăng mỗi lần sửa). **`staff.team`** (quyền `staff.manage`):

| Hàm | Việc |
|---|---|
| `list()` | mọi nhân viên kể cả đã tắt: `id`, `username`, `name`, `title`, `presets`, `extraCaps`, `active`, `isSelf`, `version`; người đã tắt xếp cuối |
| `create(input)` | `username`, `display_name`, `title`, `preset_ids` (≥ 1), `extra_capabilities`, `password`; tên đăng nhập kiểm tra bằng `validateUsername` và **không trùng** nhân viên hay tài khoản khách (kiểm tra lại **trong** `transact` sau khi băm mật khẩu, như `auth.signup`); mật khẩu bằng `validatePassword`; tên bằng `validateName` |
| `update(id, version, input)` | `display_name`, `title` (1–40 ký tự), `preset_ids`, `extra_capabilities` (quyền đã nằm trong vai thì bỏ khỏi quyền lẻ) |
| `setActive(id, version, active)` | tắt/bật |
| `resetPassword(id, version, { password })` | đặt mật khẩu mới cho **người khác**; với chính mình: "Bạn đổi mật khẩu của mình ở Hồ sơ cá nhân." |

**Hai luật chặn:** không tắt chính mình; **luôn còn ít nhất một Quản lý đang dùng** (không tắt, không bỏ vai `quan_ly` của người Quản lý cuối cùng). Đổi vai/quyền/tắt có hiệu lực ngay (`currentActor` đọc lại mỗi lần gọi; người bị tắt đang đăng nhập thành khách ở lần gọi kế tiếp). Nhân viên mới vẫn là "tài khoản mẫu" của demo (`is_sample: true`); **không có xóa hẳn nhân viên** (lịch sử còn ghi tên họ). "Khôi phục dữ liệu mẫu" làm nhân viên tạo thêm biến mất; ô "Dùng thử nhanh" ở trang đăng nhập vẫn là 4 tài khoản mẫu.

**`staff.profile`** (mọi nhân viên, chủ thể luôn lấy từ phiên, không nhận id): `get()` → `{ username, name, title, presets, caps }`; `updateName(name)`; `changePassword({ current, next, next2 })` — sai mật khẩu hiện tại báo ở `current`, mật khẩu mới trùng cũ báo ở `next`, hai ô không khớp báo ở `next2`; thành công giữ nguyên phiên. Chức danh chỉ Quản lý sửa (qua `team.update`).

**Thông tin bệnh viện chỉ xem:** `staff.settings.hospital()` → hằng `HOSPITAL_INFO` ở `rules/hospital.ts`: tên "Bệnh viện Thú y Lê Sơn", địa chỉ "101 Khuất Duy Tiến, Nhân Chính, Thanh Xuân, Hà Nội", hotline "097 355 51 05" (`tel:+84973555105`), Cấp cứu "24/24", Bác sĩ trưởng "Lê Thái Sơn" — **nguyên văn `CLAUDE.md`**, test so khớp chuỗi viết tay. **Không có giờ làm việc thường** (chưa xác nhận, không khẳng định). Không có hàm sửa.

#### B. Tùy chọn cá nhân

**`staff.prefs`** (mọi nhân viên, theo chủ thể phiên): `get()` trả giá trị đã gộp với mặc định; `save(partial)` kiểm tra từng trường, **giá trị lạ hay khóa lạ → `ValidationError`** ở đúng trường; `reset()` về mặc định.

| Trường | Giá trị | Mặc định |
|---|---|---|
| `text_size` | `md` · `lg` | `md` |
| `density` | `comfortable` · `compact` | `comfortable` |
| `motion` | `system` · `reduced` | `system` |
| `landing` | `home` · `appointments` · `inpatient` · `invoices` — chỉ trang mà người đó có quyền xem | `home` |
| `appointments_view` | `week` · `day` | `week` |
| `page_size` | 10 · 20 · 50 | 20 |
| `report_range` | `7d` · `30d` · `month` | `7d` |
| `nudges` | `requests`, `reschedules`, `stock`, `drafts` (bật/tắt từng loại; `stock` cần `stock.view`) | tất cả bật nếu có quyền tương ứng |
| `onboarding_done` / `onboarding_hidden` | khóa việc đã làm / ẩn danh sách | rỗng / `false` |

Lớp dữ liệu chỉ lưu và kiểm tra; **áp dụng lên giao diện do bên giao diện làm** (§9).

#### C. Cài đặt hệ thống (quyền `settings.manage`; đọc: mọi nhân viên)

**`staff.settings`**: `get()` (mọi nhân viên) → `{ version, values, fixedRules }`; `update(version, patch)` (quyền `settings.manage`) — kiểm tra phiên bản, từng trường có luật riêng, mỗi trường đổi ghi một dòng nhật ký "Đổi <tên cài đặt> từ A sang B".

| Trường | Luật | Mặc định | **Do lớp dữ liệu dùng** |
|---|---|---|---|
| `stock_expiry_days` | 1–365 | 30 | Kho (`expiryState`), Báo cáo |
| `stock_default_min` | 0–1000 | 5 | gợi ý ngưỡng khi thêm món (giao diện điền sẵn) |
| `default_duration_kham`, `default_duration_spa` | 5–240, bội số của 5 | 30 · 60 | cung cấp cho giao diện thay `SERVICE_MINUTES` (kiểm tra khớp giá trị hiện tại khi lập kế hoạch) |
| `calendar_start`, `calendar_end` | `HH:MM`, cách nhau ≥ 4 giờ | `07:00` · `20:00` | cung cấp khoảng giờ mặc định của lưới lịch; lịch nằm ngoài khoảng vẫn phải hiện (giao diện) |
| `payment_methods` | tập con của `cash`, `transfer`, `qr`; ≥ 1 | cả 3 | `payments.record` **từ chối** phương thức đang tắt: "Phương thức này đang tắt." |
| `request_overdue_hours` | 1–168 | 24 | `requests.list` thêm `overdue` (cần xử lý và quá hạn) vào hàng yêu cầu |

`fixedRules` (chỉ xem, không sửa, quy định đã chốt): video tối đa 15 giây và 20 MB, tự xóa sau 60 ngày, thanh toán tại quầy. Chỉ đưa vào cài đặt thứ mà lớp dữ liệu thật sự dùng hoặc cung cấp cho giao diện; mặc định ở bảng trên là **mặc định của bản demo**, không phải số liệu của bệnh viện.

#### D. Hỗ trợ người dùng (chỉ nhân viên; không có hỗ trợ khách ở đợt này)

- **`staff.help`** (mọi nhân viên): `articles()` và `search(q)` trả bài hướng dẫn **chỉ những bài hợp với quyền của mình** (mỗi bài khai báo `needs: Cap[]`, cần **một trong** các quyền đó); `whyNot(feature)` → `{ allowed, missing: Cap[], missingLabels, hint }` trong đó `feature` lấy từ bảng `FEATURE_CAPS` (ví dụ "Sắp xếp lịch hẹn" → `appointments.manage`), `hint` = "Bạn chưa có quyền …, nhờ Quản lý cấp." ; `checklist()` → việc nên làm lần đầu theo quyền, kèm đã làm hay chưa (từ `prefs.onboarding_done`); `markDone(key)`. Bài hướng dẫn viết ở `rules/help-articles.ts`, **mỗi bài gắn nhãn "Nội dung mẫu"**, chỉ mô tả chức năng có thật của ứng dụng; chủ dự án đọc duyệt (§7 câu 4).
- **`staff.support`**: `submit({ kind, title, body, screen? })` (mọi nhân viên; `kind` ∈ `howto` Hỏi cách dùng · `bug` Báo lỗi · `idea` Góp ý; tiêu đề 1–80, nội dung 1–1000, `screen` ≤ 100 ký tự); `mine()` — **chỉ phiếu của chính mình**, kèm trạng thái và trả lời; `inbox({ status? })`, `setStatus(id, version, status)`, `reply(id, version, text)` (quyền `support.inbox`; trả lời 1–500 ký tự, đặt trạng thái `answered`). Trạng thái: `new` Mới · `seen` Đang xem · `answered` Đã trả lời. **`SupportTicket`:** `id`, `code` (`HT-0001`), `kind`, `title`, `body`, `screen?`, `status`, `created_at`, `created_by`, `created_by_name`, `reply_text?`, `replied_by_name?`, `replied_at?`, `version`.
- **Không làm:** chat trực tiếp; số hỗ trợ kỹ thuật (hotline 097 355 51 05 là của bệnh viện dành cho khách, không dùng làm số hỗ trợ nhân viên); hỗ trợ cho khách; gửi email.

## 4. Hợp đồng (chỉ thêm, ghi vào "Thay đổi hợp đồng" của `PROGRESS.md` theo từng giai đoạn)

- `enums.ts`: `STOCK_KINDS`, `STOCK_MOVE_KINDS`, `STOCK_REASONS` (+ nhãn tiếng Việt), `SUPPORT_KINDS`, `SUPPORT_STATUSES` (+ nhãn), `PAGE_SIZES`…
- `staff.ts`: `StaffStockApi`, `StaffTeamApi`, `StaffProfileApi`, `StaffPrefsApi`, `StaffSettingsApi`, `StaffHelpApi`, `StaffSupportApi`; `StaffReportsApi.operations`; kiểu `StockRow`, `StockDetail`, `OperationsReport`, `StaffAdminRow`, `StaffPrefs`, `AppSettings`, `HelpArticle`, `SupportTicketRow`…; `StaffRequestRow.overdue?` (thêm, tùy chọn).
- `api.ts`: nối các nhánh mới vào `staff`.
- `rules/capabilities.ts`: 6 quyền mới, **Bác sĩ và Spa không đổi**.
- Không đổi tên, không xóa gì cũ.

## 5. Dữ liệu mẫu

Toàn bộ **tính tương đối theo "bây giờ"** như các seed khác, gắn nhãn "Dữ liệu mẫu", tên chung chung, không bịa nhãn hiệu hay thành tích:

- **Kho:** khoảng 14 món (thuốc: dịch truyền Ringer lactat, nước muối sinh lý 0,9 %, thuốc tẩy giun (mẫu), sát khuẩn… ; vật tư: bơm kim tiêm, găng tay, gạc vô trùng, băng cuộn, ống thông…); vài món ở mức sắp hết, **một** món hết hàng, **một** món sắp hết hạn, **một** món đã hết hạn, **một** món đã ngừng dùng; khoảng 40 dòng lịch sử rải 30 ngày qua, `qty_after` nhất quán.
- **Cài đặt hệ thống:** một dòng với giá trị mặc định §3.3.C.
- **Tùy chọn cá nhân:** không có (mặc định ngầm).
- **Phiếu hỗ trợ:** 4 phiếu mẫu do nhân viên mẫu gửi (2 Mới, 1 Đang xem, 1 Đã trả lời).
- **Bài hướng dẫn:** nội dung cố định trong mã (khoảng 10 bài).
- Bảng khách, lịch hẹn, hóa đơn… **giữ nguyên**; `seed.test` kiểm số lượng cũ không đổi.

## 6. Kiểm thử (TDD: test thất bại trước)

- **Quy tắc thuần** (`rules/*.test.ts`): `stockLevel`, `expiryState` (đúng biên hôm nay, hôm nay + N, hôm qua), `mergeExpiry`, các `validate*`; `operations-report` với dữ liệu nhỏ tính tay: lịch 23:59 và 00:00 giờ VN, lịch đã hủy, nhóm "Chưa phân công", mẫu số 0 → `null`, ca nội trú vắt qua đầu/cuối khoảng và khoảng ở tương lai, kỳ trước cho khoảng 1 ngày / 1 tuần / qua tháng; kiểm các bất biến cộng khớp (mỗi nhóm lịch cộng bằng `scheduled`, `byStatus` cộng bằng `received`).
- **Kho:** từng hàm (hợp lệ, không hợp lệ, thiếu quyền, `ConflictError`, món đã ngừng dùng, hai lần xuất cùng lúc), bất biến tồn = dòng lịch sử mới nhất, tồn không âm; dữ liệu mẫu nhất quán.
- **Báo cáo:** quyền (Quản lý được; Bác sĩ, Spa, khách, khách vãng lai bị `ForbiddenError`); khoảng sai; số liệu trên dữ liệu mẫu đối chiếu với tính độc lập từ bảng gốc cho hai khoảng cố định; số doanh thu khớp `reports.revenue`.
- **Cài đặt A–D:** ma trận quyền 4 vai × mọi hàm mới; hai luật chặn (không tắt mình, luôn còn Quản lý); đổi vai có hiệu lực ngay với phiên đang mở; tên đăng nhập trùng nhân viên **và** trùng tài khoản khách; hai phiên tạo cùng tên đăng nhập; mật khẩu không xuất hiện ở nhật ký hay kết quả; đổi mật khẩu từng lỗi; tùy chọn lạ bị từ chối, `landing` ngoài quyền bị từ chối; phương thức thanh toán tắt bị chặn và luôn còn ≥ 1; `overdue` đúng theo giờ; phiếu hỗ trợ chỉ thấy của mình, Quản lý/`support.inbox` thấy tất cả; `help.articles` lọc đúng theo quyền; `whyNot`.
- **Di chuyển dữ liệu:** tài liệu "cũ" (không có bảng mới, không có bộ đếm mới, nhân viên không có `version`) mở lên có đủ Kho mẫu, `nextCode` ra `KHO-xxxx` / `HT-xxxx` hợp lệ.
- **Rò rỉ:** mở rộng `leak.test`: không dữ liệu kho, cài đặt, phiếu hỗ trợ nào xuất hiện trong kết quả của API khách.
- **Quyền hiện có:** `capabilities.test` cập nhật cho 6 quyền mới; xác nhận Bác sĩ/Spa không đổi.
- **e2e:** mỗi giai đoạn chạy cả bộ e2e hiện có (`npm run verify`); thêm `e2e/du-lieu-*.spec.ts` chỉ khi có màn hình tương ứng. Nếu test e2e cũ đếm số quyền của Quản lý (`Quyền của tôi`) thì sửa nhỏ và ghi lại.

## 7. Câu hỏi cần chủ dự án chốt (mỗi câu có lựa chọn mặc định của tôi)

1. **Khung giờ đặt lịch chỉnh được** (giai đoạn 7): đổi `TimeSlot` từ danh sách cố định thành dữ liệu chỉnh được là thay đổi hợp đồng lớn hơn các mục khác (form đặt lịch công khai và kiểm tra nhập đều phải đọc từ dữ liệu). *Mặc định: chưa làm; chờ giờ thật của bệnh viện rồi quyết.*
2. **Các số mặc định của bản demo** (hạn sắp hết 30 ngày, chờ lâu 24 giờ, lưới lịch 07:00–20:00, ngưỡng sắp hết 5): *mặc định: giữ như bảng §3.3.C; Quản lý chỉnh được.*
3. **Báo cáo 30 ngày thưa** vì dữ liệu mẫu chỉ có lịch/yêu cầu quanh tuần này. *Mặc định: không thêm dữ liệu cũ.* Nếu muốn đầy hơn: làm việc riêng, thêm lịch/yêu cầu quá khứ và sửa số đếm trong test chung với bên giao diện.
4. **Nội dung bài hướng dẫn** (D) do tôi soạn từ chức năng có thật; cần chủ dự án đọc duyệt chữ trước khi gộp giai đoạn 6.
5. **Bác sĩ có thấy Kho không?** *Mặc định: không; Quản lý cấp `stock.view` / `stock.manage` lẻ cho ai cần.*

## 8. Ngoài phạm vi

Khám bệnh và Dịch vụ (chờ danh sách); tự trừ tồn theo điều trị hoặc hóa đơn; lô hàng nhiều hạn dùng; nhà cung cấp thành bảng riêng; nhập/xuất CSV; doanh thu theo từng bác sĩ; tỉ lệ khách quay lại; dự báo; biểu đồ phân tích sâu; xóa hẳn nhân viên; email, xác thực hai lớp, "quên mật khẩu" thật, nhật ký đăng nhập; sửa thông tin bệnh viện; giờ làm việc thường; hỗ trợ cho khách; chat trực tiếp.

## 9. Phối hợp với nhánh giao diện

- Toàn bộ code mới nằm trong `src/data` và tài liệu (thư mục của nhánh dữ liệu); không sửa `src/features`, `src/app`, `src/ui`.
- Không phá cái đang chạy: hợp đồng chỉ thêm; quyền Bác sĩ/Spa không đổi; dữ liệu mẫu cũ không đổi. Một chỗ **có thể** chạm test của họ: danh sách "Quyền của tôi" của Quản lý dài thêm 6 mục (kiểm khi chạy e2e).
- **Việc bên giao diện làm sau** (ghi vào "Yêu cầu gửi nhánh kia" của `PROGRESS.md` khi từng giai đoạn xong, không chặn ai): menu Kho / Báo cáo / Cài đặt hiện theo quyền mới; áp dụng tùy chọn cá nhân (cỡ chữ, độ dày bảng, trang vào, số dòng…); dùng `settings.get()` cho thời lượng mặc định, giờ lưới lịch, phương thức thanh toán đang bật (hộp thu tiền chỉ liệt kê phương thức bật), dấu `overdue` ở yêu cầu; màn hình trợ giúp và hộp thư hỗ trợ.

## 10. Giai đoạn và đầu ra

Mỗi giai đoạn: kế hoạch ngắn → TDD → `npm run verify` xanh → gộp vào nhánh tích hợp → cập nhật `PROGRESS.md` (mục dữ liệu, "Thay đổi hợp đồng", "Yêu cầu gửi nhánh kia").

1. **Kho** — nền chung (quyền, bảng, mã, di chuyển dữ liệu) + `staff.stock` + dữ liệu mẫu + test.
2. **Báo cáo vận hành** — hàm thuần + `operations` + tách hàm doanh thu dùng chung + test.
3. **Cài đặt A** — `team`, `profile`, `hospital`.
4. **Cài đặt B** — `prefs`.
5. **Cài đặt C** — `settings` + nối vào kho, thanh toán, `overdue`.
6. **Hỗ trợ D** — `help`, `support`, bài hướng dẫn, phiếu mẫu.
7. *(tùy chọn)* khung giờ đặt lịch chỉnh được.

Sau khi chủ dự án duyệt: ghi **R38** vào `docs/thiet-ke/QUYET-DINH.md` (phạm vi Kho độc lập; Báo cáo từ dữ liệu có sẵn; Cài đặt A–D; hỗ trợ chỉ cho nhân viên; quyền mới chỉ Quản lý), rồi lập kế hoạch theo giai đoạn (`writing-plans`).
