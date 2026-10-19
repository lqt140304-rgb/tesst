# Proposal: technical architecture for the Lê Sơn demo

**Lens:** technical architecture for the clickable demo (public site, login portal, customer zone, staff zone).
**Status:** design proposal for the lead. Prose is in English. Every user-facing string is in Vietnamese and is meant to be used as written.
**Sources:** BRIEF.md §2–§7, `proposal-customer.md` (route map, login portal, customer screens), `proposal-staff.md` (capabilities, data model §8, data-layer contract §9), the hero code in `/tmp/claude-0/hero/demo/`, the owner's older single-file hero, and the Artifact page contract (the rules for pages published on claude.ai).
**Probe:** I built a throwaway app in `scratchpad/design/probe/` (node_modules deleted afterwards). Section 15 separates what I verified from what I assumed.

---

## 0. Decisions at a glance

| # | Decision | One-line reason |
|---|---|---|
| 1 | **Vite 8 + React 19 + TypeScript 6 SPA**, `react-router` 8 hash data router, `motion` 13 for transitions. | Best motion control (two-level page transitions verified), typed contracts across about 30 screens, and React components move to Next.js unchanged. |
| 2 | **Hash routing (`#/…`) with `base: './'`**, plus a memory-router fallback if the host blocks `history`. | Static hosting with no rewrites. Verified under an unknown sub-path, and verified with `history` and `localStorage` both blocked. |
| 3 | **Two transition layers:** zone layer (public ↔ auth ↔ customer ↔ staff) and content layer inside each shell. Shells stay mounted. Exiting content is frozen. | The sidebar and header never flicker, and an exiting page never shows the next page's content. Verified. |
| 4 | **The orbit hero is mounted as the original vanilla module**, changed only to accept a root element and return `destroy()` (19 lines removed, 47 added, no maths touched). | Satisfies the "port faithfully, do not re-derive" rule. Teardown verified: 0 rAF calls/s after leaving, 9 frames after remount, StrictMode-safe. |
| 5 | **CSS Modules for all app CSS.** Only `tokens.css`, `fonts.css`, `base.css` and the verbatim `hero-orbit.css` are global. | The hero's global class names (`.btn`, `.frame`, `.cta`…) cannot collide with hashed module classes. |
| 6 | **Self-hosted fonts from `@fontsource/be-vietnam-pro` + `@fontsource/lora` (static, not variable)**, latin + vietnamese subsets only, woff2 only. They are inlined as data URIs in the Artifact build. | The hero waits for the family name `"Lora"` (the variable package registers `"Lora Variable"`). The Artifact CSP for same-origin fonts is uncertain, and inlining removes that risk. |
| 7 | **Mock data layer = typed async API (contract) + mock adapter**: one JSON document in `localStorage`, transactions, simulated latency, video blobs in IndexedDB, in-memory fallback. | The same contract is later implemented with Supabase. Feature code never changes. |
| 8 | **Internal vs customer separation is enforced five ways:** separate tables, explicit DTO projections (spread banned), import boundaries, session-bound customer API, and a value-scanning leak test. | "Customer must not see drugs/doses/orders" becomes a test that fails, not a convention. |
| 9 | **Sessions live in `sessionStorage` (per tab); data lives in `localStorage` (shared) with cross-tab sync.** | The owner can demo staff in one tab and customer in another and see changes flow across. |
| 10 | **Demo media via ffmpeg:** 6 Ken-Burns clips, H.264 720p, no audio track, about 1.0–1.2 MB per 10 s, plus poster and thumb JPEGs. | Measured 0.99–1.18 MB per clip. Matches the staff lens video seeds V1–V6. |
| 11 | **Tests:** Vitest for data layer and permission rules (node env, no jsdom), and Playwright 1.56.1 (matches the installed Chromium) for smoke tests per route at 1440 and 390. Also axe, an idle-motion check, and screenshot capture for owner review. | Fast, uses only what is installed. Every check ran in the probe. |
| 12 | **Three build targets:** `artifact` (published to claude.ai), `web` (local preview, Codex reference), `single` (one HTML file that opens from `file://`, like the owner's old demo). | The Artifact viewer blocks print, download and `confirm()`. A real-organization page needs the owner's OK before it gets a URL. |

---

## 1. Approach comparison

| Criterion | **A. Vite + React + TS SPA** (chosen) | B. Vanilla HTML/CSS/JS multi-page | C. Next.js static export |
|---|---|---|---|
| Beauty and motion, esp. page transitions | `AnimatePresence` exit/enter control, persistent shells, springs, layout animations. Two-level transitions verified in the probe. | Only cross-document View Transitions (no exit control, shells re-render on every page) or hand-rolled fades. Every navigation reloads the page, so the hero, fonts and data re-initialise. | App Router supports enter animations via `template.tsx`. Exit animations are unreliable, and view transitions are still experimental. *(assumed, not probed)* |
| Maintainability for about 30 screens | Components, typed contracts, one route table. | About 30 HTML files duplicating shells and nav, untyped globals for session and data. | Good, but the server/client component split is noise for a 100% client-side mock. |
| Ease for Codex → Next.js + Supabase | Components, CSS Modules, contracts and rules move as-is. Only the router adapter (1 file) and the data adapter change. | Full rewrite. | Closest in name, but static-export choices (no middleware, no server actions, client-only data) must be undone anyway. |
| Static hosting as an Artifact | One page plus assets, relative URLs, hash routes. Verified under a sub-path, in a simulated host skeleton, and with storage and history blocked. | Works, but each extra HTML page is "served without a skeleton". Cross-page navigation reloads the frame. | Export emits absolute `/_next/…` URLs and per-route folders. It needs a known `basePath`, and client navigation fetches RSC payload files by absolute path, which breaks under an unknown artifact path. *(assumed)* |
| Build speed | 1.2–1.7 s for the probe. `npm ci` takes 7 s warm. | None. | Tens of seconds for 30 routes. *(assumed)* |
| Bundle size | 127 KB gz framework baseline (measured), plus app code. | Smallest. | Similar framework weight, plus RSC payload files per route. |
| Testability | Vitest shares the Vite pipeline. Playwright runs against `vite preview`. | Playwright only. Unit-testing globals is awkward. | Vitest + Playwright, with a heavier setup. |

**Verdict: A.** B fails on maintainability and on the transitions the owner asked for. C fails on artifact hosting and buys nothing for a client-side mock. A keeps everything Codex needs: React components, CSS Modules, typed contracts.

*Considered inside A:* the native View Transitions API for page changes. Rejected for now: support differs by browser and shells cannot stay interactive while the old page exits. Motion gives one consistent result on Chrome desktop and phones.

---

## 2. Stack and exact versions

**Version policy:** pin exact versions (`save-exact`). Use the newest release that is at least about two weeks old and passed the probe. Upgrade only deliberately. All versions below exist on npm today (checked with `npm view … time`).

| Package | Version | Published | Why this one |
|---|---|---|---|
| `react`, `react-dom` | **19.3.0** | 2026-09-09 | 19.3.1 is 5 days old. |
| `react-router` | **8.4.0** | 2026-09-15 | `createHashRouter`, `createMemoryRouter`, `lazy`, `handle`, `useMatches`. Requires Node ≥ 22.22.0, and the container has 22.22.0. |
| `motion` | **13.5.1** | 2026-10-02 | Last 13.x release. 14.0.0 is a new major from the same day, and 14.3.0 is 4 days old. Verified: `motion/react` → `LazyMotion`, `m`, `domAnimation`, `AnimatePresence`, `MotionConfig`, `useIsPresent`. |
| `@fontsource/be-vietnam-pro` | **5.3.0** | 2026-07-19 | Has a `vietnamese` subset with correct `unicode-range` (verified). |
| `@fontsource/lora` | **5.3.0** | 2026-07-19 | **Static** package, so the family name is `"Lora"`, which the hero needs. Vietnamese subset present for 400–700 and italic (verified). |
| `lucide-react` | **1.52.0** | 2026-10-04 | Generic UI glyphs only, tree-shaken (see §10). |
| `idb-keyval` | **6.3.0** | 2026-07-08 | 600-byte IndexedDB wrapper for uploaded video blobs. |
| `vite` | **8.3.2** | 2026-10-01 | Rolldown-based. Resolves `url('@fontsource/…woff2')` in CSS (verified). |
| `@vitejs/plugin-react` | **6.1.1** | 2026-08-28 | Peer `vite ^8`. |
| `typescript` | **6.0.3** | 2026-04-16 | **Not 7.x:** `typescript-eslint` 8.71 requires `typescript <6.1.0` (verified peer range). |
| `vitest` | **5.0.5** | 2026-10-15 | **Not 5.0.3:** with npm 10.9.4, 5.0.3 crashes `npm install` (`Cannot read properties of null (reading 'edgesOut')`) via its optional peer `@vitest/browser-webdriverio >=5.0.0`. 5.0.5 installs cleanly (verified). |
| `@playwright/test` | **1.56.1** | — | **Must match** the preinstalled browsers (`/opt/pw-browsers/chromium-1194`). Do not upgrade unless browsers are reinstalled. |
| `@axe-core/playwright` | **4.13.0** | 2026-08-11 | Ran in the probe: 0 violations on both pages. |
| `eslint` / `@eslint/js` | **10.12.0** / **10.0.1** | 2026-10-02 / 2026-02-06 | Flat config. |
| `typescript-eslint` | **8.71.0** | 2026-09-28 | — |
| `eslint-plugin-react-hooks` / `-react-refresh` | **7.1.1** / **0.5.7** | — | `configs.flat.recommended`, `configs.vite`. |
| `globals` | **17.13.0** | 2026-10-01 | — |
| `prettier` | **3.9.9** | 2026-09-23 | Not exercised in the probe. |
| `@types/react`, `@types/react-dom` | **19.3.0** | 2026-09-09 | — |
| `vite-plugin-singlefile` | **2.3.3** | 2026-04-17 | Only for the `single` target. Verified: the output opens from `file://`, fonts load, routes work. |

**Deliberately not used (YAGNI):** Tailwind (the approved hero and header CSS is hand-tuned and stays as CSS), TanStack Query (a 60-line `useQuery` over a store-change event is enough), zod (plain TS validators in `rules/validation.ts`), date-fns (`Intl` + 10 helpers; Vietnam has no DST, so the fixed `+07:00` offset is safe), nanoid (`crypto.randomUUID()`), any QR library (see §14), jsdom (`jsdom@30` needs Node ≥ 22.22.2; unit tests run in the node env), a UI kit, a state library.

**Repo hygiene:** `.nvmrc` = `22.22.0`. `engines.node` = `>=22.22.0`. `.npmrc` sets `save-exact=true` and `engine-strict=true`. Commit `package-lock.json`. Set `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` and `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers` (the latter is already set in this container). Path alias `@/` → `src/`, which matches the Next.js default.

---

## 3. What the Artifact viewer allows, and how the build responds

The Artifact page contract shapes several technical choices. Some of these conflict with features in the other two lenses (see §14).

| Viewer rule | Consequence | Response in this architecture |
|---|---|---|
| The host wraps the published page in its own `<!doctype><head><body>` skeleton (charset, `viewport-fit=cover`, light `color-scheme`, safe-area padding on `:root`). | Vite's `index.html` must be published as a **fragment**. | `scripts/to-artifact-page.mjs` strips doctype/html/head/body and the charset/viewport metas, then adds `noindex`. Verified inside a simulated skeleton. |
| Only scripts from a CDN allowlist may load from **other** hosts. Supporting files published alongside the page load by relative URL. Fonts are only explicitly allowed from Google Fonts or as data URIs. | The JS/CSS chunks are fine as published files. Self-hosted font files are uncertain. | `base: './'`. The **artifact target inlines the woff2 files** into CSS (≈ 190 KB raw for 6 faces: Be Vietnam Pro 400/500/600/700, Lora 700/700 italic). The `web` target keeps them as files. |
| `localStorage`/IndexedDB work but may throw (previews, private mode). | Data layer must survive without storage. | `KV` adapter with try/catch and an in-memory fallback, plus a banner. Verified with a throwing `localStorage`. |
| Only a **plain `#token`** (letters, digits, `.` `_` `~` `-`) from the artifact link reaches `location.hash`. Never `/`, never a query string. | `#/nv/hoa-don` cannot be sent as a review link from outside. | In-app routes stay `#/…`. A catch-all route resolves **alias tokens** (`#nv-hoa-don` → `/nv/hoa-don`) for review links (§5.1). |
| `window.print()` does nothing. `<a download>` and script-driven saves are inert. `alert/confirm/prompt` never show. | Staff "In hóa đơn" and "Tải CSV" break. Any `confirm()` silently returns `false`. | Print-preview route and copy-to-clipboard dialog in the artifact build (§14). ESLint `no-alert`. All confirmations are in-page dialogs. |
| `tel:`/`mailto:` links are unreliable. | Hotline taps may do nothing. | The number is always visible as selectable text. `tel:` stays as a convenience. |
| No iframes/embeds. | No Google Maps embed. | The customer lens already uses a drawn map plus a "Mở Google Maps" link (new tab). |
| Theme: either full light/dark tokens, or a **deliberate single look** with explicit colors. | The brand is cream/plum. | **Single light theme, deliberate.** `color-scheme: light`, explicit `body` background, every color a token on `:root`. No dark mode (not requested). |
| Safe areas: side gutter `max(16px, env(safe-area-inset-left/right, 0px))` and `<meta name="claude:viewport-fit-sides" content="cover">`. Sticky headers use `top: env(safe-area-inset-top, 0px)`. Fixed bottom bars add `env(safe-area-inset-bottom)`. | Affects every shell. | Tokens `--gutter-l`, `--gutter-r`. The staff mobile tab bar and sticky headers follow these rules. Every form control gets a stable `id`. |
| Size limits: 16 MB per page or text file, 15 MB per binary, 255 files and 64 MB per publish, 511 files and 256 MB per version. | Fine, but hashed filenames would pile up across republishes. | Budget about 60 files and ≤ 15 MB. Each republish sends `null` for stale hashed paths (§13). |
| **A page that imitates a real organization (name, logo, contact) is built as files first; the person decides whether it gets a URL.** | This demo carries the hospital's real name, logo, address, hotline and a login form. | **Publishing is gated on the owner's explicit OK** (open question). Safeguards in every build: a "Bản demo · dữ liệu mẫu" chip on every screen, `noindex`, a password hint on login and sign-up, salted hashes (no plaintext passwords stored). The `single` target is the no-URL fallback. |

Demo safeguard copy:
- Chip on every screen: **"Bản demo · dữ liệu mẫu"**
- Under password fields (login, sign-up): **"Đây là bản demo. Bạn đừng dùng mật khẩu đang dùng ở nơi khác nhé."**

---

## 4. Folder structure (feature-based)

```
tesst/
├─ index.html                      # lang="vi", <title>, #root, module entry
├─ package.json  package-lock.json  .npmrc  .nvmrc
├─ vite.config.ts                  # base './', targets via VITE_TARGET, test config (vitest/config)
├─ vite.single.config.ts           # vite-plugin-singlefile target
├─ tsconfig.json                   # strict, noUncheckedIndexedAccess, allowJs (hero only), paths @/*
├─ eslint.config.js  .prettierrc  playwright.config.ts
├─ scripts/
│  ├─ make-media.sh                # ffmpeg pipeline (§11) + media.manifest.tsv
│  ├─ to-artifact-page.mjs         # dist → page fragment for the Artifact host
│  ├─ artifact-files.mjs           # prints the publish `files` map (+ null for stale paths)
│  ├─ check-budgets.mjs            # gzip sizes and file counts vs §13 budgets
│  └─ contact-sheet.mjs            # review/index.html from Playwright screenshots
├─ e2e/
│  ├─ manifest.ts                  # route × role × sample params (generated from src/app/routes.ts)
│  ├─ smoke.spec.ts  a11y.spec.ts  motion.spec.ts
│  └─ journeys/  booking.spec.ts  linking.spec.ts  video.spec.ts  billing.spec.ts  permissions.spec.ts
└─ src/
   ├─ main.tsx                     # fonts/tokens import, router creation (hash or memory), RouterProvider
   ├─ app/
   │  ├─ routes.ts                 # path helpers: paths.kh.hoaDon(id) … (Next.js-ready, no '#')
   │  ├─ router.tsx                # the single route table with handle metadata (§5)
   │  ├─ nav.tsx                   # AppLink, useAppNavigate — the ONLY files importing react-router's Link/navigate
   │  ├─ transition.tsx            # TransitionScope, FrozenOutlet, useStableLocation (§6)
   │  ├─ guards.tsx                # RequireGuest, RequireCustomer, RequireStaff, CapGate, LinkedGate
   │  ├─ layouts/  RootLayout  PublicLayout  AuthLayout  CustomerLayout  StaffLayout  PrintLayout
   │  ├─ session/  SessionProvider.tsx  useSession.ts
   │  └─ system/   NotFoundOrAlias.tsx  Forbidden.tsx  RouteError.tsx  DemoChip.tsx  StorageBanner.tsx
   ├─ features/
   │  ├─ public/   home/ (HomePage + sections/)  hero/ (HeroOrbit.tsx, hero-orbit.js, hero-orbit.css, hero-orbit.d.ts)
   │  │            header/ (PublicHeader, ported header-mobile spec)  footer/
   │  ├─ booking/  BookingForm (guest + logged-in variants, shared by public and customer zone)
   │  ├─ auth/     LoginPage  SignupPage  ForgotPanel  DemoAccountChips  ResetDemoLink
   │  ├─ customer/ overview/ pets/ appointments/ inpatient/ invoices/ account/   index.ts (zone chunk)
   │  └─ staff/    dashboard/ requests/ appointments/ customers/ web-accounts/ inpatient/ invoices/
   │               pricelist/ revenue/                                              index.ts (zone chunk)
   ├─ ui/                          # design system: Button, Field, Dialog, Sheet, Tabs, Toast, StatusPill,
   │  │                            # IconBadge, Card, DataTable, EmptyState, Skeleton, VideoPlayer, Money, DateText
   │  ├─ icons/                    # hand-drawn SVG components + Icon wrapper (§10)
   │  └─ motion.ts                 # durations/easings/variants tokens
   ├─ styles/  tokens.css  fonts.css  base.css          # the only global CSS besides hero-orbit.css
   ├─ data/
   │  ├─ index.ts                  # export const api: Api = mockApi   (Codex swaps this line)
   │  ├─ hooks/  useQuery.ts  useMutation.ts
   │  ├─ contracts/                # framework-free types: api.ts, customer.ts (DTOs), staff.ts, public.ts,
   │  │                            # enums.ts (+ Vietnamese label maps), errors.ts
   │  ├─ rules/                    # pure domain rules, reusable server-side later:
   │  │                            # capabilities.ts, request-status.ts, dedupe.ts, invoice-math.ts,
   │  │                            # validation.ts, video-expiry.ts, linking.ts
   │  └─ mock/
   │     ├─ store/  kv.ts  blobs.ts  db.ts (load/transact/subscribe)  schema.ts  version.ts
   │     ├─ seed/   clock.ts  index.ts  accounts.ts  requests.ts  appointments.ts  inpatient.ts  billing.ts
   │     ├─ auth.ts  guard.ts (currentActor, assertCap)  audit.ts  ids.ts  latency.ts  test-hooks.ts
   │     ├─ projections/customer/  requests.ts  appointments.ts  pets.ts  stays.ts  videos.ts  invoices.ts
   │     └─ api/  public.ts  auth.ts  system.ts  customer/*.ts  staff/*.ts
   ├─ lib/  dates.ts (vi-VN, Asia/Ho_Chi_Minh)  money.ts (VND)  phone.ts (VN mobile ↔ E.164)  cx.ts
   └─ assets/  img/ (logo, 7 stock photos)  media/ (mp4, posters, thumbs; lite/ for single)  illustrations/ (SVG)
```

Rules that come with the structure:
- A feature folder imports only from `@/ui`, `@/lib`, `@/app/nav`, `@/app/session` and its own `@/data` facade. Features never import each other, except `booking/`, which public and customer both use.
- `@/data` exposes facades by audience (`@/data/public`, `@/data/customer`, `@/data/staff`), and ESLint enforces who may import which (§8.5).

---

## 5. Routing

### 5.1 Strategy

- **Router:** `createHashRouter(routes)`. At boot, `history.replaceState` is tried inside try/catch. If it throws (sandboxed host), use `createMemoryRouter(routes)`. Verified: with `pushState` and `replaceState` patched to throw, navigation still works.
  - Consequence: all in-app links must be `AppLink`/`useAppNavigate`, never raw `href="#/…"`. Raw hash anchors do nothing in memory mode (verified).
- **One route table** (`app/router.tsx`). Every route carries `handle` metadata, which drives guards, transitions, titles, nav highlighting and the e2e manifest:
  ```ts
  type RouteHandle = {
    zone: 'public' | 'auth' | 'customer' | 'staff' | 'print';
    pageKey: string;            // transition identity: routes sharing a pageKey do NOT remount
    title: string;              // "Hóa đơn" → document.title "Hóa đơn · Lê Sơn"
    cap?: Cap | Cap[];          // staff: any-of
    linkedOnly?: boolean;       // customer: show the locked explainer if the account is not linked
    section?: 'dich-vu' | 'dat-lich' | 'gioi-thieu' | 'lien-he';
    alias?: string;             // plain-token review link, e.g. 'nv-hoa-don'
  };
  ```
- **Code splitting by zone.** The public zone is eager (home renders on first paint, no fallback flash). `auth`, `customer` and `staff` each load one lazy chunk: every page route in a zone imports from the zone's `index.ts`. A root `hydrateFallbackElement` (logo + "Đang mở…") covers deep links into lazy zones. This removes the react-router warning seen in the probe.
- **Path helpers** (`app/routes.ts`) produce plain paths (`/nv/hoa-don/123`). No `#` appears in feature code, so Next.js later uses the same helpers.
- **Review aliases.** The catch-all route `*` first resolves `location.pathname` against the alias table, then `<Navigate replace>`. Otherwise it renders Not Found.
  - Example: `…/artifact/<id>#nv-noi-tru` opens the staff cage board. If the visitor is logged out, it goes through login and then returns there.
  - Aliases exist for every static route: `trang-chu`, `dat-lich`, `dang-nhap`, `dang-ky`, `kh`, `kh-thu-cung`, `kh-lich-hen`, `kh-noi-tru`, `kh-hoa-don`, `kh-tai-khoan`, `nv`, `nv-yeu-cau`, `nv-lich-hen`, `nv-khach-hang`, `nv-tai-khoan-web`, `nv-noi-tru`, `nv-hoa-don`, `nv-bang-gia`, `nv-doanh-thu`, `bo-icon`.
- **Scroll and focus.**
  - In AnimatePresence `onExitComplete`, scroll to top. On back/forward, restore the saved position for `location.key` instead.
  - On section routes, after enter, call `scrollIntoView` (`smooth`, or `auto` with reduced motion).
  - After a client-side navigation (not on first load), move focus to the new page's `<h1 tabIndex={-1}>` and set `document.title`.
- **Not Found:** title "Không tìm thấy trang này", body "Có thể đường dẫn đã thay đổi. Bạn quay về trang chủ để tiếp tục nhé.", button "Về trang chủ".

### 5.2 Route map (all URLs)

`#` precedes every path in the address bar. "Chunk" is the JS chunk that renders the page.

| Path | Screen | Zone / layout | Guard | pageKey | Chunk |
|---|---|---|---|---|---|
| `/` | Homepage (hero + sections) | public / PublicLayout | — | `home` | main |
| `/dich-vu`, `/dat-lich`, `/gioi-thieu`, `/lien-he` | Homepage scrolled to section | public | — | `home` (no remount, no hero replay) | main |
| `/dang-nhap` | Login portal, tab Khách hàng | auth / AuthLayout | RequireGuest | `login` | auth |
| `/dang-nhap/nhan-vien` | Login portal, tab Nhân viên | auth | RequireGuest | `login` (tab change cross-fades inside the card) | auth |
| `/dang-nhap/quen-mat-khau` | Forgot-password panel | auth | RequireGuest | `login` (card content swaps, card animates height) | auth |
| `/dang-ky` | Customer sign-up | auth | RequireGuest | `signup` | auth |
| `/khach-hang` | Tổng quan | customer / CustomerLayout | RequireCustomer | `kh.home` | customer |
| `/khach-hang/thu-cung`, `/khach-hang/thu-cung/:petId` | Pets, pet profile | customer | RequireCustomer | `kh.pets`, `kh.pet` | customer |
| `/khach-hang/lich-hen`, `/khach-hang/lich-hen/:id` | Appointments & requests, detail | customer | RequireCustomer | `kh.appts`, `kh.appt` | customer |
| `/khach-hang/dat-lich` | Booking form, logged-in variant | customer | RequireCustomer | `kh.book` | customer |
| `/khach-hang/noi-tru`, `/khach-hang/noi-tru/:stayId` | Inpatient diary & videos | customer | RequireCustomer + LinkedGate | `kh.stays`, `kh.stay` | customer |
| `/khach-hang/hoa-don`, `/khach-hang/hoa-don/:id` | Invoices, invoice detail | customer | RequireCustomer + LinkedGate | `kh.invoices`, `kh.invoice` | customer |
| `/khach-hang/tai-khoan` | Account & profile | customer | RequireCustomer | `kh.account` | customer |
| `/nv` | Staff Tổng quan | staff / StaffLayout | RequireStaff | `nv.home` | staff |
| `/nv/yeu-cau`, `/nv/yeu-cau/:id` | Request queue + detail (master-detail) | staff | `requests.handle` | `nv.requests` (detail panel animates inside) | staff |
| `/nv/lich-hen?view=ngay\|tuan&date=YYYY-MM-DD` | Day/week calendar | staff | `appointments.view` | `nv.calendar` | staff |
| `/nv/khach-hang`, `/nv/khach-hang/:id` | Customers + record | staff | `customers.view` | `nv.customers` | staff |
| `/nv/tai-khoan-web` | Web accounts & linking | staff | `accounts.link` | `nv.accounts` | staff |
| `/nv/noi-tru`, `/nv/noi-tru/:stayId` | Cage board, stay detail (internal tab needs `inpatient.clinical`) | staff | `inpatient.view` | `nv.board`, `nv.stay` | staff |
| `/nv/hoa-don` | Invoice list | staff | `invoices.create` or `payments.record` | `nv.invoices` | staff |
| `/nv/hoa-don/moi` | Invoice editor | staff | `invoices.create` | `nv.invoice-new` | staff |
| `/nv/hoa-don/:id` | Invoice detail, payments | staff | `invoices.create` or `payments.record` | `nv.invoice` | staff |
| `/nv/hoa-don/:id/ban-in` | **Print preview (A5)**, added for the Artifact constraint (§14) | print / PrintLayout | same as above | `nv.print` | staff |
| `/nv/bang-gia` | Price list (read; edit needs `pricelist.edit`) | staff | RequireStaff | `nv.prices` | staff |
| `/nv/doanh-thu` | Revenue report | staff | `reports.revenue` | `nv.revenue` | staff |
| `/_bo-icon` | Icon sheet for owner review (not linked in nav) | public | — | `icons` | main |
| `*` | Alias resolver or Not Found | public | — | `404` | main |

Totals: 32 URLs, 28 distinct screens, plus the icon sheet and 404.

### 5.3 Guards and redirects

| Who | Opens | Result |
|---|---|---|
| Guest | `/khach-hang/*` | `→ /dang-nhap?tiep=<path>`, with the strip "Bạn đăng nhập để tiếp tục nhé." (customer lens) |
| Guest | `/nv/*` | `→ /dang-nhap/nhan-vien?tiep=<path>` |
| Customer | `/nv/*` | `→ /khach-hang` (silent) |
| Staff | `/khach-hang/*` | `→ /nv` (silent) |
| Anyone logged in | `/dang-nhap*`, `/dang-ky` | `→` own zone |
| Staff without the capability | a capped route | In-place Forbidden page (staff lens copy), nav item hidden |
| Customer not linked | `linkedOnly` route | In-place locked explainer page (customer lens), nav item shows a lock |

Guard and `tiep` details:
- `tiep` is sanitised: only internal paths starting with `/khach-hang`, `/nv` or `/dat-lich` are accepted. Anything else falls back to the zone home. This also teaches Codex the open-redirect habit.
- Guards are components that read the session **synchronously** (no latency on `getSession`), so protected content never flashes.
- They map 1:1 onto Next.js `middleware.ts` plus server layout checks later.

---

## 6. Layout shells and transitions

### 6.1 Shells

| Shell | Contains | Stays mounted across |
|---|---|---|
| **PublicLayout** | Ported header (logo, nav, "Đăng nhập" + "Đăng ký" at every width incl. 320 px, mobile drawer per `dac-ta-header-mobile`), `<main>`, footer with "Dành cho nhân viên" link, DemoChip | All public pages and section routes |
| **AuthLayout** | Minimal top bar (logo → `/`, "← Về trang chủ"), split illustrated panel + card (customer lens §5.1), reset-demo link | Login ↔ sign-up ↔ forgot |
| **CustomerLayout** | Zone header and nav (desktop), bottom nav (mobile) with static unseen-update dots, account menu, DemoChip, StorageBanner | All `/khach-hang/*` |
| **StaffLayout** | Sidebar (desktop) and bottom tab bar with "Thêm" sheet (mobile), top bar with "＋ Tạo nhanh", global search, profile menu ("Quyền của tôi", "Khôi phục dữ liệu mẫu", "Đăng xuất"), DemoChip, StorageBanner | All `/nv/*` except print |
| **PrintLayout** | Bare A5 sheet on a grey desk background, a top bar with "← Quay lại hóa đơn" and "In" | — |

### 6.2 Two-level transitions (verified in the probe)

- **Level 1 (RootLayout):** `AnimatePresence mode="wait"` keyed by `handle.zone`. The zone change verified in the probe: staff exits (opacity 1 → 0 over about 200 ms, still showing its own last page), then the public zone enters (about 320 ms).
- **Level 2 (each zone layout):** `AnimatePresence mode="wait"` around the content area only, keyed by `handle.pageKey`. Verified: the sidebar DOM node is the same before and after `/nv` → `/nv/yeu-cau`.
- **Freeze-on-exit:**
  - `TransitionScope` reads motion's `useIsPresent()` and ANDs it with its parent scope.
  - `FrozenOutlet` and `useStableLocation()` keep returning the last value captured while every ancestor layer was present.
  - Without this, an exiting staff shell would re-render with the new URL and flash a 404 or the wrong page. About 25 lines, with one documented `eslint-disable react-hooks/refs`.
- **Hard rule for the public zone:** page transitions use **opacity + translate only, never scale or rotate**. The hero computes positions from `getBoundingClientRect()` differences. A uniform translate cancels out, a scale would skew the orbit until the next relayout. Verified: the hero laid out correctly after entering with translateY.
- **Motion tokens** (`ui/motion.ts`, design lens may tune):
  - zone enter 320 ms `cubic-bezier(.2,.7,.2,1)` from `y: 12`; zone exit 200 ms ease-in to `y: -8`
  - page enter 240–280 ms; page exit 140 ms
  - panels and sheets use a spring (stiffness 380, damping 34)
  - toasts 200 ms
  - Total navigation stays under 0.5 s.
- **Feature bundles:**
  - `LazyMotion features={domAnimation} strict` in the main chunk (≈ 77 KB min with motion-dom).
  - Screens that need `layout`/`layoutId` (tab underline, card height morph in the login card, cage moves) wrap themselves in an async-loaded `domMax`. The main chunk does not grow.
- **Reduced motion:** `MotionConfig reducedMotion="user"` drops transform and layout animations and keeps short fades. CSS animations sit behind `@media (prefers-reduced-motion: no-preference)`. The hero has its own static layout and pause button (unchanged).
- **"Nothing loops outside the hero" is tested,** not just reviewed (§12.3). On every non-home route:
  - 2 s after load, `requestAnimationFrame` calls per second must be 0 (probe measured 0 after leaving the hero);
  - `document.getAnimations()` must have no infinite iterations.

---

## 7. Session and permissions (mock)

### 7.1 Session

- **Storage:** `sessionStorage['leson-demo:session']` = `{ v: 1, kind: 'customer' | 'staff', subjectId, startedAt }`, through the same KV adapter (memory fallback).
  - It is per tab: a reload keeps you logged in, and a new tab starts logged out.
  - This lets the owner run "Quản lý" in one tab and "Khách hàng" in another (the data syncs across tabs, §8.2).
- **Login** (`api.auth.login({ identifier, password })`):
  - Finds the account by normalised VN phone (`0973555105` ↔ `+84973555105`) or by username.
  - Checks a **salted SHA-256** (`crypto.subtle`) and returns the account's real kind.
  - The UI routes by kind whichever tab was used (customer lens rule: a wrong tab is never punished).
  - Seeded sample passwords are shown on the quick-fill chips.
- **Sign-up** creates a `web_accounts` row (no OTP). The username-not-phone rule lives in `rules/validation.ts`, shared with the API.
- **Logout** clears the session, goes to `/`, and shows the customer lens toast.
- No expiry, no "remember me" (YAGNI).

### 7.2 Capabilities in code

- `data/rules/capabilities.ts` is pure and framework-free. It holds the 17 capability keys and 3 presets from `proposal-staff.md` §1:
  ```ts
  export const CAPS = ['requests.handle', 'appointments.view', /* … 17 */] as const;
  export type Cap = (typeof CAPS)[number];
  export const PRESETS = { quan_ly: [...], bac_si: [...], spa: [...] } satisfies Record<PresetId, readonly Cap[]>;
  export const effectiveCaps = (u: StaffUser): ReadonlySet<Cap> => new Set([...u.preset_ids.flatMap(p => PRESETS[p]), ...u.extra_capabilities]);
  ```
- **Three places use it:**
  1. **UI:** `useCan(cap)` hides nav items and actions.
  2. **Routes:** `handle.cap` is checked by `CapGate`, which renders Forbidden.
  3. **Data layer:** every staff function starts with `assertCap(actor, cap)`, which throws `ForbiddenError`. The subject is always read from the session, never from parameters.
- The same capability matrix drives a table-driven unit test (§12.1) and later the SQL `has_cap()` function.
- **Customer linking:** `customerScope(session)` returns `{ accountId, customerId | null }`. Linked-only API functions throw `NotLinkedError` when `customerId` is null. `LinkedGate` turns that into the locked page.

---

## 8. Mock data layer

### 8.1 Layers

```
features/*  ──useQuery/useMutation──▶  @/data (api: Api contract)  ──▶  mock/api/{public,auth,customer,staff,system}
                                                                          │  assertCap, scope, latency, audit
                                                                          ▼
                                                     mock/projections/customer/*  (explicit DTO builders)
                                                                          ▼
                                                     mock/store/db.ts (document, transact, subscribe)
                                                                          ▼
                                                     kv.ts (localStorage | memory)   blobs.ts (IndexedDB | memory)
```

- `data/contracts/api.ts` defines the `Api` interface (the staff lens §9 function list, plus `public.bookings.submit`, `auth.*`, `customer.*` reads, `system.*`).
- `data/index.ts` exports `api` as the mock implementation. **Codex swaps this one export.**

### 8.2 Store

**Document:** one JSON value at `localStorage['leson-demo:v1']`:
```ts
{ schemaVersion: 1, seededAt: '2026-10-19', dirty: false, rev: 0,
  counters: { YC: 16, LH: 40, NT: 36, HD: 120, PT: 88 },   // human codes; formats per staff lens
  t: { web_accounts: [], account_pets: [], customers: [], account_links: [], pet_links: [], pets: [],
       booking_requests: [], request_events: [], appointments: [], cages: [], stays: [], care_orders: [],
       care_administrations: [], care_notes: [], diary_entries: [], videos: [], price_items: [],
       invoices: [], invoice_lines: [], payments: [], audit_events: [], staff_users: [] } }
```
Table and field names are exactly those in `proposal-staff.md` §8, so they become Postgres tables later.

**Writes go through `transact(label, actor, fn)`:**
1. `structuredClone` the document.
2. `fn(draft)` mutates it, allocates IDs and codes, and appends audit events.
3. Invariants are checked (dev and tests). Example: `resubmit_flag_at ⇒ status = unreachable`.
4. The document is persisted, swapped in memory, `rev++`, `dirty = true`, and subscribers are notified.

If `fn` throws, nothing changes. This makes the staff lens's atomic operations (confirm request + create appointment, issue invoice, record payment, link + pet links) all-or-nothing, mirroring a future RPC.

**Optimistic concurrency:** mutable entities carry `version`. A mismatch throws `ConflictError`, which can happen with two tabs open. Staff copy: "Hồ sơ này vừa được cập nhật ở nơi khác. Đã tải lại bản mới nhất, bạn kiểm tra rồi thao tác lại."

**Cross-tab sync:** a `storage` event on our key reloads the document and notifies subscribers. Example: a video shared in the staff tab appears in the customer tab without a reload.

**Freshness** (staff lens rule):
- On boot, if `seededAt ≠ today(VN)` and `!dirty`, reseed silently.
- If `dirty`, show the staff lens banner with "Khôi phục".

**Schema change:** if `schemaVersion` differs, wipe and reseed (no migrations, YAGNI). Toast: "Bản demo vừa được cập nhật nên dữ liệu mẫu đã được làm mới."

**Storage failures:**
- If KV is unavailable or a write hits the quota, keep running in memory.
- Banner: "Bản demo không lưu được trên trình duyệt này." Sub-line: "Mọi thay đổi sẽ mất khi bạn tải lại trang."
- Expected size of the document is 200–400 KB, far under the ~5 MB quota.

**Direct storage access is banned outside `kv.ts` and `blobs.ts`** (ESLint `no-restricted-globals` for `localStorage`, `sessionStorage`, `indexedDB`). Every access therefore goes through try/catch.

### 8.3 Latency, errors, hooks

- **Latency:** reads 120–300 ms on first fetch, 0 ms on refetches triggered by a store change (stale-while-revalidate, so no spinner storms). Writes 250–500 ms, so the button spinner and toast read as real.
- **Typed errors** (`contracts/errors.ts`): `ForbiddenError`, `NotFoundError`, `NotLinkedError`, `ConflictError`, `ValidationError` (`{ field: messageVi }`), `StorageError`.
- **Hooks:**
  - `useQuery(fn, deps)` returns `{ data, error, isLoading, isRefreshing, refetch }` and re-runs on store `rev` change.
  - `useMutation(fn)` returns `{ run, pending, error }`.
  - About 80 lines total, with no dependency.
- **Generic customer-facing copy:**
  - Load error: "Chưa tải được nội dung. Bạn thử lại giúp Lê Sơn nhé." with button "Thử lại".
  - Save error: per customer lens §3e.
- **Test hooks:** `window.__lesonDemo = { setLatency(ms), failNextWrite(), setNow(iso), loginAs(username), reset() }`.
  - Used by Playwright and by the lead to demonstrate error states.
  - Not linked anywhere in the UI.

### 8.4 Dates, IDs, money, phone

- **Clock:** `clock.now()` returns the real time unless overridden by `setNow`. `todayVN()` uses `Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' })`.
- **Seed builders use offsets from today:** `at(-2, '09:30')` → `'2026-10-17T09:30:00+07:00'`. A fixed `+07:00` is safe because Vietnam has no DST.
- **Display:** `formatDayVi` → "Thứ Hai, 19/10"; relative "Hôm nay", "Hôm qua", "Ngày mai"; times "08:10".
- **IDs:** `crypto.randomUUID()`, with a `getRandomValues` v4 fallback. Human codes come from `counters` inside the transaction.
- **Money:** integer VND; `formatVnd(150000)` → "150.000 ₫" (`Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })`). Payment state is **derived**, never stored (staff lens rule, implemented in `rules/invoice-math.ts`).
- **Phone:** stored as E.164, displayed as "097 355 51 05".

### 8.5 Internal vs customer-facing separation: five locks

1. **Separate tables.** Diary entries and videos are their own records, written deliberately. Internal stay data (`care_orders`, `care_administrations`, `care_notes`, `reason_internal`, `internal_status`, `note_internal`) is never the source of a customer field.
2. **Explicit projections.** `mock/projections/customer/*` build each DTO (`CustomerStayView`, `CustomerInvoiceView`, … in `contracts/customer.ts`) with object literals listing allowed fields.
   - ESLint `no-restricted-syntax` bans `SpreadElement` and `Object.assign` in that folder, so `{...stay}` cannot slip a field through.
   - Customer invoices group medicine lines as the staff lens specifies.
3. **Import boundaries** (ESLint `no-restricted-imports`):
   - `features/{public,auth,customer,booking}/**` may import only `@/data/public` and `@/data/customer`, never `@/data/staff`, `@/data/mock/**` or `contracts/staff`.
   - `mock/api/customer/**` may import only `projections/customer/**`, `store/db` (read), `rules/**`, `guard`.
4. **Session-bound API.** Customer functions take no `customerId` or `accountId` parameter. The scope comes from the session inside the data layer, and the `linkedOnly` functions throw `NotLinkedError`.
5. **Leak test** (Vitest, §12.1). Calls every exported customer API function as each seeded customer (linked and unlinked) and deep-scans the JSON output:
   - (a) **forbidden keys** (`item_name`, `dose`, `route`, `schedule_times`, `performed_at`, `note_internal`, `reason_internal`, `internal_status`, `ordered_by`, …);
   - (b) **forbidden values**: every drug name, dose string and internal note text present in the seed must not appear anywhere in the output, even under a renamed key;
   - (c) **other customers' records**.
   The same test later runs against the Supabase adapter.

**Honesty note for the lead:** in the demo, all mock data sits in the browser's storage, so these locks prove the *contract*, not security. Real protection comes from Supabase RLS and views (§8.8). The leak test is what makes that migration safe.

### 8.6 Videos

- **Seeded videos** reference bundled clips (`media_key: 'demo:noitru-an-sang'`, §11).
- **Uploads** (staff lens: "Chọn từ máy", ≤ 50 MB):
  - `<input type="file" accept="video/mp4,video/webm,video/quicktime">`; the blob is stored in IndexedDB via `idb-keyval` under `leson-demo:blob:<videoId>`.
  - A poster is generated client-side: seek to 1 s, draw to canvas, store a JPEG blob.
  - Played through an object URL, revoked on unmount.
  - If IndexedDB is unavailable, the blob is kept in memory with the staff lens note.
  - Too-large file (staff copy): "Video vượt quá 50 MB. Hãy chọn đoạn ngắn hơn."
- **"Audio removed":**
  - Seeded clips have **no audio track** (`-an`).
  - Uploaded files cannot be re-encoded in the browser without ffmpeg.wasm (YAGNI). `VideoPlayer` therefore always plays `muted` and `playsInline`, with custom controls (play/pause, seek, fullscreen) and **no volume control**. A `volumechange` handler re-mutes.
  - Chips: staff "Không có âm thanh", customer "Video không có tiếng".
  - Codex strips audio server-side on upload.
- **Robust source:** `VideoPlayer` first uses the file URL. On `error` it falls back to `fetch()` → blob URL (allowed by the Artifact contract). If both fail: "Video này chưa phát được trên trình duyệt của bạn. Bạn thử tải lại trang nhé."
- **60-day expiry:** `system.purgeExpiredVideos(now)` runs at boot and before every video read. It deletes the blob, sets `deleted_at`, and writes an audit event with actor "Hệ thống" (staff lens rule).

### 8.7 Reset demo data

`api.system.resetDemo()`:
1. Clears the document key and all `leson-demo:blob:*` keys.
2. Clears the session.
3. Reseeds.
4. Hard-navigates to `#/` with the toast "Đã đưa dữ liệu mẫu về trạng thái ban đầu."

It is reachable from the login portal link and the staff profile menu (per the lenses), and from the dirty-data banner. The confirmation is an in-page dialog (customer lens copy).

### 8.8 How Codex swaps the mock for Supabase

| Demo piece | Next.js + Supabase counterpart |
|---|---|
| `data/contracts/*`, `data/rules/*`, `lib/*` | **Unchanged.** DB types are generated and mapped into the same DTOs. |
| `mock/store` tables | Postgres tables, same names and fields (staff lens §8). |
| `mock/projections/customer/*` | SQL views `customer_*_v` (`security_invoker = on`) plus RLS restricting rows to the session's linked customer. |
| `assertCap` + `rules/capabilities.ts` | `has_cap(cap text)` SQL function over `staff_users` + presets, used in RLS policies and RPCs. |
| Atomic `transact` operations | Postgres RPC functions (one transaction each) with explicit `has_cap` checks. |
| `version` checks | `update … where id = $1 and version = $2`. |
| Session in `sessionStorage` | Supabase Auth cookies via `@supabase/ssr`. Guards become `middleware.ts` plus server layout checks. |
| `audit_events` append | Insert-only RLS, written inside RPCs or triggers. |
| Video blobs (IndexedDB) | Private Storage bucket, short-lived signed URLs, a server job strips audio, and `pg_cron` deletes after 60 days. Storage size is a known cost item (1 GB on Free, per `dinh-huong-san-pham.md`). |
| Hash routes, `AppLink` | App Router folders (`app/nv/hoa-don/[id]/page.tsx`). `paths.ts` is unchanged. `nav.tsx` switches to `next/link` and `next/navigation`. |
| Two-level `AnimatePresence` | `template.tsx` + motion enter animations. Exit animations are limited in App Router, so accept fades-in only or keep a client shell. |
| Latency, test hooks, reset | Removed. |

One known gotcha for Codex: Supabase Auth has no "phone + password without SMS" mode. Username/phone login needs a synthetic-email mapping or custom auth. This is not a demo concern.

---

## 9. Porting the orbit hero faithfully

**Source of truth:** `/tmp/claude-0/hero/demo/hero-orbit.{js,css}` (branch `codex/hero-chinh-quy-dao`).

I diffed it against the owner's single-file upload. The upload is an **older** build of the same simulator: the "snake" pass through the text was still enabled, frames were smaller, and the header was inside the hero. The demo copy is newer and is the one to port.

### 9.1 What changes (and nothing else)

Done in the probe as a scripted replacement: 19 lines removed, 47 added, all wiring. `SPECS`, `STATIC`, `SNAKE`, every constant, easing and formula are byte-identical.

1. `(function(){ … var hero = document.getElementById('hero-main'); … })();` becomes `export function mountHeroOrbit(hero) { … return destroy; }`.
2. An `on(target, type, fn)` helper records each listener for removal: `cta` `animationstart`/`animationend`, toggle `click`, `document` `visibilitychange`, `matchMedia` `change` (plus the `removeListener` fallback), and the `window` `resize` fallback.
3. The `IntersectionObserver` and `ResizeObserver` instances are kept and `disconnect()`ed.
4. The font-wait `setTimeout(…, 700)` is cleared.
5. A `destroyed` guard is added in `markReady()` and `relayout()`. This covers the uncancellable `document.fonts.ready.then(relayout)` and `document.fonts.load` promises.
6. The relayout `requestAnimationFrame` id is kept and cancelled.
7. `destroy()`:
   - calls `stop()` (cancels the main rAF loop) and runs the disposers;
   - empties `.ho__frames` and the orbit `<svg>`;
   - removes `is-ready`/`is-paused`;
   - resets the toggle's `aria-pressed` and label to "Tạm dừng chuyển động".

   A remount (back to `/`, or React StrictMode's double mount) therefore starts clean.

### 9.2 Teardown inventory

| Resource created by the module | Torn down by |
|---|---|
| Main rAF loop (`tick`) | `stop()` |
| Relayout rAF | `cancelAnimationFrame` |
| `setTimeout` 700 ms (font wait) | `clearTimeout` |
| `document` `visibilitychange` | `removeEventListener` |
| `matchMedia('(prefers-reduced-motion: reduce)')` `change` | `removeEventListener` / `removeListener` |
| `IntersectionObserver(hero)` | `disconnect()` |
| `ResizeObserver(hero)` (or `window` `resize`) | `disconnect()` / `removeEventListener` |
| `document.fonts.ready` / `fonts.load` promises | `destroyed` guard |
| Listeners on `.cta` and `.motion-toggle` | removed (elements are also discarded) |
| 9 `.frame` nodes, orbit SVG markup, inline styles on frames, comet and `.ho__decor` CSS vars | cleared, or discarded with the DOM |

**Verified in the probe (production build, both 1440 and 390):**
- 0 rAF calls/s after navigating away;
- exactly 9 frame elements after navigating back (no duplicates);
- the loop resumes;
- in the dev server with `<StrictMode>`: 9 frames and 6 orbit paths after the double mount;
- no console errors;
- screenshots match the original hero at 1440 and 390.

### 9.3 Component, markup and CSS

- **`HeroOrbit.tsx`:**
  - `memo`, no props, no state.
  - `useEffect(() => mountHeroOrbit(ref.current!), [])`. The effect returns `destroy`.
  - React owns the static markup (converted mechanically from `index.html`: `class` → `className`, inline `style="--x:…"` → CSS-var objects; the `data-measure` and `aria-*` attributes are kept).
  - The vanilla module owns only frames, the orbit SVG, inline transforms, state classes and the toggle's attributes. React never re-renders the component, so it never fights over those attributes.
- **CTA:** becomes `<AppLink className="btn btn--primary" to={paths.datLich} data-measure>`, keeping its label "Gửi yêu cầu đặt lịch →".
- **`hero-orbit.css` is imported verbatim** (it already uses `@container ho` and `cqw` units). It is global: it defines `.btn`, `.frame`, `.cta`, `.eyebrow`, `.subtitle`, `.blob`, `.ghost`, `.comet` and keyframes `rise`, `fadeIn`, `drift`, `burst`, `ringsIn`, `decorIn`.
  - Isolation comes from the rule that all other CSS is CSS Modules (hashed class and keyframe names).
  - A unit test (`css-guard`) fails if any non-module CSS file other than `tokens.css`, `fonts.css`, `base.css` and `hero-orbit.css` defines a class selector.
  - `hero-orbit.js` and `hero-orbit.css` are excluded from ESLint and Prettier and marked "vendored, port-faithful". A test compares the vendored JS against the original file, allowing only the documented wiring lines to differ.
- **Fonts:** the hero calls `document.fonts.load('700 1em Lora' | 'italic 700 1em Lora' | '400/600 1em "Be Vietnam Pro"')`, so family names must be exactly `Lora` and `Be Vietnam Pro` (hence the static `@fontsource/lora`). Verified: `document.fonts.check('italic 700 40px Lora', 'người bạn nhỏ') === true`, and the Vietnamese subset files were the ones fetched.
- **Transitions:** opacity and translate only on the public zone (§6.2).
  - Section routes share `pageKey: 'home'`, so jumping between Dịch vụ, Đặt lịch, Giới thiệu and Liên hệ never remounts the hero.
  - Returning to the homepage from another zone replays the approved intro. This is faithful behaviour, so I did not change it.
- **Header:** the approved mobile header spec is ported as `PublicHeader` (values from `header-mobile.css` copied into a CSS Module). Its 2 KB of behaviour (toggle, `Esc`, outside click, close on link) is re-implemented in about 30 lines of React.

---

## 10. Icons (technical side)

- **Every icon is a local React SVG component** in `ui/icons/`:
  - 24 × 24 grid, stroke 1.6, round caps and joins, `currentColor`, no fills;
  - `aria-hidden` unless labelled.
- **Hand-drawn domain icons** follow the approved service style: stethoscope, scissors, house-with-paw, heart-with-pulse, paw, cage, diary, video, invoice, payment, link-account, calendar-check.
- **Generic glyphs** come from `lucide-react` (chevrons, close, search, plus, more, phone, check, filter) through an `<Icon as={…}>` wrapper that forces stroke 1.6 and the size tokens, so both sources look like one set.
- `IconBadge` renders the approved 52 px pastel circle with a 26–28 px icon (peach, mint, lilac, rose).
- `#/_bo-icon` renders every icon at 16, 24 and 28 px and on each badge. It is screenshotted in the review pack, so the owner can approve icons in one page.

---

## 11. Demo video pipeline (ffmpeg)

**Script:** `scripts/make-media.sh` reads `scripts/media.manifest.tsv`. Outputs are committed under `src/assets/media/`, so nobody else needs ffmpeg. They are imported through a typed `media.ts`, which gives hashed filenames and lets the `single` target inline them.

| id (matches staff lens seeds) | Source | Move | Duration | Size |
|---|---|---|---|---|
| `v1-mieu-an-sang` | `service-noitru.jpg` | pan down, 0.35 → 0.75 of the free height | 10 s | 1280×720 |
| `v2-mieu-suoi-nang` | `service-noitru.jpg` | pan up, 0.75 → 0.40 (reverse) | 10 s | 1280×720 |
| `v3-mieu-nghi` | `service-noitru.jpg` | push-in 1.00 → 1.12 on the face | 8 s | 1280×720 |
| `v4-kem-uong-nuoc` | `service-capcuu.jpg` | pan down | 10 s | 1280×720 |
| `v5-gao` | `pet-left.png` (700×840, soft source) | gentle push-in | 8 s | **960×540** (source-limited) |
| `v6-bo-spa` | `service-grooming.jpg` | push-in 1.00 → 1.10 | 10 s | 1280×720 |

**Encode (verified commands).** Always crop to 16:9 **before** moving the frame: `zoompan` does not preserve aspect, and my first attempt visibly stretched the image.
```bash
# push-in
ffmpeg -y -loop 1 -framerate 30 -i SRC -t D \
  -vf "scale=3840:-2,crop=3840:2160,zoompan=z='1+0.10*on/(D*30)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1280x720:fps=30,format=yuv420p" \
  -c:v libx264 -preset slow -crf 24 -profile:v high -level 4.0 -tune stillimage -g 60 -an -movflags +faststart OUT.mp4
# vertical pan (portrait sources): fixed 16:9 window, y moves with t
ffmpeg -y -loop 1 -framerate 30 -i SRC -t D \
  -vf "scale=3840:-2,crop=3840:2160:0:'(ih-2160)*(A+(B-A)*t/D)',scale=1280:720:flags=lanczos,format=yuv420p" \
  -c:v libx264 -preset slow -crf 24 -profile:v high -level 4.0 -tune stillimage -g 60 -an -movflags +faststart OUT.mp4
# poster (at the clip's best second) and card thumb
ffmpeg -y -ss POSTER_AT -i OUT.mp4 -frames:v 1 -q:v 5 OUT.poster.jpg
ffmpeg -y -ss POSTER_AT -i OUT.mp4 -frames:v 1 -vf scale=480:-2 -q:v 6 OUT.thumb.jpg
```

- **Measured:**
  - 10 s clips: **1.18 MB** (push-in) and **0.99 MB** (pan); H.264 High, yuv420p, about 0.65–1.0 Mbit/s.
  - Posters 73–98 KB, thumbs 13–20 KB.
  - Encode time 18–22 s per clip.
  - Total for 6 clips ≈ 6.5 MB.
- **Why these settings:**
  - `-an` means no audio track, which matches the rule "audio removed".
  - `+faststart` lets playback start before download completes.
  - GOP 60 gives a keyframe every 2 s for seeking.
  - The 3840 px pre-upscale gives sub-pixel smoothness to the move.
- **Lite variants** for the `single` target: `lite/<id>.mp4` at 854×480, CRF 28, first 6 s. Estimated 250–400 KB each (not measured).
- **Player defaults:** `muted`, `playsInline`, `preload="metadata"`, `poster`, no autoplay in lists. Seeded clips carry the caption tag "Video minh họa".
- **Photos:** the 7 stock photos are recompressed with PIL (JPEG q82, original size plus a 480 px thumb) into `src/assets/img/`. The logo PNG is copied untouched.

---

## 12. Testing strategy

### 12.1 Unit tests (Vitest 5.0.5, node environment)

Tests inject a memory KV, a memory blob store, latency 0 and a fixed clock.

- **Rules:**
  - request status machine, all six locked statuses and the allowed transitions;
  - re-submit flag: set on an identical snapshot while "Không liên lạc được", cleared by starting contact;
  - full-snapshot dedupe;
  - username must not look like a phone number;
  - VN phone normalisation;
  - invoice totals and discount maths, derived payment state;
  - 60-day expiry.
- **Permissions:** table-driven from the capability matrix. For each preset × each staff API function, expect success or `ForbiddenError`. This also proves "one person, many capabilities" (`bacsi.duc`).
- **Customer scope:** the unlinked customer gets `NotLinkedError` on invoices, stays and videos. The linked customer sees only their own pets' records.
- **Leak test** (§8.5).
- **Store:**
  - a throwing `fn` leaves no partial write;
  - version conflict;
  - schema mismatch reseeds;
  - freshness rule with the clock set to tomorrow (clean vs dirty);
  - fallback when KV throws;
  - cross-tab reload on a `storage` event (simulated).
- **Seeds:** all dates relative to the fixed clock; every foreign key resolves; human codes are unique.
- **Hygiene:** `css-guard` and the vendored-hero diff check.

The probe's sample test ran in 0.44 s.

### 12.2 End-to-end tests (Playwright 1.56.1, preinstalled Chromium)

- **Config:**
  - `webServer: npm run preview -- --port 4173 --strictPort`
  - `use: { locale: 'vi-VN', timezoneId: 'Asia/Ho_Chi_Minh' }`
- **Projects:**
  - `desktop-1440` (1440×900);
  - `phone-390` (390×844, `isMobile`, `hasTouch`, DPR 2);
  - `phone-320`, public header only: "Đăng nhập" and "Đăng ký" both visible, tap targets ≥ 44 px;
  - `reduced-motion` (`reducedMotion: 'reduce'`): hero static layout, no transforms.
- **Smoke, generated from the route manifest** (route × the role that may open it, plus guard cases):
  - log in via `__lesonDemo.loginAs()` and `setLatency(0)`, then go to the route;
  - assert the page `<h1>` is visible, and there are no console errors or page errors;
  - assert `scrollWidth ≤ innerWidth` (no horizontal scroll);
  - guard redirects behave as in §5.3.
  - Size: about 45 cases × 2 projects, about 2–3 minutes.
- **Journeys** (one spec each, both viewports):
  1. Guest books → staff (quanly.ha) starts contact → confirms → customer sees "Đã xác nhận". Includes the "Không liên lạc được" re-submit flag.
  2. Customer signs up → staff links the account → invoices and inpatient unlock.
  3. Spa uploads a draft video (fixture mp4) → doctor shares → customer plays it muted. A second browser context checks cross-tab sync.
  4. Doctor issues an invoice → manager records a cash payment → customer sees "Đã thanh toán". The print preview opens.
  5. Spa staff opens `#/nv/doanh-thu` directly and gets the friendly Forbidden page. The nav item is absent.

### 12.3 Accessibility, motion and screenshots

- **a11y:** `@axe-core/playwright` on every smoke page, tags `wcag2a`, `wcag2aa`, `wcag21aa`, `wcag22aa`.
  - Fail on serious or critical violations; log moderate ones.
  - Plus a keyboard pass in the journeys: visible focus ring, dialogs trap and return focus, tabs use arrow keys.
- **Motion check:** on every non-home route, wait 2 s idle, then assert 0 rAF calls/s (measured as in the probe) and no infinite `getAnimations()`. On home, assert that the pause button stops the rAF loop.
- **Owner review pack:** `npm run shots`.
  1. Runs the smoke suite with `SHOTS=1` and a fixed clock (`setNow('…T09:00:00+07:00')`), so seeds and screenshots are stable.
  2. Pauses the hero after its intro and captures with `animations: 'disabled'`.
  3. Writes `review/shots/<project>/<zone>__<slug>.png`.
  4. `scripts/contact-sheet.mjs` builds `review/index.html` with 1440 and 390 side by side per screen, grouped by zone. The lead can publish it for the owner.

### 12.4 Static checks

- **`tsc -p .`:** strict, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`, `allowJs` only for the hero module through its `.d.ts`. Took 2.8 s in the probe.
- **ESLint flat config** (verified clean in the probe, 3.8 s): js + typescript-eslint recommended, react-hooks v7, react-refresh, plus project rules:
  - `no-alert`;
  - `no-restricted-globals` (storage access outside the adapters);
  - `no-restricted-imports` (audience boundaries, and `react-router` `Link`/`useNavigate` outside `app/nav.tsx`);
  - `no-restricted-syntax` (spread in customer projections).
- **Prettier** for formatting.
- **`npm run verify`** = typecheck → lint → unit → `build:artifact` → budgets → e2e smoke. This is the single gate for Claude and for Codex QA.

---

## 13. Build and publish

### 13.1 Targets and scripts

| Script | What it does | Output |
|---|---|---|
| `npm run dev` | Vite dev server (StrictMode on). | — |
| `npm run build` | `VITE_TARGET=web`: fonts as files, real print and CSV download. | `dist/` (served by `npm run preview`) |
| `npm run build:artifact` | `VITE_TARGET=artifact`: fonts inlined, print → preview note, CSV → copy dialog. Then `to-artifact-page.mjs`. | `dist-artifact/` + `dist-artifact/index.artifact.html` (fragment) |
| `npm run build:single` | `vite.single.config.ts`: everything inlined, lite media. | `dist-single/le-son-demo.html` (opens from `file://`; verified) |
| `npm run media` | ffmpeg pipeline (§11). | `src/assets/media/**` |
| `npm run shots` | Review screenshots and contact sheet. | `review/` (git-ignored) |
| `npm run verify` | All checks (§12.4). | — |

All targets use `base: './'`. Verified: the build served from `/a/b/` loads lazy chunks and fonts, deep-links with a full reload work, and `file://` correctly fails for the multi-file build (module scripts are blocked there by CORS, which is why `single` exists).

### 13.2 Budgets (`scripts/check-budgets.mjs` fails the build)

| Item | Budget | Probe baseline |
|---|---|---|
| Initial JS (main chunk, gz) | ≤ 180 KB | 127 KB = react-dom 202 KB + react-router 90 KB + motion 77 KB + react/scheduler 11 KB (min) |
| Hero chunk (JS + CSS, gz) | ≤ 15 KB | 8.5 KB + 3.2 KB |
| Each lazy zone chunk (gz) | auth ≤ 30 KB, customer ≤ 90 KB, staff ≤ 120 KB | — |
| Total JS (gz) | ≤ 450 KB | — |
| CSS excluding inlined fonts (gz) | ≤ 50 KB | 4 KB |
| Fonts | ≤ 6 faces, ≤ 12 woff2 files, ≤ 220 KB raw | 4 faces = 121 KB |
| Each video | ≤ 2 MB; all media ≤ 10 MB | 0.99–1.18 MB |
| Each photo / poster | ≤ 250 KB / ≤ 120 KB | posters 73–98 KB |
| `dist-artifact` total / file count | ≤ 15 MB / ≤ 80 files | — |
| `single` HTML | ≤ 8 MB | 593 KB (no media) |

### 13.3 Publishing to claude.ai (after the owner's OK)

**First publish:** the Artifact tool's `publish` with:
- `file_path: dist-artifact/index.artifact.html`
- `files`: the map printed by `scripts/artifact-files.mjs`, every other file in `dist-artifact/` as `{ "assets/index-3fA9.js": "dist-artifact/assets/index-3fA9.js", "assets/v1-mieu-an-sang-8c2e.mp4": "…", … }`
- `icon: "pet"`
- a one-sentence `description`

The fragment starts with `<title>`, `<meta name="claude:viewport-fit-sides" content="cover">` (only together with the `max(16px, env(…))` gutters) and `noindex`.

**Republish:**
- Same `file_path`, same URL.
- `artifact-files.mjs` diffs against `dist-artifact/.published.json` and adds `null` for every stale hashed path. Old chunks are removed, cache-busting stays correct, and the 511-file version limit is never approached.
- In a later conversation: `read` the artifact URL first, then publish with `url`.

**Five-minute check on the first live publish** (things the probe could only simulate):
1. The lazy auth chunk loads (`#dang-nhap` alias).
2. Lora italic renders "người bạn nhỏ" (fonts are inline, so this should pass).
3. V1 plays muted (if not, the blob-URL fallback must kick in).
4. A login survives a reload, and a booking persists after reload (localStorage).
5. The phone layout of home and `/nv`.

If 3 or 4 fail, the code already degrades: blob fallback, memory store plus banner. Note the result in the handover.

---

## 14. Notes for the other lenses (conflicts with the Artifact viewer)

| Lens item | Problem in the viewer | Resolution (artifact build only; the web build keeps the real behaviour) |
|---|---|---|
| Staff §6.6 "In hóa đơn" via `@media print` + `window.print()` | `print()` does nothing. | The button opens `#/nv/hoa-don/:id/ban-in`, the same A5 layout shown on screen. Its "In" button calls `print()` (works on the web build). Artifact note: "Bản xem thử trên Claude chưa mở được hộp thoại in. Khi chạy trên máy của bệnh viện, nút này sẽ in trực tiếp." |
| Staff §6.9 "Tải CSV" | Downloads are inert. | A dialog "Sao chép bảng CSV" with the CSV text and a "Sao chép" button (`navigator.clipboard.writeText` inside the click; on failure the text is selected). Toast: "Đã sao chép. Bạn dán vào Excel hoặc Google Sheets nhé." |
| Staff "show bank QR" | A scannable QR with made-up bank details could send real money to nowhere. | A **non-scannable** QR-like illustration with the label "Mã QR minh họa – không dùng để chuyển tiền". No QR library. Codex adds VietQR with the real account later. |
| Both lenses: `tel:` hotline links | May do nothing in the viewer. | Keep the link, but always show "097 355 51 05" as visible, selectable text (both lenses already do). |
| Both lenses: confirmations | `confirm()` returns `false` silently. | Always in-page dialogs. ESLint `no-alert` enforces it. |
| Customer `?tiep=`, staff `?view=&date=` | Queries cannot come from outside links. | Fine inside the app (they live in the hash). Outside review links use alias tokens. |
| Customer contact map | iframes are blocked. | Already a drawn map plus a link. No change. |

---

## 15. Verified vs assumed

**Verified in the probe** (Vite 8.3.2, React 19.3.0, react-router 8.4.0, motion 13.5.1, TS 6.0.3, Node 22.22.0, Chromium 1194):
- Version availability and peer ranges.
- The vitest 5.0.3 install crash and the 5.0.5 fix. TS 7 is incompatible with typescript-eslint 8.71.
- `createHashRouter` + lazy routes + `base: './'` work when served from an unknown sub-path. Deep link plus full reload works.
- The memory-router fallback works with `history.pushState`/`replaceState` and `localStorage` all throwing. Raw `href="#/…"` links do not navigate in memory mode, so `AppLink` is required.
- Page transition (exit opacity sampled mid-way). Two-level transitions: the shell persists in-zone, and the exiting zone keeps its own content. No console warnings once `hydrateFallbackElement` is set.
- Hero port: renders identically at 1440 and 390; rAF goes to 0 after leaving; no duplicate frames after return; StrictMode double mount is clean; fonts and Vietnamese subsets load; axe shows 0 violations on home and login (1440 and 390).
- `@fontsource` packages contain Vietnamese subsets with proper `unicode-range`. Vite resolves bare `url('@fontsource/…')` in CSS. Static Lora registers family `"Lora"`.
- Multi-file `dist` fails from `file://` (expected); the `vite-plugin-singlefile` output works from `file://`.
- The Artifact-fragment conversion works inside a simulated host skeleton.
- ESLint flat config with the listed plugins runs clean. `tsc` passes. Vitest runs in the node env.
- ffmpeg pipeline: sizes, durations, codecs, posters and thumbs measured, aspect-correct output checked visually.
- Bundle composition and gzip sizes.

**Assumed (not verified):**
- The real claude.ai host CSP for same-origin module scripts, lazy chunks, mp4 and fonts. Fonts are inlined to avoid depending on it; the rest is in the §13.3 first-publish check.
- That alias tokens reach the frame's `location.hash`, as the contract states.
- That `history.pushState` works inside the real viewer frame (the fallback covers it if not).
- That the cross-tab `storage` event fires between two viewer windows.
- Lite clip sizes for the `single` target.
- Next.js static-export behaviour (approach C was not probed).
- Bundle size of the final app code, which is estimated from budgets.

---

## 16. Open questions for owner

1. **Giving the demo a link.** The demo shows the hospital's real name, logo, address and hotline, and it has a login form. May we publish it as a **private claude.ai page** for you to open on your phone? It would carry a "Bản demo · dữ liệu mẫu" chip on every screen, be hidden from search engines, and show a reminder not to use real passwords. If you prefer no link, we send **one HTML file** that opens on a computer. *Default if no answer: build it as files and do not publish until you say yes.*
