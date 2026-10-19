# Proposal: visual design system, motion and icons

Lens: visual design system, motion and icons. This is design only, not product code. The prose is in English for the lead. Every user-facing string is in Vietnamese and is meant to be used exactly as written.

Sources: BRIEF.md §2 (binding answers) and §3 (locked decisions); the ported hero (`/tmp/claude-0/hero/demo/hero-orbit.css`, `hero-orbit.js`, `styles.css`); the approved service icons, recovered byte-for-byte from git history (`web-b-nh-vi-n` commit `ee11ffa^:demo/services.html`); `chot-icon-services-v1.md`; `thiet-ke-hero-chot-2026-10-15.md`; `dac-ta-header-mobile-2026-10-15.md`; and the sibling proposals `proposal-customer.md` and `proposal-staff.md`, which I align with on routes, labels and states.

Validated in this lens, not just asserted:
- Every contrast number below was computed with the WCAG formula (`scratchpad/design/tools/contrast.py`).
- The Lucide icon names were checked against `lucide-static@1.59.0` (ISC licence).
- The 9 hero crops were rendered as a contact sheet (`scratchpad/design/crops/hero-crops-sheet.jpg`).
- The colour grade and duotone were tried on four photos (`crops/grade-duotone-sheet.jpg`).
- A Ken Burns clip was produced with ffmpeg 6.1 (`crops/test-kb.mp4`).

---

## 0. Key decisions at a glance

| # | Decision | Reason (one line) |
|---|---|---|
| 1 | **Light theme only, no dark mode.** Pages declare `color-scheme: only light`. | The brand is built on warm cream and plum. A second theme doubles QA. `only light` also stops Chrome Android's auto-dark from inverting the page. |
| 2 | **Teal becomes the 4th brand colour, used for "done / safe / paid" only.** Tokens are `teal-600 #23706E` and `teal-700 #1D625F`, plus the approved mint badge `#BEE4E6`. | It gives positive states their own calm hue, so plum stays the brand colour and orange stays warmth. |
| 3 | **Seven semantic "tones"** (plum, orange, teal, rose, honey, grey, outline). Every status in every zone maps to one tone, and **always has an icon and a label**. | One chip system serves all the zones. Colour never carries meaning alone. |
| 4 | **Three moods, one family.** Public: airy and editorial on cream. Customer zone: soft cards on cream. Staff zone: a calm, denser layout with a **dark plum sidebar** on a cool lilac-grey canvas. | Each zone is recognisable at a glance, and all three share type, icons and tones. |
| 5 | **Motion library: Motion (`motion` package, `motion/react`)** for everything except the hero. The hero keeps its own ported vanilla simulator, untouched. | Motion animates only transform and opacity, offers `whileInView` with `once`, exit animations, layout (FLIP) animations, scroll-linked values and a built-in reduced-motion switch. |
| 6 | **Only the hero loops.** Everything else plays **once**, or moves **only while the visitor scrolls** (parallax). Nothing blinks, pulses or shakes, and errors never shake. | This honours the owner's rule against looping, blinking and shaking outside the hero, while still delivering "many transitions and animated objects". |
| 7 | **Icons: Lucide 1.59 (ISC) as the base grammar, plus 14 hand-crafted vet and brand icons, plus the 4 approved service icons locked byte-for-byte.** All ship as one local SVG sprite. | The 4 approved icons already *are* Lucide grammar (24 grid, stroke 2, round caps and joins). Scissors and heart-pulse are Lucide paths. Matching that grammar guarantees consistency, and custom work goes where the vet subject needs it. |
| 8 | **Clinical icons (pill, syringe, IV bag, thermometer, e-collar, y lệnh) are flagged INTERNAL.** They can never render in the public site or the customer zone. | This is the visual side of the locked rule that customers must not see drug or injection information. |
| 9 | **Photos: one shared colour grade, 9 distinct hero crops from the 7 files,** a plum→cream duotone used only as texture, and SVG line illustrations for every empty, success and error state. | Seven photos (only 6 distinct scenes) can still feel rich when crops, treatments and drawings vary. |
| 10 | **Demo inpatient videos: ffmpeg Ken Burns** at 1280×720 with no audio track. A slow zoom, a slight "handheld" drift and an optional two-crop cross-fade make them feel filmed. **No CCTV look and no burned-in text.** The "Video minh họa" label is an HTML chip. | A CCTV look would imply cameras, an unconfirmed fact. Text burned into frames cannot be translated or read by screen readers. |
| 11 | **Fonts are self-hosted:** `@fontsource-variable/lora` (wght 400–700 + italic) and `@fontsource/be-vietnam-pro` 400/500/600/700, with the vietnamese + latin subsets. | gstatic is unverified from the build. The vietnamese subset includes "₫" (U+20AB). |
| 12 | **Focus rings:** 3 px plum-700, offset 3 px, on light surfaces (locked). On dark plum surfaces they are 3 px orange-400 `#FC9238` (6.61:1). Focus never animates. | The ring stays visible on every surface. |

---

## 1. Principles for this lens

1. **The hero is the show; the rest is the stage.** Nothing outside the hero competes with the orbit for attention. Other motion is shorter, smaller and one-shot.
2. **Motion explains, decoration whispers.** Each animation answers "what just happened?" (a status changed, a payment was recorded, a page opened) or "where am I?". Decorative motion appears only on the public site, and only on reveal or on scroll.
3. **Beauty from craft, not quantity.** Consistent stroke weights, optical sizing, tinted shadows, generous whitespace and Vietnamese-friendly line heights matter more than extra effects.
4. **Never colour alone, never motion alone.** Every status has an icon and a label. Every animated reveal has a correct static end state, which is exactly what reduced-motion users get.
5. **Performance is part of the look.** Animate transform and opacity only, with three documented exceptions (§4.9). The site has to feel smooth on a mid-range Android phone.

---

## 2. Design tokens

### 2.1 Colour: core palette

Existing brand values are kept exactly. New values extend the existing ramps.

| Token | Hex | Role |
|---|---|---|
| `cream-50` | `#FBF7F1` | Page background (public, customer). Locked. |
| `cream-100` | `#F7EEE5` | Hero edge tint, warm section alternation |
| `paper` | `#FFFFFF` | Cards, inputs, tables, dialogs |
| `canvas-staff` | `#F6F2F5` | Staff app background (plum-tinted neutral) |
| `ink-900` | `#231627` | Strongest text: headings in zones, table primary text |
| `ink-800` | `#3F3342` | Body text. Locked as `--ink`. |
| `ink-600` | `#5E4A62` | Secondary text and helper text. Locked as `--ink-soft`. |
| `ink-500` | `#6B5A6E` | Tertiary text, captions, placeholders |
| `ink-400` | `#8C7A90` | **Disabled text and decorative only** (3.71:1, never informative) |
| `line-200` | `#E9DEEA` | Hairlines, card borders, table dividers |
| `line-300` | `#DCCBDD` | Stronger dividers, hover borders (decorative) |
| `field-border` | `#9C82A0` | Input and checkbox borders (3.43:1 on white, which meets the 1.4.11 ≥ 3:1 requirement) |
| `plum-950` | `#2A1B2E` | Toast background, video-player chrome |
| `plum-900` | `#421247` | Display headings, approved icon colour, footer, staff sidebar. Locked. |
| `plum-800` | `#4A154E` | Primary button hover |
| `plum-700` | `#5A1E5E` | Primary brand: buttons, links, focus ring. Locked. |
| `plum-500` | `#824787` | Secondary brand, ghost-button border. Locked. |
| `plum-muted` | `#76457A` | Eyebrows. Locked. |
| `plum-300` | `#C9A8CC` | Decorative lines: orbit dashes, light paws, yarn |
| `plum-200` | `#E4C4E8` | **Approved lilac badge** |
| `plum-100` | `#F1E6F3` | Lilac chip background, selected rows |
| `plum-50` | `#F8F2F9` | Lilac wash, hover rows, active nav (customer) |
| `orange-700` | `#A34803` | Orange **small** text (on white, cream and peach) |
| `orange-600` | `#C2560C` | Orange **large** text only: "người bạn nhỏ" and italic accent words. Locked as `--orange-text`. |
| `orange-500` | `#EA7A24` | Decoration only: arcs, sparkles in the hero. Locked. |
| `orange-400` | `#FC9238` | Decoration, the comet, the focus ring on dark surfaces. Locked. |
| `orange-200` | `#FCD0B4` | **Approved peach badge** |
| `orange-100` | `#FDEBDD` | Peach chip background |
| `orange-50` | `#FEF6EE` | Peach wash, the "new row" highlight start |
| `teal-700` | `#1D625F` | Teal small text on tint (new) |
| `teal-600` | `#23706E` | Teal text and icons, success button. The existing `--color-brand-teal`. |
| `teal-500` | `#2E8C88` | Teal large and icon only (3.77:1) |
| `teal-400` | `#3FA9A3` | Turquoise decoration only (2.65:1), e.g. one accent stroke in illustrations |
| `teal-200` | `#BEE4E6` | **Approved mint badge** |
| `teal-100` | `#E3F3F2` | Teal chip background |
| `teal-50` | `#F1F9F8` | "Khách sẽ thấy" (customer-visible) surface in staff |
| `rose-700` | `#8E2A4F` | Rose text, the emergency call button background |
| `rose-200` | `#F6BBC6` | **Approved rose badge** |
| `rose-100` | `#FBE7EE` | Rose chip background |
| `honey-800` | `#6E4C00` | Honey text: partial payment |
| `honey-100` | `#FAEFD2` | Honey chip background |
| `grey-100` | `#F1EEF0` | Neutral chip background (closed or cancelled states) |
| `danger-700` | `#9C2A2A` | **Destructive actions only** (delete, void, log out), never statuses |

Where the colours live:
- **Hero.** Keeps its own scoped variables (`.ho { --plum-900 … }`). The global tokens use the same values, so nothing in the ported hero changes.
- **Approved hover pastels.** The darker badge shades on hover (`#F7BFA0`, `#A8D7DA`, `#D6B0DC`, `#EFA6B4`) are kept exactly as approved for service cards.

### 2.2 Semantic tones and every status chip

**Tone tokens** (chip text on chip background; the icon uses the text colour):

| Tone | Text | Background | Ring (1 px, decorative) | Meaning |
|---|---|---|---|---|
| `tone-plum` | `plum-700` | `plum-100` | `rgba(90,30,94,.18)` | New, waiting, "in the system" |
| `tone-orange` | `orange-700` | `orange-100` | `rgba(163,72,3,.18)` | In progress, needs an action from someone |
| `tone-teal` | `teal-700` | `teal-100` | `rgba(29,98,95,.18)` | Done, safe, paid, stable |
| `tone-rose` | `rose-700` | `rose-100` | `rgba(142,42,79,.18)` | Problem, needs attention (never used for money) |
| `tone-honey` | `honey-800` | `honey-100` | `rgba(110,76,0,.18)` | Partially complete |
| `tone-grey` | `ink-600` | `grey-100` | `rgba(94,74,98,.14)` | Closed or cancelled, no action |
| `tone-outline` | `ink-600` | transparent | `1px solid #CDBFCF` | Refused, empty, draft |

**Chip anatomy**
- **Public and customer zone.** Height 28. Padding `0 11px 0 8px`. Gap 6. Icon 14 px. Text 13 px at weight 600, line-height 1. Pill radius.
- **Staff zone.** Height 24. Icon 13 px. Text 12.5 px at weight 600.
- Chips never wrap. On narrow screens, long labels truncate with a tooltip; staff chips only.

