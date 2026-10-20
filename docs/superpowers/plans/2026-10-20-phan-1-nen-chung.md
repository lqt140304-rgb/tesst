# Phần 1 — Nền chung (làm lại giao diện) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the shared foundation of the redesign — work-area tokens, motion presets, PetAvatar, one PageHeader, stat/section/detail cards, SaveState, DataTable, MasterDetail — and a review page `#/_giao-dien` that shows them all, without changing any existing page's behaviour.

**Architecture:** New components live in `src/ui/kit/` and are exported from `@/ui`. Logic that decides something (pagination, keyboard row moves, save-state transitions, motion presets, list-state storage) is a pure function in its own `.ts` file with a Vitest test; components are thin and get a markup test via `react-dom/server` `renderToStaticMarkup` (no DOM test library is installed and none is added). Behaviour that needs a browser (keyboard, reduced motion, 320 px, axe) is proven by one Playwright spec against the review page.

**Tech Stack:** React 19.3, TypeScript 6, Vite 8, CSS Modules + `src/styles/tokens.css`, motion 13 (`m`, `useReducedMotion`), Vitest 5 (node env), Playwright 1.56 + @axe-core/playwright 4.13, Python/PIL for photos.

**Spec:** `docs/superpowers/specs/2026-10-20-lam-lai-giao-dien-design.md` §5 (and §3.5 motion rules); motion source `docs/tham-khao/de-xuat-animation-tung-man-2026-10-20.md`. Binding base rules: `docs/thiet-ke/QUYET-DINH.md`, `CLAUDE.md`.

**Branch / worktree:** `claude/giao-dien` at `/home/user/tesst/.worktrees/giao-dien`. This branch owns `src/ui`, `src/features`, `src/styles`, `src/assets`, `src/app`, `scripts/photos.py`. Do **not** edit `src/data/**` (branch `claude/du-lieu`).

## Global Constraints

- All visible text Vietnamese; customer = "bạn"; never "quý khách"/"Quý Khách"/"lễ tân".
- Motion: entering 8–12 px, no rotate/bounce/spring-with-bounce on work screens; list stagger 60 ms, only the first 5 items animate; group total ≤ 450 ms; ease-out. Reduced motion: no translate/scale, opacity only, ≤ 100 ms. Nothing loops. Content usable immediately (never `pointer-events: none` while animating).
- Durations (spec table): list enter 280 ms · hover 150 ms · detail panel 220 ms · tab underline 180 ms · flash 600 ms · chart rise 450 ms · data swap 120–200 ms · check mark 200 ms.
- Colours only via tokens; text contrast ≥ 4.5:1 on its surface.
- Keyboard: every control reachable; focus never lost on tab change / page change / detail open; scrollable regions focusable.
- Phone 320 px: no horizontal page scroll; master–detail becomes full width below 1024 px; tables become cards below 768 px.
- Budgets: initial JS ≤ 240 KB gz; non-photo files in `dist-artifact` ≤ 80; photos lazy-loaded with `width`/`height`.
- Existing e2e suite stays green (`npm run verify`).
- Every sample photo carries "Ảnh minh họa" where shown on public pages (gallery page included).

## Review Focus

1. Search narrows the rows while the table is on a later page (e.g. page 3, then 4 results) → the table shows the last valid page, never an empty page with "Hiển thị 21–20". Pinned in Task 7 (`paginate` clamp test).
2. Storage blocked (private window, quota, bad JSON) → list state falls back to its defaults, no crash. Pinned in Task 8 (`list-state` tests).
3. A photo key with no file, or an image that fails to load → species icon, never a broken image. Pinned in Task 4 (markup test) and Task 9 (gallery shows a missing-key avatar).
4. Table in card mode on a phone is announced once, with each value labelled — no duplicated table+card markup. Pinned in Task 7 (single `<table>` markup, `data-label` on cells) and Task 9 (320 px check).
5. Save marked "Đã lưu" while the save actually failed → never; an error returns to "Chưa lưu thay đổi". Pinned in Task 6 (`saveReducer` tests).

## File map

