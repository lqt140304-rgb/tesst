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

