# Proposal — STAFF zone ("Khu nhân viên"): hospital operations

**Lens:** hospital operations for manager + staff. Covers the three selected modules (a) Appointments & customers, (b) Inpatient & video, (c) Invoices & payments, plus the staff overview dashboard, the manager-only revenue report and the service price list.
**Status:** design proposal for the lead. English text; every user-facing string is given in Vietnamese.
**Demo "today":** Monday 19/10/2026. All seed dates are offsets from the real current date (`d0`), so the demo stays fresh.

Principles applied throughout:
1. **The staff zone is a working tool.** It uses the brand (cream, plum, Lora headings, approved line icons on pastel badges) but stays calm: no looping decoration. Motion is short and purposeful (panels slide in, status pills crossfade, toasts), and all of it respects `prefers-reduced-motion`.
2. **Internal and customer-facing data are separate entities, not hidden fields.** Anything a customer will see goes through an explicit "share" step by a person who holds that capability.
3. **Capabilities, not job titles.** Each screen and action checks a capability. "Quản lý / Bác sĩ / Nhân viên Spa" are only preset bundles.
4. **Every state change is logged** (who and when) in an append-only history, shown on the record itself.
5. **YAGNI.** There is no HR, shift, task, stock or e-invoice module, and no staff-account admin screen (see §13).

---

## 1. Capability model

### 1.1 Capabilities (17)

| Key (code) | Vietnamese label (shown in "Quyền của tôi") | Grants |
|---|---|---|
| `requests.handle` | Tiếp nhận yêu cầu đặt lịch | See the request queue, start contact, log calls, confirm, mark unreachable, cancel, reject |
| `appointments.view` | Xem lịch hẹn | Day and week calendar, read-only |
| `appointments.manage` | Sắp xếp lịch hẹn | Create, reschedule, assign, check in, mark no-show, cancel appointments |
| `customers.view` | Xem hồ sơ khách hàng | Customer and pet records, incl. pet alerts ("Có thể cắn…") |
| `customers.edit` | Cập nhật hồ sơ khách hàng | Create/edit customers and pets |
| `accounts.link` | Liên kết tài khoản web | Link and unlink a web account to a hospital customer record (sensitive) |
| `inpatient.view` | Xem nội trú | Cage board, stay header, customer diary, videos (no internal medical record) |
| `inpatient.admit` | Nhập viện, xuất viện | Admit, transfer cage, discharge, change internal status |
| `inpatient.clinical` | Hồ sơ điều trị nội bộ | View and write orders (y lệnh), drug administrations, care notes |
| `inpatient.diary_write` | Viết nhật ký, tải video | Write diary drafts, upload videos as drafts |
| `inpatient.share` | Chia sẻ với chủ nuôi | Publish/withdraw diary entries and videos, delete videos |
| `invoices.create` | Lập hóa đơn | Create/edit drafts, issue invoices, discard drafts |
| `payments.record` | Thu tiền | Record payments, show bank QR, print |
| `invoices.void` | Hủy hóa đơn, hủy phiếu thu | Void an invoice; reverse a payment (reason required) |
| `pricelist.edit` | Sửa bảng giá | Add, edit, deactivate price items |
| `reports.revenue` | Xem doanh thu | Revenue report, CSV export, "Thu hôm nay" tile |
| — (implicit for every staff user) | — | Dashboard, read-only price list, own profile, global search limited by the above |

### 1.2 Preset bundles

| Capability | Quản lý | Bác sĩ | Nhân viên Spa |
|---|:-:|:-:|:-:|
| requests.handle | ✓ | – | – |
| appointments.view | ✓ | ✓ | ✓ |
| appointments.manage | ✓ | ✓ | – |
| customers.view | ✓ | ✓ | ✓ |
| customers.edit | ✓ | ✓ | – |
| accounts.link | ✓ | – | – |
| inpatient.view | ✓ | ✓ | ✓ |
| inpatient.admit | ✓ | ✓ | ✓ |
| inpatient.clinical | ✓ | ✓ | – |
| inpatient.diary_write | ✓ | ✓ | ✓ |
| inpatient.share | ✓ | ✓ | ✓ |
| invoices.create | ✓ | ✓ | – |
| payments.record | ✓ | – | – |
| invoices.void | ✓ | – | – |
| pricelist.edit | ✓ | – | – |
| reports.revenue | ✓ | – | – |

Rationale:
- **Doctors issue invoices but do not take money.** They know what was done and used. The manager runs the counter, as there is no receptionist.
- **Spa staff admit, move, discharge and share with owners** (QUYET-DINH R33, owner 20/10/2026). They bathe and handle inpatients, so they are often the ones holding the phone. The internal record (medicines, orders, care log) stays with doctors and the manager (`inpatient.clinical`). *Earlier rule, replaced: Spa could draft but not publish.*
- **Spa staff need `customers.view`** for pet safety alerts before grooming.

### 1.3 Demo staff accounts (all marked "Mẫu")

| Username | Name shown | Bundles | Why it exists in the demo |
|---|---|---|---|
| `quanly.ha` | Nguyễn Thu Hà | Quản lý | Sees everything: intake, counter, revenue, linking |
| `bacsi.duc` | BS. Trần Minh Đức | Bác sĩ **+ Tiếp nhận yêu cầu (dự phòng)** | Shows that one person can hold several capabilities (intake backup when the manager is away) |
| `bacsi.mai` | BS. Phạm Thanh Mai | Bác sĩ | Pure doctor: no queue, no revenue, no counter |
| `spa.ngocanh` | Lê Ngọc Anh | Nhân viên Spa | Smallest view: calendar, inpatient (no internal tab), drafts only |

The login portal (other lens) offers these as quick-fill chips. Each chip shows the name, the bundle and the tag "Tài khoản mẫu". In the staff zone, the profile menu shows "Quyền của tôi" with the capability labels above. This makes the capability model visible without building a staff-admin screen.

### 1.4 Manager-only actions (decided)

| Action | Manager-only? | Reason |
|---|---|---|
| Revenue report (Doanh thu) | **Yes** | Business-confidential figures |
| Edit price list | **Yes** | One source of truth for every invoice. Everyone else can read it |
| Void invoice / reverse a payment | **Yes**, reason required | Money control. There is no second checker, so a mandatory reason and the log are the safeguard |
| Record payment (Thu tiền) | **Yes by preset** (capability can be reassigned later) | Cash handling happens at the counter, which the manager runs |
| Link / unlink web account ↔ customer record | **Yes** | Linking gives a person access to medical diary, videos and invoices. This is a verification judgment, never automatic |
| Confirm requests | No (anyone with `requests.handle`) | Bác sĩ Đức is the backup |
| Share diary/video with owner | No (doctors too) | The doctor in charge knows what is appropriate |
| Issue invoice | No (doctors too) | — |

### 1.5 Enforcement and "no permission" behaviour
- **Nav items without the capability are hidden**, not disabled, to reduce clutter. Actions inside a page are also hidden. The single exception is the Internal tab in a stay, which spa staff do not see at all.
- **A direct URL to a forbidden route** shows a friendly page: "Mục này dành cho người có quyền phù hợp. Nếu bạn cần dùng, hãy nhờ quản lý cấp quyền." with the button "Về Tổng quan".
- **The mock data layer checks capabilities too.** It throws `ForbiddenError`, so permission is not a UI-only concern and maps 1:1 to server checks and RLS later.

---

## 2. Staff zone shell

**Routes** use hash routing, so they work on a static artifact:
`#/nv` (Tổng quan) · `#/nv/yeu-cau` · `#/nv/yeu-cau/:id` · `#/nv/lich-hen` (`?view=ngay|tuan&date=`) · `#/nv/khach-hang` · `#/nv/khach-hang/:id` · `#/nv/tai-khoan-web` · `#/nv/noi-tru` · `#/nv/noi-tru/:stayId` · `#/nv/hoa-don` · `#/nv/hoa-don/moi` · `#/nv/hoa-don/:id` · `#/nv/bang-gia` · `#/nv/doanh-thu`.

**Desktop (≥1024 px):**
- **Left sidebar (248 px).** It holds:
  - The logo (official raster, small) with the label "Khu nhân viên".
  - Nav items, each with a line icon:
    - Tổng quan
    - Yêu cầu đặt lịch, with a count badge. The badge turns orange when a flag is present.
    - Lịch hẹn
    - Khách hàng
    - Nội trú (the approved house-with-paw icon)
    - Hóa đơn
    - Bảng giá
    - Doanh thu
  - At the bottom: the user chip "Nguyễn Thu Hà · Quản lý" with the tag "Mẫu".
- **Top bar.** It holds:
  - The page title in Lora.
  - Global search: "Tìm khách, thú cưng, số điện thoại, mã YC/HĐ…".
  - A "＋ Tạo nhanh" menu, filtered by capability: "Tạo lịch hẹn", "Thêm khách hàng", "Nhập viện", "Tạo hóa đơn".

**Tablet (768–1023 px):** the sidebar collapses to an icon rail with tooltips.

**Mobile (<768 px):** a bottom tab bar with Tổng quan · Yêu cầu · Lịch hẹn · Nội trú · Thêm. "Thêm" opens a sheet with the other items, and tabs adapt to capabilities. Master-detail screens become a list, then a full-screen detail with a back button. Phone numbers are `tel:` links (staff call from their phones).

**Profile menu:** "Quyền của tôi" · "Khôi phục dữ liệu mẫu" · "Đăng xuất".
- "Khôi phục dữ liệu mẫu" opens a confirm: "Mọi thay đổi trong bản demo trên trình duyệt này sẽ được xóa và dữ liệu mẫu được tạo lại theo ngày hôm nay." Buttons: "Khôi phục" / "Để sau".

**Shared components used by every module:**
- **Status pill.** Every pill has an icon and text, never colour alone.
- **History timeline ("Lịch sử").** Append-only: actor, relative time plus exact timestamp on hover, and a sentence in Vietnamese.
- **Toasts.** Bottom-right on desktop, top on mobile. Check-in and no-show toasts include "Hoàn tác" for 5 seconds.
- **Dialogs.** They trap focus, close on Esc and return focus to the trigger.
- **Conflict handling.** On a version mismatch the toast reads "Mục này vừa được người khác cập nhật. Đã tải thông tin mới nhất — vui lòng kiểm tra lại."
- **Save failure.** "Chưa lưu được. Vui lòng thử lại." The UI never shows success when a save failed.