| File | Responsibility |
|---|---|
| `src/styles/tokens.css` (modify) | Work-area tokens |
| `src/styles/tokens.test.ts` (create) | Contrast of text tokens on the new surfaces |
| `src/ui/motion.ts` (modify) + `motion.test.ts` | `preset()` motion presets |
| `src/ui/kit/Tabs.tsx` (modify) | Underline variant uses `tabSlide` |
| `scripts/photos.py` (modify), `src/assets/media.ts` (modify), `scripts/check-budgets.mjs` (modify) | Pet photo sizes, `petPhoto()`, photo budget |
| `src/ui/kit/PetAvatar.tsx` + `.module.css` + `.test.tsx` | Pet photo or species badge |
| `src/ui/kit/PageHeader.tsx` + `.module.css` + `.test.tsx` | One page header (breadcrumb, title, sub, actions) |
| `src/ui/kit/Cards.tsx` + `.module.css` + `.test.tsx` | StatCard, SectionCard, DetailList |
| `src/ui/kit/save-state.ts` + `.test.ts`, `src/ui/kit/SaveState.tsx` + `.module.css` | Save status logic + label |
| `src/ui/kit/table.ts` + `.test.ts`, `src/ui/kit/DataTable.tsx` + `.module.css` + `.test.tsx` | Pagination/keyboard helpers + table |
| `src/ui/kit/list-state.ts` + `.test.ts`, `src/ui/kit/MasterDetail.tsx` + `.module.css` | Remembered list state + list/detail layout |
| `src/ui/index.ts` (modify) | Exports |
| `src/features/gallery/` (create: `index.tsx`, `GalleryPage.tsx`, `Gallery.module.css`) | Review page `#/_giao-dien` (lazy chunk) |
| `src/app/router.tsx`, `src/app/routes.ts`, `src/app/system/System.tsx` (modify) | Route + demo-chip link |
| `e2e/manifest.ts` (modify), `e2e/giao-dien-nen.spec.ts` (create) | Browser checks |

---

### Task 1: Work-area tokens

**Files:**
- Modify: `src/styles/tokens.css` (after the Neutrals block)
- Create: `src/styles/tokens.test.ts`

**Interfaces:**
- Produces: CSS variables `--canvas-work: #F4EFF4`, `--surface-card: #FCF9F6`, `--line-soft: #ECE2ED`, `--r-card: 16px`, `--sh-card: 0 1px 2px rgba(66, 18, 71, .05), 0 6px 16px -10px rgba(66, 18, 71, .14)`, `--sel-bg: var(--plum-50)`, `--sel-line: var(--plum-300)`.

- [ ] **Step 1: Write the failing test** — `src/styles/tokens.test.ts` reads `tokens.css` as text (`node:fs`, path from `import.meta.url`), extracts `--name: #HEX` pairs, and computes WCAG contrast (relative luminance formula inline in the test).

```ts
it('work-area surfaces exist', () => {
  for (const n of ['--canvas-work', '--surface-card', '--line-soft']) expect(tokens[n]).toMatch(/^#[0-9A-F]{6}$/i);
});
it('body and secondary text stay ≥ 4.5:1 on the work surfaces (review §4.5)', () => {
  for (const bg of ['--canvas-work', '--surface-card', '--plum-50']) {
    for (const fg of ['--ink-900', '--ink-600', '--plum-700']) expect(contrast(tokens[fg]!, tokens[bg]!)).toBeGreaterThanOrEqual(4.5);
  }
});
```

- [ ] **Step 2: Run** `npx vitest run src/styles/tokens.test.ts` — Expected: FAIL (`--canvas-work` undefined).
- [ ] **Step 3: Add the tokens** listed under Produces (comment: "Work areas (redesign 2026-10-20 §5.1)").
- [ ] **Step 4: Run** the test — Expected: PASS. If a pair fails, darken the surface toward white rather than lightening text; record the value change in the commit message.
- [ ] **Step 5: Commit** `feat(ui): work-area tokens for the redesign`.

### Task 2: Motion presets + tab underline