| Domain | Label (exact) | Tone | Icon |
|---|---|---|---|
| Booking request (locked six) | Chờ xác nhận | plum | `clock` |
| | Đang liên hệ | orange | `phone-outgoing` |
| | Đã xác nhận | teal | `calendar-check` |
| | Không liên lạc được | rose | `phone-missed` |
| | Đã hủy | grey | `circle-x` |
| | Từ chối | outline | `circle-minus` |
| Flag (staff only, not a status) | Khách vừa gửi lại — cần gọi lại | `orange-700` text on paper, 3 px `orange-500` left bar | `phone-redo` (custom) |
| Appointment (staff lens) | Đã hẹn | plum | `calendar-check` |
| | Đã đến | teal | `user-round-check` |
| | Không đến | rose | `user-round-x` |
| | Đã hủy | grey | `circle-x` |
| Invoice | Nháp (staff only) | outline | `file-pen` |
| | Chưa thanh toán | orange | `clock` |
| | Thanh toán một phần | honey | `circle-half` (custom) |
| | Đã thanh toán | teal | `circle-check` |
| | Đã hủy | grey (the amount is shown with a line-through) | `file-x` |
| Payment method (staff) | Tiền mặt · Chuyển khoản · QR ngân hàng | outline | `banknote` · `landmark` · `qr-code` |
| Inpatient, internal (staff only) | Ổn định | teal | `circle-check` |
| | Cần theo dõi | orange | `eye` |
| | Nặng | rose | `triangle-alert` |
| Inpatient, customer-facing general status | Ổn định | teal | `circle-check` |
| | Đang hồi phục tốt | teal | `heart` |
| | Cần theo dõi thêm | plum | `eye` |
| | Sẵn sàng về nhà | teal (outline variant) | `door-open` |
| Cage tile | Trống | outline (dashed tile border) | `kennel-empty` (custom) |
| Diary / video share state (staff) | Bản nháp | outline | `file-pen` |
| | Đã chia sẻ | teal | `send` |
| | Ngừng chia sẻ | grey | `eye-off` |
| Video expiry (customer + staff) | Còn 45 ngày (> 14 days) | grey | `hourglass` |
| | Còn 10 ngày (4–14) | orange | `hourglass` |
| | Còn 2 ngày (≤ 3) | rose | `hourglass` |
| Video audio | Không có âm thanh | grey | `volume-x` |
| Account link (staff view) | Đã liên kết | teal | `link-2` |
| | Chưa liên kết | outline | `unlink` |
| Visibility marker (staff) | Khách sẽ thấy | teal | `eye` |
| | Nội bộ · khách không thấy | `plum-100` bg, `plum-900` text | `lock` |
| Demo marker | Dữ liệu mẫu · Mẫu · Ảnh minh họa · Video minh họa · Giá minh họa | grey, 12 px, no icon | none |

Note for the lead: the customer-facing inpatient status set differs between the customer lens (Ổn định / Đang theo dõi / Lê Sơn muốn trao đổi với bạn) and the staff lens (Ổn định / Đang hồi phục tốt / Cần theo dõi thêm / Sẵn sàng về nhà). The tones above cover both. The final list is the lead's call. My recommendation for "Lê Sơn muốn trao đổi với bạn" is tone-orange with the `phone` icon.

**Two internal surfaces in the staff zone.** These visually separate data that customers can see from data they cannot. This is the visual half of the locked "separate data" rule.
- **"Hồ sơ nội bộ" (internal).**
  - Paper background with a 45° hatch: 1 px lines every 8 px at `rgba(66,18,71,.035)`.
  - A 1 px dashed `plum-300` border.
  - A `lock` chip "Nội bộ · khách không thấy" pinned top-left.
  - Clinical icons appear **only** inside this surface.
- **"Nhật ký cho chủ nuôi" (customer-facing).**
  - A `teal-50` surface with a 1 px `teal-200` border.
  - An `eye` chip "Khách sẽ thấy".
  - A "Xem như khách" preview uses the customer zone's exact components.

### 2.3 Contrast, verified

Computed with the WCAG 2.x formula. The minimums are 4.5 for normal text, 3.0 for large text (≥ 24 px, or ≥ 18.66 px bold) and 3.0 for UI components and icons.

| Pair | Ratio | Use |
|---|---|---|
| ink-900 on cream-50 | 16.19 | Text |
| ink-800 on cream-50 | 11.16 | Body |
| ink-600 on cream-50 / paper / canvas-staff | 7.48 / 7.98 / 7.20 | Secondary text |
| ink-500 on cream-50 / paper / canvas-staff | 5.94 / 6.34 / 5.72 | Captions, placeholders |
| ink-400 on cream-50 | **3.71** | Disabled and decorative only |
| plum-900 / plum-700 / plum-500 / plum-muted on cream | 13.96 / 11.04 / 6.15 / 6.78 | Headings, links, eyebrows |
| orange-600 `#C2560C` on cream | **4.25** | **Large text only** (accent words are ≥ 32 px Lora 700) |
| orange-700 on cream / paper / orange-100 | 5.65 / 6.02 / 5.19 | Small orange text, "Chưa thanh toán" chip |
| teal-600 on cream / paper / teal-100 | 5.44 / 5.81 / 5.08 | Teal text |
| teal-700 on teal-100 | 6.20 | Teal chips |
| teal-500 on cream | 3.77 | Large text and icons only |
| rose-700 on paper / cream / rose-100 | 8.09 / 7.58 / 6.85 | Rose text, chips |
| honey-800 on honey-100 / paper | 6.80 / 7.79 | Partial-payment chip |
| plum-700 on plum-100 / plum-50 | 9.74 / 10.70 | Plum chip, active nav |
| ink-600 on grey-100 | 6.93 | Grey chip |
| cream on plum-700 / plum-800 | 11.04 / 13.04 | Primary button (rest and hover) |
| white on teal-600 / rose-700 / danger-700 | 5.81 / 8.09 / 7.56 | Success, emergency and danger buttons |
| plum-900 icon on peach / mint / lilac / rose badge | 10.52 / 10.95 / 9.48 / 9.11 | Approved badges (non-text ≥ 3) |
| cream on plum-900 | 13.96 | Footer, staff sidebar text |
| plum-200 on plum-900 | 9.48 | Secondary text on dark |
| orange-400 on plum-900 / plum-700 | 6.61 / 5.22 | Focus ring and accents on dark |
| cream on plum-950 (toast) | 15.20 | Toast text |
| teal-200-ish `#8FD3CC` / orange-400 on plum-950 | 9.54 / 7.19 | Toast icons |
| field-border `#9C82A0` on paper | 3.43 | Input boundary (≥ 3) |
| plum-700 focus ring on cream / on peach badge | 11.04 / 8.32 | Focus visibility |
| turquoise `#3FA9A3` on cream | **2.65** | Decoration only, never text or a meaningful icon |

### 2.4 Typography

**Families and loading**
- **Lora** (variable, wght 400–700, roman and italic) for display.
  - Weights used: 600 and 700, and 600/700 italic for accent words.
- **Be Vietnam Pro** 400 / 500 / 600 / 700 for UI.
- Subsets: `vietnamese` and `latin` only. `font-display: swap`.
- Preload 3 files: Lora roman variable, Be Vietnam Pro 400 and 600. The hero already waits up to 700 ms for fonts before its intro (ported).
- Fallback stacks are kept from the hero: `Georgia, "Times New Roman", serif` and `system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif`.

**Rules for Vietnamese**
- Line-height is ≥ 1.12 for display and ≥ 1.5 for body. This leaves room for stacked marks (ỗ, ữ, ẫ).
- Tracking is never tighter than −0.02em.
- Uppercase is used for eyebrows only.
- `hyphens: none`. `text-wrap: balance` on headings and `text-wrap: pretty` on paragraphs.
- Numbers use `font-variant-numeric: tabular-nums` in tables, money, KPIs and timestamps.
- Money is written "1.250.000 ₫", with a non-breaking space before ₫.
- Dates are written "Thứ Ba, 21/10/2026".

**Public site scale**

| Token | Font | Size (fluid) | Line-height | Use |
|---|---|---|---|---|
| `display-xl` | Lora 700 | `clamp(2.3rem, .9rem + 4.1cqw, 4.4rem)` | 1.12 | Hero H1 (locked, ported) |
| `display-l` | Lora 700 | `clamp(2rem, 1.35rem + 2vw, 3rem)` (32–48 px) | 1.15 | Section H2. One italic accent word in orange-600. |
| `display-m` | Lora 600 | `clamp(1.625rem, 1.3rem + 1vw, 2rem)` (26–32 px) | 1.2 | Sub-headings, the login H1 |
| `title-l` | Lora 600 | 22 px | 1.3 | Public card titles (service cards, pillars) |
| `eyebrow` | BVP 600, uppercase | 12.5–13 px, tracking .28em | 1.3 | Section eyebrows, in plum-muted |
| `body-l` | BVP 400 | 18 px | 1.7 | Section subtitles and paragraphs, max 62ch |
| `body` | BVP 400 | 16 px | 1.6 | General text |
| `label` | BVP 600 | 14–15 px | 1.4 | Buttons, nav |
| `caption` | BVP 500 | 12.5 px (minimum 12) | 1.4 | "Ảnh minh họa", meta |

**Customer zone scale**
- Page title: Lora 600, 28 px (24 px on mobile).
- Greeting: Lora 600, 26 px, with an italic accent for the pet name.
- Card title: BVP 600, 17 px.
- Body: BVP 400, 15–16 px, line-height 1.6.
- Label: BVP 600, 13.5 px.
- Money: BVP 700, 20 px, tabular.
- Tab-bar label: 12.5 px.

**Staff zone scale (dense)**
- Page title: Lora 600, 24 px (20 px on mobile).
- Dashboard greeting: Lora 600 italic, 22 px.
- Section title: BVP 600, 16 px.
- Table body: BVP 400, 14 px / 20 px.
- Table header: BVP 600, 12.5 px, sentence case, ink-600.
- Meta: 12.5 px.
- KPI number: BVP 700, 30 px, tabular.
- Lora appears **only** in page titles, the greeting and empty-state titles. Everything operational is set in Be Vietnam Pro.

### 2.5 Spacing and layout grid

- **Spacing scale (4 px base):** 4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 80 · 96 · 128.
- **Section padding (public):** `clamp(64px, 5vw + 40px, 128px)` vertical.
- **Containers:**
  - Public content: `min(1200px, 100% − 2·gutter)`. Wide: 1320.
  - Customer content: max 1080 inside the shell.
  - Staff: fluid up to 1440.
- **Gutters:** 16 px (≤ 640) · 24 px (641–1199) · 32 px (≥ 1200).
- **Grid:** 12 columns with a 24 px gap (32 px at ≥ 1200). Cards use 4/3/2/1 columns by breakpoint (see §7).
- **Card padding:** 24–28 (public) · 20–24 (customer) · 16–20 (staff).
- **Rhythm inside cards:** title → 8 → body → 16 → actions. Between stacked cards: 16 (staff), 20 (customer), 24 (public).

### 2.6 Radii

| Token | px | Use |
|---|---|---|
| `r-xs` | 6 | Tooltips, keyboard hints |
| `r-sm` | 10 | Staff small buttons, table action buttons |
| `r-md` | 12–14 | Inputs (12); icon buttons and ☰ (14, locked) |
| `r-lg` | 20 | Standard cards (customer, staff tiles 16) |
| `r-xl` | 28 | Feature cards, dialogs, the login card, bottom sheets (top corners) |
| `r-arch` | `999px 999px 24px 24px` | Arch photo windows (public, a motif from the earlier approved arches) |
| `r-frame` | `20% of width` | Hero glass frames (locked, ported) |
| `r-pill` | 999 | Buttons, chips, the subtitle pill |

### 2.7 Elevation and shadows

Every shadow is plum-tinted, never grey-black.

| Token | Value | Use |
|---|---|---|
| `e0` | none, plus a 1 px `line-200` border | Staff surfaces, tables |
| `e1` | `0 1px 2px rgba(66,18,71,.06), 0 8px 24px -12px rgba(66,18,71,.14)` | Resting cards (public, customer) |
| `e2` | `0 2px 4px rgba(66,18,71,.06), 0 18px 40px -16px rgba(66,18,71,.24)` | Hovered or lifted cards |
| `e3` | `0 24px 60px -20px rgba(66,18,71,.38)` | Dialogs, dropdowns, toasts |
| `e-btn` | `0 16px 30px -14px rgba(90,30,94,.75)` | Primary CTA (locked from the hero) |
| `e-glow` | `0 8px 26px -8px rgba(252,146,56,.22)` | Warm glow under photo frames (from the hero) |
| `e-badge` | Approved per-colour badge shadows (e.g. `0 4px 14px rgba(184,83,11,.18)` on peach) | Service badges (locked) |

A hover change of shadow is implemented as a cross-fade of a pre-rendered `::after` shadow layer (opacity only), not by animating `box-shadow`.

### 2.8 Glass and blur (rules)

**Glass token:** `background: rgba(255,255,255,.74)`, `backdrop-filter: blur(16px) saturate(1.15)`, `border: 1px solid rgba(255,255,255,.9)`. With `@supports not (backdrop-filter: blur(1px))` the background becomes opaque `rgba(255,255,255,.96)`.

Glass is allowed only on floating chrome:
1. The public header after scrolling (8 px or more): `rgba(251,247,241,.78)`.
2. The hero subtitle pill and the motion toggle (ported, unchanged).
3. The customer mobile bottom tab bar.
4. The video-player control strip.

Glass is not allowed:
- behind paragraphs, tables, forms or invoice paper;
- for more than two blurred layers on screen at once (cost on low-end Android).

Dialog backdrops dim without blur on mobile (`rgba(42,27,46,.44)`) and use a 4 px blur at ≥ 993 px.

### 2.9 Background textures and bokeh

