# QUYẾT ĐỊNH CUỐI — nguồn sự thật cho bản demo Lê Sơn

**Ngày:** 19/10/2026 · **Trạng thái:** chủ dự án đã duyệt bản thiết kế tổng hợp trong chat (19/10/2026).
Tài liệu này **ưu tiên cao nhất**. Bốn bản đề xuất (`proposal-*.md`) là chi tiết; chỗ nào mâu thuẫn với tài liệu này
thì làm theo tài liệu này. Báo cáo rà soát: `critique.md` (mã C1…C33 dẫn bên dưới).

Written in English below so any implementer (human, Claude, Codex) can apply it precisely.

---

## 0. Precedence

1. Owner answers (§1 below) — binding.
2. Locked decisions in `../tham-khao/*.md` (six request statuses, contact info, no unconfirmed facts, hero rules, icon set,
   header mobile spec, inpatient video rules, customer must not see drug info) — binding unless §1 overrides.
3. This file's resolutions (§2).
4. Source of truth per area when proposals disagree:
   - **Customer lens** (`proposal-customer.md`): all customer-visible copy, tone, customer screens.
   - **Staff lens** (`proposal-staff.md`): data model, capabilities, staff screens, **seed data (single seed source)**.
   - **Visual lens** (`proposal-visual.md`): tokens, colours, status chips/icons/thresholds, toast position, motion tokens,
     icon grammar, illustration plan.
   - **Tech lens** (`proposal-tech.md`): stack and versions, routing, folder structure, data layer mechanics, hero port,
     font packaging, video pipeline, tests, build/publish targets.

## 1. Owner answers (binding)

| Topic | Decision |
|---|---|
| Product level | Full clickable **demo with mock data** in the browser (localStorage); real backend later (Next.js + Supabase by Codex). |
| Repo | `lqt140304-rgb/tesst`, branch `claude/focused-pascal-rfxnnp`. |
| Services | **One section on the homepage**, no separate page. Header nav gets a "Dịch vụ" item that only scrolls to that section (Claude default, owner did not object; C14). Nav: Trang chủ · Dịch vụ · Giới thiệu · Liên hệ + Đăng nhập + Đăng ký. |
| Payments | Collected **at the counter** by staff (cash, transfer, bank QR shown at counter). Customer only **views** invoices + status. No online payment. |
| Staff modules | (a) Appointments & customers, (b) Inpatient & video, (c) Invoices & payments (+ manager revenue report, price list). **No HR / shift / task module.** |
| Login | One portal, two tabs "Khách hàng" / "Nhân viên", separate from the public site; routes to the correct zone by account. |
| Photos/video | Free-license stock. Downloads are blocked in the build container → use the 7 repo photos (cropped into 9 hero frames, colour-graded), ffmpeg Ken-Burns clips (no audio track) as inpatient videos, SVG line illustrations. Label "Ảnh minh họa". |
| Sign-up | Customer self sign-up (phone + username + password, no OTP); staff link the web account to the hospital customer record after verification. Before linking: pets + booking requests work; Nội trú, Hóa đơn locked with a kind explanation. |
| Appointment check-in | **NO "Đã đến" / "Không đến".** Appointments have only **Đã hẹn / Đã hủy** (+ derived "Đã qua" when the time has passed). Locked rule kept. |
| Preview | **Private claude.ai Artifact link** (owner confirmed they act for Lê Sơn). If the publisher refuses, deliver the single-file HTML + screenshots; do not propose other hosting. |
| Refuse/cancel reason for customer | Customer sees only the generic sentence (no staff free-text message) (C24). |
| Dark mode | None. `color-scheme: only light`. |

## 2. Conflict resolutions (apply when building)

**R1 Linking (C1).** Use the staff lens flow: the customer zone shows **"Mã kết nối hồ sơ: LS-7K2Q"** with [Sao chép] on the
unlinked banner, both locked pages, first-run step 3 and Tài khoản › Liên kết hồ sơ. Copy: "Lần tới khi đến Lê Sơn, bạn mở
trang này và đưa mã cho nhân viên để được liên kết." Never automatic, never by phone. Label the method "đề xuất" in docs.

**R2 Inpatient customer model (C2).** `diary_entries { part_of_day: 'sang'|'chieu'|'toi', category: 'an_uong'|'nghi_ngoi'|
'tinh_than'|'van_dong'|'loi_nhan', text, general_status }`. General status list: Ổn định · Đang hồi phục tốt · Cần theo dõi
thêm · Sẵn sàng về nhà · "Lê Sơn muốn trao đổi với bạn" (orange, with call CTA). No separate stay message (use category
"Lời nhắn"). Attribution "Lê Sơn" everywhere. Customer projection never exposes clock times (videos show "Chiều 19/10";
stay header "Cập nhật sáng nay"). Staff composer has Buổi + Loại selects.

**R3 Seeds (C3, C22).** Staff lens §11 is the **only** seed source. Customer personas/examples are rewritten from it.
Usernames use `_` not `.` (validator: lowercase a–z, digits, `_`; must not look like a phone): `lan_nguyen`, `thuy_pham`,
`hoang_long`, `ngoc_tran`, `minh_khoa`, `maianh_do`. Staff usernames keep their form only if the staff login validator allows
dots — simpler: also use `_` (`quanly_ha`, `bacsi_duc`, `bacsi_mai`, `spa_ngocanh`). Add seeds: one **account-scope
"Không liên lạc được"** request for the unlinked persona (Đỗ Minh Khoa / Gạo); one **issued unpaid invoice** for Lan; the
unlinked persona's self-added web pet **Gạo** (so pet matching can be demoed). Login chips list 4 staff + 2 customer
accounts (Lan linked, Khoa unlinked) with real demo passwords.

**R4 Icons (C4).** Visual §5 grammar: 24-grid, **stroke 2**, round caps/joins, optical-size table; the 4 approved service
icons byte-for-byte; only permitted fills (paw pads, dots). One icon source: **`lucide-react@1.59.0`** (names verified
against lucide-static 1.59.0) + ~14 custom vet icons. Clinical icons are staff-only. No camera glyph (use `video`).

**R5 Fonts (C5).** Static `@fontsource/lora` (family "Lora", the hero waits for it) weights 500/600/700 + italic 600/700;
`@fontsource/be-vietnam-pro` 400/500/600/700. Subsets latin + vietnamese, woff2. Font budget raised accordingly.

**R6 Hero photos (C6).** Do **not** edit the vendored simulator. Inject photos via a separate CSS file
(`.frame:nth-of-type(n) .frame__inner { background-image }`, hide `.frame__label`) or a post-mount hook appending `<img>` into
existing `.frame__inner`. Preview tag text → "Ảnh minh họa". Record as documented non-maths change.