**Files:**
- Modify: `src/ui/motion.ts`, `src/ui/kit/Tabs.tsx`
- Create: `src/ui/motion.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export type PresetName = 'enterList' | 'enterPanel' | 'tabSlide' | 'flashOnce' | 'chartRise' | 'fadeSwap';
  export type MotionPreset = { initial: false | Record<string, unknown>; animate: Record<string, unknown>; transition: Record<string, unknown> };
  export function preset(name: PresetName, opts?: { reduced?: boolean; index?: number }): MotionPreset;
  ```
  Values (seconds): `enterList` y 8 → 0, opacity 0 → 1, duration 0.28, delay `index * 0.06` for index 0–4, index ≥ 5 → `initial: false`; `enterPanel` x 12 → 0, opacity, 0.22; `tabSlide` transition only `{ duration: 0.18, ease: ease.out }` (initial false, animate {}); `flashOnce` animate `backgroundColor: ['var(--plum-100)', 'rgba(0,0,0,0)']`, 0.6 (unchanged when reduced — colour, not movement); `chartRise` scaleY 0 → 1, `originY: 1`, 0.45; `fadeSwap` opacity 0 → 1, 0.15. Reduced (all except `flashOnce`): `initial {opacity: 0}`, `animate {opacity: 1}`, `transition {duration: 0.1}`, no `x`/`y`/`scale*` keys anywhere.

- [ ] **Step 1: Write the failing tests** in `src/ui/motion.test.ts`:
  - `enterList` index 0 → `{ y: 8 }`, delay 0, duration 0.28; index 4 → delay 0.24; index 5 → `initial === false`.
  - `enterPanel` → `initial.x === 12`, duration 0.22.
  - every preset with `reduced: true` except `flashOnce`: `JSON.stringify(p)` contains none of `"x"`, `"y"`, `"scale`, and `transition.duration <= 0.1`.
  - no preset has `type: 'spring'` or a bounce.
- [ ] **Step 2: Run** `npx vitest run src/ui/motion.test.ts` — Expected: FAIL (`preset` not exported).
- [ ] **Step 3: Implement `preset()`** in `src/ui/motion.ts`; leave existing exports untouched (pages use them).
- [ ] **Step 4: Tabs** — in `Tabs.tsx`, `variant === 'underline'` uses `preset('tabSlide', { reduced }).transition` (from `useReducedMotion()`; reduced → `{ duration: 0 }`) for the `layoutId` indicator; the pill variant keeps `spring.glide`.
- [ ] **Step 5: Run** `npx vitest run src/ui && npm run typecheck` — Expected: PASS.
- [ ] **Step 6: Commit** `feat(ui): motion presets from the per-screen motion proposal`.

### Task 3: Pet photo sizes and photo budget

**Files:**
- Modify: `scripts/photos.py`, `src/assets/media.ts`, `scripts/check-budgets.mjs`
- Create: `src/assets/media.test.ts`

**Interfaces:**
- Produces: files `src/assets/img/pet-<slug>-avatar.webp` (320 × 320, centre-weighted square crop, same `grade()`), `-card.webp` (960 wide) and `-banner.webp` (1600 wide, only when the source is ≥ 1600 px wide). Slugs now: `meo-vang` (from `pet-right.png`), `cho-nau` (from `pet-left.png`), `meo-muop` (from `pet-center.png`) — check each source by eye and rename the slug if the animal differs. Any image placed in `docs/tham-khao/anh/` is processed too, slug = file stem.
- Produces: `export type PhotoSize = 'avatar' | 'card' | 'banner'; export function petPhoto(key: string, size: PhotoSize): string | undefined` in `src/assets/media.ts` (glob `./img/pet-*.webp`, eager, `?url`; returns `undefined` when that exact size is missing — no silent fallback, callers choose).

- [ ] **Step 1: Write the failing test** `src/assets/media.test.ts`: `petPhoto('meo-vang', 'avatar')` matches `/pet-meo-vang-avatar.*\.webp/`; `petPhoto('khong-co', 'avatar')` is `undefined`.
- [ ] **Step 2: Run** `npx vitest run src/assets/media.test.ts` — Expected: FAIL.
- [ ] **Step 3: Extend `photos.py`** with a `PETS` table and a `docs/tham-khao/anh/` scan; run `python3 scripts/photos.py`; confirm the three avatar files exist and each is ≤ 40 KB.
- [ ] **Step 4: Implement `petPhoto`.** Run the test — Expected: PASS.
- [ ] **Step 5: Budget** — in `check-budgets.mjs` replace the single `dist-artifact files ≤ 80` row by: `Non-photo files` (all files that are not `.webp/.png/.jpg` photos) ≤ 80; `Photo files` ≤ 60; `All photos (raw)` ≤ 4 MB. Run `npm run build:artifact && npm run budgets` — Expected: all ✓.
- [ ] **Step 6: Commit** `feat(media): pet photo sizes, petPhoto(), photo budget`.