**Service colour chips** reuse the approved service badge colours everywhere: calendar, price list, invoice lines.
- Khám và điều trị = peach with the stethoscope icon
- Spa & Grooming = mint with scissors
- Nội trú = lilac with house-paw
- Cấp cứu = rose with heart-pulse

---

## 3. Tổng quan (staff overview dashboard)

**Header:** "Chào buổi sáng, Hà" (or "Chào buổi chiều" / "Chào buổi tối"), with the subline "Thứ Hai, 19/10/2026 · Hôm nay có 7 lịch hẹn và 5 bé đang nội trú."

**Tile row.** Each tile appears only if the user has the capability, and clicking it deep-links to the filtered list.
- "Yêu cầu cần xử lý" shows **11** and the subline "1 khách vừa gửi lại — cần gọi lại" in orange (`requests.handle`).
- "Lịch hẹn hôm nay" shows **7** and "2 khách đã đến".
- "Đang nội trú" shows **5 bé** and "1 bé tình trạng nặng · 2 cần theo dõi".
- "Chưa thu tiền" shows **3 hóa đơn** and "Còn 970.000 ₫" (`payments.record`).
- "Thu hôm nay" shows **180.000 ₫** with the link "Xem doanh thu" (`reports.revenue`).

**Two-column body (stacks on mobile):**
- **Left column:**
  - "Cần gọi lại" (`requests.handle`): flagged requests first, then the other "Không liên lạc được" requests. Each row shows the name, the pet, "Đã gọi 2 lần", a tap-to-call link and "Mở".
  - "Lịch hôm nay": an agenda list for the next 5 appointments with a "Khách đã đến" button (`appointments.manage`).
- **Right column:**
  - "Nội trú — việc sắp đến giờ" (`inpatient.clinical`): for example "14:00 · Kem · Truyền dịch". Overdue items read "Quá giờ".
  - "Chưa gửi nhật ký hôm nay" (`inpatient.share`): one chip per pet, for example "Kem".
  - "Video sắp tự xóa" (≤ 7 days).
  - "Hoạt động gần đây" (manager): the last 8 audit events. Sensitive events (link, void, payment reversal, price edit, video delete) carry a small shield icon.

**Per account:**
- **Spa (Ngọc Anh):** "Lịch hôm nay" filtered to her plus unassigned spa appointments, "Nội trú" (read-only), and "Nhật ký nháp của tôi".
- **Bác sĩ Mai:** "Lịch của tôi hôm nay", "Nội trú — việc sắp đến giờ", "Chưa gửi nhật ký hôm nay", "Hóa đơn nháp của tôi".
- **Bác sĩ Đức:** the same as Mai, plus the request tiles.

---

## 4. Module A — Appointments & customers

### 4.1 Yêu cầu đặt lịch (request intake queue)

**Desktop layout:** master-detail. The left list is 420 px and the right panel is the detail.

**Top of list:**
- Tabs:
  - **"Cần xử lý"** (default). This is a view, not a status: Chờ xác nhận + Đang liên hệ + Không liên lạc được.
  - Then one tab per locked status, each with a count: "Chờ xác nhận" · "Đang liên hệ" · "Không liên lạc được" · "Đã xác nhận" · "Đã hủy" · "Từ chối" · "Tất cả".
- Filters:
  - Search: "Tên, số điện thoại, tên thú cưng, mã YC".
  - Dịch vụ: Khám và điều trị / Spa & Grooming / Nội trú.
  - Nguồn: "Khách vãng lai" / "Có tài khoản".
  - Ngày mong muốn: Hôm nay / 7 ngày tới / tùy chọn.
  - Người liên hệ.
- **Sort in "Cần xử lý":**
  1. Flagged ("Khách vừa gửi lại") first.
  2. Then Chờ xác nhận, oldest first.
  3. Then Đang liên hệ.
  4. Then Không liên lạc được.