**R7 Customer invoice grouping (C7).** `price_items.customer_group`. Medicines, consumables **and treatment procedures**
(tiêm thuốc, truyền dịch…) roll into one customer line **"Thuốc và vật tư điều trị"**. Exam, inpatient days, spa itemised.
Vaccination itemised as **"Tiêm phòng"** without vaccine product name. Drug/dose soft-lint + "Xem như khách" preview on
**every** customer-visible free-text field. Leak test covers procedure names too.

**R8 No check-in (C8, owner).** Remove `appointments.manage` check-in/no-show; dashboard has no "khách đã đến" tile.
"Tạo hóa đơn" available from any appointment today or past.

**R9 Customer invoice states (C9).** Chưa thanh toán · Đã thanh toán một phần ("Đã thanh toán 2.000.000 ₫ · còn lại
1.450.000 ₫. Bạn thanh toán phần còn lại tại quầy nhé.") · Đã thanh toán · (P1) Đã hủy (grey, struck amount, "Hóa đơn này
đã được thay bằng HĐ-…", no reason). "Các lần thanh toán" list: date + method only, no collector. Overview sums remaining.

**R10 Appointments seen by customer (C10).** Rows without a request: chip "Đã xác nhận" + "Đặt qua điện thoại".
Reschedule: new time + timeline event "Lịch hẹn đã được đổi sang 15:00, thứ Tư 21/10". Staff cancel: request "Đã hủy" copy.
Past: tab "Đã qua", "Ngày hẹn đã qua". `customer_appointments_v` excludes assignee + internal notes.

**R11 Contrast (C13).** Flag "Khách vừa gửi lại — cần gọi lại": orange-700 `#A34803` text on white + 3 px orange-500 left bar
+ phone-redo icon. All small orange text uses orange-700.

**R12 Publishing (C11).** See §1 Preview.

**R13 Scope tiers (C12).**
- **P0 (wave 1, shown to owner first):** homepage (hero + all sections) + header/mobile menu; login/sign-up/forgot; guest &
  logged-in booking → staff intake (six statuses, flag, call log) → confirm → calendar; sign-up → link code → staff link →
  unlock; cage board → internal record + customer diary + video share (seeded clips) → customer view; invoice from price list →
  payment (cash/transfer/QR, partial) → customer view + print preview; basic revenue (manager); read-only price list;
  customers & pets records; "Quyền của tôi"; demo chip menu (reset data, icon sheet); all empty/loading/error/unlinked states.
- **P1 (wave 2, after owner feedback):** void/reversal, discount, CSV, reconciliation, price-list edit, global search +
  "Tạo nhanh", call-log outcome analytics, device video upload (IndexedDB, ≤ 20 MB, honest muted note), conflict toasts,
  orbit-wipe login transition polish, phone mock, parallax/floating decor, staff reset-password/lock account.
- Care orders are presented as a **care log**, not tasks with "Quá giờ" alerts.

**R14 Header (C15).** Locked "hộp menu xổ xuống" (not a drawer) from `../tham-khao/dac-ta-header-mobile-2026-10-15.md`;
port `reference/hero-demo/header-mobile.css/js` behaviour; e2e: aria-controls="mobileMenu", label swap, Esc returns focus,
outside/link click closes, closed menu hidden; Đăng nhập + Đăng ký visible 320–1440, ≥ 44 px.

**R15 Services (C16).** Locked names and order: **Khám và điều trị · Spa & Grooming · Nội trú · Cấp cứu 24/24**. Small
"Nội dung mẫu" caption under the grid next to "Ảnh minh họa". Cấp cứu card: call button only.

**R16 Chips/feedback (C17).** Visual §2.2 + M17 are the source for chip colours, icons, thresholds (video expiry: rose ≤ 3
days, orange 4–14), toast position (bottom-centre everywhere), audio chip text "Không có âm thanh".

**R17 Copy (C18–C20).** One Vietnamese string table governed by customer §10 (staff-only strings: staff glossary §12).
Customer = "bạn", hospital = "Lê Sơn", pet = "bé" + name; never "quý khách", never "lễ tân". Print footer "Cảm ơn bạn đã
tin tưởng gửi gắm bé cho Lê Sơn." Replacements: "Hotline" + "Tư vấn, đặt lịch và cấp cứu"; emergency line "Bé cần cấp cứu?
Bạn gọi ngay 097 355 51 05 thay vì gửi yêu cầu, Lê Sơn tiếp nhận cấp cứu 24/24."; validation "Bạn chọn giúp dịch vụ bé cần
nhé." style; staff term "Khách sẽ thấy" / "Xem như khách". Keep skip link "Chuyển đến nội dung chính". Always "dữ liệu mẫu".
One global chip "Bản demo · dữ liệu mẫu"; per-object marks only where content is invented.

**R18 Dates (C21).** 19/10/2026 is **Monday (thứ Hai)**; 21/10 = thứ Tư. Always format with `Intl` (`vi-VN`,
`Asia/Ho_Chi_Minh`), weekday computed, never typed by hand. Seeds relative to today.

**R19 Sensitive account ops (C23).** P0: forgot password = call hospital / ask at counter (informational, no dead end).
Locked/expired/throttled customer states not shown in P0. P1: manager "Đặt lại mật khẩu" (one-time temp password) and
"Khóa / Mở khóa", each with reason + audit.

**R20 No staff names to customers (C25).** Customer DTOs exclude assignee, author, collector. Sample staff names appear only
in the staff zone and login chips, tagged "Mẫu".

**R21 Print & clipboard (C26).** Customer print preview route `#/khach-hang/hoa-don/:id/ban-in` (same A5 layout as staff);
clipboard failure → select text + "Bạn bấm giữ để sao chép nhé".

**R22 Review chrome (C27).** No "DEMO UI/UX" toolbar in the product. Icon sheet at `#/_bo-icon`, reachable from the demo chip
menu. Mobile checks via Playwright 390/320 projects.

**R23 Motion (C28).** Visual §4.3 tokens are the source. Tech's 0.5 s cap applies to in-zone navigation; zone transitions are
named exceptions (≤ 1.1 s, reduced-motion = fade). Orbit wipe is a fixed overlay outside the hero container. Only the hero
loops.

**R24 Map/camera (C29).** Map pin = generic kennel pin (not logo-shaped). No camera icon anywhere.

**R25 Video upload honesty (C30).** No fake "Đang bỏ âm thanh…" step. Device upload (P1) note: "Bản demo: video tải từ máy
được phát ở chế độ tắt tiếng; bản chính thức sẽ loại bỏ âm thanh khi tải lên." Cap ~20 MB.

**R26 Per-browser data (C31).** Demo chip menu states "Dữ liệu mẫu lưu riêng trên từng trình duyệt" + "Khôi phục dữ liệu mẫu".
Review journeys: one browser, two tabs.

**R27 A11y (C32).** Decorative phone mock `inert` + `aria-hidden` + one-line text alternative. Toasts pause on hover/focus;
undo ≥ 10 s and also available from record history.

**R28 Data model additions (C33).** `booking_requests.snapshot.pet_id?`, `web_accounts.salutation`, `account_seen {account_id,
key, seen_at}`. Staff session on the public booking form → "Bạn đang đăng nhập bằng tài khoản nhân viên. Hãy dùng 'Tạo lịch
hẹn' trong khu nhân viên." with submit disabled.

**R29 — thay bằng R34 (20/10/2026).** **R29 Services section look (owner, 19/10/2026).** Homepage "Dịch vụ" follows the hero ("Quỹ đạo nối tiếp"): warm
gradient continuing from the hero, one dotted/solid orbit curve above the cards (draws once, then still), hero-style glass
frames tilted ±2–3° (straighten on hover/focus), glass cards riding the curve (outer high, inner low on desktop), heading
accent "*bé*" in orange italic, subtitle in the hero pill. Names, order, copy, CTAs and the call-only emergency card unchanged.

**R30 — thay bằng R34 (20/10/2026).** **R30 Giới thiệu right after the hero (owner, 19/10/2026).** Homepage order: Hero → Giới thiệu → Dịch vụ → Đặt lịch →
Tài khoản khách hàng → Liên hệ; header/footer menus follow (Trang chủ · Giới thiệu · Dịch vụ · Liên hệ). Giới thiệu is the
owner-approved v3 (web-b-nh-vi-n @ ee11ffa, 17/10): the three largest hero frames fly into three slots while the section is
pinned for one scroll beat; vendored hero script updated to v3 (port wiring only). Slots keep the illustration photos of the
frames that land ("Ảnh minh họa", no "Gợi ý ảnh" captions); intro text is the sample paragraph ("Nội dung mẫu") + facts
(cấp cứu 24/24 · địa chỉ · hotline) + "Chỉ đường". Reduced motion / paused: static slots with the same photos.

**R31 — thay bằng R34 (20/10/2026).** **R31 Linked transitions (owner, 19/10/2026).** Only between related pages, each with its own effect, no loops (only the
hero loops); scroll-linked effects run backwards on scroll-up; reduced motion shows final states. (1) Giới thiệu → Dịch vụ:
the services orbit is drawn by the scroll, paw prints appear as the tip passes, cards drop onto the curve in order.
(2) Dịch vụ → Đặt lịch: a scroll-drawn line from the orbit's orange end runs down the margin into the step rail; step dots
light with self-drawing icons; a service card's button flies its icon into the matching form choice (+ small sparkle).
(3) Trang chủ → Đăng nhập / Đăng ký (desktop, View Transitions browsers): the hero orbit and three frames morph into the
portal's orbit window; others keep the zone fade; return trip keeps the fade.

## 3. Still open (not blocking P0)
- Whether customers may download videos (default: no).
- Final legal/consent copy for videos and personal data (demo uses placeholder consent text marked "Nội dung mẫu").
- Real photos/videos from the hospital (owner will send later).

**R32 — thay bằng R34 (20/10/2026).** **R32 Card shapes and shadows (owner, 20/10/2026).** Public site only. Not every card is uniformly rounded: each group has
its own corner signature ("bo lệch") and a tinted shadow ("bóng màu"): Dịch vụ = "tai thú" (three 40 px corners, one 8 px
corner alternating along the row) with a solid ghost in the service tint; booking form = "phiếu khám" (56 px top-left,
folded top-right) with a lilac ghost; emergency note = pill on the left; account tiles = leaves in a checkerboard with
badge-tint ghosts; contact rows = tickets (round left, notched right, tint strip); map = arched window. Customer and staff
zones keep their calm, uniform cards. Tokens `--sh-plum`, `--sh-plum-lift`; cards set `--tint` / `--ghost` locally.

**R33 Inpatient money, Spa rights, device videos (owner, 20/10/2026 — spec `docs/superpowers/specs/2026-10-20-noi-tru-day-du-design.md`).**
(1) The inpatient day charge (LT01 Nội trú mèo · LT02 Nội trú chó dưới 15 kg · LT03 Nội trú chó từ 15 kg) is billed **by the
hour**: hours ÷ 24 rounded **up to 0,1 day**, minimum 0,1 (6 h → 0,3 · 24 h → 1 · 52 h → 2,2); line totals round to whole đồng.
(2) It is suggested from species + weight only; a pet **without a weight** gets no day line by default (staff choose).
(3) At discharge the day line on the stay's **draft** invoice is set to the hours actually stayed; an issued invoice never
changes, and a day line staff removed is not added back. (4) "Nhân viên Spa" gains `inpatient.admit` (admit, transfer,
discharge, and change "Tình trạng nội bộ" — owner confirmed 20/10/2026) and `inpatient.share` (share diary and videos); still no `inpatient.clinical`. (5) Device videos: video files
only, ≤ 20 MB **and ≤ 15 s** (redesign §3.2), always played muted, kept only in the uploading browser (IndexedDB), deleted
with the 60-day purge, with "Xóa video" and with "Khôi phục dữ liệu mẫu".

**R34 Public site, booking page, login — redesign part 2 (owner, 20/10/2026 — spec `docs/superpowers/specs/2026-10-20-phan-2-cong-khai-dat-lich-dang-nhap-design.md`).**
(1) Homepage order: Hero (unchanged, the only loop) → Giới thiệu (text + three points beside a clinic photo) → Dịch vụ as
**tabs** "Khám & điều trị · Nội trú · Spa & grooming" (mockup names and order; three sample items each) → a separate
**Cấp cứu 24/24 strip** (call only, no booking) → **Đội ngũ** ("Bác sĩ trưởng · Lê Thái Sơn · Đồng hành cùng thú cưng mỗi
ngày.", real photo, no credentials) → a booking band → Tài khoản khách hàng → Liên hệ, as flat cards. (2) The booking form is
its **own page `#/dat-lich`** (two columns, steps, hotline); `?dich-vu=` preselects. (3) Booking has an optional **time slot**
(08:00–10:00 · 10:00–12:00 · 14:00–16:00 · 16:00–18:00 · 18:00–20:00 — placeholder hours until the owner sends the real
ones; this replaces "no opening hours on the web"). (4) Login/sign-up: photo + card; **"Ghi nhớ đăng nhập"** keeps a
customer signed in for 30 days in this browser (staff never). (5) The linked effects of R30/R31 (pinned frame flight,
services orbit, booking thread, homepage → portal morph) and the R29/R32 card styling are removed; sections appear once
(8–12 px, ≤ 450 ms). R15's service labels stay in the booking form.


**R35 Customer zone — redesign part 3 (owner, 21/10/2026 — spec `docs/superpowers/specs/2026-10-21-phan-3-khu-khach-design.md`).**
(1) The customer zone keeps a **left sidebar** (owner's change from the mockup's top bar: room for more tasks and easy to tell apart
from the public site): Tổng quan · Thú cưng · Lịch hẹn · Nội trú · Hóa đơn · Tài khoản, hotline card, the signed-in name and
"Đăng xuất"; phones: top bar (logo, bell, account menu) and a five-item bottom bar. (2) The **bell** lists up to 10 updates of
the last 30 days (diary, video, request changes, new invoices) with a day and part of day only — never a clock time, medicine
or staff name; opening it marks everything seen. (3) **Yêu cầu đổi lịch**: a customer asks to move a confirmed appointment that
has not happened (date from tomorrow, optional slot and reason ≤ 200 characters, one pending request per appointment); the
appointment stays until staff call, move it in the calendar (the wish closes) or choose "Không đổi". (4) Pet profile shows
weight and a **"Tình trạng chung"** block: the latest shared diary line per category (Ăn uống, Nghỉ ngơi, Tinh thần, Vận động,
never "Lời nhắn") plus the weight; no block when there is nothing. (5) Lịch hẹn tabs are **Sắp tới · Đang xử lý · Lịch sử**
("Đang xử lý" kept so an unconfirmed request is not mixed with an appointment); past rows read "Đã qua" or their request outcome
— never "Hoàn thành". (6) Nội trú is **"Hôm nay của bé"**: pick a pet and a day (field and arrows, `?ngay=`), that day's video
(muted, never autoplays) and diary by part of day. (7) Hóa đơn: list beside the invoice; "Tải hóa đơn" opens the print sheet
(save as PDF in the browser); payment stays at the counter. (8) Customers cannot upload pet photos yet. (9) Type and numbers
follow the owner's standard of 21/10/2026 (numbers, money, codes, phones in Be Vietnam Pro; uppercase labels tracked 0.04–0.08 em;
staff titles Be Vietnam Pro 600) and the icon set is **Phosphor Duotone** (owner, 21/10/2026), colours unchanged.

**R36 Staff data: customer editing, price list writes, revenue by category (owner, 21/10/2026 — spec `docs/superpowers/specs/2026-10-21-phan-4-du-lieu-nhan-vien-design.md`).**
(1) Staff with `customers.edit` can edit customers and pets (weight 0,1–120 kg, colour, neutered, internal note); pet photos are not editable in the demo.
(2) A phone number already used by another customer **warns, never blocks** (a family may share a number). (3) Only the manager
(`pricelist.edit`) adds and edits price items and switches them on or off; codes are generated (KB10…); a price change never alters
lines already on invoices; a switched-off item cannot be added to an invoice but a draft already holding it still saves; the
inpatient day items LT01–LT03 cannot be switched off or made open-price. (4) An open-price item may carry a **reference price**,
a hint the invoice editor pre-fills; the API never applies it. (5) Revenue by category is counted on issued invoices **after
discount** and adds up to the invoiced total. (6) List paging stays in the UI for the demo.

**R37 Staff zone — redesign part 4A: base look, appointments, invoices (owner, 21/10/2026 — spec `docs/superpowers/specs/2026-10-21-phan-4a-nhan-vien-lich-hoa-don-design.md`).**
(1) Staff pages share the customer zone's look: breadcrumb ("Tổng quan › …"), flat cards, flat plum sidebar (the paw trail is gone),
paged tables. (2) After the owner's review of 21/10: **buttons and inputs are 6 px, cards and images 12 px** across all three zones
(status pills, tabs and chip groups stay pill-shaped; the hero and the booking "phiếu khám" keep their own shapes); on phones the
booking page folds its three steps under one line and the demo chip is a small icon button that hides while a field has focus.
(3) **Lịch hẹn**: day and week grids (week = seven day columns on one hour axis, the window widens past 07–21 for early/late
appointments), appointments that overlap in time stand side by side, a quick search dims what does not match; an appointment opens
in a **side panel** (a page of its own on phones, `?lich=`, system Back returns to the list) with Đổi lịch · Hủy lịch · Tạo hóa đơn;
an appointment has **no "Xác nhận"** (R8) and no drag-to-move. A customer's reschedule wish shows in the panel ("Dời theo mong
muốn" / "Không đổi"). (4) **Overlap rule (owner chose "block")**: the same assignee may not have two overlapping appointments
(cancelled ones ignored, touching ones such as 09:30 are fine); the rule belongs to the data branch (request logged in
`PROGRESS.md`); the UI shows the API error at the time field and still lays overlapping data side by side. (5) **Hóa đơn**:
paged list; the draft editor shows the invoice **as the customer will read it** beside the editing column (folded under a button on
screens under 1100 px), lines still come only from the price list ("Thêm dịch vụ" picker), the save label says "Chưa lưu thay đổi"
until a real save and "Đã lưu" only after one, "Phát hành hóa đơn" is disabled without lines; an issued invoice always shows the
customer view beside it. (6) **Video stays at 15 s / 20 MB** (the 21/10 review and a later plan said 20 s; the owner kept 15 s).
(7) Not done: moving appointments by drag, reordering invoice lines, count-up animation removal on revenue (owner did not choose it).

**R38 Staff zone — redesign part 4B: Khách hàng (owner, 21/10/2026 — spec `docs/superpowers/specs/2026-10-21-phan-4b-nhan-vien-khach-hang-design.md`).**
(1) The customer list is the shared paged table (pet photos stacked up to three, "Nội trú" tag, web-account tag, nearest appointment,
amount owed); search stays accent-free. (2) The record is two columns from 1100 px (info card beside the tabs), the card above the
tabs below that; tabs: Thú cưng · Lịch hẹn · Hóa đơn · Nội trú · Tài khoản web · **Lịch sử tương tác**. (3) `customers.edit` (Manager,
Doctor; not Spa) adds and edits customers and pets; a phone shared with **another** customer warns and still saves (the customer's
own number never warns). (4) Edit forms send the version they opened with; a newer save elsewhere answers "vừa được người khác cập
nhật", closes the form and the record reloads — a stale form never overwrites. (5) **Pet alerts are always sent as ticked**: unticking
all clears them (the form says so); an alert outside the usual list stays ticked so saving does not silently drop it. Weight is
0,1–120 kg, one decimal. (6) The history tab shows the API's own list (newest first, at most 50); billing rows need
`invoices.create`/`payments.record` and stays need `inpatient.view`, and a row links only to pages the viewer may open. Appointments
have no page of their own there. (7) Not done: merging or deleting customers, editing pet photos, a mockup-based layout pass (waits
for the "Khách hàng & hồ sơ" mockup).

**R39 Staff zone — redesign part 4C: Nội trú (owner, 21/10/2026 — spec `docs/superpowers/specs/2026-10-21-phan-4c-nhan-vien-noi-tru-design.md`).**
(1) The cage board shows three summary numbers (bé đang nội trú · chuồng trống · cần gửi nhật ký hôm nay), a zone filter, and one "next step" line per tile; an empty cage is a button that opens "Nhập viện" with that cage chosen. (2) One pet's page is two columns from 1100 px (info card beside the tabs): a progress strip (Nhập viện → Đang chăm sóc → Sẵn sàng về → Đã xuất viện, orientation only), the pet and owner, how long it has stayed, the internal status, the running day charge, what the owner can see, a gentle "Việc nên làm" list, and the actions; tabs: Hồ sơ nội bộ (only `inpatient.clinical`) · Nhật ký cho chủ nuôi · Video · Hóa đơn · **Lịch sử** (grouped by day; the API already hides orders and care from people without `inpatient.clinical`). (3) **"Nhập viện" is three steps** (owner chose it over one long form): choose the pet (or from today's appointments), cage and care details, bill and confirm; an API error returns the person to the step that owns the field and typed data is kept; the cage is sent as chosen even if just taken so the API explains why. (4) "Chuyển chuồng" offers quick reasons (Cách ly · Đổi khu · Gần bác sĩ hơn · Khác, ≤ 200 characters). (5) "Xuất viện" shows the bill summary computed by the hour (rounded up to 0,1 day), recomputed when the time changes; reminders about draft diary entries, draft videos and an unissued invoice are **only reminders**; an untouched time means "now" so discharging at once never lands before admission. (6) "Tải video lên" is three steps (Chọn video → Lời nhắn → Chia sẻ), limits (MP4, MOV, WebM · tối đa 15 giây · 20 MB) shown up front and checked as soon as a file is chosen; an unreadable length is accepted and shown as "—". (7) A dialog that is already open stays open if another tab changes the pet meanwhile, so saving explains it ("vừa được người khác cập nhật" / "Bé đã xuất viện.") instead of the form vanishing. (8) Invoice line quantities use a decimal comma ("0,1", "2,2") everywhere, including the owner's invoice sheet. (9) No data or contract change. Not done: editing cages, owners downloading videos, check-in.