### Task 4: PetAvatar

**Files:**
- Create: `src/ui/kit/PetAvatar.tsx`, `src/ui/kit/PetAvatar.module.css`, `src/ui/kit/PetAvatar.test.tsx`
- Modify: `src/ui/index.ts`

**Interfaces:**
- Consumes: `petPhoto(key, 'avatar')` (Task 3); `IconBadge` (existing, `@/ui`).
- Produces: `PetAvatar({ name, species, photoKey, size = 56, decorative = false }: { name: string; species: Species; photoKey?: string; size?: 40 | 56 | 96 | 160; decorative?: boolean })`; `export const SPECIES_ICON: Record<Species, IconName>` (`cat: 'cat-face', dog: 'dog-face', other: 'paw'`), `SPECIES_TONE` (`cat: 'lilac', dog: 'peach', other: 'mint'`). `Species` is a type-only import from `@/data/contracts/enums`.
- Rendering: photo → `<img src alt={decorative ? '' : name} width={size} height={size} loading="lazy" decoding="async">` inside a span with `data-pet-avatar="photo"`, radius 12 px (`size >= 96` → 16 px); on `onError` switch to the badge (state). No photo → `IconBadge` with the species icon, `data-pet-avatar="icon"`, `role="img" aria-label={name}` unless decorative (then `aria-hidden`).

- [ ] **Step 1: Write the failing markup tests** (`renderToStaticMarkup`):
  - `<PetAvatar name="Miu" species="cat" photoKey="meo-vang" />` contains `data-pet-avatar="photo"`, `alt="Miu"`, `width="56"`.
  - `photoKey="khong-co"` → contains `data-pet-avatar="icon"` and `aria-label="Miu"`, no `<img`.
  - `decorative` + photo → `alt=""`.