**Request card:**
- **Row 1:** the status pill, then the code `YC-0242`, then right-aligned "12 phút trước".
- **Row 2:** the customer name (bold, from the snapshot) and the phone number.
- **Row 3:** a pet chip ("Tôm · Chó Pug"), the service chip (service colour), and "Mong muốn: T3 20/10".
- **Row 4:** the source chip ("Khách vãng lai" or "Tài khoản: lan.nguyen"), the call count ("Đã gọi 2 lần", derived from the call log), and the handler avatar ("Hà đang liên hệ").
- **Flag banner across the top of the card** (orange #C2560C text on #FDEBDD, with a ↻ icon): **"Khách vừa gửi lại — cần gọi lại · lúc 08:15 hôm nay"**.

**Detail panel (top to bottom):**
1. **Header:** the code and status pill, and on the right the contextual primary action plus a "⋯" overflow. The flag banner is repeated here if set.
2. **"Thông tin khách đã gửi"** (read-only snapshot card).
   - Caption: "Giữ nguyên như lúc gửi, không chỉnh sửa. Gửi lúc 08:42, 19/10/2026."
   - Fields: Họ tên · Số điện thoại (tap-to-call) · Thú cưng (tên, loài, giống) · Dịch vụ · Ngày mong muốn · Ghi chú của khách.
   - For account-scoped requests: "Tài khoản web: lan.nguyen · Đã liên kết với hồ sơ KH-0001" or "Chưa liên kết".
3. **"Cuộc gọi"** (call log).
   - The list of attempts: outcome chip, note, who and when.
   - An inline composer "Ghi cuộc gọi":
     - Outcome chips: **"Đã trao đổi" · "Không nghe máy" · "Máy bận / thuê bao" · "Khách hẹn gọi lại"**.
     - Note field, placeholder "Ví dụ: Khách muốn đổi sang buổi chiều, gọi lại sau 11 giờ."
     - Button "Lưu cuộc gọi".
   - When the outcome is "Không nghe máy" or "Máy bận / thuê bao" and the status is Đang liên hệ, a checkbox appears under the composer: "Chuyển sang Không liên lạc được" (unchecked by default).
4. **Linked appointment card** (when the status is Đã xác nhận): "Lịch hẹn: 09:00, Thứ Ba 20/10 · BS. Phạm Thanh Mai" with the button "Xem trên lịch".
5. **"Lịch sử"** timeline: status changes, calls, flag set/cleared and handler changes.

**Primary actions by status:**

| Status | Primary button | Secondary / overflow |
|---|---|---|
| Chờ xác nhận | **Bắt đầu liên hệ** (also sets the handler to me and focuses the call composer) | Hủy yêu cầu… · Từ chối… |
| Đang liên hệ | **Xác nhận lịch hẹn…** | Không liên lạc được · Ghi cuộc gọi · Hủy yêu cầu… · Từ chối… |
| Không liên lạc được | **Liên hệ lại** (→ Đang liên hệ, clears flag) | Hủy yêu cầu… · Từ chối… |
| Đã xác nhận | **Xem lịch hẹn** | Hủy yêu cầu… (also cancels the appointment) |
| Đã hủy / Từ chối | — (banner "Yêu cầu đã đóng") | — |

**Allowed transitions (adopting the earlier proposal table; no reopening):**

| From | To |
|---|---|
| Chờ xác nhận | Đang liên hệ, Đã hủy, Từ chối |
| Đang liên hệ | Đã xác nhận, Không liên lạc được, Đã hủy, Từ chối |
| Không liên lạc được | Đang liên hệ, Đã hủy, Từ chối |
| Đã xác nhận | Đã hủy |
| Đã hủy, Từ chối | — terminal |

Decided rules:
- **No reopen of Đã hủy or Từ chối.** These release the dedupe lock, so the customer can simply re-submit and that creates a new request. This keeps history clean and avoids lock conflicts.
- **"Đã xác nhận" is never rolled back to an earlier status.** A changed time is a reschedule of the appointment (§4.2). The request stays Đã xác nhận.
- **The dedupe lock is held by** Chờ xác nhận, Đang liên hệ, Không liên lạc được and Đã xác nhận. It is released by Đã hủy and Từ chối.
- **Flag rules** (locked behaviour):
  - The flag exists only in Không liên lạc được.
  - It is set by an identical re-submit in the same scope, and is set once per cycle. The timestamp is the first re-submit of the cycle, and later identical clicks do not change it.
  - **Any transition out of Không liên lạc được clears it** in the same operation. There is no separate "clear flag" button.
  - The re-submit stays in history.
  - Setting the flag bumps `version`, so a stale detail panel gets the conflict toast.
- **Optimistic concurrency:** every transition sends `expectedVersion`.
- **No shortcut that links a web account from a request.** Linking happens only through §4.4.

**Dialogs:**

*Xác nhận lịch hẹn* (from Đang liên hệ):
- Intro: "Chọn ngày giờ đã thống nhất với khách. Ngày khách mong muốn vẫn được giữ nguyên trong yêu cầu."
- Fields:
  - "Ngày hẹn" and "Giờ hẹn". Both are required: "Vui lòng chọn đủ ngày và giờ hẹn."
  - "Dịch vụ", prefilled from the snapshot.
  - "Thời lượng dự kiến": default 30 phút for Khám, 60 phút for Spa, 30 phút for Nội trú intake.
  - "Người phụ trách" (optional). It shows a soft warning on overlap: "BS. Phạm Thanh Mai đã có lịch 09:00–09:30." This warns but does not block.
  - **"Hồ sơ khách hàng"**:
    - A radio: "Chọn hồ sơ có sẵn" (search) / **"Tạo hồ sơ mới từ thông tin yêu cầu"** (default when nothing matches).
    - If a staff-side search finds a record with the same phone, show the hint "Có 1 hồ sơ dùng số này: Nguyễn Thị Lan (KH-0001)". The staff member decides; nothing is auto-attached.
  - "Thú cưng": pick from the record's pets or "Thêm thú cưng mới từ yêu cầu".
  - "Ghi chú nội bộ".
- Account-scoped requests show the note "Tài khoản web này chưa liên kết với hồ sơ. Việc liên kết chỉ thực hiện tại quầy sau khi xác minh."
- Primary button: **"Xác nhận và đưa vào lịch"**.
- On success, atomically: request → Đã xác nhận; appointment created (Đã hẹn); confirmed date-time plus confirmer and confirmation time recorded (the three timestamps stay separate).
- Toast: "Đã xác nhận lịch hẹn lúc 09:00, Thứ Ba 20/10."

*Hủy yêu cầu*:
- Intro: "Dùng khi khách báo không đến hoặc muốn hủy."
- Reasons: "Khách báo không đến" · "Khách đã có kế hoạch khác" · "Khách đã đặt lại qua điện thoại" · "Lý do khác" (requires text).
- Buttons: "Hủy yêu cầu" (danger) / "Quay lại".

*Từ chối yêu cầu*:
- Intro: "Dùng khi bệnh viện chưa thể tiếp nhận. Lý do chỉ nhân viên thấy."
- Reasons: "Chưa thể sắp xếp lịch phù hợp" · "Dịch vụ chưa phù hợp với nhu cầu" · **"Trùng với yêu cầu khác"** (adds a field "Mã yêu cầu trùng", e.g. YC-0228) · "Thông tin không hợp lệ" · "Lý do khác".
- Guidance: for a guest-scope request that duplicates an account-scope request, reject the guest one and keep the account one, because the customer can see only the account one.

**Reasons are internal.** The customer sees only the status, in gentle wording (§7).

**Empty states:**
- "Cần xử lý" tab: "Hiện không có yêu cầu nào cần xử lý."
- Search: "Không tìm thấy yêu cầu phù hợp."

**Live demo hook.** If the owner submits the booking form as a customer in the same browser, a `storage` event pops the toast "Có yêu cầu đặt lịch mới" and updates the badge. An identical re-submit of an unreachable request makes the flag appear live.

### 4.2 Lịch hẹn (day / week calendar)

**Toolbar:** "Hôm nay" · ‹ › · a date label ("Thứ Hai, 19/10/2026" or "19 – 25/10/2026") · a segmented control "Ngày | Tuần" · the filter "Người phụ trách" · the button "＋ Tạo lịch hẹn" (`appointments.manage`).

**Day view:**
- One column per person with appointments that day (BS. Đức, BS. Mai, Ngọc Anh), plus a "Chưa phân công" column.
- 30-minute rows across a visible window of 07:00–21:00. The window scrolls, and it is not a statement of opening hours.
- A "now" line in plum.
- Appointment block: tinted with the service colour, with the time, pet name, service and customer surname, plus a small status icon (✓ đã đến, ✕ không đến).
- Cancelled appointments are hidden by default (toggle "Hiện lịch đã hủy").

**Week view:**
- 7 columns (T2 … CN) with compact chips "09:00 · Mochi · Spa".
- A day header shows its count ("7 lịch").
- Clicking a day header opens the day view.

**Mobile:** both views become an agenda list. Week view adds a swipeable 7-day strip with dot counts.

**Appointment drawer** (click a block):
- **Content:** the pet with species icon, the customer with a link, the phone number, service, time and duration, the assignee, and the source chip ("Từ yêu cầu web YC-0232" / "Đặt qua điện thoại" / "Tại quầy"). Pet alerts appear as orange chips. Below that, the internal note and history.
- **Actions by status:**
  - Đã hẹn: **"Khách đã đến"** (primary) · "Không đến" · "Dời lịch…" · "Hủy lịch…".
  - Đã đến: **"Tạo hóa đơn"** (`invoices.create`) · "Nhập viện" (`inpatient.admit`).
  - Không đến: "Khách đã đến" (only on the same day, for latecomers) · "Dời lịch…".

**Appointment statuses (separate entity; the six request statuses are untouched):** **Đã hẹn · Đã đến · Không đến · Đã hủy.** There is deliberately no "Đã khám" or "Hoàn thành", and no medical record. See Open question 1.

**Sync rules:**
- **Reschedule:** the dialog takes the new date and time plus a reason ("Khách xin đổi giờ", "Bệnh viện đổi lịch", "Khác"). The request stays Đã xác nhận and the customer sees the new time.
- **Cancel the appointment:** reason required. If it came from a request, the request becomes Đã hủy with the same reason, atomically.
- **Cancel the request:** the appointment is cancelled.
- **Không đến** does not change the request.

**"Tạo lịch hẹn"** (phone or walk-in booking, without a web request):
- Fields: customer (search or create), pet, service, date and time, duration, assignee, source ("Điện thoại" / "Tại quầy"), note.
- No request record is created. This matches reality: the hotline is a main booking channel.

**No drag-and-drop rescheduling** in the demo. On touch screens dragging causes accidental moves, and the dialog captures the reason for the log.

### 4.3 Khách hàng & thú cưng (customer and pet records)

**List** `#/nv/khach-hang`:
- **Table columns:** Mã (KH-0001) · Họ tên · Số điện thoại · Thú cưng (chips) · Tài khoản web ("Đã liên kết" teal chip / "—") · Lịch hẹn gần nhất · Còn nợ (amount in orange if > 0).
- **Filters:** search ("Tên, số điện thoại, tên thú cưng") · "Đang có bé nội trú" · "Còn nợ" · "Đã liên kết tài khoản web".
- **Primary action:** "Thêm khách hàng".
- **Mobile:** cards.

**Customer detail:**
- **Header:** name, code and phone number with tap-to-call; buttons "Sửa", "Tạo lịch hẹn", "Tạo hóa đơn".
- **Tabs:**
  - **Thú cưng:** pet cards.
  - **Lịch hẹn**
  - **Yêu cầu:** requests attached via confirmation, plus those from the linked account.
  - **Hóa đơn:** with the outstanding total.
  - **Tài khoản web:** link status, linked-by and when; "Liên kết tài khoản…" / "Gỡ liên kết…" (manager).
  - **Lịch sử**

**Thêm khách hàng:**
- Fields: "Họ tên"* · "Số điện thoại"* · "Số điện thoại khác" · "Địa chỉ" (tùy chọn) · "Ghi chú nội bộ".
- A duplicate phone gives a soft warning, not a block (families share numbers): "Đã có hồ sơ dùng số này: Nguyễn Thị Lan (KH-0001). Mở hồ sơ đó?"

**Pet card and dialog:**
- Fields: "Tên"* · "Loài"* (Chó / Mèo / Khác) · "Giống" · "Giới tính" (Đực / Cái / Chưa rõ) · "Triệt sản" (Đã triệt sản / Chưa / Chưa rõ) · "Năm sinh hoặc tuổi ước tính" · "Màu lông" · "Cân nặng (kg)", stored with its date.
- **"Lưu ý quan trọng"** chips, all internal: "Dễ hoảng sợ" · "Có thể cắn — cần rọ mõm" · "Dị ứng thuốc (ghi rõ)" · "Bệnh mãn tính (ghi rõ)" · free text.
- "Ghi chú nội bộ".
- The pet page shows tabs: Lịch hẹn · Nội trú · Hóa đơn · Video.
- No medical record or vaccination book (out of scope).

### 4.4 Liên kết tài khoản web (linking a web account to a customer record)

**Mechanism (decided).** Every customer web account shows a short **"Mã kết nối hồ sơ"**, e.g. `LS-7K2Q`, in its profile page (customer lens).
- The customer reads it out or shows it at the counter, from their own logged-in phone. Showing it proves they control the account.
- The manager uses it to find the account. The manager never searches accounts by phone, and no automatic match is made.

**Screen `#/nv/tai-khoan-web`** (manager):
- **Table:** Tên đăng nhập · Tên khách · Số điện thoại tài khoản · Ngày đăng ký · Trạng thái ("Chưa liên kết" / "Đã liên kết với KH-0001") · Thú cưng khách tự thêm (count).
- **Filter:** "Chưa liên kết".
- **Button:** "Liên kết bằng mã…".

**Dialog "Liên kết tài khoản web"** (4 short steps in one dialog):
1. **"Mã kết nối khách đưa cho bạn"** (placeholder "VD: LS-7K2Q"). It shows the account card: username, name, phone, signup date, web pets.
   - Wrong code: "Không tìm thấy tài khoản với mã này. Vui lòng kiểm tra lại với khách."
2. **"Chọn hồ sơ khách hàng"**: search, or "Tạo hồ sơ mới" with fields prefilled from the account.
3. **"Ghép thú cưng"**: each web pet ("Thú cưng khách tự thêm") gets a select of the record's pets ("Hồ sơ tại bệnh viện") or "Không ghép". Name and species matches are pre-suggested, never auto-applied.
4. **"Cách xác minh"**:
   - Radio options:
     - "Khách có mặt tại quầy và mở tài khoản trên điện thoại của mình" (default)
     - "Cách khác (ghi rõ)" (text required)
   - Required checkbox: **"Tôi đã đối chiếu người đến quầy đúng là chủ của hồ sơ này."**
   - Info box: "Sau khi liên kết, khách sẽ xem được hóa đơn, nhật ký nội trú và video của các bé trong hồ sơ này."
- Primary button: **"Liên kết tài khoản"**. Toast: "Đã liên kết tài khoản minhkhoa với hồ sơ KH-0006."

**Gỡ liên kết** (manager):
- Text: "Khách sẽ không còn xem được hóa đơn, nhật ký và video. Vui lòng ghi lý do."
- Required reason, then the danger button "Gỡ liên kết".
- History is kept, and the link row is closed rather than deleted.

**Rule (decided):** at most one active web account per customer record in the demo. The link table supports more later.

**Visibility effects of linking:**
- **Before linking**, the customer sees only their own requests, the confirmed time on those requests, and their own web pets.
- **After linking**, they also see the following for the record's pets: issued invoices, shared diary entries, shared videos and all appointments.

---

## 5. Module B — Inpatient & video

### 5.1 Cage board `#/nv/noi-tru`

**Header:**
- The title "Nội trú" with the subline "5 bé đang nội trú · 7 chuồng trống".
- Legend chips for the internal status: **Ổn định** (teal) · **Cần theo dõi** (orange) · **Nặng** (rose). Each has an icon.
- Button "＋ Nhập viện" (`inpatient.admit`).

**Board:** grouped by zone, using sample configuration that is not editable in the demo:
- "Khu chó" C1–C6
- "Khu mèo" M1–M4
- "Khu riêng" R1–R2

**Tiles:** 4–6 per row on desktop, 2 per row on mobile.
- **Empty tile:** dashed outline, cage code and "Trống". With `inpatient.admit`, clicking it opens "Nhập viện" with the cage preselected.
- **Occupied tile:**
  - Cage code
  - A pet avatar (species line icon on a pastel badge, or a photo when present)
  - **Pet name** with species and breed
  - "Ngày 3", counting the admission day as day 1
  - The internal status pill
  - The doctor's initials
- **Footer indicators on occupied tiles:**
  - Visible with `inpatient.clinical`: "14:00 · 2 việc" (next due orders), or "Quá giờ 12:00" in rose when an order slot has passed undone.
  - Visible with `inpatient.share`: "Chưa gửi nhật ký hôm nay" (orange dot).
  - Video count (camera icon and number).
  - If the owner is not linked: "Chủ nuôi chưa liên kết tài khoản" (grey).

No QR scanning anywhere.

### 5.2 Stay detail `#/nv/noi-tru/:stayId`

**Header card:**
- The pet, linked to its record, with alerts.
- The owner, linked, with tap-to-call.
- Cage, "Nhập viện lúc 10:30, 17/10", "Ngày 3", "BS. phụ trách" and the internal status (an editable select with `inpatient.admit`).
- Actions: "Chuyển chuồng…" · "Xuất viện…".

**Tabs:**
1. **"Hồ sơ nội bộ"**, with a lock icon and the tag **"Chỉ nhân viên"**. Hidden entirely without `inpatient.clinical`.
2. **"Nhật ký cho chủ nuôi"**, with an eye icon and the tag **"Chủ nuôi sẽ thấy"**.
3. **"Video"**
4. **"Hóa đơn"**: the stay's draft invoice.
5. **"Lịch sử"**

**Visual separation (deliberate design device):**
- **The internal tab** has a cool neutral surface (light slate, #F3F1F5) and a 4 px plum-grey top stripe with the banner "Thông tin nội bộ — không bao giờ hiển thị cho khách hàng."
- **The customer tab** has the warm cream surface with an orange-peach stripe and the banner "Nội dung ở đây sẽ hiển thị cho chủ nuôi sau khi bạn chia sẻ."
- Staff can tell at a glance which side they are writing on.

#### 5.2.1 Internal record (Hồ sơ nội bộ)

Three blocks on one scrolling page:
- **"Y lệnh đang thực hiện"** (orders):
  - **Table columns:** Thuốc / chỉ định · Liều · Đường dùng · Giờ thực hiện (chips "08:00 · 20:00") · Từ ngày – Đến ngày · Người ra y lệnh · status ("Đang thực hiện" / "Đã ngừng").
  - **Actions:** "＋ Thêm y lệnh" and, per row, "Ngừng y lệnh" (reason optional).
  - **Kinds:** "Thuốc", "Dịch truyền", "Chăm sóc" (e.g. "Vệ sinh vết thương", "Đo nhiệt độ").
- **"Lịch thực hiện hôm nay"** (administration checklist):
  - A timeline of due slots, generated from orders: "08:00 · Dịch truyền NaCl 0,9% · 150 ml · Tĩnh mạch".
  - Each slot has the button **"Ghi đã thực hiện"**. It opens a small popover: time (default now), actual dose (prefilled), note, then "Lưu".
  - Done slots show ✓ with "BS. Mai · 08:05". Past undone slots are highlighted "Quá giờ".
  - Ad-hoc administration: "＋ Ghi thuốc ngoài y lệnh".
- **"Ghi chú chăm sóc"** (care notes):
  - Type chips: "Theo dõi" (optional fields Nhiệt độ °C, Cân nặng kg) · "Ăn uống" · "Vệ sinh" · "Ghi chú".
  - Text, then the newest-first list.

#### 5.2.2 Customer diary (Nhật ký cho chủ nuôi)

**Left (or top on mobile): composer "Viết nhật ký cho chủ nuôi"**
- **"Tình trạng chung"**, a required select with warm labels that the customer sees: "Ổn định" · "Đang hồi phục tốt" · "Cần theo dõi thêm" · "Sẵn sàng về nhà".
- **Text** (≤ 600 characters).
  - Placeholder: "Ví dụ: Sáng nay Miu ăn hết phần pate, đi lại nhẹ nhàng và ngủ trưa rất ngon."
  - Helper line: "Không ghi tên thuốc, liều lượng hay giờ tiêm."
- **Soft lint (decided).** Text is matched against a keyword list: mg, ml, tiêm, truyền, kháng sinh, liều, viên, y lệnh, and drug names from the price list. A match shows a non-blocking warning: "Nội dung có thể chứa thông tin thuốc hoặc liều dùng. Vui lòng kiểm tra lại trước khi chia sẻ."
- **Buttons:** "Lưu nháp" · "Xem như chủ nuôi" · **"Chia sẻ với chủ nuôi"** (`inpatient.share`).
  - "Xem như chủ nuôi" opens a preview rendered exactly like the customer card.
  - Users without share can only save drafts. Their drafts show the label "Chờ bác sĩ hoặc quản lý chia sẻ".

**Right: the entry list.** Each entry shows a status chip (**Bản nháp** / **Đã chia sẻ** / **Đã thu hồi**), the author, and "Chia sẻ lúc 07:40 bởi BS. Mai".
- **Shared entries are not editable.** Use "Thu hồi" ("Chủ nuôi sẽ không còn thấy mục này.") and write a new entry. This keeps the trail clean.
- Toast: "Đã chia sẻ nhật ký với chủ nuôi."
- **If the owner is not linked**, a banner shows: "Chủ nuôi chưa liên kết tài khoản web. Nhật ký và video đã chia sẻ sẽ hiển thị cho khách sau khi liên kết."

**Customer's "current general status"** is the label of the latest shared entry. The internal status is never mapped automatically to anything the customer sees.

#### 5.2.3 Video

**Grid of video cards:**
- A poster frame, duration, "Quay lúc 08:10, 18/10", uploader, a share chip (**Bản nháp** / **Đã chia sẻ** / **Ngừng chia sẻ**), and a fixed chip **"Không có âm thanh"**.
- **Countdown:** "Tự xóa sau 52 ngày" with a thin progress bar. At ≤ 7 days it turns orange: "Còn 3 ngày sẽ tự xóa".

**Player:** muted, `playsinline`, with no unmute control (there is no audio track).

**"Tải video lên" dialog** (`inpatient.diary_write`):
- **Source:**
  - "Chọn video mẫu" is the primary option. It is a gallery of the bundled demo clips, labelled "Video minh họa".
  - "Chọn từ máy" is also available. The file is stored only in this browser via IndexedDB (≤ 50 MB), with the note "Bản demo: video chỉ lưu trên trình duyệt này."
- **"Lời nhắn kèm video"** (optional, ≤ 120 characters), placeholder "Miu sưởi nắng buổi sáng".
- "Thời điểm quay" (default now).
- Fixed info chips: **"Âm thanh: đã loại bỏ"** · **"Tự xóa sau 60 ngày"**. The demo has no keep-audio option.
- **Before sharing**, both checkboxes are required: "Video không có người hay thú cưng của khách khác" · "Không thấy tên thuốc, y lệnh hay giấy tờ nội bộ".
- **Buttons:**
  - Users with `inpatient.share`: "Lưu nháp" · **"Tải lên và chia sẻ"**.
  - Users without it: **"Tải lên (bản nháp)"**.

**Per-card actions** (`inpatient.share`): "Chia sẻ" / "Ngừng chia sẻ" / "Xóa video". Xóa asks: "Video sẽ bị xóa vĩnh viễn và chủ nuôi không xem được nữa."

**Visibility rule:** a video is visible to a customer only if all of these hold: it is shared, it is not deleted, it has not expired, and its `pet.customer_id` has an active link to that account. Only that pet's owner can see it.

**Auto-delete:**
- `expires_at = uploaded_at + 60 days`. Drafts expire too.
- On each app load the mock layer runs `purgeExpiredVideos()`. It removes the media, keeps a tombstone row and logs "Hệ thống tự xóa video sau 60 ngày".

### 5.3 Inpatient dialogs

**Nhập viện:**
- Fields:
  - "Thú cưng" (search, or "Từ lịch hẹn hôm nay").
  - "Chuồng": only empty cages, with the zone matching the species suggested first.
  - "Bác sĩ phụ trách".
  - "Lý do nhập viện (nội bộ)".
  - "Tình trạng ban đầu" (Ổn định / Cần theo dõi / Nặng).
  - "Dự kiến xuất viện" (optional).
  - Checkbox "Tạo hóa đơn nội trú nháp", checked by default.
- Primary button: "Nhập viện". Toast: "Đã nhập viện Kem vào chuồng C4."

**Chuyển chuồng:** "Chuồng mới" (empty only) and "Lý do" (optional).

**Xuất viện:**
- Fields: "Thời điểm xuất viện" (default now), "Ghi chú nội bộ".
- Optional **"Lời chào tạm biệt gửi chủ nuôi"**, which becomes a final diary entry with status "Sẵn sàng về nhà" and goes through the same lint and share rules.
  - Example: "Mochi đã khỏe và sẵn sàng về nhà. Cảm ơn gia đình đã tin tưởng Lê Sơn!"
- **No medication or home-care instructions on the web.** Those are given in person, which keeps the rule that customers never see drug names or doses online.
- If the stay invoice is still a draft, a warning shows: "Hóa đơn nội trú đang là bản nháp." with the button "Mở hóa đơn".
- Primary button: "Xác nhận xuất viện".

---

## 6. Module C — Invoices & payments

### 6.1 Invoice statuses and rules

| Status | Visible to customer? | Editable? | How it is reached |
|---|---|---|---|
| **Nháp** | No | Yes | Created manually, from an appointment, or automatically at admission |
| **Chưa thanh toán** | Yes (if linked) | No | "Phát hành hóa đơn" |
| **Thanh toán một phần** | Yes | No | Derived: 0 < paid < total |
| **Đã thanh toán** | Yes | No | Derived: paid = total |
| **Đã hủy** | Yes, shown as "Đã hủy" without a reason | No | Manager voids, with a reason |

Decided rules:
- **Issued invoices are immutable.** To correct one, the manager voids it, then uses **"Sao chép thành hóa đơn mới"** to create a prefilled draft. The two invoices are linked ("Thay thế cho HD-…").
- **Void is allowed only when net paid = 0.** Otherwise the UI says: "Hóa đơn đã có 500.000 ₫ thanh toán. Hủy phiếu thu trước khi hủy hóa đơn."
- **Drafts can be discarded** by their creator or the manager ("Xóa nháp"). A stay's draft cannot be discarded while the stay is active.
- **Partial payments are supported.** They are common for inpatient stays.
- **No VAT line and no tax wording.** The demo is not a tax invoice, and tax status is unconfirmed. The printed footer states: "Chứng từ nội bộ, không thay thế hóa đơn điện tử." E-invoice integration is out of scope.
- **Discount:** one invoice-level discount (in % or ₫) with a required reason ("Lý do giảm giá"). It is logged and appears in the revenue report. There are no per-line discounts.
- **Unit prices come from the price list and are locked.** Items marked "Nhập khi lập hóa đơn" (open price) require a price on the line.
- **Money is stored as integer VND** and displayed as "1.250.000 ₫".
- **Codes:** `HD-YYMM-NNNN` for invoices and `PT-YYMM-NNNN` for payment receipts, both numbered per month.

### 6.2 Invoice list `#/nv/hoa-don`

- **Summary strip:** "Chưa thu: 3 hóa đơn · 970.000 ₫" · "Thanh toán một phần: 2" · "Nháp: 5".
- **Table columns:** Số HĐ · Ngày · Khách hàng · Thú cưng · Tổng tiền · Đã thu · Còn lại · Trạng thái · Người lập.
- **Filters:**
  - Status chips.
  - Period ("Hôm nay", "7 ngày", "Tháng này", "Tùy chọn").
  - Search: "Số HĐ, tên khách, số điện thoại".
  - Payment method.
- **Primary action:** "Tạo hóa đơn".

### 6.3 Invoice editor `#/nv/hoa-don/moi` and draft edit

**Left panel:**
- **"Khách hàng & thú cưng"**, prefilled from the appointment or stay; it can also be searched.
- **"Dịch vụ & hàng hóa"**:
  - A typeahead "Tìm trong bảng giá…" with category tabs: "Khám & điều trị" · "Spa & Grooming" · "Nội trú" · "Thuốc" · "Vật tư".
  - **Line columns:** Tên · Thú cưng (only when the invoice has more than one pet) · Đơn vị · Đơn giá · Số lượng (stepper) · Thành tiền · ✕.
- **Inpatient helper:** a stay draft shows the line "Nội trú mèo / ngày × 2", with the button "Cập nhật theo số ngày nội trú (3)".
- "Ghi chú trên hóa đơn" (visible to the customer).

**Right panel (sticky summary):**
- "Tạm tính"
- "Giảm giá" (link "Thêm giảm giá")
- **"Tổng cộng"** in Lora, large
- Buttons: "Lưu nháp" · **"Phát hành hóa đơn"**

**Issue confirm:** "Phát hành hóa đơn? Sau khi phát hành, hóa đơn không sửa được và khách sẽ xem được trong tài khoản (nếu đã liên kết)." Buttons: "Phát hành" / "Xem lại".

### 6.4 Invoice detail `#/nv/hoa-don/:id`

- **Header:** code, status pill, customer and pet.
- **Actions:**
  - **"Ghi nhận thanh toán"** (primary, `payments.record`, when remaining > 0)
  - "In hóa đơn"
  - Overflow: "Hủy hóa đơn…" (`invoices.void`) · "Sao chép thành hóa đơn mới"
- **Body:**
  - The lines table.
  - Totals: Tổng cộng / Đã thu / **Còn lại**.
  - **"Các lần thanh toán"**: one row per payment with receipt code, time, method icon, amount and collector. The manager also gets "Hủy phiếu thu…" per row, with a required reason.
- **"Khách sẽ thấy"** preview toggle: renders the customer projection (see the medicine grouping in §7).
- **"Lịch sử"**

### 6.5 Payment dialog "Ghi nhận thanh toán"

- **"Số tiền"**: defaults to the remaining amount and can be lowered for a partial payment. It cannot exceed the remaining amount: "Số tiền không được lớn hơn số còn lại (1.450.000 ₫)."
- **"Phương thức"**: a segmented control: **"Tiền mặt"** · **"Chuyển khoản"** · **"QR ngân hàng"**.
  - **Tiền mặt:** fields "Khách đưa" and an auto-calculated "Tiền thừa trả khách". This is a counter helper only.
  - **Chuyển khoản:** field "Ghi chú / mã giao dịch" (optional).
  - **QR ngân hàng:** a button **"Hiện mã QR cho khách"** opens a full-screen panel to turn toward the customer.
    - The panel shows a large QR placeholder with a diagonal **"MẪU — KHÔNG CHUYỂN TIỀN"** watermark, the amount in Lora, the hospital name, and the transfer content `LESON HD26100032`.
    - It has a "Đóng" button. It has no real bank details.
    - After checking their banking app, staff press **"Xác nhận đã nhận tiền"**.
- **Primary button:** "Xác nhận đã nhận tiền". Toast: "Đã ghi nhận 400.000 ₫ bằng tiền mặt."
- The invoice status updates automatically.

### 6.6 Print

- **"In hóa đơn"** opens an **A5 portrait** print layout via `@media print`. A5 prints on any office printer and scales to A4; a thermal-receipt layout can come later.
- **Content:**
  - The official logo, hospital name, address and hotline (confirmed info only).
  - "HÓA ĐƠN" with code and date.
  - Customer and pet.
  - The lines in the customer projection, with medicine grouped.
  - Discount, total, paid and remaining.
  - The payments list.
  - "Người lập".
- **Footer:** "Cảm ơn quý khách đã tin tưởng Bệnh viện Thú y Lê Sơn." and, smaller, "Chứng từ nội bộ, không thay thế hóa đơn điện tử."

### 6.7 Void dialog "Hủy hóa đơn" (manager)

- Text: "Hóa đơn đã hủy vẫn được lưu để đối chiếu. Vui lòng ghi lý do."
- Reasons: "Lập nhầm khách hàng" · "Sai dịch vụ hoặc số lượng" · "Khách không sử dụng dịch vụ" · "Lý do khác" (text).
- Danger button "Hủy hóa đơn". It is followed by the prompt "Tạo hóa đơn thay thế?"

### 6.8 Bảng giá (price list) `#/nv/bang-gia`

- **Permanent banner:** "Giá trong bản demo là giá minh họa, chưa phải giá thật của bệnh viện."
- **Grouped by category** with the service colour chips.
- **Columns:** Mã · Tên · Đơn vị · Giá · Cách tính giá ("Giá cố định" / "Nhập khi lập hóa đơn") · Trạng thái ("Đang dùng" / "Ngừng dùng").
- **Everyone can read it.** With `pricelist.edit`, the actions are "＋ Thêm mục", "Sửa" and "Ngừng dùng".
- **No deletion.** Old invoice lines keep a snapshot of the name and price.
- Each price change is logged ("Đổi giá Tắm sấy mèo: 180.000 ₫ → 200.000 ₫").
- **Medicine items have an internal name only.** On the customer side they are grouped (§7).

### 6.9 Doanh thu (manager revenue report) `#/nv/doanh-thu`

**Basis (decided): cash collected ("Tiền đã thu").** This is the sum of non-reversed payments with `received_at` in the period. It matches what the manager reconciles against the cash drawer and the bank statement.

- **Period chips:** "Hôm nay" · "7 ngày" · "Tháng này" (default) · "Tháng trước" · "Tùy chọn".
- **KPI tiles:**
  - **"Tiền đã thu"**, with a delta versus the previous equal period ("↑ 12% so với kỳ trước")
  - "Hóa đơn phát hành" (count and total of invoices issued in the period)
  - **"Còn phải thu"**, the total outstanding on all open invoices (not period-bound)
  - "Đã giảm giá" (sum of discounts on invoices issued in the period)
- **Sections:**
  1. **"Tiền thu theo ngày"**: bars stacked by method (Tiền mặt / Chuyển khoản / QR ngân hàng), with a table toggle for accessibility.
  2. **"Đối soát theo ngày"**: a table with Ngày · Tiền mặt · Chuyển khoản · QR · Tổng · Người thu.
  3. **"Theo nhóm dịch vụ"**: horizontal bars by category, labelled **"(theo hóa đơn phát hành trong kỳ)"** so the two bases are never mixed silently.
  4. **"Hóa đơn còn nợ"**: oldest first, with age ("Quá 10 ngày"), linking to the invoice.
- **Button:** "Tải CSV" (client-side export of the daily table).
- **Footnote:** "Số liệu được tính từ dữ liệu mẫu."
- Excluded from the report: voided invoices, reversed payments and drafts.

---

## 7. Customer-zone touchpoints (interface contract for the customer lens)

What each staff action exposes to the customer, so the two lenses agree:

| Data | Customer sees when… | Never shows |
|---|---|---|
| Booking request | The request belongs to their account scope | Reasons, call log, handler, internal notes |
| Request status wording (suggestion) | Chờ xác nhận → "Đã nhận yêu cầu — bệnh viện sẽ gọi để xác nhận" · Đang liên hệ → "Bệnh viện đang liên hệ với bạn" · Đã xác nhận → "Đã xác nhận lịch: 09:00, Thứ Ba 20/10" · Không liên lạc được → "Bệnh viện chưa liên lạc được với bạn và sẽ gọi lại" · Đã hủy → "Đã hủy" · Từ chối → "Bệnh viện chưa thể tiếp nhận yêu cầu này. Vui lòng gọi 097 355 51 05 để được hỗ trợ." | The resubmit flag |
| Appointment | It came from their request, or it belongs to their linked record | Assignee notes, internal note |
| Pets | Their web pets, plus the linked record's pets (name, species, breed, sex, age) | Alerts, internal notes, weight history |
| Inpatient | Linked; stay active or ended ≤ 60 days ago | Cage code, internal status, reason, orders, administrations, care notes, drafts, withdrawn entries |
| Diary | Shared entries only, plus "Tình trạng chung" from the latest one, signed "Đội ngũ Lê Sơn" | Staff names, drafts, withdrawn entries |
| Video | Shared and not deleted, own pet, before expiry; shown with "Video được lưu đến 18/12/2026" | Drafts and expired videos. No download button in the demo |
| Invoice | Linked and status ≠ Nháp | Creator, history. **Medicine lines (Thuốc, Vật tư) are grouped into one line "Thuốc & vật tư y tế"** (Open question 3) |

**Customers cannot cancel or reschedule online.** The customer UI shows "Cần đổi hoặc hủy lịch? Gọi 097 355 51 05.", and staff record the change.

The customer profile shows "Mã kết nối hồ sơ: LS-7K2Q — Đưa mã này cho nhân viên khi bạn đến bệnh viện để xem hóa đơn, nhật ký nội trú và video của bé."

---

## 8. Data model (mock now, Supabase later)

Conventions:
- `id` is a UUID string; human codes are separate fields.
- Timestamps are ISO strings with a `+07:00` offset.
- Money is an integer in VND.
- Mutable workflow entities carry `version` (an integer) for optimistic concurrency.
- Enum values are ASCII snake_case; Vietnamese labels live in a separate label map.

**Identity & permissions**
- `staff_users` { id, username, display_name, title, preset_ids[], extra_capabilities[], is_sample, active }
- `capability_presets` { id, name, capabilities[] } (static config)
- Effective capabilities = union of the presets plus `extra_capabilities`.

**Customer side (web)**
- `web_accounts` { id, username, phone_e164, display_name, email?, link_code, status: active|locked, created_at }
- `account_pets` { id, account_id, name, species, breed?, sex?, birth_year?, note?, created_at }. These are customer-entered and never edited by staff.

**Hospital records**
- `customers` { id, code, full_name, phone_e164, phone_alt?, address?, note_internal?, created_at, created_by }
- `account_links` { id, account_id, customer_id, linked_at, linked_by, method: in_person_app|other, method_note?, unlinked_at?, unlinked_by?, unlink_reason? }
  - Unique active row per account, and (demo rule) per customer.
- `pet_links` { id, account_pet_id, pet_id, link_id }. Created in the linking dialog and closed with the link.
- `pets` { id, code, customer_id, name, species: dog|cat|other, breed?, sex?, neutered?, birth_year?, color?, weight_kg?, weight_at?, alerts[], note_internal?, photo? }

**Booking**
- `booking_requests` { id, code, scope: account|guest, account_id?, snapshot{ contact_name, phone_e164, pet_name, species, breed?, account_pet_id?, service, desired_date, note? }, dedupe_key, status, resubmit_flag_at?, handler_id?, appointment_id?, customer_id?, pet_id?, version, created_at, updated_at }
  - Status values: pending | contacting | confirmed | unreachable | cancelled | rejected.
  - Constraint: `resubmit_flag_at` is not null ⇒ status = unreachable.
- `request_events` (append-only) { id, request_id, type: created|status_change|call|resubmit|handler_change, from_status?, to_status?, call_outcome?: talked|no_answer|busy|call_back_later, reason_code?, reason_text?, note?, actor_type: staff|customer|guest|system, actor_id?, at }
- `appointments` { id, code, customer_id, pet_id, service, start_at, duration_min, assignee_id?, status: scheduled|arrived|no_show|cancelled, source: web_request|phone|walk_in, request_id?, note_internal?, cancel_reason?, version, created_by, created_at }

**Inpatient — internal (staff only)**
- `cages` { id, code, zone, species_hint, active }
- `stays` { id, code, pet_id, customer_id, cage_id, doctor_id, admitted_at, admitted_by, reason_internal, internal_status: stable|watch|critical, expected_discharge_at?, discharged_at?, discharged_by?, discharge_note_internal?, appointment_id?, invoice_id?, version }
- `care_orders` { id, stay_id, kind: drug|fluid|care, item_name, dose?, route?, schedule_times[] ("08:00"), start_date, end_date?, status: active|stopped, ordered_by, ordered_at, stopped_by?, stopped_at?, note? }
- `care_administrations` { id, stay_id, order_id?, slot_time?, item_name, dose?, performed_at, performed_by, note? }
- `care_notes` { id, stay_id, type: observation|feeding|hygiene|note, text, temp_c?, weight_kg?, author_id, at }

**Inpatient — customer-facing (separate tables, written deliberately)**
- `diary_entries` { id, stay_id, pet_id, status: draft|shared|withdrawn, general_status: stable|recovering|watch|ready_home, text, author_id, created_at, shared_by?, shared_at?, withdrawn_by?, withdrawn_at? }
- `videos` { id, pet_id, customer_id, stay_id?, media_key, poster_key, duration_s, caption?, recorded_at, uploaded_by, uploaded_at, expires_at, audio_removed: true, share_status: draft|shared|unshared, shared_by?, shared_at?, deleted_at?, deleted_by? (staff id or "system") }

**Billing**
- `price_items` { id, code, category: exam|spa|inpatient|medicine|supply, name, unit, price, price_mode: fixed|open, active, updated_at, updated_by }
- `invoices` { id, code, customer_id, pet_ids[], source_type: appointment|stay|counter, source_id?, status: draft|issued|voided, discount?{ type: percent|amount, value, amount, reason }, subtotal, total, note_customer?, issued_at?, issued_by?, voided_at?, voided_by?, void_reason_code?, void_reason_text?, replaces_invoice_id?, created_by, created_at, version }
  - The payment states "Chưa thanh toán / Thanh toán một phần / Đã thanh toán" are **derived** from `total` and the non-reversed payments. They are not stored, so they can never drift.
- `invoice_lines` { id, invoice_id, price_item_id, pet_id?, name_snapshot, category_snapshot, unit_snapshot, unit_price, qty, line_total }
- `payments` { id, code, invoice_id, amount, method: cash|transfer|qr, received_at, received_by, cash_given?, note?, reversed_at?, reversed_by?, reverse_reason? }

**Audit**
- `audit_events` (append-only) { id, at, actor_type, actor_id?, actor_name_snapshot, action, entity_type, entity_id, summary_vi, diff?{ before, after }, reason?, sensitive: bool }

**Customer projections** (the future Supabase views/RLS) are defined in the data layer as separate read functions, never as UI filters:
- `customer_requests_v`
- `customer_appointments_v`
- `customer_pets_v`
- `customer_invoices_v` (issued/voided only, medicine grouped)
- `customer_stays_v` (shared diary only)
- `customer_videos_v` (shared, not expired, own pets)

---

## 9. Mock async data layer (contract for the build and for Codex)

- **One module per domain** under `src/data/`. Every function is `async`, simulates 120–300 ms of latency, and throws typed errors: `ForbiddenError`, `ConflictError`, `ValidationError`, `NotFoundError`.
  - `staff/requests`: list, get, startContact, logCall, markUnreachable, confirm, cancel, reject
  - `staff/appointments`: listRange, create, reschedule, checkIn, markNoShow, cancel
  - `staff/customers`: list, get, create, update, createPet, updatePet
  - `staff/accounts`: list, findByLinkCode, link, unlink
  - `staff/inpatient`: board, getStay, admit, transfer, discharge, setInternalStatus, orders.create|stop, administrations.record, careNotes.create, diary.saveDraft|share|withdraw|deleteDraft, videos.upload|share|unshare|delete
  - `staff/invoices`: list, get, createDraft, updateDraft, discardDraft, issue, void, duplicate, payments.record|reverse
  - `staff/priceItems`: list, create, update, setActive
  - `staff/reports`: revenue({from, to})
  - `staff/audit`: listFor, recent
  - `customer/*`: projection reads only, plus the public `bookings.submit`, which implements the dedupe and flag rules
  - `system`: purgeExpiredVideos, demo.reset
- **The session is read inside the data layer**, so capability checks happen there (as on a server). The subject (account or guest) is never taken from UI parameters.
- **Persistence:**
  - One JSON document in `localStorage` under the key `leson-demo:v1`, holding `schemaVersion`, `seededAt` and `dirty`.
  - User-uploaded video blobs go in IndexedDB.
  - Every read and write is wrapped in try/catch. If storage is unavailable, the app runs in-memory with the banner "Bản demo không lưu được trên trình duyệt này."
- **Freshness rule:**
  - On load, if `seededAt` is not today and `dirty = false`, reseed silently.
  - If `dirty = true`, show the banner "Dữ liệu mẫu được tạo ngày 16/10. Khôi phục để cập nhật theo hôm nay?" with the button "Khôi phục".
- **Atomic multi-entity operations** are single functions, so they become a single RPC/transaction later:
  - confirm (request + appointment)
  - cancel appointment ↔ request
  - issue invoice
  - record payment
  - link (link + pet links)

---

## 10. Audit trail — what is logged (who and when)

Every row records actor, time and a Vietnamese summary. **Bold** marks sensitive events: they are shield-tagged and shown in the manager's "Hoạt động gần đây".

| Area | Logged actions |
|---|---|
| Staff session | Staff login, logout. "Khôi phục dữ liệu mẫu" (demo) |
| Requests | Created (customer/guest), status change (from → to, reason), call logged (outcome), handler set, **re-submit flag set (actor: Khách)**, flag cleared (by transition) |
| Appointments | Created, rescheduled (old → new, reason), assignee changed, check-in, no-show, undo of check-in/no-show, cancelled (reason) |
| Customers & pets | Created, edited (changed fields), pet alerts changed |
| Account links | **Linked (method, note)**, **unlinked (reason)** |
| Inpatient | Admitted, cage transfer, internal status change, discharged; order created/stopped; administration recorded; care note added; diary draft saved; **diary shared**; **diary withdrawn**; video uploaded; **video shared/unshared**; **video deleted (staff)**; video auto-deleted (actor: Hệ thống) |
| Invoices | Draft created, draft discarded, issued, discount applied (amount, reason), payment recorded, **payment reversed (reason)**, **invoice voided (reason)**, duplicated as replacement |
| Price list | **Item created, price changed (old → new), deactivated** |

Not logged (YAGNI): page views, report views, reads of internal records, printing.

**Display:** each record's "Lịch sử" tab, plus the manager's dashboard feed. There is no standalone audit screen in the demo.

**Example lines:**
- "Nguyễn Thu Hà chuyển yêu cầu YC-0234 từ Không liên lạc được sang Đang liên hệ · 09:02"
- "Hệ thống tự xóa 1 video của Su sau 60 ngày · 07/10"

---

## 11. Demo seed data plan

**Global:**
- All personal data is fictional.
- Phone numbers use the reserved-looking pattern `0900 000 0NN`.
- The UI shows the tag "Dữ liệu mẫu" in the staff-zone footer.
- `d0` = today (Monday 19/10/2026 in the reference run).
- **Times today are offsets back from the seed moment** (e.g. "−12 phút", "−2 giờ"), never fixed clock times, so nothing appears in the future.
- Today's appointments are fixed clock times. Their status is set relative to the seed moment: past ones get their anchor status, future ones stay "Đã hẹn".

### 11.1 Staff (4)
See §1.3: Nguyễn Thu Hà (Quản lý), BS. Trần Minh Đức (Bác sĩ + Tiếp nhận dự phòng), BS. Phạm Thanh Mai (Bác sĩ), Lê Ngọc Anh (Nhân viên Spa). All carry `is_sample`.

### 11.2 Customers (18) and pets (22: 14 dogs, 8 cats)

| Code | Customer | Web account | Pets |
|---|---|---|---|
| KH-0001 | Nguyễn Thị Lan | `lan.nguyen` — **linked** | **Miu** (Mèo ta lông vàng, cái, 4 tuổi, đã triệt sản) · **Bông** (Poodle, đực, 3 tuổi) |
| KH-0002 | Phạm Thu Thủy | `thuy.pham` — linked | **Kem** (Golden Retriever, đực, 5 tháng) |
| KH-0003 | Vũ Hoàng Long | `hoang.long` — linked | **Mochi** (Poodle, cái, 7 tuổi) |
| KH-0004 | Trần Bảo Ngọc | `ngoc.tran` — linked | **Bơ** (Golden Retriever, đực, 6 tuổi) · **Su** (Mèo Anh lông ngắn, cái, 2 tuổi) |
| KH-0005 | Hoàng Văn Nam | — (no web account) | **Lu** (Corgi, đực, 2 tuổi) |
| KH-0006 | Đỗ Minh Khoa | `minhkhoa` — **not linked** (link code `LS-7K2Q`) | **Gạo** (Mèo mướp trắng, đực, 1 tuổi) |
| KH-0007 | Lê Thị Hồng Nhung | — | **Mít** (Phốc sóc, cái, 4 tuổi) |
| KH-0008 | Bùi Quang Huy | — | **Sói** (Husky, đực, 3 tuổi) |
| KH-0009 | Ngô Thanh Hương | — | **Na** (Mèo Scottish tai cụp, cái, 1 tuổi) · **Bin** (Mèo Ba Tư, đực, 5 tuổi) |
| KH-0010 | Đặng Văn Tùng | — | **Đậu** (Chó ta, đực, 6 tuổi) |
| KH-0011 | Trịnh Mai Phương | — | **Tôm** (Pug, đực, 4 tuổi) |
| KH-0012 | Phan Đức Anh | — | **Mướp** (Mèo ta, cái, 8 tuổi) |
| KH-0013 | Lý Thu Trang | — | **Lucky** (Shih Tzu, cái, 5 tuổi) · **Xoài** (Mèo Munchkin, cái, 1 tuổi) |
| KH-0014 | Cao Minh Tuấn | — | **Milo** (Bắc Kinh lai, đực, 9 tuổi) |
| KH-0015 | Đinh Hải Yến | — | **Cốm** (Poodle, cái, 2 tuổi) |
| KH-0016 | Võ Quốc Bảo | — | **Mập** (Mèo Anh lông ngắn, đực, 3 tuổi) |
| KH-0017 | Hà Thị Thu | — | **Ổi** (Phốc sóc, cái, 6 tuổi) |
| KH-0018 | Tạ Minh Châu | — | **Sushi** (Shiba, đực, 2 tuổi) |

**Pet alerts (samples):** Sói "Có thể cắn — cần rọ mõm"; Mập "Dễ hoảng sợ"; Milo "Bệnh mãn tính: tim (theo dõi)".

**Extra web accounts without a hospital record:**
- `maianh.do`: Đỗ Mai Anh, with web pet **Bắp** (Corgi). She has 1 pending request.
- 6 web accounts in total.

### 11.3 Booking requests (20, all six statuses)

| Code | Submitted | Scope | Contact / pet | Service | Desired | Status & story |
|---|---|---|---|---|---|---|
| YC-0225 | d−9 | guest | "Khách thử" / — | Khám | d−7 | **Từ chối**: "Thông tin không hợp lệ" (note "Tên và số điện thoại là nội dung thử") |
| YC-0226 | d−7 | guest | Cao Minh Tuấn / Milo | Spa | d−1 | Confirmed, then **Đã hủy**: "Khách báo không đến" (appointment cancelled) |
| YC-0227 | d−4 07:58 | guest | Nguyễn Thị Lan / Miu | Khám | d−2 | **Từ chối**: "Trùng với yêu cầu khác" → YC-0228 (shows the guest-vs-account exception) |
| YC-0228 | d−4 08:06 | `lan.nguyen` | Lan / Miu | Khám | d−2 | **Đã xác nhận** 09:00 d−2 → came → admitted (stay NT-0041) |
| YC-0229 | d−3 | `hoang.long` | Long / Mochi | Spa | d+1 | **Đã hủy**: "Khách đã có kế hoạch khác" |
| YC-0230 | d−3 | `thuy.pham` | Thủy / Kem | Khám | d−1 | **Đã xác nhận** 16:00 d−1 → came → admitted d0 (NT-0044) |
| YC-0231 | d−2 | guest | Lý Thu Trang / Lucky | Spa | d+1 | **Đã xác nhận** 09:30 d+1, Ngọc Anh |
| YC-0232 | d−2 | guest | Lê Thị Hồng Nhung / Mít | Khám | d+1 | **Đã xác nhận** at 10:30 **d0** (earlier than desired; shows that the three dates differ) |
| YC-0233 | d−2 | guest | Nguyễn Văn Bình / Lạc (chó ta) | Spa | d+5 | **Không liên lạc được**, 3 calls (no answer ×2, busy) |
| YC-0234 | d−1 | guest | Đặng Văn Tùng / Đậu | Khám | d+1 | **Không liên lạc được** + **flag "Khách vừa gửi lại — cần gọi lại"** set at −35 min; 2 calls on d−1 |
| YC-0235 | d−1 | `lan.nguyen` | Lan / Bông | Spa | d+2 | **Đã xác nhận** 15:00 d+2, Ngọc Anh |
| YC-0236 | d−1 | guest | Ngô Thanh Hương / Na | Khám | d+3 | **Đang liên hệ**, Hà, started −20 min, no call logged yet |
| YC-0237 | d−1 | guest | Bùi Quang Huy / Sói | Spa | d+1 | **Đang liên hệ**, BS. Đức (backup); call "Đã trao đổi — khách cân nhắc giờ chiều, chờ khách chốt" |
| YC-0238 | d−1 | `ngoc.tran` | Ngọc / Su | Khám | d+2 | **Đang liên hệ**, Hà; call "Khách hẹn gọi lại — đang họp, gọi lại sau 11 giờ" |
| YC-0239 | d−1 | guest | Phan Đức Anh / Mướp | Khám | d+2 | **Không liên lạc được**, 1 call (−1 h, no answer) |
| YC-0240 | d−1 21:40 | guest | Cao Minh Tuấn / Milo | Khám | d+1 | **Chờ xác nhận** (note "Bé ho nhiều về đêm") |
| YC-0241 | d−1 22:10 | `lan.nguyen` | Lan / Bông | Khám | d+4 | **Chờ xác nhận** (note "Tiêm nhắc lại theo lịch") |
| YC-0242 | −2 h | guest | Trịnh Mai Phương / Tôm | Khám | d+1 | **Chờ xác nhận** (note "Bé hay thở khò khè khi ngủ") |
| YC-0243 | −55 min | `maianh.do` | Đỗ Mai Anh / Bắp | Spa | d+3 | **Chờ xác nhận** (account with no hospital record) |
| YC-0244 | −12 min | guest | Lý Thu Trang / Xoài | Khám | d+2 | **Chờ xác nhận** (note "Bé bỏ ăn từ hôm qua") |

**Totals:** Chờ xác nhận 5 · Đang liên hệ 3 · Không liên lạc được 3 (1 flagged) · Đã xác nhận 5 · Đã hủy 2 · Từ chối 2.

### 11.4 Appointments

**This week (Mon d0 → Sun d+6), 24 in total.**

Today (7):

| Time | Pet | Service | Assignee | Source | Status |
|---|---|---|---|---|---|
| 08:00 | Bin | Khám (tái khám) | BS. Mai | Điện thoại | Đã đến |
| 08:30 | Cốm | Spa & Grooming | Ngọc Anh | Tại quầy | Đã đến |
| 09:00 | Mập | Khám | BS. Đức | Điện thoại | Không đến |
| 10:30 | Mít | Khám | BS. Mai | YC-0232 | Đã hẹn |
| 14:00 | Ổi | Khám | BS. Đức | Điện thoại | Đã hẹn |
| 15:30 | Sushi | Spa & Grooming | Ngọc Anh | Điện thoại | Đã hẹn |
| 17:00 | Bơ | Khám | BS. Đức | Điện thoại | Đã hẹn |

The rest of the week:

| Day | Count | Includes |
|---|---|---|
| d+1 | 4 | Lucky 09:30 Spa (YC-0231) and Cốm 16:00 Khám |
| d+2 | 3 | Bông 15:00 Spa (YC-0235) |
| d+3 | 3 | — |
| d+4 | 2 | — |
| d+5 (T7) | 4 | Mostly Spa |
| d+6 (CN) | 1 | — |

One d+3 appointment is unassigned, to show the "Chưa phân công" column.

**Past 7 days: 16.** These include Miu 09:00 d−2 (Đã đến) and Kem 16:00 d−1 (Đã đến). Two are Không đến and two Đã hủy, one of them Milo's (from YC-0226).

### 11.5 Inpatient

**Cages:** 12 (C1–C6, M1–M4, R1–R2). 5 are occupied, 7 empty.

| Stay | Pet / owner | Cage | Admitted | Doctor | Internal status | Content |
|---|---|---|---|---|---|---|
| NT-0041 | Miu / Lan (linked) | M2 | d−2 10:30 | BS. Mai | Ổn định (was Cần theo dõi) | Orders: "Dịch truyền NaCl 0,9% · 150 ml · tĩnh mạch · 08:00, 20:00", "Kháng sinh tiêm · 0,5 ml · dưới da · 08:00", "Giảm đau đường uống · ½ viên · 08:00, 20:00". Administrations filled up to now. 4 care notes. Diary: 3 shared (d−2 evening "Cần theo dõi thêm", d−1 "Đang hồi phục tốt", d0 morning "Ổn định"). Videos: 2 shared + 1 draft |
| NT-0044 | Kem / Thủy (linked) | C4 | d0 −3 h | BS. Đức | Cần theo dõi | Orders: Ringer lactat 250 ml 10:00/16:00/22:00; "Men tiêu hóa · 1 gói · 12:00, 18:00". The 12:00 slot is left undone → "Quá giờ" when viewed after 12:00. **No diary yet** → "Chưa gửi nhật ký hôm nay". 1 shared video |
| NT-0039 | Mochi / Long (linked) | C1 | d−4 | BS. Đức | Ổn định | Expected discharge d+1. 4 shared diary entries + 1 draft "Sẵn sàng về nhà" written by Ngọc Anh (waiting for a sharer) |
| NT-0040 | Lu / Nam (no web account) | C3 | d−3 | BS. Mai | **Nặng** | Rich internal record; no diary (owner has no web account → tile note "Khách chưa có tài khoản web") |
| NT-0043 | Gạo / Khoa (**not linked**) | M4 | d−1 | BS. Mai | Cần theo dõi | 1 shared diary + 1 shared video that are **invisible until the manager links `minhkhoa`**. This is the key "linking" demo moment |
| NT-0035 (past) | Bơ / Ngọc | — | d−58 → d−52 | BS. Đức | — | Video uploaded d−57 → **"Còn 3 ngày sẽ tự xóa"** |
| NT-0031 (past) | Su / Ngọc | — | d−75 → d−70 | BS. Mai | — | 1 video auto-deleted at d−12 (history event only) |

### 11.6 Videos (6 media files + 1 tombstone)

Clips are generated locally with ffmpeg as slow Ken-Burns pans over the bundled photos: 8–12 s, 1280×720, H.264, **no audio track**, plus a poster JPG. They are labelled "Video minh họa".

| Video | Pet | Source photo | State |
|---|---|---|---|
| V1 | Miu, d−1 08:10 "Miu ăn sáng ngon lành" | service-noitru.jpg (crop A) | Shared |
| V2 | Miu, −2 h "Miu sưởi nắng buổi sáng" | service-noitru.jpg (crop B, reverse pan) | Shared |
| V3 | Miu, −10 min | service-noitru.jpg (crop C) | **Draft**, uploaded by Ngọc Anh |
| V4 | Kem, −1 h "Kem đã chịu uống nước" | service-capcuu.jpg / pet-center.png | Shared |
| V5 | Gạo, d−1 | pet-left.png | Shared, owner not linked yet |
| V6 | Bơ, d−57 | service-grooming.jpg | Shared, expires d+3 |
| (V7) | Su | — | Tombstone, auto-deleted |

### 11.7 Price list (31 items, "giá minh họa")

None of these are equipment-dependent (no X-ray, ultrasound or lab items, per the "no unconfirmed facts" rule).

- **Khám & điều trị:**
  - KB01 Khám lâm sàng (lần) 150.000
  - KB02 Tái khám (lần) 100.000
  - KB03 Khám cấp cứu (lần) 300.000
  - KB04 Tiêm phòng (mũi) 250.000
  - KB05 Tẩy giun (lần) 80.000
  - KB06 Truyền dịch (lần) 120.000
  - KB07 Tiêm thuốc (mũi) 60.000
  - KB08 Vệ sinh, xử lý vết thương (lần) 150.000
  - KB09 Thủ thuật theo chỉ định (nhập khi lập hóa đơn)
- **Spa & Grooming:**
  - SP01 Tắm sấy chó dưới 5 kg 150.000
  - SP02 Tắm sấy chó 5–15 kg 220.000
  - SP03 Tắm sấy chó trên 15 kg 320.000
  - SP04 Tắm sấy mèo 200.000
  - SP05 Cắt tỉa tạo kiểu 200.000
  - SP06 Cắt móng 50.000
  - SP07 Vệ sinh tai 50.000
- **Nội trú:**
  - LT01 Nội trú mèo (ngày) 150.000
  - LT02 Nội trú chó dưới 15 kg (ngày) 180.000
  - LT03 Nội trú chó từ 15 kg (ngày) 250.000
  - LT04 Chăm sóc tăng cường (ngày) 200.000
  - (Prefix LT avoids clashing with stay codes NT-….)
- **Thuốc:**
  - TH01 Dịch truyền (chai 500 ml) 45.000
  - TH02 Kháng sinh đường uống (vỉ) 60.000
  - TH03 Men tiêu hóa (gói) 15.000
  - TH04 Thuốc nhỏ mắt/tai (lọ) 85.000
  - TH05 Giảm đau đường uống (viên) 12.000
  - TH06 Thuốc theo đơn khác (nhập khi lập hóa đơn)
- **Vật tư:**
  - VT01 Băng gạc (bộ) 30.000
  - VT02 Kim luồn (cái) 25.000
  - VT03 Vòng chống liếm (cái) 90.000
  - VT04 Tã lót thú cưng (miếng) 10.000
  - VT05 Vật tư khác (nhập khi lập hóa đơn)

### 11.8 Invoices (34) and payments (~28)

| Status | Count | Anchors |
|---|---|---|
| Nháp | 5 | One per active stay (Miu, Kem, Mochi, Lu, Gạo), with growing "Nội trú × N ngày" plus treatment/medicine lines |
| Chưa thanh toán | 3 | HD for Cốm today 400.000 (SP01 + SP05 + SP06); HD for Kem's d−1 visit 320.000; HD for Milo d−10, 250.000 (aging debt "Quá 10 ngày") |
| Thanh toán một phần | 2 | Bơ's stay HD-2608-…, 3.450.000, paid 2.000.000 by transfer; Sói d−6, 650.000, paid 300.000 cash |
| Đã thanh toán | 23 | 15 this month, including Bin today 180.000 cash; 8 last month for the "Tháng trước" comparison. Methods ≈ 45% cash, 30% transfer, 25% QR. One carries a discount ("Khách quen", 10%) |
| Đã hủy | 1 | d−6, "Lập nhầm khách hàng", replaced by the next code |

- **Payment reversal:** one reversed payment (manager, "Ghi nhầm phương thức thanh toán") is re-recorded correctly, so reversal appears in history.
- **Target figures** (approximate; the generator keeps them plausible): "Tháng này" collected ≈ 11–13 triệu ₫; "Còn phải thu" = 970.000 + 1.450.000 + 350.000 = **2.770.000 ₫**.

---

## 12. Key Vietnamese labels (glossary for consistency)

| Concept | Label |
|---|---|
| Staff area | Khu nhân viên |
| Request statuses (locked) | Chờ xác nhận · Đang liên hệ · Đã xác nhận · Không liên lạc được · Đã hủy · Từ chối |
| Re-submit flag | Khách vừa gửi lại — cần gọi lại |
| Appointment statuses | Đã hẹn · Đã đến · Không đến · Đã hủy |
| Internal inpatient status | Ổn định · Cần theo dõi · Nặng |
| Customer general status | Ổn định · Đang hồi phục tốt · Cần theo dõi thêm · Sẵn sàng về nhà |
| Diary/video share states | Bản nháp · Đã chia sẻ · Đã thu hồi / Ngừng chia sẻ |
| Invoice statuses | Nháp · Chưa thanh toán · Thanh toán một phần · Đã thanh toán · Đã hủy |
| Payment methods | Tiền mặt · Chuyển khoản · QR ngân hàng |
| Internal tab / customer tab | Hồ sơ nội bộ (Chỉ nhân viên) / Nhật ký cho chủ nuôi (Chủ nuôi sẽ thấy) |
| Pets in staff copy | "bé" (e.g. "5 bé đang nội trú") |
| Sample marking | Mẫu · Dữ liệu mẫu · Video minh họa · Giá minh họa |

---

## 13. Out of scope (deliberately not designed)

- HR, shift scheduling, duty rosters, task assignment, handover.
- A staff-account and capability admin screen. Presets are config; the profile shows "Quyền của tôi".
- Stock and inventory.
- E-invoice / VAT.
- Online payment by customers.
- Medical records, health reports and vaccination books beyond the inpatient record.
- Drag-and-drop calendar.
- Cage configuration UI.
- QR cage scanning.
- Email/SMS notifications (an in-app badge only).
- A standalone audit-log screen.
- Keep-audio override for videos.
- Video download for customers.
- Per-line discounts.
- Deposit (tạm ứng) as a separate concept; partial payment covers it.
- Reopening closed requests.

---

## 14. Open questions for owner

1. **Appointment check-in.** Calendar appointments get "Đã hẹn / Đã đến / Không đến / Đã hủy". This is separate from the six request statuses, which stay unchanged, and there is still no "Đã khám / Hoàn thành". **Default: yes.** Without it the manager cannot see who is waiting, or bill from the calendar.
2. **Verification for linking a web account.** **Default:** the customer is present at the counter and shows the "Mã kết nối hồ sơ" from their own logged-in account, and staff confirm the person owns the record. Is that strong enough, or does the owner want an ID check?
3. **Medicine names on customer invoices.** **Default:** grouped as one line "Thuốc & vật tư y tế", to respect "customers do not see drug names", while services stay itemised. Alternatively, the owner may want full itemisation on invoices.
4. **Request transitions.** **Default:** adopt the earlier proposed table (no reopening of Đã hủy/Từ chối; Đã xác nhận → only Đã hủy), and cancel/reject reasons are internal only.