**R40 Staff zone — part 5 (first batch): stock, operations report, settings, staff support (owner, 21/10/2026 — spec `docs/superpowers/specs/2026-10-21-phan-5-kho-bao-cao-cai-dat-design.md`; numbered R38 on the data branch before the merge, renumbered because R38 was already part 4B).**
(1) **Kho** is standalone: it lists medicines and supplies with quantity, a low-stock threshold and a nearest expiry, and records
every delivery, use and stock-take as a movement; it does **not** deduct stock from treatments or invoices. Customers never see
it (R7). (2) **Báo cáo vận hành** is computed from existing data (appointments, booking requests, inpatient, new customers, stock,
a revenue summary) with a "versus previous period" figure; no figure is typed in by hand. (3) **Cài đặt** covers staff accounts
and permissions (manager), the personal profile, read-only hospital information, personal preferences, manager-only system
settings and **staff-only** support (help articles, "why can't I see…", suggestions and bug reports); no customer-facing support
in this batch. (4) New capabilities (`stock.view`, `stock.manage`, then `reports.operations`, `staff.manage`, `settings.manage`,
`support.inbox`) are held by the manager only; the doctor and spa presets do not change, and the manager can grant single
capabilities. (5) Sample data and behaviour that already exist do not change. (6) Not in this batch: Khám bệnh and Dịch vụ (wait for
the owner's service list), editable booking time slots (wait for real hours), stock batches, CSV import/export.

**R41 Staff zone — redesign part 4D: Bảng giá và Doanh thu (owner, 22/10/2026 — spec `docs/superpowers/specs/2026-10-22-phan-4d-nhan-vien-bang-gia-doanh-thu-design.md`).**
(1) **Bảng giá** is the shared paged table with search and two filter groups (service group, and status — by default only items in use, with counts); people with `pricelist.edit` (manager) add and edit a service in **one dialog** (the owner chose a dialog over editing in the table row): group (fixed after creation), name, unit, price mode (fixed / entered when making the invoice), price or a suggested price, and who sees it (only the exam group chooses; medicine and supply are always one combined line, spa and inpatient always itemized); the dialog says that a new price applies only to invoices made afterwards. (2) Switching a service off asks first and explains that it leaves new invoices but a draft that has it still saves and old invoices stay; switching on needs no question; the three inpatient day items cannot be switched off or become entered-price items and say why. (3) Doctors and Spa only view. (4) **Doanh thu** keeps the four fixed periods and adds **"Chọn ngày"** (the owner asked for it): two date fields, checked in the interface with the shared calendar rules (real dates, from ≤ to, at most 366 days, years 2000–2100, the standard messages) because the revenue API does not check the range; a bad range never reaches the API and the figures on screen stay. The chosen period lives in the address (`?tu=…&den=…`), a broken address falls back to this month. (5) A closed "Cách tính" note says that money collected, invoiced-by-group and outstanding use different bases. (6) The daily chart, the group bars and the open-invoice list each have a table twin or are tables; the group bars show a whole-percent share (largest remainder, adds to 100); ranges over 120 days draw weekly bars so the chart fits a phone. (7) No data or contract change. Not done: editing in the table row, bulk edits, deleting a service, CSV export.

**R42 Staff zone — redesign part 5A: Kho (owner, 22/10/2026 — spec `docs/superpowers/specs/2026-10-22-phan-5a-nhan-vien-kho-design.md`, plan `docs/superpowers/plans/2026-10-22-phan-5a-nhan-vien-kho.md`).**
(1) **Kho** is a menu entry for people with `stock.view` (by default only the manager); customers never see it. Buttons that write (add, edit, receive, issue, stock-take, switch off/on) need `stock.manage` together with `stock.view` and are hidden, not greyed, without it. (2) The list has four summary tiles that are also buttons (Sắp hết, Hết hàng, Sắp hết hạn, Đã hết hạn); "Sắp hết hạn" and "Đã hết hạn" both turn on the one expiry filter of the API, shown as the chip "Sắp hoặc đã hết hạn". Search (no accents), a kind filter, a status filter and "Hiện cả món đã ngừng dùng"; all filters live in the address (`?q=&loai=&tt=&ngung=1`) and a broken address falls back to the defaults. Level and expiry are always words (Ổn / Sắp hết / Hết hàng; Sắp hết hạn / Đã hết hạn; Ngừng dùng), never colour alone. (3) The item page shows the quantity, one or two plain sentences about what is wrong ("Còn 3 hộp, thấp hơn mức báo hết 5.", "Hết hạn từ …"), the facts, and the last 100 movements newest first. (4) One dialog adds or edits an item: the kind is locked after creation, there is no quantity box when editing (the quantity moves only through Nhập thêm, Xuất ra and Kiểm kê, so the history always adds up), and the warning level starts at the system setting `stock_default_min` (5 without it); 0 means "no low warning", but out of stock is still reported. (5) Nhập thêm shows the stock after receiving; Xuất ra explains "Kho chỉ còn N <đơn vị>." under the box and writes a reason; Kiểm kê shows the difference as the person types and writes a Kiểm kê line. (6) Switching off asks first and says what happens; switching back on does not ask. An item that is switched off cannot be received, issued or counted, and says why. (7) Every dialog sends the version it opened with; a second tab that saved first gets the standard "vừa được người khác cập nhật" message and the dialog closes, nothing is overwritten. (8) No data or contract change. Not done: charts, printing or exporting the list, several items at once, barcodes, linking stock to invoices.

**R43 Design direction (owner, 22/10/2026).** Two reference blends, taken from the `awesome-design-md` collection (structure only, never colours, fonts, logos or copy): **the introduction website = Stripe 70% + Linear 30%** (cream-white ground, brand purple, soft gradient behind the pet photos, prominent headings, airy layout, refined motion); **the management system = Linear 85% + Stripe 15%** (compact sidebar, clear work tables, readable medical records, purple as the accent, **no gradient inside data areas**). The project's own tokens, fonts (Be Vietnam Pro, Lora) and brand colours always win over a reference. The skills `taste-skill` and `awesome-design-md` are used when designing; `taste-skill` is written for landing pages, so on staff screens only its layout discipline and pre-flight list apply. Earlier staff screens (4A to 5A) are not redone now; they are checked against this direction when the owner asks.

**R44 Staff zone — redesign part 5B: Báo cáo vận hành (owner, 22/10/2026 — spec `docs/superpowers/specs/2026-10-22-phan-5b-nhan-vien-bao-cao-van-hanh-design.md`, plan `docs/superpowers/plans/2026-10-22-phan-5b-nhan-vien-bao-cao-van-hanh.md`).**
(1) **Báo cáo** is a menu entry for people with `reports.operations` (by default only the manager), just before Doanh thu; the money block shows only to people who also hold `reports.revenue`. (2) The period picker is the one Doanh thu uses (Hôm nay · 7 ngày · Tháng này · Tháng trước · Chọn ngày) and opens on **7 ngày**; the state is shared in `usePeriodRange(fallback)` and the period lives in the address; a broken address falls back to 7 days; a bad free range never reaches the report. Two lines name the days of the numbers on screen ("Kỳ này", "Kỳ trước"), taken from the report itself, so they always match. (3) First row: one strip of four numbers (Lịch đã hẹn, Yêu cầu nhận, Khách mới, Lượt nhập nội trú), each against the period before **in words** ("nhiều hơn kỳ trước 3"), and "Cần chú ý lúc này" (waiting requests; stock out, low, expiring, expired), which does not depend on the period and links only to pages the person may open. (4) Lịch hẹn: a one-line summary, a daily bar chart with a table twin (weekly bars past 120 days), and splits by service and by source; Yêu cầu đặt lịch: received, confirmation rate, average first response, and the six statuses; Nội trú: current stays, in and out, bed-days and occupancy, each explained in plain words; Doanh thu trong kỳ: collected, invoiced, outstanding. Every split adds up to the number it splits. (5) A rate that cannot be worked out reads **"Chưa có"**, never 0% or NaN. A period with nothing in it says so and hides only the Lịch hẹn and Yêu cầu blocks (Nội trú stays: current stays are not tied to the period). (6) **No per-person bar** (the owner dropped "theo người phụ trách"). (7) Look: R43, Linear 85% + Stripe 15%: flat panels with hairlines, one plum accent, light even-width figures (weight 500, the 300 weight is not packaged), no gradient in data areas. (8) No data change. Not done: export, print, row-level tables, custom charts.

**R45 Staff zone — redesign part 5C: Cài đặt (owner, 22/10/2026 — spec `docs/superpowers/specs/2026-10-22-phan-5c-nhan-vien-cai-dat-design.md`, plan `docs/superpowers/plans/2026-10-22-phan-5c-nhan-vien-cai-dat.md`).**
(1) **Cài đặt** is the last menu entry for every staff member, with four pages: Hồ sơ của tôi, Thông tin bệnh viện, Tài khoản nhân viên (`staff.manage`) and Cài đặt hệ thống (everyone sees it, only `settings.manage` changes it). The side list offers only pages the person may open; the bare address opens Hồ sơ của tôi. (2) **Hồ sơ của tôi:** change your own display name and password (three boxes, each mistake under its own box); the title is read-only ("Chỉ Quản lý sửa được chức danh."); "Quyền của tôi" is now a section of this page, grouped by work area, and the old dialog is gone. (3) **Thông tin bệnh viện** is read-only and word for word the project facts ("24/24" only beside Cấp cứu). (4) **Tài khoản nhân viên:** one table (name with username and a "Bạn" tag, role, "N quyền thêm", status), one add/edit dialog with the roles as ticks and the **extra rights as a tick list by work area** (rights a role already gives are ticked, locked and marked "Có theo vai"; changing roles updates them at once); a note appears when a stock-writing right lacks viewing the stock. The manager can give any person any of the four stock rights (Nhập thêm, Xuất ra, Kiểm kê, Thêm/sửa/ngừng món) separately. Resetting someone else's password is a manager's typed password with "Hãy báo cho họ; họ đổi lại ở Hồ sơ của họ."; your own row has no such button and no switch-off button, and the dialog says why. Two safety rules reach the screen in the API's own words: you cannot switch yourself off, and the last active manager can neither be switched off nor lose the manager role. Switching off asks first; switching on does not. New accounts are sample accounts. (5) **Cài đặt hệ thống:** one form with one Save that sends only what changed and the version it read; groups Giờ và lịch, Kho, Thanh toán, Yêu cầu đặt lịch, Ngày lễ, Quy định cố định (read-only). A mistake lands under its own box and the typed text stays. **Ngày lễ:** the owner's option A: the hospital still works but only until 19:00, customers can still book outside the slots after 19:00, the note is for staff only, no surcharge; a day that is not real or already listed is refused before anything is sent. The page says plainly that applying these settings to the calendar, invoices and requests is the next step (5D). (6) **Kho follows the four rights:** each action button shows only for the person who holds that right (and can view the stock); the old umbrella `stock.manage` is offered in the picker only to someone who still holds it. (7) Look: R43. (8) No data change. Not done: applying the settings, personal options (5D), help and support (5E).

**R46 Staff zone — redesign part 5D: Tùy chọn của tôi and applying the system settings (owner, 22/10/2026 — spec `docs/superpowers/specs/2026-10-22-phan-5d-nhan-vien-tuy-chon-ap-dung-design.md`, plan `docs/superpowers/plans/2026-10-22-phan-5d-nhan-vien-tuy-chon-ap-dung.md`).**
(1) **Tùy chọn của tôi** is the second page of Cài đặt (`#/nv/cai-dat/tuy-chon`), for every staff member, about themselves only. **A choice is saved the moment it is made** (only the key just changed is sent), with a "Đã lưu." line; "Về mặc định" asks first. Groups: Giao diện (cỡ chữ, độ dày bảng, chuyển động), Khi đăng nhập (trang vào), Màn hình làm việc (kiểu xem lịch, số dòng mỗi trang, khoảng ngày báo cáo), Nhắc việc. Trang vào and the nudge switches list only what the role may open or receive. (2) **Effects:** large text zooms the staff area by 12.5% (`html[data-staff-text]`, only while a staff member is signed in, removed on sign-out); compact density shortens table rows (never below 40 px); "Luôn giảm" gives the same as a device that asks for less motion (no slide, zoom or bounce, only short fades, CSS transitions to 0) through the `useReducedMotion` wrapper in `@/ui/motion` for the kit and staff screens; sign-in without a `?tiep` link opens the chosen landing page (the data layer already lowers it to the overview if the right is gone); the calendar opens in the chosen view when the address names none, and **the default is Ngày** (the data layer's default was changed to match); every staff table uses the chosen rows per page (20 by default; the chart table twins and the open-invoices table keep their own); **Báo cáo and Doanh thu both open on the chosen period, 7 days by default** (Doanh thu used to open on Tháng này), and the period picker has a new "30 ngày". (3) **Nhắc việc** block at the top of Tổng quan: one line per kind switched on and with something to do (requests waiting, reschedule requests, stock out or low, draft invoices older than 2 days, a demo threshold), each a link to where it is handled; no line, no block; the pop-up for a new request follows the requests switch. (4) **System settings now take effect:** default durations of exam and spa in the new-appointment and confirm forms (inpatient stays 30), the calendar grid hours (08:00 to 21:00 by default, widened for anything outside), only the payment methods that are on in the payment box (never empty), a "Quá hạn" tag on late requests and a count on the overview tile, and holidays marked on the day and week views with a warning (not a block) when a visit ends after 19:00. The customer-facing holiday note and the surcharge are not part of this. (5) No data change. Not done: onboarding list and help (5E), more personal options, customer-side holiday note.

**R47 Staff zone — redesign part 5E: Trợ giúp and support (owner, 22/10/2026 — spec `docs/superpowers/specs/2026-10-22-phan-5e-nhan-vien-tro-giup-ho-tro-design.md`, plan `docs/superpowers/plans/2026-10-22-phan-5e-nhan-vien-tro-giup-ho-tro.md`).**
(1) **Trợ giúp** is the last menu entry (`#/nv/tro-giup`) for every staff member, with tabs: Hướng dẫn, Góp ý của tôi and, only for whoever has `support.inbox`, **Hộp thư on the same page** (owner choice, not a separate menu entry; the tab label carries the count of Mới tickets; a person without the right who types `?tab=hop-thu` lands on Hướng dẫn). (2) **Hướng dẫn:** search without accents, only the articles the person's rights allow, live count, "Nội dung mẫu" tag; an unknown `?bai=` is dropped. (3) **A blocked page explains itself:** the "no access" page says which right is missing and links to the article about rights; the profile menu has "Hỏi hoặc góp ý", which opens Góp ý with the screen name filled in. (4) **Việc đầu tiên** on the overview: eight tasks that **tick themselves when the person really does the thing** (owner choice), a progress line, "Ẩn danh sách"; shown or hidden again in Tùy chọn; **"Về mặc định" also resets it** (said in its confirm box). (5) **Góp ý:** three kinds (Hỏi cách dùng, Báo lỗi, Góp ý), title up to 80, content up to 1000, screen up to 100 characters with a counter, a repeat of the same ticket is refused, own tickets listed with the manager's answer. (6) **Hộp thư:** filter by state, a dialog per ticket, "Đánh dấu đang xem", reply up to 500 characters (can be answered again); two managers answering the same ticket get the usual "vừa được người khác cập nhật" and nothing is overwritten. (7) No data change in this part. Not done: attachments, push notices, a badge on the menu entry.

**R48 Public site — redesign part 6A: the introduction page below the hero (owner, 22/10/2026 — spec `docs/superpowers/specs/2026-10-22-phan-6-trang-gioi-thieu-design.md`, plan `docs/superpowers/plans/2026-10-22-phan-6a-trang-gioi-thieu.md`).**
(1) The hero stays as approved. Below it, nine sections in this order: Giới thiệu "An tâm gửi gắm", Dịch vụ, Đội ngũ, Câu chuyện điều trị, Không gian, Sản phẩm nổi bật, Quy trình, Hỏi đáp, Đặt lịch và liên hệ. Old anchors `/gioi-thieu`, `/dich-vu`, `/lien-he` stay; the new sections are anchors only (no new routes). The old booking band and the account-teaser block are gone. (2) **One page background** (`#F2EFF3`) with tokens `--pub-*` that exist only inside `[data-pub]`, so the hero and both work areas never see them; one very soft plum glow behind the main photo of Giới thiệu and a **thin plum thread** down the page that is drawn as the person scrolls (already full under reduced motion; not drawn under 640 px). Buttons 4 to 6 px, photos 0 to 8 px, no pill buttons, no cards inside cards. Orange (3.69:1) is for large display text and shapes only. (3) **Dịch vụ:** numbered rows 01 to 03 with a one-line description, one sticky photo that follows the chosen row (hover or keyboard focus previews it, tap or Enter opens it), the Cấp cứu 24/24 strip unchanged (call only), then a **CTA below it**: "Đặt lịch khám" inside opening hours (08:00 to 21:00 every day, holidays until 19:00), "Gọi 097 355 51 05" outside them, with the line "Chưa chắc chọn dịch vụ nào? Lê Sơn sẽ tư vấn khi gọi lại." The clock is the demo clock; the homepage reads it on mount and every minute. (4) **Câu chuyện điều trị:** one lead and up to two beside it from `public.featured.cases()`; "Đọc câu chuyện" opens the whole story in a dialog on the same page (focus returns to the button); none shown hides the whole section. **Sản phẩm nổi bật:** at most six from `public.featured.products()`, **no price and no "bán chạy" label**, group buttons only with two or more groups, "Hỏi mua" calls the hospital for now; none shown hides the whole section. (5) Quy trình (four steps, the joining line drawn on scroll) and Hỏi đáp (keyboard accordion) are sample text until the owner confirms them; Đội ngũ shows only the head doctor, the other places stay empty and labelled; Không gian uses stock pictures labelled "Ảnh minh họa". (6) Đặt lịch và liên hệ: address, hotline, **opening hours kept apart from Cấp cứu 24/24**, directions, Facebook; the main button follows the clock; two entries with different names, "Đặt lịch khám" and "Đăng nhập theo dõi bé" (a signed-in customer sees "Vào tài khoản của bạn"). (7) No data change. Waiting on the data branch: `public.inquiries.submit` (leave-a-message box, part 6B). Not done: parts 6B (out-of-hours message box and holiday note on the booking pages), 6C (Quản lý screen "Nội dung trang giới thiệu"), 6D (video upload dialog wording), detail pages, "Xem tất cả", cart, prices, holiday surcharge, a fixed call bar.

**R49 Public site — redesign part 6B: leaving a message, out-of-hours booking, holidays (owner, 23/10/2026 — spec `docs/superpowers/specs/2026-10-23-phan-6b-loi-nhan-ngoai-gio-design.md`, plan `docs/superpowers/plans/2026-10-23-phan-6b-loi-nhan-ngoai-gio.md`).**
(1) **"Để lại lời nhắn" is one dialog** used in three places: the "Hỏi mua" button of a featured product (with "Bạn hỏi về: <tên>"), the end of the intro page and the Dịch vụ CTA when the hospital is closed, and the booking page when "Giờ khác" is chosen. Name (filled in for a signed-in customer), phone, message up to 500 characters with a counter; every refusal is the data layer's own sentence (three a day per number points to the hotline; a staff account is refused with its own sentence); sending twice in one instant makes one message; each opening starts empty. (2) **Booking pages (`/dat-lich`, `/khach-hang/dat-lich`):** the slot box gains a last choice "Giờ khác (ngoài giờ làm việc)"; choosing it shows the fixed sentence at once, replaces "Gửi yêu cầu" with "Gọi 097 355 51 05" and "Để lại lời nhắn", and keeps everything typed. **On a holiday** only the slots that end by 19:00 are offered with the line "Ngày này Lê Sơn làm đến 19:00."; a chosen slot that no longer fits is dropped with a sentence saying why. No word about a holiday surcharge. (3) **Staff:** a block "Lời nhắn của khách" at the top of Yêu cầu đặt lịch for whoever holds `requests.handle` (by default only the Quản lý; a doctor needs the right granted, the Spa never): name, phone to call, the message, the product asked about, an overdue tag, "Đã gọi lại" with the person's name and time; a filter between waiting and called back; the block hides when nothing waits and beside a request's detail. (4) No data change. Not done: live chat, a history of messages for the customer, a reminder on Tổng quan, push notices, holiday surcharge; parts 6C (Quản lý screen "Nội dung trang giới thiệu") and 6D (video upload dialog wording).

**R50 Staff — redesign part 6C: the screen "Nội dung trang giới thiệu" (owner, 23/10/2026 — spec `docs/superpowers/specs/2026-10-23-phan-6c-noi-dung-trang-gioi-thieu-design.md`, plan `docs/superpowers/plans/2026-10-23-phan-6c-noi-dung-trang-gioi-thieu.md`).**
(1) **Who and where:** whoever holds `content.publish` (by default the Quản lý and the Bác sĩ; a Spa only if the right is granted) sees the menu entry "Trang giới thiệu" (after Bảng giá, before Báo cáo) and the screen `/nv/trang-gioi-thieu`; the right moves from "Báo cáo và cài đặt" to its own group "Nội dung" in the staff account screen. (2) **Two tabs** kept in the address: Sản phẩm (default) and Câu chuyện, each with a counter "Đã dùng x/30 mục" (hidden items count), a "Thêm" button and a table: picture, name, group or pet, status Đang hiện/Đang ẩn, the tag "Nội dung mẫu" until the item is edited, who changed it and when (stories also who confirmed the owner's consent and when). Per row: Sửa, Ẩn/Hiện lại (at once, no question) and Xóa (asks first and says it is for good). A link "Xem trang giới thiệu" opens the public page in a new tab. (3) **Dialogs:** product = name, group, note with a counter, picture; story = title, pet's name, species, story with a counter, picture and the box "Chủ nuôi đã đồng ý cho đăng câu chuyện này" which starts empty on every opening and is required on every save; no price box (the price is kept if one exists but is never shown, until the owner sends the price list); a fixed reminder not to write medicine names, doses, customers' names or phone numbers. Every refusal is the data layer's own sentence under the box it names. (4) **Picture:** JPG, PNG or WebP up to 5 MB, refused at once with the rules' sentence; the words are saved first and the picture second, so a picture that fails leaves the words saved, keeps the dialog open on that item and says "Đã lưu nội dung, nhưng ảnh chưa tải được: …"; saving again never makes a second item; the preview address is freed when the file is replaced, dropped or the dialog closes. (5) **Races:** the version is read again at the moment of a hide, show or delete; a stale save is told "vừa được người khác cập nhật" and the dialog closes; losing the right while the screen is open gives way to the no-rights page. (6) No data change. Not done: price on the public card, "bán chạy", ordering or pinning, scheduled posting, several pictures per item, a page per story, a publish date; a help article for this screen is asked from the data branch.

**R51 Public site — redesign part 7: the hero and the intro page told "from worry to reassurance" (owner, 23/10/2026 — spec `docs/superpowers/specs/2026-10-23-phan-7-lam-lai-trang-gioi-thieu-design.md`, plan `docs/superpowers/plans/2026-10-23-phan-7-lam-lai-trang-gioi-thieu.md`). Replaces parts of R48 and the "hero stays as approved" rule.**
(1) **The owner allowed the hero to be redone** and wanted the page warmer, with more pet feeling, more refined and less monotone, and the scroll thread gone. (2) **Gone:** the scroll thread and its nodes, the soft glow behind the first photo, the line drawn between the Quy trình steps, the single flat background, the 5 px buttons and 0–8 px photos. (3) **Order of the sections:** Giới thiệu, Đội ngũ, Câu chuyện điều trị, Không gian, Dịch vụ, Sản phẩm nổi bật, Quy trình, Hỏi đáp, Liên hệ; each has a question under its heading ("Ai sẽ chăm bé của bạn?", …; sample wording the owner can edit) and a chapter number (a CSS counter, so a hidden section never leaves a gap). (4) **Look:** four warm bands (cream, warm white, plum tint, a stronger tint for the stories) cycled by position so neighbours always differ, ink/soft ink/plum ≥ 4.5:1 on all four (a unit test); photos 22 px round with a soft shadow; buttons 14 px; larger Lora headings; three photos bridge the boundary above (Giới thiệu over the hero from 993 px, the lead story over Đội ngũ, the contact photo over Hỏi đáp) with a drift of at most 12 px, none under reduced motion. Stories without a picture of their own show an illustrative pet photo of the same species, labelled "Ảnh minh họa". (5) **Hero:** the orbit stays; the headline is "Khi bé không khỏe, bạn không phải lo *một mình.*" (sample wording, option B), the old line became the subline; two buttons, "Gửi yêu cầu đặt lịch" and, by the clock and holidays like the rest of the page, "Gọi 097 355 51 05" or "Để lại lời nhắn"; five clear photos (four on phones and tablets, in two bands above and below the words); **a photo never touches the words, buttons, pause button or the edges**: it fades out before it would, the intro grows each photo on its own spot, and the full-width text of phones gets two free bands (taller hero). The bottom strip of the hero melts into the first section. (6) **Owner rule changed:** the orbit simulator is no longer kept "line for line" as the reference demo; the fidelity test was removed and tests of behaviour replace it. (7) No data change. Not done: real photos (the owner is to provide team, rooms, wards and consented pets), a page per story, prices, the HTML delivery.