| Texture | Make | Use | Opacity |
|---|---|---|---|
| **Bokeh blobs** | Radial gradients, lilac `rgba(206,176,226,.5)` and peach `rgba(255,206,168,.55)` (the hero's blob recipe) | The hero (drifting, ported); elsewhere **static**, at most 2 per section; 2 fixed blobs in the customer canvas | 35–55% |
| **Paper grain** | A 200×200 noise PNG generated once at build (PIL), `mix-blend-mode: multiply` | Cream public sections, login panel, invoice paper | 3.5% |
| **Dotted orbit** | Concentric SVG ellipses, 1 px `plum-300`, dash `2 6` | Behind section headers (Dịch vụ, Đặt lịch), login panel | 18–30% |
| **Paw trail** | A 240×240 SVG pattern of 5 small paws walking diagonally | Footer and staff sidebar (cream at 5%), login mobile band, empty-state backdrops (plum at 4%) | 4–6% |
| **Lilac wash** | `linear-gradient(180deg, #F8F2F9, #FBF7F1)` | The Đặt lịch section, customer hero cards | — |
| **Internal hatch** | 45° 1 px lines every 8 px | Staff "Hồ sơ nội bộ" surfaces only | 3.5% |

### 2.10 Focus states

- **Light surfaces (default):** `outline: 3px solid #5A1E5E; outline-offset: 3px` (locked). It follows the border radius.
- **Filled plum buttons:** a 3 px `plum-900` outline plus a 2 px cream inner ring via `box-shadow` (the pattern already in `styles.css`).
- **Dark surfaces** (footer, staff sidebar, login panel, toasts, video chrome): `outline: 3px solid #FC9238; outline-offset: 2px` (6.61:1 on plum-900).
- **Inputs:** a 2 px `plum-700` border plus a 4 px `rgba(130,71,135,.22)` ring, and the 3 px outline on `:focus-visible`.
- **Table rows and tiles:** an inset outline (`outline-offset: -2px`), so focus is not clipped by `overflow`.
- Focus is `:focus-visible` only, is never animated and is never removed. Skip links go to "Bỏ qua, đến nội dung chính".

### 2.11 Token sample (CSS custom properties)

```css
:root {
  color-scheme: only light;
  --cream-50:#FBF7F1; --paper:#FFFFFF; --canvas-staff:#F6F2F5;
  --ink-900:#231627; --ink-800:#3F3342; --ink-600:#5E4A62; --ink-500:#6B5A6E;
  --line-200:#E9DEEA; --field-border:#9C82A0;
  --plum-950:#2A1B2E; --plum-900:#421247; --plum-800:#4A154E; --plum-700:#5A1E5E;
  --plum-500:#824787; --plum-300:#C9A8CC; --plum-200:#E4C4E8; --plum-100:#F1E6F3; --plum-50:#F8F2F9;
  --orange-700:#A34803; --orange-600:#C2560C; --orange-500:#EA7A24; --orange-400:#FC9238;
  --orange-200:#FCD0B4; --orange-100:#FDEBDD;
  --teal-700:#1D625F; --teal-600:#23706E; --teal-500:#2E8C88; --teal-200:#BEE4E6; --teal-100:#E3F3F2; --teal-50:#F1F9F8;
  --rose-700:#8E2A4F; --rose-200:#F6BBC6; --rose-100:#FBE7EE;
  --honey-800:#6E4C00; --honey-100:#FAEFD2; --grey-100:#F1EEF0; --danger-700:#9C2A2A;
  --font-display:"Lora Variable","Lora",Georgia,"Times New Roman",serif;
  --font-ui:"Be Vietnam Pro",system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;
  --ease-out:cubic-bezier(.2,.7,.2,1); --ease-out-expo:cubic-bezier(.16,1,.3,1);
  --ease-in-out:cubic-bezier(.65,0,.35,1); --ease-in:cubic-bezier(.4,0,1,1); --ease-pop:cubic-bezier(.34,1.56,.64,1);
  --dur-xs:120ms; --dur-s:180ms; --dur-m:240ms; --dur-l:360ms; --dur-xl:600ms; --dur-draw:900ms;
}
```

---

## 3. Three moods and the login portal

| | Public site | Customer zone | Staff zone |
|---|---|---|---|
| Feeling | Airy, editorial, warm, a little poetic | Soft, reassuring, "your pet is in good hands" | Calm, efficient, dense yet elegant |
| Canvas | cream-50 with alternating white and lilac-wash bands; plum-900 footer | cream-50 with 2 static bokeh blobs (lilac top-right, peach bottom-left) | `canvas-staff #F6F2F5`; **plum-900 sidebar** with the paw-trail texture at 4% |
| Surfaces | Large photo windows (arch, glass frames), few cards | White cards, r 20–28, e1 | White panels, r 16, e0 (hairline), shadows only on floating items |
| Type | Big Lora, italic orange accent words, eyebrows | Lora page titles and greetings, BVP body 15–16 | BVP 14 throughout; Lora only for the title and greeting |
| Icons | Approved pastel badges (52 px, white ring) | Pastel badges at 40 px, 24 px nav icons | Flat line icons at 20 px, small flat badges (32 px, no ring) |
| Decoration | Orbit arcs, yarn, paws, bokeh, grain, parallax objects | One arc or paw per screen at most; illustrations in empty states | Almost none: paw trail in the sidebar, illustrations in empty states |
| Motion intensity | High (one-shot reveals, draws, scroll parallax) | Medium (route fade and rise, card stagger, timeline draws, stamp) | Low (fades, chip morphs, row highlights, count-ups once) |
| Photos | Hero frames, service arches, Giới thiệu stack | Video thumbnails, illustrated species avatars | Video thumbnails only; avatars are illustrated |

### 3.1 Public site: "airy editorial"

- **Section header pattern.** Eyebrow, then a Lora H2 with **one** italic orange-600 accent word, then an 18 px subtitle in ink-600. Dịch vụ is centred; the others are left-aligned, two-column.
- **Photo grammar.** Arch windows for the services and Giới thiệu, plus the hero's glass frames.
  - Each photo sits on a soft pastel blob offset 16–24 px behind it.
  - A thin **orange arc hugs its outer side**: the hero motif, at most once per section.
- **Background rhythm** (from the customer lens): cream → white → lilac wash → cream → white → cream → plum-900 footer.
  - Section seams are a static orbit arc divider that draws in once.
- **Density.** At most 2 bokeh blobs and 4 small decorative objects (paw, yarn, heart, ball, bone) per section. The objects are hidden at ≤ 640 px.
- **Buttons.**
  - Primary: plum-700 pill, 52 px (locked hero CTA).
  - Secondary: white pill with a 1.5 px plum-500 border.
  - Emergency: the rose-700 pill "Gọi 097 355 51 05" with the `phone` icon.

### 3.2 Customer zone: "soft, card-based, reassuring"

- **Shell** (per the customer lens).
  - A cream sidebar (248 px) with 24 px nav icons. The active item is a `plum-50` pill with plum-700 text, weight 600, plus a 3 px orange-400 dot to the left.
  - On mobile, a glass bottom tab bar.
- **Greeting band.** Lora 26 px "Chào chị Lan," with a subline. Behind it, a one-shot orbit arc and a lilac wash.
- **"Hero card" pattern** (an active stay or the next appointment):
  - A gradient from `plum-50` to white, r 28, with an illustrated species avatar 56 px on a pastel circle.
  - The status chip.
  - A single primary action.
- **Lists are cards, not tables.** Money is right-aligned in bold. Chips use the public size.
- **Illustrated species avatars.** A cat, dog or paw line icon on one of the 4 pastels, with the colour fixed per pet. These replace photos: no photo upload (YAGNI, per the customer lens).
- **Invoice detail** is the one "paper" object:
  - White with the paper grain at 3.5%, a hairline border, r 16.
  - The "ĐÃ THANH TOÁN" stamp when paid (§4.7 O15).
- **Calm money.** Unpaid amounts never use rose or red; they use the orange tone and a peach banner.

### 3.3 Staff zone: "calm operations"

- **Sidebar** (248 px).
  - plum-900 background, cream labels (13.96:1), 20 px icons in `plum-200`.
  - Active item: a `rgba(251,247,241,.12)` pill, cream icon and text, and a 3 px orange-400 left bar.
  - Count badges: `plum-700` on cream. When a flag is present the badge becomes `orange-400` with plum-900 text.
  - The logo sits on a 40 px cream tile (r 12), so the official logo is never placed directly on plum.
- **Top bar.** White, 64 px, hairline bottom border. It holds the Lora page title, the global search field (r 12, 40 px) and the "＋ Tạo nhanh" tonal button.
- **Tables.**
  - Header row `#FAF7FA`, rows 48 px (44 in compact lists), dividers `line-200`.
  - Row hover `#FAF6FA`. Selected row: `plum-50` plus a 3 px plum-700 left bar.
  - Numbers are tabular and right-aligned.
  - Row actions are 36 px visible inside a 44 px hit area.
- **KPI tiles.** White, r 16, a 32 px flat pastel badge, a 13 px ink-600 label, a 30 px BVP 700 tabular number in plum-900 and a 12.5 px subline. Flagged sublines are orange-700.
- **Cage board tiles.** 160 × 128, r 16, white.
  - Empty tiles use a dashed `plum-300` 1.5 px border on transparent.
  - "Nặng" tiles get a 4 px rose-700 left edge; colour is never the only signal (chip + icon).
- **Charts** (manager revenue report).
  - Bars in plum-700; the selected or hovered bar in teal-600.
  - Gridlines `line-200`. Axis labels 12.5 px ink-600. Tooltip in plum-950 with cream text.
  - No 3D, no gradients.
- **Internal and customer-facing surfaces:** see §2.2. This is the strongest visual rule in the staff zone.
- **Theme colour.** `meta theme-color` is `#421247` in the staff zone and `#FBF7F1` elsewhere. The phone's browser chrome changes colour, which helps staff know they are in the staff zone.

### 3.4 Login portal: "the orbit window"

The layout is from the customer lens. These are the visual specifics.

**Desktop: split screen**
- **Left panel (45%).**
  - A `plum-900 → plum-700` diagonal gradient (160°), the paper grain at 3.5%, and a large dotted orbit ellipse (cream at 18%).
  - A thin orange-500 arc hugs one side of the ellipse.
  - **Three hero-style glass frames** with photos sit on the orbit.
  - The static `cat-silhouette.svg` sits bottom-left at 60% opacity.
  - Headline in Lora 600, 34 px, cream: "Rất vui được gặp lại *bạn và bé*". The accent is in **orange-400**, which is legal on plum-900 at any size (6.61:1).
- **Right panel (55%).**
  - A cream canvas with the white login card (r 28, e1, max 440 px).
  - Tabs as a segmented control: a white track with a 1.5 px `line-200` border and a sliding plum-700 indicator pill with cream text.
  - Tab icons: `paw-heart` for "Khách hàng" and `id-card` for "Nhân viên".

**Panel content per tab**
- **Khách hàng:** the frames hold pets (`pet-center`, `pet-right`, `service-noitru`).
- **Nhân viên:** the frames cross-fade to care scenes (`service-kham`, `service-grooming`, `service-noitru` crop B). The headline becomes "Khu làm việc của *đội ngũ Lê Sơn*".

**Motion on entry (once)**
- The orbit ellipse and the arc draw in.
- The frames glide 12° along the ellipse and settle.
- After that the panel is completely still, with no loop (O16).

**Mobile**
- A 112 px plum-900 band at the top with the paw trail at 6%, a short orange arc and the logo on a cream tile.
- The card overlaps the band by 24 px.

---

## 4. Motion system

### 4.1 Rules

1. **Loops:** only the hero, which is ported as-is, with its "Tạm dừng chuyển động" button and reduced-motion handling.
2. **One-shot:** every reveal, draw, pop or count runs once per element per page view (`whileInView`, `once: true`). Returning to a route replays route transitions but not section reveals already seen in that session.
3. **Scroll-linked:** parallax and the diary spine move **only while the visitor scrolls**. When scrolling stops, they stop. They never move on their own.
4. **Forbidden everywhere outside the hero:** pulse, blink, shake, wobble, shimmer skeletons, auto-advancing carousels, marquee and cursor-follow effects.
5. **Functional exceptions.** A busy spinner (M20) and progress bars (M24) may repeat only while a real wait is happening, and are replaced by static text under reduced motion.
6. **Hover effects** apply only under `@media (hover: hover) and (pointer: fine)`.

### 4.2 Library choice

- **Motion** (`motion` package from motion.dev, React API `motion/react`; pin the exact current version at install).
  - Use `LazyMotion` with `domAnimation` on the public site (about 15 kB gz). Load `domMax` (layout animations) only in the zones.
  - `MotionConfig reducedMotion="user"` sits at the root.
  - If the lead chooses vanilla instead of React, use Motion's vanilla `animate` / `inView` / `scroll` / `stagger` with the same tokens.
- **CSS transitions** for hovers, presses and focus colours. These are cheaper, and declarative is enough.
- **The hero's own rAF simulator, untouched.** One optional wrapper-level addition: pause it when the hero is less than 10% visible, through the same code path as the toggle and tab-hidden pause, without changing simulator numbers.
- **Not used:**
  - GSAP: duplicates Motion.
  - Lenis and other scroll-jacking libraries: they hurt accessibility and low-end phones.
  - The View Transitions API: Motion gives consistent cross-browser exits, and the owner also checks on phones.

### 4.3 Motion tokens

| Token | Value | Typical use |
|---|---|---|
| `dur-xs` | 120 ms | Hover colour, exits of small items |
| `dur-s` | 180 ms | Press, dropdowns, tooltips |
| `dur-m` | 240 ms | Route content enter, toasts |
| `dur-l` | 360 ms | Dialogs, sheets, list → detail |
| `dur-xl` | 600–700 ms | Section reveals |
| `dur-draw` | 900–1400 ms | SVG line drawings, timelines |
| `ease-out` | `cubic-bezier(.2,.7,.2,1)` | Default enter (the hero's "rise" curve) |
| `ease-out-expo` | `cubic-bezier(.16,1,.3,1)` | Large reveals, sheets |
| `ease-in-out` | `cubic-bezier(.65,0,.35,1)` | Drawings, wipes, indicators by tween |
| `ease-in` | `cubic-bezier(.4,0,1,1)` | Exits |
| `ease-pop` | `cubic-bezier(.34,1.56,.64,1)` | Badge pops, stamp (the approved badge-hover curve) |
| `spring-glide` | `{ type: "spring", bounce: 0, visualDuration: .3 }` | Tab and nav indicators, toggles |
| `spring-pop` | `{ type: "spring", bounce: .25, visualDuration: .35 }` | Chip swaps, pin drop |
| Distances | rise 8 px (zones), 16 px (cards), 24 px (public sections); parallax ±24–40 px | — |
| Stagger | 60 ms (zone lists), 80–90 ms (public cards); **at most the first 8 items stagger**, the rest appear with the last | — |
| In-view | `amount: .25`, `margin: "0px 0px -10% 0px"`, `once: true` | — |

### 4.4 Route and page transitions

Every row lists: trigger, what moves, timing, whether it loops, and the reduced-motion fallback.

| ID | Trigger | What moves | Duration / easing | Loops | Reduced motion |
|---|---|---|---|---|---|
| R1 **Orbit wipe** | Public → login portal (click "Đăng nhập", "Đăng ký" or "Dành cho nhân viên") | A plum-900 ellipse (1.6:1) starts at the clicked button's centre and scales up to cover the viewport. The route swaps under it, then the cover fades out and the portal panel settles (O16). | Cover: 420 ms `ease-in-out`. Fade: 260 ms `ease-out`. About 680 ms in total. | No | 150 ms opacity cross-fade |
| R1b | Direct load of `#/dang-nhap` | No wipe. Only O16. | — | No | Static |
| R2 | Login tab switch | The indicator pill glides; fields fade out (120 ms) and in (200 ms, rise 6 px); the panel headline cross-fades (200 ms); the panel photos cross-fade (400 ms). | `spring-glide` / `ease-out` | No | Instant swap |
| R3 | Login success → zone | The button label becomes a check that draws (260 ms), with a 240 ms hold. The portal fades to 0 and scales to .985 (200 ms `ease-in`). The zone shell enters: sidebar x −16→0 with fade (320 ms `ease-out-expo`), top bar fade (240 ms), content cards rise 8 with a 60 ms stagger. The welcome toast follows at +400 ms. | About 1.1 s in total | No | 150 ms fade, then the toast |
| R4 | Sign-up success → customer zone | Same as R3. The first-run welcome card adds the paw trail (O6). | — | No | Static plus the toast |
| R5 | Route change inside a zone (sidebar, tab bar, in-page tabs) | The shell stays still. Content exits with opacity 1→0 (120 ms `ease-in`) and enters with opacity 0→1 and y 8→0 (220 ms `ease-out`). Staff uses y 4 and 180 ms. The active nav indicator glides (`layoutId`, `spring-glide`). Scroll resets to the top before entry. | — | No | 120 ms opacity only |
| R6 | List → detail (invoice, request, stay, customer) | **≥ 641 px:** detail enters x 24→0 with fade (260 ms `ease-out-expo`). Back: x 0→24 with fade-out (180 ms `ease-in`); the list restores its scroll position. **≤ 640 px:** a full-screen layer slides y 100%→0 (340 ms `ease-out-expo`); back reverses (240 ms `ease-in`). | — | No | 120 ms cross-fade |
| R7 | Logout → public homepage | Zone fades out (200 ms), the public site fades in (240 ms), then the toast "Bạn đã đăng xuất. Hẹn gặp lại bạn và bé!" | — | No | Instant plus the toast |
| R8 | Homepage anchors (`#/dich-vu`, `#/dat-lich`, `#/gioi-thieu`, `#/lien-he`) | Native `scrollIntoView({behavior:"smooth"})`, with `scroll-margin-top` = header height (96 / 72). The scroll-spy indicator glides. | Browser default | No | `behavior:"auto"` (jump) |
| R9 | Guard redirect to login (`?tiep=`) | No wipe. A 200 ms fade. The strip "Bạn đăng nhập để tiếp tục nhé." slides down 8 px, once. | — | No | Static |
| R10 | Not found / error screen | 200 ms fade. The illustration draws (O18). | — | No | Static |
| R11 | Mobile ☰ menu (locked spec) | Scale .96→1, y −6→0 and opacity, from the top-right origin. Close: 140 ms. | 180 ms `ease-out-expo` | No | Instant |

### 4.5 Homepage scroll choreography (section by section)

| Section | Trigger | Choreography | Timing | Loops | Reduced motion |
|---|---|---|---|---|---|
| **Header** | Scroll > 8 px | The glass background layer fades in (opacity on a pseudo-element; the header height never changes). The scroll-spy underline is one element that moves with translateX and scaleX. | 200 ms `ease-out`; underline 320 ms `ease-in-out` | No | Instant |
| **S1 Hero** | Load | **Ported unchanged:** text rises (.56 s, .11 s stagger), rings in (1.5 s), the burst, decor in (.8 s), frames fly out from behind the text, then a continuous orbit, the comet, and blob drift (21–30 s alternate). | As in the code | **Yes, the approved exception** | Ported: text instantly, frames placed still, toggle hidden |
| **S2 Dịch vụ** | 25% in view | The eyebrow fades and rises 8. The H2 lines reveal through a mask (each line translateY 100%→0 inside a clip). The subtitle fades. The 4 cards rise 24 with a fade, 90 ms stagger. Inside each card the photo "unveils" (scale 1.08→1). The badge pops (scale .6→1). The icon stroke draws. The "Tiếp nhận 24/24" chip fades in last. On 1 column (≤ 640), each card triggers on its own entry, with no chain. | Eyebrow 400 ms; H2 700 ms `ease-out-expo` with an 80 ms line stagger; cards 700 ms `ease-out-expo`; photo 1100 ms `ease-out`; badge 450 ms `ease-pop` at +250 ms; icon draw 600 ms `ease-in-out` at +350 ms | No | All visible, static |
| **Hover on a service card** | Pointer hover | **Approved Services v1 behaviour:** the card lifts −6 px (e2 cross-fade), the photo scales 1.05 (400 ms), the badge scales 1.08 and rises −3 px to its darker approved pastel (300 ms `ease-pop`). | — | No | Colour change only |
| **S3 Đặt lịch** | 25% in view | The left column rises. The stepper spine grows (scaleY 0→1 from the top). Each step dot pops as the spine reaches it. The form card rises 24 at +120 ms. `cat-pose-booking.svg` fades and rises 12 at +500 ms. The emergency callout's heart-pulse line draws once. | Spine 900 ms `ease-in-out`; dots 300 ms `ease-pop` at i×300 ms; heart-pulse 800 ms | No | Static |
| **Service preselect** (a card CTA scrolled here) | On arrival | The service field gets a lilac highlight overlay (opacity 0→.9→0), once. | 600 ms `ease-in-out` | No | A static `plum-300` 2 px border for 2 s, no fade (a colour change, not motion) |
| **S4 Giới thiệu** | 25% in view, plus scroll | The arch photo unveils (scale 1.1→1 with a container fade). The orange arc draws around the arch's outer side. The **yarn ball rolls in** (x −48→0, rotate −200°→0) and its thread draws behind it. The H2 mask-reveals. The pillars stagger with badge pops. **Scroll-linked parallax** (§4.7 O9): the arch moves y +24→−24 across the section, and the two small round inserts move +40→−40. | Arch 900 ms; arc 1100 ms `ease-in-out` at +300 ms; yarn 1000 ms `ease-out-expo`, thread 800 ms at +200 ms | No (parallax only while scrolling) | Static, no parallax |
| **S5 Tài khoản khách hàng** | 25% in view, plus scroll | The phone mock rises 32 and tilts in (rotateX 10°→0, perspective 1200 px). After it settles, its mini cards stagger (rise 8, 70 ms). The 2×2 tiles stagger with badge pops. Scroll parallax on the mock: y +30→−30. | Mock 900 ms `ease-out-expo`; mini cards 240 ms each | No | Static |
| **S6 Liên hệ** | 25% in view | The info rows stagger (rise 12, 80 ms). On the drawn map the streets draw, then the road label fades, then the **pin drops**, then **one** ripple ring. | Streets 1400 ms in total, 120 ms stagger, `ease-in-out`; pin 600 ms `spring-pop` (a single bounce); ripple 900 ms (scale .6→1.8, opacity .45→0) **once** | No | Static map with the pin |
| **S7 Footer** | 30% in view | The orange arc draws. Three light-purple paws appear in sequence (opacity with scale .8→1). | Arc 1000 ms; paws 140 ms apart | No | Static |
| **Section dividers** | 40% in view | The thin orbit arc draws from left to right. | 1100 ms `ease-in-out` | No | Static |
| **Floating objects** (public only, ≥ 641 px) | Scroll | 2–4 per section (paw, yarn, heart, ball, bone) at 30–60% opacity in `plum-300` or peach. They translateY at speed factors −0.08 to −0.2 and rotate ±6° across the section's scroll range. **They do not move unless the page scrolls.** | Scroll-linked (ScrollTimeline when available) | No | Static, at their mid positions |

### 4.6 Micro-interactions

| ID | Element | Trigger → effect | Timing | Loops | Reduced motion |
|---|---|---|---|---|---|
| M1 | Primary button | Hover: background to plum-800, shadow layer cross-fade, the arrow moves translateX 3 px. Press: scale .97. | 180 ms `ease-out`; press 120 ms | No | Colours only |
| M2 | Secondary / ghost button | Hover: border to plum-700, background to white. Press: scale .98. | 180 ms | No | Colours only |
| M3 | Icon button (44 px) | Hover: a `plum-50` circle scales .8→1 behind the icon. Press: scale .94. | 160 ms | No | Colour only |
| M4 | Text link | Hover: an underline grows left to right (scaleX 0→1, 1.5 px). | 240 ms `ease-out` | No | Static underline on hover |
| M5 | Clickable card (public, customer) | Hover: lift −4 px plus e2 cross-fade. Press: scale .99. | 240 ms `ease-out` | No | Shadow only |
| M6 | Service badge | Approved: scale 1.08, −3 px, darker pastel (on card hover). | 300 ms `ease-pop` | No | Colour only |
| M7 | Status chip change (staff action, or a change seen by the customer) | The old chip fades and scales to .9 (120 ms). The new chip scales .9→1 with `spring-pop`. The row gets a one-time wash in the new tone's background (opacity .9→0 over 600 ms). | ≈ 600 ms in total | No | Instant swap, no wash |
| M8 | Filter chips / segmented control | The selected indicator glides (`layoutId`). The check icon slides in (x −4→0 with opacity). | `spring-glide`, 160 ms | No | Instant |
| M9 | Toggle switch (e.g. "Chia sẻ với chủ nuôi") | The thumb moves translateX 20 px (`spring-glide`). The track colour cross-fades (180 ms). | — | No | Instant |
| M10 | Checkbox / radio | The check stroke draws (pathLength 0→1). The radio dot scales .4→1. | 180 ms | No | Instant |
| M11 | Input focus / error | Focus: the border and ring appear (120 ms colour). Error: the message slides down 6 px and fades in; the border turns rose-700. **No shake.** | 180 ms `ease-out` | No | Instant |
| M12 | Password "Hiện" / "Ẩn" | The eye ↔ eye-off icons cross-fade with scale .9→1. | 150 ms | No | Instant |
| M13 | Table rows (staff) | Hover tint (120 ms). **New row** (created or arrived): slides y −8→0 and fades, plus a peach wash `orange-50` that fades out over 1.2 s, once. **Removed row:** fades out (160 ms) and the rows below close the gap with layout FLIP (200 ms). **Lists over 50 rows:** no per-row animation; the whole table fades (160 ms). | — | No | Instant; the wash becomes a static 2 s tint |
| M14 | Accordion / expand (snapshot card, history) | Height via Motion `height: auto` (a documented exception, §4.9) plus content fade with y −4. | 220 ms `ease-out`; content ≤ 400 px | No | Instant |
| M15 | Dropdown (account menu, "＋ Tạo nhanh") | Scale .98→1 from the trigger corner, with opacity. | 160 ms `ease-out-expo`; exit 120 ms | No | Instant |
| M16 | Tooltip (staff icon rail, truncated chips) | 400 ms delay, then fade with y 4→0. | 140 ms | No | Instant after the delay |
| M17 | Toast | Enter: y 16→0, scale .96→1, opacity (260 ms `ease-out-expo`). Exit: y 8 with fade (180 ms). Dismissed after 4 s, or 5 s when it has "Hoàn tác". Max 3 stacked; older toasts move up via layout. **Position (all zones): bottom-right on desktop, bottom-centre on mobile, 12 px above any tab bar.** | — | No | Fade only |
| M18 | Dialog / bottom sheet | Backdrop fade (200 ms). Dialog: scale .96→1, y 12→0, opacity (280 ms `ease-out-expo`); exit 180 ms. Sheet (≤ 640): y 100%→0 (340 ms); no drag-to-dismiss (YAGNI). | — | No | Fade only |
| M19 | Copy button ("Sao chép") | The `copy` icon becomes a `check` that draws, and the label reads "Đã sao chép" for 1.6 s, then reverts once. | 200 ms each way | No | Instant swap |
| M20 | Busy button ("Đang lưu…", "Đang đăng nhập…") | The label changes; a 16 px arc rotates **only while waiting** (the mock waits 250–500 ms). | 800 ms per turn, `linear` | Only while busy (functional) | No spinner; the label text only |
| M21 | Skeleton → content | **Static** skeleton blocks in `#F3ECF4` (no shimmer). Content cross-fades in. | 200 ms | No | Instant |
| M22 | Video card | Hover: the thumbnail scales 1.04 inside a clip; the play badge scales 1.08. | 300 ms `ease-out` | No | None |
| M23 | Upload dropzone (staff video) | Drag-over: border to plum-700, background `plum-50`, the `cloud-upload` icon moves y −4. | 160 ms | No | Colours only |
| M24 | Progress (upload, "Đang bỏ âm thanh…") | A determinate bar (scaleX 0→p, origin left). On completion a check draws. | Follows progress; check 300 ms | Only while working (functional) | A static bar that updates in steps, plus the % text |
| M25 | Mobile tab bar | The active item's pastel pill scales .6→1 behind the icon (`spring-glide`). The label colour changes. The font weight never changes. | 260 ms | No | Instant |
| M26 | Sidebar nav (both zones) | The active indicator glides between items (`layoutId`). Hover: a background tint. | `spring-glide` | No | Instant |
| M27 | Form submit success (booking) | The form card's height morphs (layout FLIP, 300 ms). The content cross-fades to the success panel. O17 plays. | — | No | Instant swap |

### 4.7 Animated objects (catalogue)

| ID | Object | Where | Trigger | Duration / easing | Loops | Reduced motion |
|---|---|---|---|---|---|---|
| O1 | **Hero orbit** (frames, rings, comet, bokeh drift) | Homepage hero | Load | Ported numbers | **Yes (approved exception)**, with "Tạm dừng chuyển động" / "Tiếp tục chuyển động" and auto-pause when the tab is hidden | Ported static layout |
| O2 | **Self-drawing line illustrations** (empty states, success, error, 404) | Customer and staff zones, public success | Mount / in view | 1200 ms `ease-in-out`, paths staggered 80 ms; the pastel blob behind fades in first (300 ms) | No | Drawn complete |
| O3 | **Service icon draw** | Dịch vụ cards, Tài khoản tiles, Giới thiệu pillars | In view | 600 ms `ease-in-out` | No | Static |
| O4 | **Orbit arc dividers** | Between public sections; the login panel | In view | 1100 ms `ease-in-out` | No | Static |
| O5 | **Yarn ball roll-in plus thread** | Giới thiệu (beside the arch) | In view | Roll 1000 ms `ease-out-expo`; thread 800 ms | No | Static |
| O6 | **Paw trail** (3 small paws "walking") | Footer, booking success, first-run welcome card | In view / mount | 3 × 140 ms; each paw opacity with scale .8→1 and a 6° rotation settle | No | Static |
| O7 | **Heart-pulse draw** | The Cấp cứu card, the emergency callout, the "Cấp cứu" contact row | In view | 800 ms `ease-in-out` | **No, never a heartbeat loop** | Static |
| O8 | **Floating decor objects** | Public sections (≥ 641 px) | Scroll | Scroll-linked transforms | Scroll-only | Static |
| O9 | **Parallax photo stack** (arch, plus round insert A cropped from `service-noitru` (blanket and paw), plus round insert B cropped from `pet-right` (eye and whiskers)) | Giới thiệu | Scroll | Arch ±24 px, inserts ±40 px, at different speeds | Scroll-only | Static |
| O10 | **Phone-mock tilt-in** | Tài khoản khách hàng | In view | 900 ms `ease-out-expo` | No | Static |
| O11 | **Map pin drop plus a single ripple** | Liên hệ | In view, after the streets | Pin 600 ms `spring-pop`; ripple 900 ms | No (ripple plays once) | Static pin |
| O12 | **Request timeline draw** (3 main nodes plus side outcomes) | Customer request detail, staff request detail | Mount | Spine scaleY 0→1, 900 ms `ease-in-out`; nodes pop at i × 220 ms; timestamps fade | No | Static |
| O13 | **Diary spine fill** (plum-700 fill over a `plum-200` track) | Customer stay detail → Nhật ký | Scroll within the list | Scroll-linked scaleY | Scroll-only | Full and static |
| O14 | **KPI count-up** | **Staff Tổng quan and Doanh thu only** (never public: no statistics; never customer money) | First view per session | 900 ms `ease-out-expo`; numbers formatted with `Intl.NumberFormat('vi-VN')`, tabular | No | Final value |
| O15 | **"ĐÃ THANH TOÁN" stamp** (teal-600 at 85% opacity, double border, rotated −8°, BVP 700 13 px, tracking .12em) | Staff invoice detail when a payment completes the invoice; customer invoice detail on first view per session | Event / mount | Scale 1.35→1, rotate −14°→−8°, opacity 0→1 over 380 ms `ease-pop` | No | Static stamp |
| O16 | **Login panel settle** (orbit ellipse draw, arc draw, 3 frames glide 12° along the ellipse and settle with a 90 ms stagger) | Login portal | Mount / after R1 | Ellipse 1200 ms; frames 1100 ms `ease-out-expo` | **No; still afterwards** | Static |
| O17 | **Booking success** (a `paw-heart` drawn at 64 px, then the paw trail O6) | Public form success, the zone booking form | Submit success | Draw 700 ms; paws +300 ms | No | Static |
| O18 | **Monoline cat draws itself** (`cat-dancing-monoline-brand-v7.svg`, which is stroke-based) | 404 and "Chưa tải được thông tin" | Mount | 1600 ms `ease-in-out` | No | Static. The deferred three-pose cat animation is **not** built. |
| O19 | **Revenue bars grow** | Staff Doanh thu (manager) | First view | scaleY from the baseline, 600 ms `ease-out-expo`, 30 ms stagger (max 12 bars staggered) | No | Static |
| O20 | **Avatar ring draw** (a pastel ring draws around the species avatar) | Customer Tổng quan "Các bé của bạn", the stay header | Mount | 700 ms `ease-in-out` | No | Static |

### 4.8 Reduced motion (global policy)

The trigger is `prefers-reduced-motion: reduce`. There is no in-app setting (YAGNI); the hero keeps its own pause button.

Under reduced motion:
- Every enter or reveal renders its **final state immediately**.
- Route changes become 120–150 ms opacity cross-fades. Opacity is not vestibular motion.
- Drawings appear complete. Count-ups show the final number. Parallax and scroll-linked effects are off and objects sit at their mid positions.
- The orbit wipe becomes a cross-fade. Spinners become text.
- Smooth scrolling becomes a jump.
- The hero follows its ported reduced-motion branch: text instantly, frames still, toggle hidden.
- Implementation: `MotionConfig reducedMotion="user"`, plus a CSS `@media (prefers-reduced-motion: reduce)` block that sets `animation: none` and `transition-duration: 0ms` on all non-colour transitions.

### 4.9 Performance budget

- **Animate only `transform` and `opacity`.** There are three documented exceptions:
  1. `stroke-dashoffset` (pathLength) on one-shot SVG drawings, with each drawing ≤ 600 × 600 px and not scroll-linked.
  2. Accordion `height` (M14), ≤ 240 ms, with content ≤ 400 px, never inside lists of more than 50 rows.
  3. The hero's ported `filter: blur` on far frames (existing).
- **Shadow and colour changes on hover** use opacity cross-fades of pre-rendered layers; `box-shadow` is not animated.
- **In-view detection** uses IntersectionObserver through Motion `whileInView` / `inView`. There are no scroll listeners that read layout. Scroll-linked values use Motion `useScroll`, which uses native ScrollTimeline in Chrome, off the main thread.
- **`will-change`** is set only during an animation (Motion handles this). It is never left permanently on more than 10 elements; the hero frames are exempt.
- **Concurrency.** At most about 24 elements animate at once per screen. Stagger caps apply (first 8 items). Tables over 50 rows get no row-level animation.
- **Targets:**
  - CLS = 0 from animation (space reserved, transforms only).
  - INP < 200 ms.
  - LCP < 2.5 s on "Fast 4G" with mid-tier mobile emulation.
  - No long task over 50 ms caused by animation setup.
  - ≥ 55 fps during section reveals with a 4× CPU throttle in Chrome DevTools.
- **Hero.** The simulator pauses when the tab is hidden (existing). An optional wrapper also pauses it when the hero is less than 10% visible. Photos are decoded asynchronously; the first 6 frames load eagerly and the rest lazily.
- **Weight budget:**
  - Motion: about 15 kB gz on public pages, about 30 kB in the zones.
  - Fonts: about 6 woff2 files, ≤ 260 kB in total.
  - Homepage images: ≤ 900 kB at DPR 2 (WebP).
  - Each demo video: ≤ 1.5 MB.

---

## 5. Icons

### 5.1 Decision: adapt Lucide plus hand-craft the vet set (not a fully custom set)

- **The approved icons already set the grammar.** The 4 approved service icons (from `ee11ffa^:demo/services.html`) use `viewBox 0 0 24 24`, `stroke-width 2`, `stroke-linecap round`, `stroke-linejoin round`.
  - Scissors and heart-pulse are Lucide paths.
  - The stethoscope and the house-with-paw are custom paths in the same grammar.
- **What Lucide covers.** Lucide 1.59.0 (ISC licence, 2,159 icons, all names in this section verified) covers about 80% of the UI need in exactly this grammar. Drawing 100 generic UI glyphs by hand would add risk without adding beauty.
- **"Meticulously crafted" means:**
  - one grammar;
  - per-size optical tuning (§5.3);
  - a hand-drawn set where the subject is the hospital's own (pets, care, kennels);
  - every icon reviewed on a contact sheet at 16, 20, 24 and 28 px on cream, white and the 4 pastels.
- **Delivery.**
  - Copy the needed paths from `lucide-static` at build time into **one local SVG sprite** (`icons.svg`, `<symbol id="i-…">`), together with the custom icons.
  - Keep the ISC licence notice.
  - No runtime icon dependency.
  - One component: `<Icon name="…" size={16|20|24|28} tone="…" />`.

### 5.2 Icon grammar

- **Grid.** 24 × 24, with a 2-unit safe margin (live area 2–22). Keylines: circle Ø 20, square 18 × 18, portrait 16 × 20, landscape 20 × 16. Circles are drawn about 5% larger than squares for optical balance.
- **Stroke.** 2 units by default, uniform within an icon. Round caps, round joins, no miters.
- **Corners.** Rectangles use `rx 2`. Inner corners are ≥ 1 unit. Curves are smooth with no kinks.
- **Pixel snapping.** Horizontal and vertical strokes sit on integer coordinates, so a 2-unit stroke covers whole pixels at 24 px.
- **Gaps.** At least 2 units between parallel strokes or a stroke and a fill. This prevents the "stuck together" effect that the icon QA flagged at 26–28 px.
- **Fills: only three permitted exceptions.**
  1. Paw pads and toe beans (≤ 4 units across), as in the approved house-paw.
  2. Dot features (eyes, noses, kibble), radius ≤ 1.25.
  3. The half-fill of `circle-half`.
  - No filled silhouettes.
- **No sparkles, stars, leaves or decorative bursts in icons** (locked). The hero's existing sparkle and flower decor stays **inside the hero only**.
- **Colour.** `currentColor`.
  - Default: plum-900 on pastels and cream.
  - Ink-600 for secondary icons.
  - Cream or `plum-200` on plum-900.
  - Status icons inherit the chip text colour.
- **Animation.** Every path uses `pathLength="1"` so draw-ins are uniform.

### 5.3 Optical sizes

| Render size | Stroke (in 24-unit space) | Rendered stroke | Detail rule | Use |
|---|---|---|---|---|
| 14 px | 2.5 | 1.46 px | Simplified: no inner details (e.g. no whiskers, single-line seams) | Chip icons |
| 16 px | 2.25 | 1.5 px | Simplified variants for cat-face, dog-face and house-paw (3 toes instead of 4 pads) | Inline with text, input adornments |
| 20 px | 2 | 1.67 px | Full | Staff nav, buttons, tables |
| 24 px | 2 | 2 px | Full | Customer nav, tab bars, public UI |
| 26–28 px | 2 | 2.17–2.33 px | Full (approved) | Inside 52 px badges |
| 40–64 px | 1.5 | 2.5–4 px | Full, with optional secondary details | Success marks (O17), big empty-state emblems |

### 5.4 Badges (pastel round backgrounds)

| Badge | Icon | Ring and shadow | Use |
|---|---|---|---|
| 28 px | 16 px | None | Staff dense lists, legend |
| 32 px | 18 px | None (flat) | Staff KPI tiles, cage tiles |
| 40 px | 22 px | 2 px white ring, `e-badge` at 60% | Customer cards, Liên hệ rows, pillars |
| **52 px** | **26–28 px** | **3 px white ring and the approved shadow** (locked) | Public services, Tài khoản tiles |
| 56 px | 28 px | 3 px ring | Species avatars (customer hero cards) |

**Colour mapping** (fixed meanings; use these for grids where meaning is neutral):
- **Peach `#FCD0B4`:** examination and care, contact (phone, address), "Lắng nghe trước", pets and paws.
- **Mint `#BEE4E6`:** grooming, booking and calendar, paid and positive.
- **Lilac `#E4C4E8`:** nội trú, account, video.
- **Rose `#F6BBC6`:** emergency. Also the 4th colour in neutral 4-colour grids such as the receipt tile.

The icon inside a badge is always plum-900 (approved). The cycle order is peach → mint → lilac → rose.

### 5.5 Complete inventory

**Where codes:**
- **P** public site
- **L** login portal
- **C** customer zone
- **S** staff zone
- **M** manager-only
- **I** INTERNAL: may render only inside staff "Hồ sơ nội bộ" or staff-only screens; **never** in P, L or C

**Sources:**
- `Lucide:name`
- **Custom** (hand-drawn, see §5.6)
- **Approved** (locked path, byte-for-byte)
- **Official** (third-party mark, unaltered)

**A. Brand and decoration** (always `aria-hidden`)

| Icon | Source | Where | Notes |
|---|---|---|---|
| `paw` (filled pads) | Custom (= the hero's `#i-paw`) | P, L, C, S decor | The hero's existing symbol is kept |
| `paw-heart` | Custom | P (booking success), L (Khách hàng tab), C (welcome) | A heart outline with a small filled paw inside |
| `yarn-ball` | Custom | P (Giới thiệu, hero-adjacent decor), empty states | Matches the hero yarn |
| `ball` | Custom | P decor | The hero's "small ball bottom-left" |
| `bone` | Lucide:`bone` | P decor, empty states | — |
| `heart` (hero heart) | Hero symbol `#i-heart` | P | — |
| `sparkle`, `flower` | Hero symbols | **Hero only** | Not reused anywhere else |
| `orbit-arc` | SVG ornament (not an icon) | P, L | Dividers, frames |
| Logo | **Official PNG** `logo-le-son.png` | Everywhere | Never redrawn or recoloured; on dark surfaces it sits on a cream tile |

**B. Navigation and chrome**

| Icon | Source | Where | Vietnamese label / aria |
|---|---|---|---|
| `menu` | Lucide:`menu` | P, S | "Mở danh mục điều hướng" / "Đóng danh mục điều hướng" |
| `x` | Lucide:`x` | All | "Đóng" |
| `chevron-down` / `-up` / `-left` / `-right` | Lucide | All | — |
| `arrow-right` | Lucide | P, C, S CTAs | The hero keeps its text glyph "→" (locked) |
| `arrow-left` | Lucide | L, C, S | "Về trang chủ", "Quay lại" |
| `arrow-up-right` | Lucide | P, C | External links ("Chỉ đường", "Mở trang Facebook") |
| `house` | Lucide:`house` | C, S | "Trang chủ Lê Sơn" |
| `house-heart` | Lucide:`house-heart` | C | "Tổng quan" |
| `layout-dashboard` | Lucide | S | "Tổng quan" |
| `inbox` | Lucide | S | "Yêu cầu đặt lịch" |
| `calendar-days` | Lucide | S | "Lịch hẹn" (day/week) |
| `calendar-check` | Lucide | C | "Lịch hẹn" |
| `users-round` | Lucide | S | "Khách hàng" |
| `paw-line` | Custom | C, S | "Thú cưng" |
| `house-paw` | **Approved** | P, C, S | "Nội trú" |
| `receipt` | Lucide | C, S | "Hóa đơn" |
| `tags` | Lucide | S | "Bảng giá" |
| `chart-column` | Lucide | M | "Doanh thu" |
| `link-2` | Lucide | S | "Tài khoản web" (linking) |
| `circle-user-round` | Lucide | C, S | "Tài khoản", avatar fallback |
| `search` | Lucide | S | Global search |
| `plus` | Lucide | C, S | "＋ Tạo nhanh", "Thêm bé" |
| `ellipsis-vertical` | Lucide | S | "Thêm thao tác" |
| `log-in` / `log-out` | Lucide | L, C, S | "Đăng nhập" / "Đăng xuất" |
| `shield-user` | Lucide | S | "Quyền của tôi" |
| `rotate-ccw` | Lucide | S, L (demo) | "Khôi phục dữ liệu mẫu" |

**C. Public site content**

| Icon | Source | Where | Use |
|---|---|---|---|
| `stethoscope` | **Approved** | P, S (service chip) | Khám & điều trị |
| `scissors` | **Approved** | P, S | Spa & grooming |
| `house-paw` | **Approved** | P, C, S | Nội trú |
| `heart-pulse` | **Approved** | P, C, S | Cấp cứu 24/24, emergency callouts |
| `phone` | Lucide | P, C, S | "Gọi 097 355 51 05", "Đường dây chung" |
| `map-pin` | Lucide | P, C | "Địa chỉ" |
| `navigation` | Lucide | P, C | "Chỉ đường" |
| `facebook` | **Official "f" glyph, monochrome plum, unaltered** | P | "Facebook". Not redrawn in line style: Meta's brand rules forbid altering the mark. |
| `message-circle-heart` | Lucide | P | Pillar "Lắng nghe trước" |
| `book-open` | Lucide | P | Pillar "Giải thích dễ hiểu" |
| `send` | Lucide | P | Step "Bạn gửi yêu cầu" |
| `phone-call` | Lucide | P | Step "Lê Sơn gọi lại" |
| `calendar-check` | Lucide | P, C | Step "Lịch hẹn được xác nhận" |
| `link-2` | Lucide | P, C | Footnote about account linking |
| `pause` / `play` (16 px, filled) | Hero symbols (ported) | P | "Tạm dừng chuyển động" / "Tiếp tục chuyển động" |
| `image` | Lucide (existing frame placeholder) | P | Only if a hero frame has no photo |

**D. Login and account**

| Icon | Source | Where | Use |
|---|---|---|---|
| `paw-heart` | Custom | L | Tab "Khách hàng" |
| `id-card` | Lucide | L | Tab "Nhân viên" |
| `eye` / `eye-off` | Lucide | L, C | Inside the "Hiện" / "Ẩn" toggle (text stays visible) |
| `lock` | Lucide | L, C, S | Password; locked nav items ("mở sau khi liên kết hồ sơ"); "Nội bộ" |
| `key-round` | Lucide | L, S | "Quên mật khẩu?", "Đặt lại mật khẩu" |
| `user-round-plus` | Lucide | L | "Tạo tài khoản" |
| `circle-alert` | Lucide | L, C, S | Field and form errors |
| `info` | Lucide | All | Helper banners |
| `copy` → `check` | Lucide | C | "Sao chép" (username) |

**E. Pets and species**

| Icon | Source | Where | Use |
|---|---|---|---|
| `cat-face` | Custom | C, S | Species "Mèo", species avatars |
| `dog-face` | Custom | C, S | Species "Chó", species avatars |
| `paw-line` | Custom | C, S | Species "Khác" |
| `cake` | Lucide | C, S | "Ngày sinh" |
| `weight` | Lucide | S (C only if the customer lens shows weight) | "Cân nặng" |
| `mars` / `venus` | Lucide | C, S | "Đực" / "Cái" (always with text) |
| `pencil` | Lucide | C, S | "Sửa" |

**F. Booking requests and appointments.** The status icons are in §2.2. Extra actions:

| Icon | Source | Where | Use |
|---|---|---|---|
| `clock` · `phone-outgoing` · `calendar-check` · `phone-missed` · `circle-x` · `circle-minus` | Lucide | C, S | The six statuses |
| `phone-redo` | Custom | S | Flag "Khách vừa gửi lại — cần gọi lại" |
| `user-round-check` / `user-round-x` | Lucide | S | "Đã đến" / "Không đến" |
| `calendar-plus` | Lucide | S | "Tạo lịch hẹn" |
| `calendar` | Lucide | P, C, S | Date fields |
| `undo-2` | Lucide | S | "Hoàn tác" |
| `history` | Lucide | S | "Lịch sử" |
| `funnel` · `arrow-up-down` | Lucide | S | "Lọc" · "Sắp xếp" |
| `check` · `x` | Lucide | S | "Xác nhận" · "Hủy" |

**G. Inpatient, diary and video**

| Icon | Source | Where | Use |
|---|---|---|---|
| `pet-bowl` | Custom | C, S | Diary "Ăn uống" |
| `droplets` | Lucide | C, S | "Uống nước" |
| `moon` | Lucide | C, S | "Nghỉ ngơi", "Tối" |
| `sunrise` / `sun` | Lucide | C, S | "Sáng" / "Chiều" (part of day; no clock times for customers) |
| `heart` | Lucide | C, S | "Tinh thần", "Đang hồi phục tốt" |
| `message-circle` | Lucide | C, S | "Lời nhắn" |
| `eye` | Lucide | C, S | "Cần theo dõi thêm" / "Cần theo dõi"; "Khách sẽ thấy" |
| `door-open` | Lucide | C, S | "Sẵn sàng về nhà", "Xuất viện" |
| `house-plus` | Lucide | S | "Nhập viện" |
| `kennel` / `kennel-empty` | Custom | S | Cage tile, "Trống" |
| `triangle-alert` | Lucide | S | Internal "Nặng"; warnings |
| `notebook-pen` | Lucide | S | Diary editor |
| `video` | Lucide | C, S | "Video" tab, video count on tiles |
| `circle-play` | Lucide | C, S | Play overlay on thumbnails ("Phát video") |
| `volume-x` | Lucide | C, S | "Không có âm thanh" |
| `hourglass` | Lucide | C, S | "Còn N ngày" |
| `video-off` | Lucide | C, S | "Video này đã hết thời gian lưu (60 ngày)." |
| `cloud-upload` | Lucide | S | "Tải video lên" |
| `trash-2` | Lucide | S | "Xóa" (danger) |
| `send` / `eye-off` | Lucide | S | "Chia sẻ với chủ nuôi" / "Ngừng chia sẻ" |
| `file-pen` | Lucide | S | "Bản nháp" |
| **INTERNAL clinical (I)** | | | |
| `pill` | Lucide | **I** | Thuốc |
| `syringe` | Lucide | **I** | Tiêm |
| `iv-bag` | Custom | **I** | Truyền dịch |
| `thermometer` | Lucide | **I** | Nhiệt độ |
| `clipboard-list` | Lucide | **I** | Y lệnh |
| `bandage` | Lucide | **I** | Thay băng |
| `e-collar` | Custom | **I** | Vòng chống liếm |
| `stethoscope` (approved) | Approved | **I** (in records) and P (service) | Thăm khám |

**H. Invoices and payments**

| Icon | Source | Where | Use |
|---|---|---|---|
| `receipt` / `receipt-text` | Lucide | C, S | List / "Tạo hóa đơn" |
| `circle-check` · `clock` · `circle-half` · `file-x` · `file-pen` | Lucide / Custom | C, S | Invoice statuses (§2.2) |
| `banknote` · `landmark` · `qr-code` | Lucide | **S only** | "Tiền mặt" · "Chuyển khoản" · "QR ngân hàng". The customer zone never shows a QR code. |
| `hand-coins` | Lucide | S | "Ghi nhận thanh toán" |
| `badge-percent` | Lucide | S | "Giảm giá" |
| `copy-plus` | Lucide | S | "Sao chép thành hóa đơn mới" |
| `file-check` | Lucide | S | "Phát hành hóa đơn" |
| `printer` | Lucide | C, S | "In hóa đơn" |
| `trending-up` · `calendar-range` | Lucide | M | Revenue report |
| `shield` | Lucide | M | Sensitive events in "Hoạt động gần đây" |
| `link-2` / `unlink` | Lucide | S | "Liên kết hồ sơ" / "Hủy liên kết" |

**I. System feedback**

| Icon | Source | Use |
|---|---|---|
| `circle-check` | Lucide | Success toast |
| `info` | Lucide | Info toast or banner |
| `triangle-alert` | Lucide | Warning ("Mục này vừa được người khác cập nhật…") |
| `circle-alert` | Lucide | Error ("Chưa lưu được. Vui lòng thử lại.") |
| `loader-circle` | Lucide | Busy (M20) |
| `refresh-cw` | Lucide | "Thử lại" |

**Totals:** about 100 Lucide glyphs (every name checked against `lucide-static@1.59.0`), **14 custom**, **4 approved (locked)** and 1 official third-party mark.

### 5.6 Custom icon specifications (drawing notes)

Every custom icon uses the §5.2 grammar.

| Custom icon | Construction |
|---|---|
| `paw` (decor) | Existing hero symbol, unchanged |
| `paw-line` | **Symmetric**, unlike Lucide's tilted paw. The main pad is a rounded trapezoid about 8 × 6.5 at (12, 16). Four toe ovals: rx 1.8 / ry 2.3 at (6, 10.5) rotated −20°; (9.5, 6.5) rotated −8°; (14.5, 6.5) rotated +8°; (18, 10.5) rotated +20°. Gaps ≥ 2. It matches the hero paw silhouette in outline. |
| `house-paw` | **Approved path**: `M3 10l9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z`, plus the filled paw (3 toes of r 1.1 and a pad). The 16 px variant drops to 3 toes and a pad of r 0.9. |
| `stethoscope`, `scissors`, `heart-pulse` | **Approved paths**, byte-for-byte from `ee11ffa^:demo/services.html` |
| `cat-face` | A rounded head (18 wide, 15 tall, base flattened). Ears are soft triangles with tip radius 1, angled about 30° outward, echoing the cat in the logo. Eyes are dots (r 1); the nose is a small rounded triangle. One whisker stroke per side only at ≥ 24 px. |
| `dog-face` | A rounded head (16 wide) with floppy drop ears hanging along both sides (teardrop outlines). Eyes are dots; the nose is a filled oval r 1.4; the muzzle a short "w" stroke. |
| `kennel` | The approved house roof angle (`l9-7 9 7`) with walls and an **arched door** (r 3.5) centred at the bottom, plus a small filled paw above the door at ≥ 24 px |
| `kennel-empty` | The kennel outline with `stroke-dasharray: 2 3` and no paw |
| `yarn-ball` | A circle (r 8) with 3 curved wrap strokes (2 crossing and 1 band). A thread tail curls out at the lower right and ends in a round cap. It matches the hero's light-purple yarn. |
| `ball` | A circle (r 7) with one S-shaped seam |
| `pet-bowl` | A low trapezoid bowl with a rounded bottom, a rim line on top, and 3 kibble dots above (r 1, filled) |
| `e-collar` | A truncated cone (wide at the front) wrapped around a small circle head (r 3) with 2 ear nubs |
| `iv-bag` | A rounded-rect bag (10 × 11, rx 3) with a hanger loop on top and a tube from the bottom down to a small drip (a dot) |
| `phone-redo` | Lucide's phone glyph scaled to 85% at the bottom-left, plus a circular "redo" arrow (r 4, 270°, with arrowhead) at the top-right |
| `circle-half` | A circle (r 9), stroke 2, with the left half filled (a permitted status fill) |
| `paw-heart` | The hero heart curvature as an outline, with a filled mini paw inside (3 toes and a pad), like the approved house-paw interior |
| `facebook` | Not custom: the official "f" logo as one monochrome path at 18–20 px inside a 40 px lilac badge |

**Icon QA (per icon, before the owner sees them):**
1. A contact sheet at 14, 16, 20, 24 and 28 px on cream, white and the 4 pastels, plus 20 px cream on plum-900.
2. No strokes stuck together at the approved 26–28 px size.
3. Optical weight matches its neighbours in a row.
4. The 16 px variants are legible.
5. The sheet is shown to the owner as a demo-only page reachable from the "Tiêu chí" review panel (route `#/demo/bo-icon`). It is not part of the product navigation.

### 5.7 Visibility rule for clinical icons

- `Icon` accepts `internal` icons only when it is rendered inside an `InternalSurface` component. In dev builds, rendering one elsewhere throws a warning. This is cheap insurance against leaking "syringe" or "pill" into customer views.
- The customer zone and public site have **no** imports of the internal set.

---

## 6. Illustration and photo plan (richness from 7 photos)

### 6.1 Photo inventory

There are 7 files but only **6 distinct scenes**: `pet-center.png` is the same puppy as `service-capcuu.jpg`.

| File | Scene | Native size | Strength |
|---|---|---|---|
| `service-kham.jpg` | Woman stroking a tabby cat | 1000×667 | The human touch: care |
| `service-grooming.jpg` | Hands brushing a smiling golden retriever | 1000×667 | Joy, grooming |
| `service-noitru.jpg` | Ginger cat asleep in blankets | 1000×1333 | Calm, safety: inpatient |
| `service-capcuu.jpg` / `pet-center.png` | Golden puppy holding a flower | 1000×1603 / 960×845 | Gentle, hopeful |
| `pet-left.png` | Laughing tabby-and-white cat in a yellow bandana | 700×840 | Personality, colour |
| `pet-right.png` | Tabby cat looking up against a blue sky | 700×840 | Clean graphic shape |

### 6.2 One colour grade for all photos

Applied once at build (PIL); validated in `crops/grade-duotone-sheet.jpg`.
1. Warm the balance: R ×1.025, B ×0.965.
2. Saturation 0.93; contrast 0.96.
3. A gradient-map blend at 10%, from shadows `#421247` to highlights `#FFF6EC`. This tints shadows plum and highlights cream, so every photo "belongs" to the palette.
4. **`pet-right` only:** shift the blue sky toward teal (hue −8°, blue saturation −25%), so its strong blue echoes the teal accent instead of fighting the plum.

Exports:
- WebP q78, with `width`/`height` attributes set.
- Each photo gets a "Ảnh minh họa" tag once per section.

### 6.3 Hero: 9 frames from the photos

**Display rules (from the simulator):**
- Frames are `w × 1.06w`.
- Desktop shows 9, tablet the first 8, mobile the first 6. So **indices 0–5 must be the strongest and most distinct crops.**
- Even indices are the large outer ring; odd indices are the small inner ring.

**Exports per crop:** 400 × 424 (desktop, DPR 2) and 240 × 254 (mobile), WebP.

| Index | Ring / size | Crop (source box x, y, w, h) | Subject |
|---|---|---|---|
| 0 | outer, 1.00 | `pet-left` 70, 34, 560, 593 | Laughing cat, yellow bandana (warmest first impression) |
| 1 | inner, .66 | `service-noitru` 190, 504, 560, 593 | Ginger cat asleep |
| 2 | outer, .90 | `pet-center` 180, 42, 600, 636 | Puppy with flower, face |
| 3 | inner, .62 | `pet-right` 50, 34, 560, 593 | Tabby with teal-shifted sky |
| 4 | outer, .84 | `service-grooming` 485, 23, 430, 455 | Golden retriever's smile |
| 5 | inner, .70 | `service-kham` 340, 55, 520, 551 | Hands stroking a tabby |
| 6 | outer, .96 | `service-kham` 50, 4, 560, 593 | Person and cat (the human bond) |
| 7 | inner, .60 | `service-grooming` 260, 258, 420, 445 | Hand brushing fur (detail) |
| 8 | outer, .76 | `service-capcuu` 50, 483, 900, 954 | Puppy, full body on the patio |

**What changes in the ported hero to show photos:**
- Only the frame inner template: an `<img>` with `object-fit: cover`, the existing inner radius, `decoding="async"`, `alt=""` (the frames container is already `aria-hidden`). The CSS-generated "ẢNH ĐANG CHỜ" label is hidden when an image is present.
- The corner tag "Bản xem thử · ảnh sẽ thay sau" becomes **"Ảnh minh họa"**.
- No simulator numbers change.
- Frames 2 and 8 show the same puppy. If the orbit ever places them adjacent, swap 8 with 6.

### 6.4 Where each photo is used (avoid repeating the same crop on one screen)

| Placement | Photo / crop | Treatment |
|---|---|---|
| Hero | 9 crops above | Graded, inside glass frames |
| Dịch vụ: Khám & điều trị | `service-kham`, arch 4:5, centred on the cat's head and the hands | Graded arch. `alt=""` (the card title carries the meaning). |
| Dịch vụ: Cấp cứu 24/24 | `service-capcuu`, arch 4:5, puppy's face and flower | Graded |
| Dịch vụ: Nội trú | `service-noitru`, arch 4:5, the sleeping cat | Graded |
| Dịch vụ: Spa & grooming | `service-grooming`, arch 4:5, the dog's face and the brushing hand | Graded |
| Giới thiệu: arch (O9) | `pet-left`, **full body** (different from the hero's face crop), 3:4 | Graded arch with an orange arc. Alt: "Ảnh minh họa: một bạn mèo đeo khăn vàng đang cười tươi" |
| Giới thiệu: round insert A | `service-noitru` detail: paw and blanket texture, 1:1 | Graded, 120 px circle with a white 4 px ring |
| Giới thiệu: round insert B | `pet-right` detail: eye and whiskers, 1:1 | Graded, 96 px circle |
| Tài khoản phone mock | Video poster thumbnails (V1, V2) inside the mock | Graded |
| Login panel (Khách hàng) | `pet-center`, `pet-right`, `service-noitru` | Graded, in glass frames on plum |
| Login panel (Nhân viên) | `service-kham`, `service-grooming`, `service-noitru` crop B | Graded |
| Customer zone | **Illustrated species avatars** (no pet photos; per the customer lens); photos appear only as video posters | — |
| Staff zone | Video posters; cage tiles use species avatars | — |
| 404 / error / empty | Line illustrations only | — |

### 6.5 Duotone (texture only)

- **Recipe:** grayscale with autocontrast, then a plum-900 → cream (`#FBF7F1`) gradient map. The plum→peach version looked too magenta in the test sheet, so it is rejected.
- **Use:**
  - As a **background texture at 10–14% opacity**: behind the Đặt lịch form column (`service-noitru`) and in the staff empty-state backdrops.
  - As the "expired video" tile backdrop (`video-off` on top).
  - Never as a foreground photo.

### 6.6 SVG line illustrations (new, hand-drawn)

**Style:**
- 1.75 px non-scaling stroke in plum-700, round caps.
- **One** accent stroke in orange-500 or turquoise `teal-400` (decorative only).
- A soft pastel blob behind (`plum-100` or `orange-100`).
- Small filled paw pads allowed.
- A slightly hand-drawn line (gentle irregular curves), to contrast with the geometric icons.
- ≤ 12 paths each, 160–200 px displayed, always drawn in (O2).

| ID | Illustration | Where | Title copy (Vietnamese) |
|---|---|---|---|
| IL1 | A cat sitting beside an empty cushion | C: Thú cưng empty | "Chưa có bé nào trong hồ sơ" |
| IL2 | A calendar page with a paw-print "stamp" | C: Lịch hẹn empty; S: empty day | "Chưa có lịch hẹn sắp tới" |
| IL3 | A receipt with a curled corner and a small heart | C: Hóa đơn empty | "Bạn chưa có hóa đơn nào" |
| IL4 | A large kennel with a cat asleep **outside** the door | C: Nội trú empty | "Hiện không có bé nào đang nội trú" |
| IL5 | A film frame with a yarn ball rolling out | C, S: Video empty | "Video của bé sẽ hiện ở đây khi được đăng" |
| IL6 | Monoline cat (existing `cat-dancing-monoline-brand-v7.svg`) beside an orbit arc | 404 | "Không tìm thấy trang này" |
| IL7 | A cat curled on a cushion with a small "z" | Load error | "Chưa tải được thông tin" |
| IL8 | `paw-heart` with an envelope | Booking success | "Lê Sơn đã nhận yêu cầu của bạn" |
| IL9 | An inbox tray with a cat napping on top | S: request queue empty | "Không còn yêu cầu nào cần xử lý" |
| IL10 | A magnifier with a paw print in the lens | S: no search results | "Không tìm thấy kết quả phù hợp" |
| IL11 | A hand-drawn map (streets, the "Khuất Duy Tiến" label, a kennel-shaped pin) | P: Liên hệ | Caption "Sơ đồ minh họa · không theo tỉ lệ" |

The existing filled cat SVGs (`cat-pose-booking.svg`, `cat-silhouette.svg`) are used **statically** with fade-in only. The three-pose cat animation stays deferred (locked).

### 6.7 Demo inpatient videos (ffmpeg)

Align with the staff lens table V1–V6 (sources and pets). The recipe was validated with ffmpeg 6.1 / libx264.

**Output settings**
- 1280×720, 25 fps, 8–12 s, H.264 `yuv420p`, CRF 27, `-movflags +faststart`.
- **`-an`**: no audio track at all. This matches "audio removed by default".
- Poster: a JPG grabbed at 1 s, at 1280×720 and 640×360.
- Each file ≤ 1.5 MB.

**Motion inside each clip**
- Ken Burns zoom 1.04→1.12, or a reverse 1.30→1.24 for variety.
- A slow pan toward the subject's face.
- A **handheld drift**: `+6*sin(on/37)` on x and `+5*sin(on/53)` on y, in source pixels at 3000 px wide. This makes it feel filmed on a phone, not like a slideshow.
- **Two of the six clips** use two crops of the same photo joined with `xfade=transition=fade:duration=0.8`, so they read as a cut. The second crop must be clearly tighter (zoom ≥ 1.6 on the face). A 1.3 zoom was tested and the cut barely reads.
- `vignette=PI/6` and saturation 0.95.

**Speed tip for the build:**
- Pre-upscale each still **once** to 3000 px wide (PIL Lanczos).
- Feed it as `-loop 1 -framerate 25 -t <seconds>` and use `zoompan … d=1`.
- Validated: a 7.2 s two-crop clip with xfade renders in about 31 s and weighs 315 kB (`crops/test-kb2.mp4`).
- Scaling to 4000 px inside the filter graph on every frame is very slow; that variant hit a 300 s timeout.

**Deliberately not done**
- No timestamps, "CAM 01" labels or fisheye. A CCTV look would imply cameras, which is an unconfirmed fact.
- No burned-in text. The container has no fonts with Vietnamese glyphs, and burned text is inaccessible.
- "Video minh họa" and "Không có âm thanh" are HTML chips on the thumbnail and in the player.

**Template** (one crop):

```
ffmpeg -loop 1 -framerate 25 -t 10 -i still-3000w.jpg -vf "zoompan=z='1.04+0.08*on/250':x='iw*0.5-(iw/zoom/2)+6*sin(on/37)':y='ih*0.36-(ih/zoom/2)+ih*0.10*on/250+5*sin(on/53)':d=1:s=1280x720:fps=25,vignette=angle=PI/6,eq=saturation=0.95,format=yuv420p" -an -c:v libx264 -preset slow -crf 27 -movflags +faststart V1.mp4
```

### 6.8 Labelling (comfort and honesty)

- **"Ảnh minh họa":**
  - the hero corner tag;
  - once per public section that uses photos (12 px caption, ink-500);
  - the login panel's bottom-left.
- **"Video minh họa":** a grey chip on every thumbnail and in the player title row.
- **"Sơ đồ minh họa · không theo tỉ lệ":** under the map.
- Photo `alt` text describes the pet gently and starts with "Ảnh minh họa:". Decorative crops use `alt=""`.

---

## 7. Responsive rules (320 → 1440+)

**Breakpoints (tokens):** 360 · 480 · 641 · 768 · **993** (the locked header switch) · 1024 (staff sidebar) · 1200 · 1440.

| Range | Public | Login | Customer zone | Staff zone |
|---|---|---|---|---|
| **320–359** | Locked header spec (logo only, both auth buttons, ☰, buttons ≥ 44 px, text 13.5 px). Gutter 16. Hero per the ported container queries (6 frames). Cards 1 column. Floating decor hidden. | Plum band (112 px) plus a full-width card. Tabs stay side by side (each ≥ 44 px). | Bottom tab bar (5 items, each ≥ 64 px wide). Cards 1 column. Chips truncate only in staff. | Bottom tab bar (4 + "Thêm"). Lists instead of tables. Tiles 2 per row. |
| **360–640** | Same, header per spec. Section padding 64–72. Parallax off. Phone mock hidden (customer lens). | Same | Same; the greeting is 24 px | Same; master → full-screen detail (R6) |
| **641–992** | ☰ menu (locked). Services 2×2. Two-column sections stack. Floating decor on (max 2 per section). | Single column, card centred (max 440), panel as a top band of 200 px with 3 frames | Bottom tab bar continues to 992 (customer lens). Cards 2 columns where useful. | 768–1023: icon rail (72 px) with tooltips. Tables on, with priority columns (lower-priority columns hide). |
| **993–1199** | Desktop header and nav. Services 2×2 (customer lens). Two-column sections. | Split 45/55 | Sidebar 248 | 1024+: full sidebar 248 and full tables |
| **1200–1439** | Services 4 across. Container 1200. Gutter 32. | Split | Content max 1080 | Content fluid |
| **≥ 1440** | Container capped at 1200 (wide elements 1320). The hero stays full-bleed; its own `cqw` maths scales it. Section backgrounds full-bleed. | The panel grows; the card stays at 440 | Content stays 1080, centred | Content up to 1440 |

**Global rules**
- **No horizontal page scroll at any width.** Staff tables that cannot fit scroll **inside their own container** with a sticky first column, and only at ≥ 768. Below 768 they become card lists.
- **Touch targets** are ≥ 44 × 44 at ≤ 1023, and ≥ 36 visible with a ≥ 44 hit area on desktop staff tables.
- **Type** uses `clamp()` as in §2.4. Body text is never below 15 px on mobile (staff tables 14).
- **Images** use `srcset`/`sizes` everywhere. Only the hero's first 6 frames are eager.
- **Safe areas:** bottom bars add `env(safe-area-inset-bottom)`.

---

## 8. Dark mode

**No.**
- `<meta name="color-scheme" content="only light">` and `:root { color-scheme: only light; }` prevent Chrome Android's "auto dark mode for web contents" from inverting the photos, badges and brand colours.
- `theme-color`: `#FBF7F1` (public, customer, login right side) and `#421247` (staff zone).
- The plum footer and staff sidebar already give "dark" depth where it helps.

---

## 9. Accessibility checklist for this lens

1. **Text contrast:** ≥ 4.5:1, or ≥ 3:1 for large text, using the §2.3 pairs only. `orange-600` is used for large text only. `ink-400`, `teal-400` and `orange-500` are never used for text.
2. **Non-text contrast:** icons and field borders ≥ 3:1 (`field-border` 3.43:1). Chip meaning always comes from **icon + label**.
3. **Focus:** visible on every interactive element, per §2.10. Focus is never obscured by sticky headers (`scroll-padding-top`).
4. **Motion:**
   - The hero has the pause control (locked).
   - Everything else is one-shot or scroll-only.
   - A complete reduced-motion fallback exists (§4.8).
   - Nothing flashes more than 3 times per second; nothing flashes at all.
5. **Decorative SVGs, frames, bokeh and floating objects** use `aria-hidden="true"`. Icon-only buttons have Vietnamese `aria-label`s (§10).
6. **Count-ups:** the real value is in the DOM text for screen readers. The animating number is an `aria-hidden` visual layer.
7. **Toasts** use `role="status"`, or `role="alert"` for errors. They do not steal focus.
8. **Dialogs** trap focus, close on Esc and return focus to the trigger.

---

## 10. Vietnamese microcopy owned by this lens

| Context | Copy |
|---|---|
| Hero motion toggle (locked) | "Tạm dừng chuyển động" / "Tiếp tục chuyển động" |
| Photo tag | "Ảnh minh họa" |
| Video tag | "Video minh họa" |
| Audio chip | "Không có âm thanh" |
| Video expiry chips | "Còn 45 ngày" · "Còn 10 ngày" · "Còn 2 ngày" |
| Expired video tile | "Video này đã hết thời gian lưu (60 ngày)." |
| Map caption | "Sơ đồ minh họa · không theo tỉ lệ" |
| Paid stamp | "ĐÃ THANH TOÁN" |
| Staff visibility chips | "Khách sẽ thấy" · "Nội bộ · khách không thấy" |
| Cage tile empty | "Trống" |
| Upload progress (staff) | "Đang tải video lên… 42%" → "Đang bỏ âm thanh…" → toast "Đã tải video lên. Video không có âm thanh và sẽ tự xóa sau 60 ngày." |
| Payment recorded (staff toast, with O15) | "Đã ghi nhận thanh toán. Hóa đơn HD-2610-0142 đã thanh toán đủ." |
| Copy button | "Sao chép" → "Đã sao chép" |
| Login welcome toast (customer) | "Chào mừng chị Lan quay lại!" (salutation from the profile setting) |
| Login welcome toast (staff) | "Chào buổi sáng, Hà. Chúc bạn một ngày làm việc nhẹ nhàng." |
| Skip link | "Bỏ qua, đến nội dung chính" |
| Icon-only aria-labels | "Đóng" · "Mở danh mục điều hướng" · "Đóng danh mục điều hướng" · "Thêm thao tác" · "Phát video" · "Video trước" · "Video tiếp theo" · "In hóa đơn" · "Sao chép tên đăng nhập" · "Tìm kiếm" · "Tạo nhanh" · "Xem chi tiết" |
| Alt text examples | "Ảnh minh họa: một bạn mèo đeo khăn vàng đang cười tươi" · "Ảnh minh họa: bạn mèo cam ngủ ngon trong chăn ấm" · "Ảnh minh họa: chú chó lông vàng đang được chải lông" · "Ảnh minh họa: chú cún lông vàng ngậm một bông hoa nhỏ" · "Ảnh minh họa: bạn mèo mướp được vuốt ve nhẹ nhàng" · "Ảnh minh họa: bạn mèo mướp ngước nhìn bầu trời" |

---

## 11. Open questions for owner

1. **Photos in the 9 hero frames.** Put the stock photos in the hero frames now, with the tag "Ảnh minh họa", replacing the "ẢNH ĐANG CHỜ" placeholders? *Default: yes.* You chose free stock photos, and nothing else in the approved hero changes.
2. **Scroll-only movement of small decorations outside the hero.** A few small paws, yarn balls and hearts drift slightly **only while you scroll** and stop when you stop. They never loop by themselves. Does this fit your rule against looping decoration? *Default: yes.* If not, they stay completely still.

---

## 12. Notes for the lead (cross-lens alignment)

- **Customer-facing inpatient status set:** customer lens vs staff lens differ (§2.2 note). The tones cover both; pick one list.
- **Toast position:** the staff lens has mobile toasts at the top; the customer lens has them at the bottom. This system uses **bottom-centre on mobile, bottom-right on desktop for every zone** (thumb reach, and the page title stays visible).
- **Facebook icon:** the customer lens says "line style". This lens uses the **official monochrome glyph** (brand-compliance requirement).
- **Video resolution:** the staff lens says 1280×720 and 8–12 s. This lens keeps that, adds the handheld drift, the cross-fade cuts and no burned-in text, and notes the pre-upscale speed tip.
- **Staff breakpoints (1024 / 768)** are kept as the staff lens defined them. Public and customer use the locked 993 switch.
- **Assets produced during validation** (scratch, not product):
  - `scratchpad/design/crops/hero-crops-sheet.jpg` (the 9 crops with their source boxes)
  - `crops/grade-duotone-sheet.jpg`
  - `crops/test-kb.mp4` and `crops/test-kb2.mp4` (two crops with xfade)
  - `tools/contrast.py`, `tools/crops.py`, `tools/grade.py`