- [ ] **Step 2: Run** `npx vitest run src/ui/kit/PetAvatar.test.tsx` — Expected: FAIL.
- [ ] **Step 3: Implement**; export `PetAvatar`, `SPECIES_ICON`, `SPECIES_TONE` from `@/ui`. Point `src/features/staff/ui.tsx` and `src/features/customer/ui.tsx` at the shared `SPECIES_ICON` (keep their exported names `SPECIES_ICON` / `speciesIcon` as re-exports so pages don't change).
- [ ] **Step 4: Run** the test, `npm run typecheck`, `npm run lint` — Expected: PASS.
- [ ] **Step 5: Commit** `feat(ui): PetAvatar with species fallback`.

### Task 5: One PageHeader + cards

**Files:**
- Create: `src/ui/kit/PageHeader.tsx`, `PageHeader.module.css`, `PageHeader.test.tsx`, `src/ui/kit/Cards.tsx`, `Cards.module.css`, `Cards.test.tsx`
- Modify: `src/ui/index.ts`, `src/features/staff/ui.tsx`, `src/features/customer/ui.tsx` (their `PageHeader` becomes a thin wrapper of the shared one), and remove the now-unused `.pageHead/.pageHeadText/.h1/.pageSub` rules from `Staff.module.css` / `Customer.module.css` only if no other file uses them (grep first).

**Interfaces:**
- Produces:
  ```ts
  export type Crumb = { label: string; to?: string };
  export function PageHeader(p: { title: ReactNode; sub?: ReactNode; actions?: ReactNode; eyebrow?: ReactNode; crumbs?: Crumb[]; size?: 'md' | 'lg' }): JSX.Element;
  export function StatCard(p: { icon: IconName; label: string; value: ReactNode; hint?: ReactNode; tone?: 'plum' | 'orange' | 'teal' }): JSX.Element;
  export function SectionCard(p: { title: ReactNode; action?: { label: string; to: string }; children: ReactNode; id?: string; className?: string }): JSX.Element;
  export function DetailList(p: { items: { label: ReactNode; value: ReactNode }[] }): JSX.Element;
  ```
- PageHeader: `<header>`; crumbs → `<nav aria-label="Đường dẫn"><ol>`, items with `to` are `AppLink`, the last crumb has `aria-current="page"`; `<h1 tabIndex={-1}>` (keeps the existing focus-on-navigation behaviour; check how pages focus `h1` today and keep it working). `size="lg"` = customer title `clamp(26px, 3.2vw, 32px)`, `md` = staff 24 px (20 px < 768).
- Staff wrapper: `PageHeader` with `size="md"`; customer wrapper: `size="lg"`. Same props as today, so pages are untouched.
- Cards use `--surface-card`, `--line-soft`, `--r-card`, `--sh-card`. SectionCard: `<section aria-labelledby>` with `<h2>`; action renders `AppLink` "{label} →" (arrow icon `arrow-right`, `aria-hidden`). StatCard: `data-stat`, value in Lora 28 px. DetailList: `<dl>` grid of two columns (label `--ink-600`).

- [ ] **Step 1: Write the failing markup tests**:
  - PageHeader with `crumbs=[{label:'Khách hàng', to:'/nv/khach-hang'},{label:'Hồ sơ khách hàng'}]` → `aria-label="Đường dẫn"`, `aria-current="page">Hồ sơ khách hàng`, one `<h1`.
  - SectionCard with `action={{label:'Xem tất cả', to:'/x'}}` → `aria-labelledby` equals the `h2` id; text `Xem tất cả`.
  - DetailList with 2 items → 2 `<dt>` and 2 `<dd>`.
  - StatCard → `data-stat`.
  (Wrap renders in `MemoryRouter` from `react-router` because `AppLink` needs a router.)
- [ ] **Step 2: Run** `npx vitest run src/ui/kit/PageHeader.test.tsx src/ui/kit/Cards.test.tsx` — Expected: FAIL.
- [ ] **Step 3: Implement**, wire the staff/customer wrappers, export from `@/ui`.
- [ ] **Step 4: Run** unit tests, typecheck, lint; then `npm run build && npx playwright test e2e/staff-a.spec.ts e2e/customer-a.spec.ts --project=desktop-1440` — Expected: PASS (pages unchanged in behaviour).
- [ ] **Step 5: Commit** `feat(ui): shared PageHeader with breadcrumb, stat/section/detail cards`.

### Task 6: SaveState

**Files:**
- Create: `src/ui/kit/save-state.ts`, `save-state.test.ts`, `SaveState.tsx`, `SaveState.module.css`
- Modify: `src/ui/index.ts`

**Interfaces:**
- Produces:
  ```ts
  export type SaveStatus = 'clean' | 'dirty' | 'saving' | 'saved' | 'error';
  export type SaveEvent = 'edit' | 'start' | 'ok' | 'fail' | 'reset';
  export function saveReducer(s: SaveStatus, e: SaveEvent): SaveStatus;
  export const SAVE_LABEL: Record<Exclude<SaveStatus, 'clean'>, string>; // dirty 'Bản nháp · Chưa lưu thay đổi', saving 'Đang lưu…', saved 'Đã lưu', error 'Chưa lưu thay đổi'
  export function useSaveStatus(initial?: SaveStatus): { status: SaveStatus; edit(): void; reset(): void; run<T>(fn: () => Promise<T>): Promise<T> };
  export function SaveState(p: { status: SaveStatus }): JSX.Element | null;
  ```
- Transitions: `edit` → `dirty` from any state except `saving` (stays `saving`); `start` → `saving`; `ok` → `saved` **only from `saving`** (else unchanged); `fail` → `error` only from `saving`; `reset` → `clean`. `run` dispatches start, awaits, ok/fail, rethrows on failure.
- `SaveState`: `clean` → `null`; otherwise `<span role="status" aria-live="polite" data-save={status}>`; `saved` shows a check icon that scales/fades in over 200 ms (opacity only when reduced); `saving` shows no spinner animation beyond a static dot (no looping animation).

- [ ] **Step 1: Write the failing tests** (`save-state.test.ts`): clean→edit=dirty; dirty→start=saving; saving→ok=saved; saving→fail=error; dirty→ok stays dirty (no tick without a save); error→edit=dirty; saved→edit=dirty; labels exact as above.
- [ ] **Step 2: Run** `npx vitest run src/ui/kit/save-state.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement** reducer, labels, hook, component; export from `@/ui`.
- [ ] **Step 4: Run** test + typecheck — Expected: PASS.
- [ ] **Step 5: Commit** `feat(ui): SaveState — draft / saving / saved, tick only after a real save`.

### Task 7: DataTable

**Files:**
- Create: `src/ui/kit/table.ts`, `table.test.ts`, `DataTable.tsx`, `DataTable.module.css`, `DataTable.test.tsx`
- Modify: `src/ui/index.ts`

**Interfaces:**
- Produces (`table.ts`):
  ```ts
  export type PageInfo = { page: number; pages: number; from: number; to: number; total: number };
  export function paginate<T>(rows: T[], page: number, pageSize: number): PageInfo & { rows: T[] };
  export function rangeLabel(p: PageInfo, noun: string): string; // 'Hiển thị 1–5 của 24 khách hàng'; total 0 → 'Không có kết quả'
  export function pageList(page: number, pages: number): (number | '…')[]; // ≤ 7 entries, always first and last
  export function moveRow(index: number, key: string, count: number): number; // ArrowDown/ArrowUp clamp, Home → 0, End → count-1, other keys → index
  ```
- Produces (`DataTable.tsx`):
  ```ts
  export type Column<T> = { key: string; header: string; cell: (row: T) => ReactNode; align?: 'start' | 'end'; primary?: boolean; hideOnPhone?: boolean };
  export function DataTable<T>(p: { rows: T[]; columns: Column<T>[]; rowKey: (row: T) => string; caption: string; noun: string;
    selectedKey?: string; onOpen?: (row: T, via: 'pointer' | 'keyboard') => void; pageSize?: number; page?: number; onPageChange?: (page: number) => void; empty?: ReactNode }): JSX.Element;
  ```
- One `<table>` (caption visually hidden), wrapped in a focusable region (`tabIndex={0}`, `role="region"`, `aria-label={caption}`). Each `<td>` has `data-label={column.header}`; below 768 px CSS turns rows into cards (the `primary` column is the card title, `hideOnPhone` cells hidden) — no second markup. Rows: `tabIndex={0}` on the selected row (or first row), `-1` on others; `aria-selected` on the selected row; Enter/Space or click → `onOpen(row, via)`; arrow keys use `moveRow` and move focus. Selected row: `--sel-bg` background + 3 px `--plum-700` inline-start bar (not colour alone). Hover 150 ms background. Pager below when `pages > 1`: `rangeLabel` text + `pageList` buttons (`aria-current="page"` on the current one, prev/next "Trang trước"/"Trang sau"); the tbody keeps `min-height` of `pageSize` rows while `pages > 1` so the page does not jump. Default `pageSize` 10; uncontrolled page state when `page` is not given; when `rows` shrink, `paginate` clamps.

- [ ] **Step 1: Write the failing tests** (`table.test.ts`):
  - `paginate(24 rows, 1, 5)` → from 1, to 5, pages 5; `rangeLabel(..., 'khách hàng') === 'Hiển thị 1–5 của 24 khách hàng'`.
  - `paginate(4 rows, 3, 5)` → page 1, from 1, to 4 (clamp — Review Focus 1); `paginate([], 2, 5)` → pages 1, total 0, label `'Không có kết quả'`.
  - `pageList(1, 5)` → `[1,2,3,4,5]`; `pageList(6, 12)` → `[1,'…',5,6,7,'…',12]`.
  - `moveRow(0,'ArrowUp',5) === 0`, `moveRow(4,'ArrowDown',5) === 4`, `moveRow(2,'End',5) === 4`, `moveRow(2,'a',5) === 2`.
- [ ] **Step 2: Write the failing markup test** (`DataTable.test.tsx`): 7 rows, pageSize 5, `selectedKey` of row 2 → exactly one `<table`, `<caption`, `aria-selected="true"` once, `data-label="Tên khách hàng"` on cells, text `Hiển thị 1–5 của 7 khách hàng`, `aria-current="page"` on button 1.
- [ ] **Step 3: Run** `npx vitest run src/ui/kit/table.test.ts src/ui/kit/DataTable.test.tsx` — Expected: FAIL.
- [ ] **Step 4: Implement** `table.ts`, then `DataTable`; export `DataTable`, `type Column` from `@/ui`.
- [ ] **Step 5: Run** tests, typecheck, lint — Expected: PASS.
- [ ] **Step 6: Commit** `feat(ui): DataTable — pagination, keyboard rows, cards on phones`.

### Task 8: MasterDetail + remembered list state

**Files:**
- Create: `src/ui/kit/list-state.ts`, `list-state.test.ts`, `MasterDetail.tsx`, `MasterDetail.module.css`
- Modify: `src/ui/index.ts`

**Interfaces:**
- Produces (`list-state.ts`):
  ```ts
  export type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;
  export function readListState<T extends object>(store: StorageLike | null, key: string, initial: T): T; // shallow-merge saved over initial; any throw / bad JSON / non-object → initial
  export function writeListState(store: StorageLike | null, key: string, value: object): void; // swallows errors
  export function useListState<T extends object>(key: string, initial: T): [T, (patch: Partial<T>) => void]; // sessionStorage (per tab), key prefix 'leson:list:'
  ```
- Produces (`MasterDetail.tsx`):
  ```ts
  export function MasterDetail(p: { label: string; list: ReactNode; detail: ReactNode | null; detailKey?: string; onBack: () => void; backLabel: string; focusDetail?: boolean }): JSX.Element;
  ```
  ≥ 1024 px (`useMedia('(min-width: 1024px)')`): two columns (list `minmax(0, 1fr)`, detail 400–480 px, sticky top); detail container keyed by `detailKey` and animated with `preset('enterPanel')` (reduced → fade). < 1024 px: when `detail` is non-null, only the detail shows (list stays mounted with `hidden` so its scroll and state survive) with a top "← {backLabel}" button calling `onBack`; otherwise only the list. `focusDetail` → after mount, focus the detail's first heading (`h2`, `tabIndex=-1`); otherwise focus stays where it was. Detail region: `<section aria-label={label}>`.

- [ ] **Step 1: Write the failing tests** (`list-state.test.ts`): round-trip with an in-memory store; `getItem` throwing → returns `initial`; stored `'{bad'` → `initial`; stored `'[1,2]'` → `initial`; saved `{page:3}` over `{page:1, q:''}` → `{page:3, q:''}`; `setItem` throwing → no throw (Review Focus 2).
- [ ] **Step 2: Run** `npx vitest run src/ui/kit/list-state.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement** `list-state.ts`, then `MasterDetail`; export `MasterDetail`, `useListState` from `@/ui`.
- [ ] **Step 4: Run** tests, typecheck, lint — Expected: PASS.
- [ ] **Step 5: Commit** `feat(ui): MasterDetail layout and per-tab remembered list state`.

### Task 9: Review page `#/_giao-dien` + browser checks

**Files:**
- Create: `src/features/gallery/index.tsx` (exports `GalleryPage`), `src/features/gallery/GalleryPage.tsx`, `src/features/gallery/Gallery.module.css`, `e2e/giao-dien-nen.spec.ts`
- Modify: `src/app/router.tsx` (lazy route under the public layout, like `_bo-icon` but `lazy: page(() => import('@/features/gallery'), 'GalleryPage')`), `src/app/routes.ts` (`paths.uiGallery = '/_giao-dien'`, alias `'giao-dien': '/_giao-dien'`), `src/app/system/System.tsx` (demo-chip menu item "Bộ giao diện" after "Bộ icon"), `e2e/manifest.ts` (row `{ zone: 'public', slug: 'giao-dien', route: '/_giao-dien' }`)

**Interfaces:**
- Consumes: everything from Tasks 1–8.
- Page content (static sample data inside `GalleryPage.tsx`, labelled "Dữ liệu mẫu"; title "Bộ giao diện"):
  1. Two surfaces side by side (customer `--cream-50`, staff `--canvas-work`) each showing: PageHeader `lg`/`md` with crumbs; 3 StatCards ("Doanh thu đã thu", "Hóa đơn đã thanh toán", "Giá trị trung bình"); SectionCard "Lịch hẹn sắp tới" with "Xem tất cả"; DetailList.
  2. PetAvatar row: all sizes; species fallback for cat/dog/other; one `photoKey="khong-co"` (Review Focus 3); "Ảnh minh họa" tag.
  3. Tabs (underline) "Thú cưng · Lịch hẹn · Hóa đơn".
  4. SaveState demo: buttons "Sửa", "Lưu (thành công)", "Lưu (lỗi)" driving `useSaveStatus` with a fake 600 ms save.
  5. MasterDetail + DataTable: 12 sample customers (columns Tên khách hàng (primary) · Số điện thoại · Thú cưng · Lần ghé gần nhất), `pageSize` 5, search box filtering by name, `useListState('gallery', { page: 1, q: '', sel: '' })`; opening a row shows a detail with PetAvatar + DetailList + "Chỉnh sửa" button.
  6. A "flashOnce" demo button "Giả lập cập nhật" that flashes a status row once.

- [ ] **Step 1: Write the failing e2e** `e2e/giao-dien-nen.spec.ts`:
  - `axe` (same helper/config as `e2e/a11y.spec.ts`) on `/_giao-dien` → no violations.
  - keyboard: focus the first table row, `ArrowDown`, `Enter` → detail region `getByRole('region', { name: … })` visible with the second customer's name; focus is inside the detail (`focusDetail` when via keyboard).
  - paging: click "Trang sau" → text `Hiển thị 6–10 của 12 khách hàng`; reload → still page 2 (remembered state).
  - search "Lan" while on page 3 → label shows the clamped first page, never `Hiển thị 11–` (Review Focus 1).
  - missing photo: `[data-pet-avatar="icon"][aria-label]` present in the avatar row.
  - SaveState: "Sửa" → `Bản nháp · Chưa lưu thay đổi`; "Lưu (lỗi)" → `Chưa lưu thay đổi` and no `Đã lưu`; "Lưu (thành công)" → `Đã lưu`.
  - `@motion-reduced`: open a row; the detail panel's computed `transform` is `none` after 50 ms.
  - `@narrow` (320 px project): `document.documentElement.scrollWidth <= 320`; table cells show `data-label` text via CSS (assert the first cell's `::before` content via `getComputedStyle(el, '::before').content` contains `Tên khách hàng`), and opening a row hides the list (`list` has `hidden`).
- [ ] **Step 2: Run** `npm run build && npx playwright test e2e/giao-dien-nen.spec.ts` — Expected: FAIL (route missing).
- [ ] **Step 3: Implement** route, chip link, manifest row, `GalleryPage`.
- [ ] **Step 4: Run** `npm run build && npx playwright test e2e/giao-dien-nen.spec.ts` (all projects) — Expected: PASS.
- [ ] **Step 5: Run** `npm run verify` — Expected: exit 0 (existing suite green, budgets ✓). Check the gallery is its own chunk (initial JS unchanged within budget).
- [ ] **Step 6: Commit** `feat(gallery): #/_giao-dien review page for the redesign foundation`.

### Task 10: Hand-off

**Files:**
- Modify: `PROGRESS.md` (only the `claude/giao-dien` section), `README.md` status row (one line: "Làm lại giao diện — phần 1 nền chung ✅").

- [ ] **Step 1:** `npm run shots` → look at `review/shots/*/public__giao-dien.png` at 1440 and 390; fix anything visibly off against `docs/tham-khao/mau-giao-dien/` (card radius, borders, sidebar colours are part 4 — not here).
- [ ] **Step 2:** Update the `claude/giao-dien` section of `PROGRESS.md` (done, next: part 2 design), commit `docs: progress — part 1 foundation done`, `git push`.
- [ ] **Step 3:** Merge into the integration branch from the main checkout (`/home/user/tesst`): `git merge --no-ff claude/giao-dien`, `npm run verify`, push; republish the Artifact (same `file_path`, `files` from `node scripts/artifact-files.mjs`) so the owner can open `#/_giao-dien`.
