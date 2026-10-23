/* Hero chính "khung ảnh bay vòng" — chép từ docs/de-xuat-hero-quy-dao/hero-quy-dao.html (shared/qa-review @ f58c2d7).
   Chỉ đổi: id gốc, tên lớp .hero → .ho, bỏ phần đo header riêng.
   17/10/2026 (Claude, chủ dự án duyệt v3): thêm chuyển cảnh Hero → Giới thiệu gắn theo thanh cuộn và FRAME_SCALE (khung +8%),
   theo docs/de-xuat-gioi-thieu/trang-chu-gioi-thieu.html (shared/qa-review @ ea269d0); quỹ đạo không đổi. */
// PORT: IIFE -> mount function. Root element is passed in; returns a teardown.
// 23/10/2026 (part 7, R51): the owner allowed the hero to be redone, so this is no longer line-for-line with the reference demo:
// five photos (four below 993 px), fade-out before any word, button or edge, bands above and below the words on small screens.
export function mountHeroOrbit(hero) {
  'use strict';
  var destroyed = false;              // PORT
  var disposers = [];                 // PORT
  function on(target, type, fn, opts) {     // PORT: every listener registered here is removed on teardown
    target.addEventListener(type, fn, opts);
    disposers.push(function () { target.removeEventListener(type, fn, opts); });
  }
  var content = hero.querySelector('.ho__content');
  var title = content.querySelector('.ho-title');
  var titleLines = title.querySelectorAll('.line > [data-measure]');
  var cta = content.querySelector('.cta');
  var layer = hero.querySelector('.ho__frames');
  var svg = hero.querySelector('.ho__orbits svg');
  var comet = hero.querySelector('.comet');
  var decor = hero.querySelector('.ho__decor');
  var toggle = hero.querySelector('.motion-toggle');
  var toggleLabel = toggle.querySelector('.motion-toggle__label');
  var mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- Toán học ---------- */
  var TAU = Math.PI * 2, DEG = Math.PI / 180;
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function easeOutCubic(t) { var u = 1 - t; return 1 - u * u * u; }
  function smoother(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
  function smoothstep(a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
  function easeOutBack(t) { var c1 = 1.35, c3 = c1 + 1, u = t - 1; return 1 + c3 * u * u * u + c1 * u * u; }
  function mod(a, n) { return ((a % n) + n) % n; }
  function angDist(a, b) { var d = mod(a - b, TAU); return d > Math.PI ? TAU - d : d; }
  function wrapPi(a) { return mod(a + Math.PI, TAU) - Math.PI; }
  function spow(v, e) { return v < 0 ? -Math.pow(-v, e) : Math.pow(v, e); }

  // Ngẫu nhiên có hạt giống: bố cục ổn định mỗi lần tải
  var seedState = 20240611;
  function rand() {
    seedState = (seedState + 0x6D2B79F5) | 0;
    var t = Math.imul(seedState ^ (seedState >>> 15), 1 | seedState);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /* ---------- Cấu hình ---------- */
  // Part 7: 5 khung (4 khung đầu cho màn hình dưới 993 px).
  // size: máy tính (lớn / nhỏ xen kẽ); msize: bố cục dọc (di động, máy tính bảng đứng) đều tay hơn.
  var SPECS = [
    { ring: 0, size: 1.00, msize: 1.00, tilt: -8 },
    { ring: 1, size: 0.88, msize: 0.92, tilt: 7 },
    { ring: 0, size: 0.94, msize: 0.96, tilt: 10 },
    { ring: 1, size: 0.82, msize: 0.88, tilt: -5 },
    { ring: 0, size: 0.90, msize: 0.92, tilt: 6 }
  ];
  // Bố cục tĩnh khi giảm chuyển động (chọn tay): [góc độ trên quỹ đạo, độ sâu 0..1 (null = theo góc), hệ số bán kính]
  // Góc: 0° = phải, 90° = dưới (gần), 180° = trái, 270° = trên (xa).
  var STATIC = {
    wide5: [[190, .9, .95], [356, .9, .95], [62, null, 1], [128, .62, 1], [300, null, 1]],
    tall4: [[62, null, 1], [118, null, 1], [242, null, 1], [298, null, 1]]
  };
  var INTRO_AFTER_CTA = 0.5; // khung bay ra 0,5 giây sau khi hàng nút bắt đầu hiện (~1,0 giây)
  var INTRO_FALLBACK = 1.4;  // nếu không nhận được sự kiện animation (tính từ lúc mở màn)
  var INTRO_STAGGER = 0.1;
  var INTRO_DUR = 1.05;
  var FIRST_EXCURSION_AFTER = 6.0; // lần lướt qua chữ đầu tiên ~7 giây
  var FONT_WAIT_MS = 700;    // chờ phông tối đa
  var COMET_SPEED = 0.2;     // rad/giây
  var MAX_DT = 1 / 15;       // kẹp delta time

  var FRAME_SCALE = 1.12;   // khung to hơn ~12% so với Hero v5

  var FRAME_HTML =
    '<div class="frame__card"><div class="frame__inner">' +
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="9.5" r="1.8"/><path d="M4.5 18l5-5 3.5 3.5 2.5-2.5 4 4"/></svg>' +
    '<span class="frame__label"></span></div></div>';

  var frames = SPECS.map(function (spec, i) {
    var el = document.createElement('div');
    el.className = 'frame';
    el.innerHTML = FRAME_HTML;
    layer.appendChild(el);
    return {
      el: el, spec: spec, i: i, ring: spec.ring, tilt: spec.tilt,
      seed: rand(),
      rj: 1 + (rand() - 0.5) * 0.05,          // lệch bán kính rất nhẹ
      ox: (rand() - 0.5) * 1.3,               // điểm xuất phát trong vùng chữ
      oy: (rand() - 0.5) * 0.9,
      spinDir: rand() < 0.5 ? -1 : 1,
      phase: 0, st: null,
      w: 0, h: 0, active: true,
      exc: null, band: -1, z: -1, lastO: -1, lastT: '', crossing: false
    };
  });

  /* ---------- Trạng thái ---------- */
  var G = null;              // hình học hiện tại
  var simT = 0;              // đồng hồ mô phỏng (chỉ chạy khi đang phát)
  var last = null, raf = 0, running = false;
  var reduced = mqReduce.matches;
  var userPaused = false, inView = true;
  var SNAKE = { V: 0.8, R1: 1.3, R2: 1.4, PRE: 0.15, OFF: 0.14, MARGIN: 0.2, L: 3.0, K: 6, K_MOBILE: 4 };
  var conv = null, nextExc = Infinity, settleUntil = 0;
  /* ---------- Chuyển cảnh Hero -> Giới thiệu (gắn theo thanh cuộn) ---------- */
  var about = document.querySelector('.gt');
  var slotEls = [].slice.call(document.querySelectorAll('.gt__slot-frame'));
  var SLOTS = [];          // [{x, y, w, rot}] toạ độ tâm ô ảnh, tính theo góc trên-trái của Hero
  var P = 0;               // tiến độ chuyển cảnh 0..1
  var slotOf = [];         // chỉ số ô ảnh cho từng khung (-1 = không có ô, sẽ mờ dần)
  var pinWrap = document.querySelector('.gt-pin');
  var PIN_VH = 0.8;        // độ dài nhịp đứng yên của phần Giới thiệu (theo chiều cao màn hình)
  var END = 1;             // quãng cuộn (px) để hoàn tất chuyển cảnh
  // PORT (redesign part 2): the pinned Giới thiệu is gone, so the flight only runs when its markup exists.
  var flight = !!(about && pinWrap);
  function measureSlots() {
    if (!flight) { SLOTS = []; slotOf = frames.map(function () { return -1; }); END = 1; return; }
    // Chừa chỗ cho thanh dính trên đỉnh trang (đánh dấu data-sticky-top, ví dụ thanh điều khiển bản xem thử)
    var off = 0;
    [].forEach.call(document.querySelectorAll('[data-sticky-top]'), function (el) { off = Math.max(off, el.offsetHeight); });
    var vh = window.innerHeight - off, aH = about.offsetHeight;
    var top = off + Math.max(0, Math.round((vh - aH) / 2));
    var pin = Math.round(vh * PIN_VH);
    about.style.setProperty('--gt-top', top + 'px');
    pinWrap.style.setProperty('--pin-len', pin + 'px');
    var pinTop = pinWrap.getBoundingClientRect().top + window.scrollY;
    END = Math.max(1, pinTop - top + pin * 0.75);
    SLOTS = slotEls.map(function (el) {
      var fig = el.parentNode, st = getComputedStyle(fig);
      if (st.display === 'none') return null;
      var m = new DOMMatrixReadOnly(st.transform === 'none' ? undefined : st.transform);
      var rot = Math.atan2(m.b, m.a) * 180 / Math.PI;
      var w = el.offsetWidth, h = el.offsetHeight;
      el.style.setProperty('--w', Math.min(w, h) + 'px');
      if (!el.firstChild) el.innerHTML = FRAME_HTML;
      return { el: el, x: 0, y: 0, w: w, h: h, rot: rot };
    });
    trackSlots();
    // Gán ô: khung lớn nhất vào ô đầu (khung dọc), rồi lần lượt
    var act = frames.filter(function (f) { return f.active; });
    var order = act.slice().sort(function (a, b) { return b.spec.size - a.spec.size; });
    slotOf = frames.map(function () { return -1; });
    var free = SLOTS.map(function (s, i) { return s ? i : -1; }).filter(function (i) { return i >= 0; });
    order.forEach(function (f) { if (free.length) slotOf[frames.indexOf(f)] = free.shift(); });
    // PORT: a landed slot shows the photo of the frame that flew into it (photos are styled by data-photo = frame index)
    SLOTS.forEach(function (sl) { if (sl) sl.el.removeAttribute('data-photo'); });
    slotOf.forEach(function (si, fi) { if (si >= 0 && SLOTS[si]) SLOTS[si].el.setAttribute('data-photo', String(fi)); });
  }
  // Tâm ô ảnh theo toạ độ Hero; đo lại mỗi lần vẽ vì phần Giới thiệu đứng yên (sticky) trong khi Hero cuộn đi
  function trackSlots() {
    var hr = hero.getBoundingClientRect();
    SLOTS.forEach(function (sl) {
      if (!sl) return;
      var r = sl.el.getBoundingClientRect();      // hộp bao (đã xoay) -> tâm vẫn đúng
      sl.x = r.left + r.width / 2 - hr.left; sl.y = r.top + r.height / 2 - hr.top;
    });
  }
  function progress() {
    if (!flight) return 0;
    return clamp(window.scrollY / END, 0, 1);
  }
  // Làm mượt: khung "đuổi theo" thanh cuộn với độ trễ mềm (giảm dần theo hàm mũ), nên mỗi nấc lăn chuột
  // không còn làm khung giật một bước. SMOOTH_K càng nhỏ càng trôi.
  var SY = 0;
  var SMOOTH_K = 7, Pt = 0, Ps = 0, lastSm = null, smInit = false, glideRaf = 0;
  function smoothP() {
    Pt = reduced ? 0 : progress();
    var now = performance.now();
    if (!smInit) { Ps = Pt; smInit = true; }
    else if (lastSm !== null) {
      var dt = Math.min((now - lastSm) / 1000, 0.1);
      Ps += (Pt - Ps) * (1 - Math.exp(-dt * SMOOTH_K));
    }
    lastSm = now;
    if (Math.abs(Pt - Ps) < 0.0008) Ps = Pt;
    return Ps;
  }
  function glide() {
    glideRaf = 0;
    if (running) return;              // vòng chính đang vẽ mỗi khung hình rồi
    render(simT);
    if (Ps !== Pt) glideRaf = requestAnimationFrame(glide);
    else lastSm = null;               // đứng yên: lần cuộn sau bắt đầu lại từ dt = 0
  }
  function easeInOutSine(x) { return -(Math.cos(Math.PI * x) - 1) / 2; }
  var introSkipped = reduced;
  var introBase = null;      // thời điểm (đồng hồ mô phỏng) khung đầu tiên bay ra
  var readyAt = null;        // thời điểm chữ bắt đầu mở màn (sau khi có phông)
  var cometLastT = '', cometLastO = -1;

  // Đồng bộ với CSS: chữ hiện trước, khung chỉ bay ra khi hàng nút bắt đầu xuất hiện.
  function beginIntro(at) {
    if (introBase !== null) return;
    introBase = at;
    nextExc = Infinity;   // không còn đợt chui vào giữa: khung chỉ bay vòng ở vùng ngoài
  }
  on(cta, 'animationstart', function (e) {
    if (e.target === cta) beginIntro(simT + INTRO_AFTER_CTA);
  });
  on(cta, 'animationend', function (e) {
    if (e.target === cta) relayout();   // đo lại khi chữ đã vào vị trí cuối
  });
  // Part 7: every word and button settles on its own beat, and the fade-out distance to them is measured from where they end up.
  on(content, 'animationend', function () { relayout(); });

  // Mở màn khi phông đã sẵn sàng (hoặc sau tối đa 0,7 giây)
  function markReady() {
    if (destroyed || readyAt !== null) return;   // PORT: guard
    readyAt = simT;
    layout();
    render(simT);
    hero.classList.add('is-ready');
  }
  (function waitFonts() {
    var loads = [];
    if (document.fonts && document.fonts.load) {
      var sample = title.textContent + content.textContent;
      ['700 1em Lora', 'italic 700 1em Lora', '400 1em "Be Vietnam Pro"', '600 1em "Be Vietnam Pro"'].forEach(function (f) {
        loads.push(document.fonts.load(f, sample).catch(function () {}));
      });
    }
    Promise.race([
      Promise.all(loads),
      new Promise(function (r) { var id = setTimeout(r, FONT_WAIT_MS); disposers.push(function () { clearTimeout(id); }); })
    ]).then(markReady, markReady);
  })();

  /* ---------- Hình dạng quỹ đạo ----------
     Máy tính: elip rộng, nghiêng nhẹ.
     Bố cục dọc (di động, máy tính bảng đứng): "siêu elip" cao, đỉnh và đáy phẳng, khung nán lại ở
     khoảng trống phía trên dòng chào và phía dưới hàng nút, lướt nhanh qua hai bên. */
  function shape(rg, th) {
    var c = Math.cos(th), s = Math.sin(th);
    if (rg.e !== 1) { c = spow(c, rg.e); s = spow(s, rg.e); }
    return [rg.rx * c, rg.ry * s];
  }
  // Toạ độ so với tâm khối chữ
  function toLocal(rg, lx, ly) {
    return [lx * rg.c - ly * rg.s, lx * rg.s + ly * rg.c + rg.oy];
  }
  // Mật độ thời gian trên mỗi đơn vị chiều dài: R > 1 => đi nhanh ở hai bên, chậm ở đỉnh/đáy
  function dens(rg, th) {
    if (rg.R === 1) return 1;
    return lerp(1 / rg.R, 1, smoothstep(0.55, 0.85, Math.abs(Math.sin(th))));
  }

  // Bảng tra đổi tham số s (đều theo thời gian) -> góc θ, theo chiều dài cung có trọng số.
  var WARP_N = 256;
  function buildWarp(rg) {
    var cum = new Float32Array(WARP_N + 1), total = 0, i, prev = shape(rg, 0), p;
    for (i = 1; i <= WARP_N; i++) {
      p = shape(rg, i / WARP_N * TAU);
      total += Math.sqrt((p[0] - prev[0]) * (p[0] - prev[0]) + (p[1] - prev[1]) * (p[1] - prev[1])) * dens(rg, (i - 0.5) / WARP_N * TAU);
      cum[i] = total;
      prev = p;
    }
    var inv = new Float32Array(WARP_N + 1), j = 0;
    for (var k = 0; k <= WARP_N; k++) {
      var target = k / WARP_N * total;
      while (j < WARP_N - 1 && cum[j + 1] < target) j++;
      var seg = cum[j + 1] - cum[j];
      inv[k] = (j + (seg > 0 ? clamp((target - cum[j]) / seg, 0, 1) : 0)) / WARP_N * TAU;
    }
    rg.inv = inv;
  }
  function warp(rg, s) {
    var sm = mod(s, TAU), q = sm / TAU * WARP_N, k = Math.floor(q);
    if (k >= WARP_N) k = WARP_N - 1;
    var th = rg.inv[k] + (rg.inv[k + 1] - rg.inv[k]) * (q - k);
    return sm + (th - sm) * rg.mix;
  }

  /* ---------- Đo đạc & quỹ đạo ---------- */
  function layout() {
    var W = hero.clientWidth, H = hero.clientHeight;
    if (!W || !H) return;
    var hr = hero.getBoundingClientRect();
    var cr = content.getBoundingClientRect();
    var l = Infinity, r = -Infinity;
    // Read again each time: the secondary button swaps between a call link and a message button by the clock.
    var measureEls = content.querySelectorAll('[data-measure]');
    for (var i = 0; i < measureEls.length; i++) {
      var b = measureEls[i].getBoundingClientRect();
      if (b.width > 0) { if (b.left < l) l = b.left; if (b.right > r) r = b.right; }
    }
    if (!isFinite(l)) { l = cr.left; r = cr.right; }

    var mobile = W <= 700, tablet = !mobile && W <= 992;
    var tall = mobile || tablet;   // part 7: below 993 px the photos keep two bands, above and below the words
    var count = tall ? 4 : 5;   // part 7: few photos, large and clear
    var cx = (cr.left + cr.right) / 2 - hr.left;
    var cy = (cr.top + cr.bottom) / 2 - hr.top;
    var kx = (r - l) / 2, ky = cr.height / 2;
    var headerH = 0;   // header chung của trang nằm ngoài khối hero
    var base = (mobile ? clamp(Math.min(W * 0.22, (H - headerH) * 0.14), 72, 100) : (tall ? clamp(W * 0.09, 72, 88) : clamp(Math.min(W * 0.134, (H - headerH) * 0.242), 123, 196))) * FRAME_SCALE;
    var depth = tall ? { sMin: 0.86, sMax: 1.04, oMin: 0.92 } : { sMin: 0.82, sMax: 1.05, oMin: 0.92 };   // every photo stays clear
    var rings, reserveBottom = 0;

    if (tall) {
      // Hai dải trống: trên dòng chào và dưới hàng nút (chừa chỗ cho nút tạm dừng).
      var cTop = cr.top - hr.top, cBot = cr.bottom - hr.top;
      var hhBack = base * 1.06 * depth.sMin * 0.5, hhFront = base * 1.06 * depth.sMax * 0.5;
      // Room kept at the bottom for the pause button (its real top, when it is shown).
      var tgEl = hero.querySelector('.motion-toggle'), tgBox = tgEl ? tgEl.getBoundingClientRect() : null;
      var reserve = Math.max(mobile ? 66 : 74, tgBox && tgBox.width > 0 ? Math.round(hr.bottom - tgBox.top) + 8 : 0);
      reserveBottom = reserve - 10;
      var yT = Math.max(headerH + hhBack + 8, (headerH + cTop) / 2);
      var yB = Math.min(H - reserve - hhFront * 0.55, (cBot + H - reserve) / 2);
      if (yB < cBot) yB = cBot;
      var ryT = (yB - yT) / 2, oyT = (yT + yB) / 2 - cy;
      var rxT = mobile ? W * 0.36 : W * 0.38;
      rings = [
        { rx: rxT, ry: ryT, oy: oyT, tilt: -1.5 * DEG, e: 0.6, R: mobile ? 3.4 : 2.8, mix: 1 },
        { rx: rxT * 0.8, ry: ryT * 0.93, oy: oyT, tilt: 1.5 * DEG, e: 0.6, R: mobile ? 3.4 : 2.8, mix: 1 }
      ];
    } else {
      // Bán kính dọc: khung ở phía sau (trên cùng) không chạm header, không đè lên chữ.
      var backHalf = base * 1.06 * depth.sMin / 2 + 9;
      var topLimit = cy - headerH - backHalf - 14;
      var textLimit = ky + backHalf + 10;
      var ry0 = Math.max(60, Math.min(topLimit, Math.max(textLimit, (H - headerH) * 0.36)));
      var rx0 = tablet ? W / 2 - base * 0.35 : Math.max(W * 0.46, Math.min(kx + base * 0.95, W * 0.5 + 10));
      rings = [
        { rx: rx0, ry: ry0, oy: 0, tilt: -4 * DEG, e: 1, R: 1, mix: 0.8 },
        { rx: rx0 * 0.87, ry: ry0 * 0.9, oy: 0, tilt: 3 * DEG, e: 1, R: 1, mix: 0.8 }
      ];
    }
    rings.forEach(function (rg) { rg.c = Math.cos(rg.tilt); rg.s = Math.sin(rg.tilt); buildWarp(rg); });

    var key = (tall ? 'tall' : 'wide') + count;
    var countChanged = !G || G.count !== count || G.tall !== tall;
    // Boxes of the words and buttons (hero coordinates): a photo fades out before it can touch any of them.
    // Taken from the layout offsets, not from the screen boxes: a word still sliding in must already count where it will rest.
    var texts = [], tEls = content.querySelectorAll('[data-measure], .sample-note');
    for (var ti = 0; ti < tEls.length; ti++) {
      var te = tEls[ti];
      if (te.offsetParent === content && te.offsetWidth > 0 && te.offsetHeight > 0) {
        var tl = cr.left - hr.left + te.offsetLeft, tt = cr.top - hr.top + te.offsetTop;
        texts.push([tl, tt, tl + te.offsetWidth, tt + te.offsetHeight]);
      } else {
        var tb = te.getBoundingClientRect();
        if (tb.width > 0 && tb.height > 0) texts.push([tb.left - hr.left, tb.top - hr.top, tb.right - hr.left, tb.bottom - hr.top]);
      }
    }
    // Above and below the hero is cut off, so a photo fades out before it would be cut: the strips outside count like words.
    texts.push([-5000, -5000, 5000, 0], [-5000, H, 5000, H + 5000]);
    // On a wide screen the first section's photo rises about 56 px over the bottom of the hero (and drifts up to 12 px): keep off it.
    var rise = document.querySelector('#gioi-thieu [data-bridge]');
    if (rise) {
      var rb = rise.getBoundingClientRect();
      texts.push([rb.left - hr.left, rb.top - hr.top - 14, rb.right - hr.left, rb.bottom - hr.top]);
    }
    // The pause button and the sample tag are controls, not words, but a photo should stay off them as well.
    var ctl = hero.querySelectorAll('.motion-toggle, .preview-tag');
    for (var ci = 0; ci < ctl.length; ci++) {
      var cb = ctl[ci].getBoundingClientRect();
      if (cb.width > 0 && cb.height > 0) texts.push([cb.left - hr.left, cb.top - hr.top, cb.right - hr.left, cb.bottom - hr.top]);
    }
    G = {
      W: W, H: H, cx: cx, cy: cy, kx: kx, ky: ky, rings: rings, count: count, tall: tall, text: texts,
      // Cả hai vòng quay cùng tốc độ: đội hình xen kẽ nên các khung giữ khoảng cách.
      speed: mobile ? 0.07 : 0.08,
      mobile: mobile, base: base, depth: depth, bob: mobile ? 4 : 7, koX: tall ? 0.55 : 1,
      // Bố cục dọc trên màn hình thấp: khung không chui dưới header hay nút tạm dừng (thà lùi ra sau chữ)
      yMin: headerH + 4, yMax: H - (tall ? reserveBottom : (mobile ? 60 : 64))
    };

    frames.forEach(function (f, idx) {
      var active = idx < count;
      if (active !== f.active || countChanged) {
        f.active = active;
        f.el.style.display = active ? '' : 'none';
      }
      f.st = STATIC[key] ? STATIC[key][idx] || null : null;
      var w = Math.round(base * (tall ? f.spec.msize : f.spec.size)), h = Math.round(w * 1.06);
      if (w !== f.w || h !== f.h) {
        f.w = w; f.h = h; f.mk = null;
        f.el.style.removeProperty('--fw');
        f.el.style.setProperty('--w', w + 'px');
        f.el.style.setProperty('--h', h + 'px');
      }
    });
    if (countChanged) {
      assignPhases();
      frames.forEach(function (f) { f.exc = null; });
      conv = null;
    }

    // Biến cho trang trí bám theo tiêu đề
    var tr = title.getBoundingClientRect();
    var w1 = titleLines[0].getBoundingClientRect().width, w2 = titleLines[1].getBoundingClientRect().width;
    if (tr.width > 0) {
      decor.style.setProperty('--tx', ((tr.left + tr.right) / 2 - hr.left).toFixed(1) + 'px');
      decor.style.setProperty('--ty', ((tr.top + tr.bottom) / 2 - hr.top).toFixed(1) + 'px');
      decor.style.setProperty('--th', (tr.height / 2).toFixed(1) + 'px');
      decor.style.setProperty('--l1', (w1 / 2).toFixed(1) + 'px');
      decor.style.setProperty('--tw', (Math.max(w1, w2) / 2).toFixed(1) + 'px');
    }
    drawRings();
  }

  // Khung xếp đều theo thứ tự, xen kẽ vòng ngoài / vòng trong.
  function assignPhases() {
    var list = frames.filter(function (f) { return f.active; });
    var n = list.length || 1;
    // Ba khung đầu (khung 2 dẫn đầu, 1 và 0 theo sau) luôn đi sát nhau thành một "đoàn" để lúc cần thành con rắn;
    // các khung còn lại chia đều phần vòng còn lại.
    var g = 0, rest = n > 3 ? (TAU - 2 * g) / (n - 2) : TAU / n, ph = 0.35;
    g = TAU / n; rest = g;                      // tất cả khung cách đều nhau; cả đàn cùng tham gia đợt chuyển động
    list.forEach(function (f, j) {
      f.phase = ph + (f.seed - 0.5) * 0.06;
      ph += j < 2 ? g : rest;
    });
  }
  // Vị trí của khung trong "đội hình" (tham số s, đều theo thời gian).
  function angleOf(f, t) {
    return f.phase + G.speed * t + Math.sin(t * 0.23 + f.seed * 10) * 0.06;
  }

  function ringPath(rg, th0, th1, steps) {
    var d = '';
    for (var i = 0; i <= steps; i++) {
      var th = th0 + (th1 - th0) * i / steps, p = shape(rg, th), q = toLocal(rg, p[0], p[1]);
      d += (i ? 'L' : 'M') + (G.cx + q[0]).toFixed(1) + ' ' + (G.cy + q[1]).toFixed(1);
    }
    return d;
  }
  function ringPoint(rg, th) {
    var p = shape(rg, th), q = toLocal(rg, p[0], p[1]);
    return [G.cx + q[0], G.cy + q[1]];
  }

  function drawRings() {
    var g = G;
    svg.setAttribute('viewBox', '0 0 ' + g.W + ' ' + g.H);
    var out = '<defs>';
    g.rings.forEach(function (rg, i) {
      out += '<linearGradient id="orbitGrad' + i + '" gradientUnits="userSpaceOnUse" x1="' + (g.cx - rg.rx).toFixed(1) + '" y1="' + (g.cy + rg.oy - rg.ry * 0.3).toFixed(1) + '" x2="' + (g.cx + rg.rx).toFixed(1) + '" y2="' + (g.cy + rg.oy + rg.ry * 0.5).toFixed(1) + '">' +
        '<stop offset="0" stop-color="#5A1E5E"/><stop offset=".3" stop-color="#824787"/><stop offset=".62" stop-color="#C77A9C"/><stop offset=".82" stop-color="#EA7A24"/><stop offset="1" stop-color="#FC9238"/></linearGradient>';
    });
    // Cung phía trước (gần) của vòng chính: nét dày hơn, mờ dần ở hai đầu
    var rg0 = g.rings[0], fa = 14 * DEG, fb = 166 * DEG;
    var pa = ringPoint(rg0, fb), pb = ringPoint(rg0, fa);
    out += '<linearGradient id="orbitFront" gradientUnits="userSpaceOnUse" x1="' + pa[0].toFixed(1) + '" y1="' + pa[1].toFixed(1) + '" x2="' + pb[0].toFixed(1) + '" y2="' + pb[1].toFixed(1) + '">' +
      '<stop offset="0" stop-color="#824787" stop-opacity="0"/><stop offset=".24" stop-color="#9A5596" stop-opacity=".85"/><stop offset=".52" stop-color="#C77A9C" stop-opacity=".9"/><stop offset=".78" stop-color="#EA7A24" stop-opacity=".9"/><stop offset="1" stop-color="#FC9238" stop-opacity="0"/></linearGradient>';
    out += '<filter id="orbitSoft" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="3"/></filter></defs>';

    var dotSets = [
      [0.16, 0.86, 1.22, 1.7, 1.93],
      [0.42, 1.04, 1.48]
    ];
    g.rings.forEach(function (rg, i) {
      var grad = 'url(#orbitGrad' + i + ')';
      var d = ringPath(rg, 0, TAU, 180) + 'Z';
      out += '<path d="' + d + '" fill="none" stroke="' + grad + '" stroke-width="7" opacity=".1" filter="url(#orbitSoft)"/>';
      out += '<path d="' + d + '" fill="none" stroke="' + grad + '" stroke-width="' + (i === 0 ? 1.7 : 1.3) + '" opacity="' + (i === 0 ? .62 : .48) + '"/>';
      if (i === 0) {
        var inner = { rx: rg.rx - 18, ry: rg.ry - 12, oy: rg.oy, c: rg.c, s: rg.s, e: rg.e };
        out += '<path d="' + ringPath(inner, 0, TAU, 180) + 'Z" fill="none" stroke="' + grad + '" stroke-width="1.3" stroke-dasharray="1.5 9" stroke-linecap="round" opacity=".45"/>';
        out += '<path d="' + ringPath(rg, fa, fb, 90) + '" fill="none" stroke="url(#orbitFront)" stroke-width="2.6" stroke-linecap="round" opacity=".6"/>';
      }
      dotSets[i].forEach(function (a, k) {
        var pt = ringPoint(rg, a * Math.PI);
        var rr = k % 2 ? 2.4 : 3.6;
        out += '<circle cx="' + pt[0].toFixed(1) + '" cy="' + pt[1].toFixed(1) + '" r="' + rr + '" fill="' + grad + '" opacity=".85"/>';
        out += '<circle cx="' + pt[0].toFixed(1) + '" cy="' + pt[1].toFixed(1) + '" r="' + (rr + 4) + '" fill="' + grad + '" opacity=".14"/>';
      });
    });
    svg.innerHTML = out;
  }

  // Đẩy điểm ra khỏi vùng chữ bằng một "siêu elip" mềm (không có góc gãy).
  function keepOut(x, y, hw, hh) {
    var a = G.kx * G.koX + hw * 0.85 + 6;
    var b = G.ky + hh * 0.85 + 6;
    var nx = x / a, ny = y / b;
    var n4 = nx * nx * nx * nx + ny * ny * ny * ny;
    if (n4 < 1e-8) return [x, y];
    var n = Math.sqrt(Math.sqrt(n4));
    var gN = Math.pow(Math.pow(n, 8) + 1, 1 / 8);
    var f = gN / n;
    return [x * f, y * f];
  }

  function bandOf(n) { return n < 0.22 ? 2 : (n < 0.4 ? 1 : 0); }
  function bandFor(n, prev) {
    var up = bandOf(n + 0.03), dn = bandOf(n - 0.03);
    if (prev >= up && prev <= dn) return prev;   // trong vùng trễ: giữ nguyên
    return bandOf(n);
  }

  function introEnd() {
    return (introBase === null || !G) ? Infinity : introBase + (G.count - 1) * INTRO_STAGGER + INTRO_DUR;
  }

  /* ---------- Đặt một khung ---------- */
  function place(f, t) {
    var ring = G.rings[f.ring], D = G.depth;
    var still = reduced && f.st;
    // Part 7: on a tall screen the photos keep their two bands (above and below the words) and only sway; a full ring would have to pass over the text.
    var held = !still && G.tall && f.st;
    var theta, rad = 1, bump = 0, spin = 0, nFix = null, kR = 1, exU = -1, exE = 0;
    var ex = f.exc;
    if (still || held) {
      theta = f.st[0] * DEG; nFix = f.st[1]; kR = f.st[2];
      ex = null;
    } else {
      var sPar = angleOf(f, t);
      if (ex) {
        // Đường đi của "con rắn": cả đàn chạy chung một đường — chạy trên quỹ đạo chính tới điểm rẽ,
        // chui vào giữa (phía sau chữ), rồi ra lại quỹ đạo. Khung sau đi đúng vệt của khung đầu.
        var sn = f.sn, phd = ex.phiDep + sn.off;
        var u = (sPar - phd) / ex.L;
        if (u >= 1) {
          sPar += ex.delta - ex.L;
        } else if (u > 0) {
          sPar = phd + ex.delta * smoother(u);
          bump = Math.sin(Math.PI * u);
          spin = bump * 9 * f.spinDir;
          exU = u;
          exE = easeIO(u, sn.p);
        }
      }
      theta = warp(ring, sPar);
    }
    var ct = Math.cos(theta), st = Math.sin(theta);
    var d = ex ? lerp(st, 0.3, bump) : st;   // độ sâu: -1 = phía sau, 1 = phía trước
    var n = nFix !== null ? nFix : (d + 1) / 2;
    var s = lerp(D.sMin, D.sMax, n);
    var o = lerp(D.oMin, 1, clamp(n * 1.7, 0, 1));

    var p = shape(ring, theta);
    var q = toLocal(ring, p[0] * f.rj * kR, p[1] * f.rj * kR);
    var x = q[0], y = q[1];
    if (!still) {
      x += Math.sin(t * 0.55 + f.seed * 6.283) * G.bob;
      y += Math.sin(t * 0.83 + f.seed * 9.1) * G.bob * 1.3;
      if (held) x += Math.sin(t * 0.3 + f.seed * 7.1) * 16;   // a slow sideways sway along the band
    }
    var hw = f.w * s * 0.5, hh = f.h * s * 0.5;
    var ko;
    if (exU >= 0) {
      // đoạn chui vào giữa: mọi khung đi theo đúng một đường cong mượt (vệt của khung đầu), nối liền với vòng ở hai đầu
      var B = f.sn.B, a0 = B[0], a1 = B[3];
      var m0 = keepOut(a0[0], a0[1], hw, hh), m1 = keepOut(a1[0], a1[1], hw, hh);
      var w0 = 1 - smoother(exU), w1 = smoother(exU), q3 = exE, v = 1 - q3;
      var bx = v * v * v * B[0][0] + 3 * v * v * q3 * B[1][0] + 3 * v * q3 * q3 * B[2][0] + q3 * q3 * q3 * B[3][0];
      var by = v * v * v * B[0][1] + 3 * v * v * q3 * B[1][1] + 3 * v * q3 * q3 * B[2][1] + q3 * q3 * q3 * B[3][1];
      ko = [bx + (m0[0] - B[0][0]) * w0 + (m1[0] - B[3][0]) * w1, by + (m0[1] - B[0][1]) * w0 + (m1[1] - B[3][1]) * w1];
    } else {
      ko = keepOut(x, y, hw, hh);
    }
    var X = G.cx + ko[0] * rad, Y = G.cy + ko[1] * rad;
    X = clamp(X, hw * 0.75, G.W - hw * 0.75);   // luôn thấy ít nhất ~85% khung
    if (G.tall) Y = clamp(Y, G.yMin + hh, Math.max(G.yMin + hh, G.yMax - hh));

    var rz = f.tilt + (still ? 0 : Math.sin(t * 0.47 + f.seed * 5) * 3) + spin;
    var rY = -ct * 14 * (1 - bump), rX = st * 7 * (1 - bump);

    var k = (introSkipped || still) ? 1 : (introBase === null ? -1 : (t - introBase - f.i * INTRO_STAGGER) / INTRO_DUR);
    if (k < 1) {
      if (k <= 0) {
        o = 0; s = 0.22;   // waits where it will stay; nothing flies across the words
      } else {
        var e = easeOutCubic(k);
        // grows and turns into place from its own spot on the ring
        s = lerp(0.22, s, easeOutBack(k));
        o = o * clamp(k * 2.4, 0, 1);
        rz += (1 - e) * 30 * f.spinDir;
        rY *= e; rX *= e;
      }
    }
    // A photo never crosses the words or buttons: it fades out as it nears them and is gone before they touch.
    if (G.text && G.text.length) {
      var fm = k < 1 ? 0.71 : 0.6;   // half the diagonal while it still turns into place (up to 30°), a little more than half its side once it rests (tilt ≤ 13°)
      var fhw = f.w * s * fm + 3, fhh = f.h * s * fm + 3, gap = Infinity;
      for (var ti = 0; ti < G.text.length; ti++) {
        var tr = G.text[ti];
        var gx = Math.max(tr[0] - (X + fhw), (X - fhw) - tr[2], 0), gy = Math.max(tr[1] - (Y + fhh), (Y - fhh) - tr[3], 0);
        gap = Math.min(gap, Math.sqrt(gx * gx + gy * gy));
      }
      o *= smoothstep(8, 30, gap);
    }
    var band = bandFor(n, f.band), morph = null;
    // Giữ khung đứng nguyên chỗ trên màn hình khi Hero cuộn đi (bù quãng cuộn), rồi mới bay xuống ô ảnh:
    // điểm xuất phát không bị kéo trôi lên nên đường bay không chững lại khi phần Giới thiệu dừng (sticky).
    if (!reduced && flight) Y += SY;   // part 7: only the old scroll flight needed the photos held in place; now they scroll away with the hero
    // Chuyển cảnh: khung rời quỹ đạo, bay xuống và nằm đúng vào ô ảnh của phần Giới thiệu
    if (P > 0 && !reduced) {
      var idx = frames.indexOf(f), si = slotOf[idx], sl = si >= 0 ? SLOTS[si] : null;
      var q = clamp((P - (si >= 0 ? si : 0) * 0.08) / 0.84, 0, 1), e2 = easeInOutSine(q);
      if (sl && e2 > 0) {
        // cung lệch ngang luôn phồng ra phía mép ngoài của ô ảnh (xa cột chữ) để khung đang bay không che đoạn giới thiệu
        var arcK = Math.sin(Math.PI * e2) * (G.mobile ? 24 : 60) * (sl.x < G.W / 2 ? -1 : 1);
        var nx = lerp(X, sl.x, e2) + arcK, ny = lerp(Y, sl.y, e2);
        // đổi dần hình dạng khung (vuông -> dọc / ngang / vuông) thay vì phóng to, để viền và góc bo không bị méo
        morph = [lerp(f.w * s, sl.w, e2), lerp(f.h * s, sl.h, e2)];
        X = nx; Y = ny; s = 1; o = lerp(o, 1, e2);
        rz = lerp(rz, sl.rot, e2); rY *= (1 - e2); rX *= (1 - e2);
        if (e2 > 0.35) band = 0;
        n = Math.max(n, e2);           // bay lên lớp trên cùng khi đang hạ cánh
        if (P >= 1) o = 0;             // đã hạ cánh: ô ảnh tĩnh thay thế (trùng khít)
      } else if (!sl) {
        o *= 1 - clamp(P * 2.5, 0, 1); s *= 1 - 0.3 * clamp(P * 2.5, 0, 1);
      }
    }

    var fw = f.w, fh = f.h;
    if (morph) {
      fw = morph[0]; fh = morph[1];
      var mk = fw.toFixed(1) + 'x' + fh.toFixed(1);
      if (mk !== f.mk) {
        f.el.style.setProperty('--fw', fw.toFixed(1) + 'px');
        f.el.style.setProperty('--h', fh.toFixed(1) + 'px');
        f.el.style.setProperty('--w', Math.min(fw, fh).toFixed(1) + 'px');
        f.mk = mk;
      }
    } else if (f.mk) {
      f.el.style.removeProperty('--fw');
      f.el.style.setProperty('--w', f.w + 'px');
      f.el.style.setProperty('--h', f.h + 'px');
      f.mk = null;
    }
    var tf = 'translate3d(' + (X - fw / 2).toFixed(2) + 'px,' + (Y - fh / 2).toFixed(2) + 'px,0) perspective(900px) rotateY(' +
      rY.toFixed(2) + 'deg) rotateX(' + rX.toFixed(2) + 'deg) rotate(' + rz.toFixed(2) + 'deg) scale(' + s.toFixed(4) + ')';
    if (tf !== f.lastT) { f.el.style.transform = tf; f.lastT = tf; }
    var oR = Math.round(o * 1000) / 1000;
    if (oR !== f.lastO) { f.el.style.opacity = oR; f.lastO = oR; }
    var z = 1 + Math.round(n * 20);
    if (z !== f.z) { f.el.style.zIndex = z; f.z = z; }
    if (band !== f.band) {
      f.el.classList.toggle('is-mid', band === 1);
      f.el.classList.toggle('is-far', band === 2);
      f.band = band;
    }
    var crossing = !!ex && bump > 0.3;
    if (crossing !== f.crossing) { f.el.classList.toggle('is-crossing', crossing); f.crossing = crossing; }
  }

  // Đốm sáng chạy dọc vòng chính (sáng hơn ở phía trước)
  function placeComet(t) {
    var rg = G.rings[0];
    var th = reduced ? 205 * DEG : warp(rg, 0.9 + t * COMET_SPEED);
    var pt = ringPoint(rg, th);
    var tf = 'translate3d(' + pt[0].toFixed(2) + 'px,' + pt[1].toFixed(2) + 'px,0)';
    if (tf !== cometLastT) { comet.style.transform = tf; cometLastT = tf; }
    var o = Math.round((0.45 + 0.4 * Math.sin(th)) * 100) / 100;
    if (o !== cometLastO) { comet.style.opacity = o; cometLastO = o; }
  }

  function render(t) {
    if (!G) return;
    P = smoothP();
    SY = reduced ? 0 : window.scrollY;
    if (!running || !inView) sync();
    if (P > 0) trackSlots();
    if (flight) about.classList.toggle('is-landed', P >= 1);
    hero.querySelector('.ho__orbits').style.opacity = (1 - P).toFixed(3);
    for (var i = 0; i < frames.length; i++) if (frames[i].active) place(frames[i], t);
    placeComet(t);
  }

  /* ---------- Thỉnh thoảng một khung lướt ngang qua chữ ---------- */
  // Ứng viên: khung đang ở mép trái (đang đi lên); ưu tiên khung lớn để dễ thấy khi lướt qua chữ.
  function pickExcursionFrame(t) {
    var best = null, bestScore = -Infinity;
    frames.forEach(function (f) {
      if (!f.active) return;
      var dd = Math.abs(mod(angleOf(f, t), TAU) - Math.PI);
      if (dd > 0.9) return;
      var score = f.spec.size - dd * 0.35;
      if (score > bestScore) { bestScore = score; best = f; }
    });
    return best;
  }
  // Chọn điểm nhập lại quỹ đạo nằm giữa khoảng trống lớn nhất phía đối diện.
  function chooseDelta(f, t) {
    var th = angleOf(f, t);
    var others = frames.filter(function (o) { return o !== f && o.active; })
      .map(function (o) { return angleOf(o, t); });
    var best = Math.PI, bestScore = -Infinity;
    for (var dd = -0.6; dd <= 0.6001; dd += 0.05) {
      var target = th + Math.PI + dd, m = Infinity;
      others.forEach(function (a) { m = Math.min(m, angDist(target, a)); });
      var score = m - Math.abs(dd) * 0.08;
      if (score > bestScore) { bestScore = score; best = Math.PI + dd; }
    }
    return best;
  }
  // "Con rắn": khung đầu chui vào giữa; các khung sau tiếp tục chạy trên quỹ đạo chính, nhờ quán tính tăng tốc dần
  // tới đúng điểm rẽ rồi đi theo đúng vệt đó. Cuối đợt mọi khung về lại đúng chỗ vốn có của nó trên vòng nên đội hình không lệch.
  function envInt(c, tau) {
    if (tau <= 0) return 0;
    if (tau < c.R1) { var x = tau / c.R1; return c.R1 * (x * x * x - x * x * x * x / 2); }
    var I = c.R1 / 2;
    if (tau < c.R1 + c.P) return I + (tau - c.R1);
    I += c.P;
    var y = Math.min(1, (tau - c.R1 - c.P) / c.R2);
    return I + c.R2 * (y - (y * y * y - y * y * y * y / 2));
  }
  function localAt(f, sp) {
    var ring = G.rings[f.ring], p = shape(ring, warp(ring, sp));
    return toLocal(ring, p[0] * f.rj, p[1] * f.rj);
  }
  // Làm mượt/đổi nhịp vào-ra của từng khung: p < 1 vào nhanh ra chậm, p > 1 vào chậm ra nhanh (vẫn 0→1, đơn điệu).
  function easeIO(u, p) { var a = Math.pow(u, p), b = Math.pow(1 - u, p); return a / (a + b); }
  function startSnake(t) {
    var wr = G.speed, S = SNAKE;
    var act = frames.filter(function (f) { return f.active; });
    var lead = frames[2].active ? frames[2] : act[0];
    var la = angleOf(lead, t);
    var members = act.map(function (f) { return { f: f, d: mod(la - angleOf(f, t), TAU) }; })
      .sort(function (x, y) { return x.d - y.d; }).slice(0, Math.min(act.length, G.mobile ? S.K_MOBILE : S.K));
    var dmax = members[members.length - 1].d;
    var V = S.V, num = S.PRE + S.OFF + S.L + S.MARGIN + dmax + (V - wr) * S.R1 / 2;
    var P = Math.max(0, num / V - S.R1);
    var E = (V - wr) * (P + S.R1 / 2 + S.R2 / 2);
    conv = { t0: t, V: V, R1: S.R1, R2: S.R2, P: P, L: S.L, phiDep: la + S.PRE, delta: S.L - E,
             total: S.R1 + P + S.R2, wr: wr,
             members: members.map(function (m) { return { f: m.f, p0: m.f.phase }; }) };
    // Mỗi khung có đường vào riêng, lệch nhau một chút (điểm rẽ, độ cong, độ cao, nhịp vào/ra) cho mượt và tự nhiên.
    conv.members.forEach(function (m, i) {
      var f = m.f, r1 = (Math.sin(i * 12.9898 + f.seed * 78.233) + 1) / 2, r2 = (Math.sin(i * 4.1414 + f.seed * 31.7) + 1) / 2;
      var off = (r1 - 0.5) * 2 * S.OFF;
      var phd = conv.phiDep + off;
      var P0 = localAt(f, phd), P3 = localAt(f, phd + conv.delta);
      var cy = -(P0[1] + P3[1]) / 6 - 10 + (r2 - 0.5) * 90, cx0 = P0[0] * 0.1 + (r1 - 0.5) * 120, cx3 = P3[0] * 0.1 + (r2 - 0.5) * 120;
      f.sn = { off: off, p: 0.8 + 0.5 * ((r1 + r2) / 2), B: [P0, [cx0, cy], [cx3, cy + (r1 - 0.5) * 50], P3] };
      f.exc = conv;
    });
    return true;
  }
  function updateExcursions(t) {
    if (conv) {
      var tau = t - conv.t0;
      if (tau >= conv.total) {
        conv.members.forEach(function (m) { m.f.phase = m.p0; m.f.exc = null; });   // đã về đúng chỗ vốn có trên vòng
        conv = null;
        nextExc = t + 9 + rand() * 4;
        settleUntil = t + 3;
      } else {
        var ex = (conv.V - conv.wr) * envInt(conv, tau);
        conv.members.forEach(function (m) { m.f.phase = m.p0 + ex; });
      }
    }
    if (!conv && t > introEnd() && t >= nextExc) {
      if (!startSnake(t)) nextExc = t + 0.4;
    }
  }

  // Đội hình luôn tự giãn đều. Khi có khung đang lướt qua chữ, chỗ nhập lại của nó được mở sẵn:
  // khung đó là "mốc" cố định tại vị trí đích, các khung còn lại dịch dần (không bao giờ lùi rõ rệt).
  function relax(t, dt) {
    var list = frames.filter(function (f) { return f.active; });
    var n = list.length;
    if (n < 2) return;
    var anch = conv ? conv.members.map(function (m) { return { f: m.f, delta: m.p0 - m.f.phase }; }) : [];
    var ex = anch.length > 0 || t < settleUntil;
    var cur = list.map(function (f) {
      var ea = null;
      for (var k = 0; k < anch.length; k++) if (anch[k].f === f) { ea = anch[k]; break; }
      return { f: f, a: !!ea, s: mod(f.phase + G.speed * t + (ea ? ea.delta : 0), TAU) };
    }).sort(function (a, b) { return a.s - b.s; });
    var step = TAU / n, base, jA = -1;
    cur.forEach(function (c, j) { if (c.a) jA = j; });
    if (jA >= 0) {
      base = cur[jA].s - jA * step;
    } else {
      var ref = cur[0].s, sum = 0;
      cur.forEach(function (c, j) { sum += wrapPi(c.s - j * step - ref); });
      base = ref + sum / n;
    }
    var lo = (ex ? 0.06 : 0.035) * dt, hi = (ex ? 0.14 : 0.035) * dt, gain = ex ? 1.2 : 0.3;
    cur.forEach(function (c, j) {
      if (c.a) return;
      var d = wrapPi(base + j * step - c.s);
      c.f.phase += clamp(d * gain * dt, -lo, hi);
    });
    // Chống chồng khung: hai khung kề nhau trên vòng không bao giờ được gần nhau hơn ~65% khoảng đều.
    var minGap = step * 0.65, push = 0.6 * dt;
    for (var j2 = 0; j2 < cur.length; j2++) {
      var A = cur[j2], B = cur[(j2 + 1) % cur.length];
      if (A === B) continue;
      var g = mod(B.s - A.s, TAU);
      if (g >= minGap) continue;
      var m = Math.min(push, (minGap - g) * 0.5);
      if (!A.a) A.f.phase -= m;
      if (!B.a) B.f.phase += m;
    }
  }

  /* ---------- Vòng lặp ---------- */
  function tick(now) {
    raf = 0;
    if (last === null) last = now;
    var dt = clamp((now - last) / 1000, 0, MAX_DT);
    last = now;
    simT += dt;
    if (introBase === null && readyAt !== null && simT >= readyAt + INTRO_FALLBACK) beginIntro(simT);
    updateExcursions(simT);
    render(simT);
    if (running) raf = requestAnimationFrame(tick);
  }
  function start() {
    if (running) return;
    running = true; last = null;
    raf = requestAnimationFrame(tick);
  }
  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }
  function sync() {
    // còn đang chuyển cảnh thì vòng quay chạy tiếp dù Hero đã ra khỏi màn hình, để khung không khựng giữa đường bay
    var shouldRun = !reduced && !userPaused && !document.hidden && (inView || (Pt > 0 && Pt < 1) || Ps !== Pt);
    if (shouldRun) start(); else stop();
    hero.classList.toggle('is-paused', userPaused);
  }

  /* ---------- Giảm chuyển động ---------- */
  function applyReduced() {
    reduced = mqReduce.matches;
    toggle.hidden = reduced;
    if (reduced) {
      stop();
      introSkipped = true;
      frames.forEach(function (f) { f.exc = null; });
      conv = null;
      render(simT);               // bố cục tĩnh chọn sẵn: khung nằm trên quỹ đạo, hai khung lớn hai bên tiêu đề
    } else {
      if (introSkipped) beginIntro(simT);   // bật lại chuyển động: không phát lại intro
      sync();
    }
  }

  /* ---------- Nút tạm dừng (WCAG 2.2.2) ---------- */
  on(toggle, 'click', function () {
    userPaused = !userPaused;
    toggle.setAttribute('aria-pressed', String(userPaused));
    toggleLabel.textContent = userPaused ? 'Tiếp tục chuyển động' : 'Tạm dừng chuyển động';
    sync();
  });

  on(document, 'visibilitychange', sync);
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      inView = entries[0].isIntersecting;
      sync();
    });
    io.observe(hero);
    disposers.push(function () { io.disconnect(); });   // PORT
  }

  var relayoutQueued = false, relayoutRaf = 0;
  function relayout() {
    if (destroyed || relayoutQueued) return;   // PORT: guard
    relayoutQueued = true;
    relayoutRaf = requestAnimationFrame(function () {
      relayoutQueued = false;
      layout();
      measureSlots();
      if (!running) render(simT);
    });
  }
  if ('ResizeObserver' in window) {
    var ro = new ResizeObserver(relayout);
    ro.observe(hero);
    disposers.push(function () { ro.disconnect(); });   // PORT
  } else on(window, 'resize', relayout);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayout);
  // Part 7: the second button swaps between a call link and a message button, so measure the words again when the content changes.
  if ('MutationObserver' in window) {
    var mo = new MutationObserver(relayout);
    mo.observe(content, { childList: true, subtree: true, characterData: true });
    disposers.push(function () { mo.disconnect(); });
  }

  if (mqReduce.addEventListener) on(mqReduce, 'change', applyReduced);
  else if (mqReduce.addListener) {
    mqReduce.addListener(applyReduced);
    disposers.push(function () { mqReduce.removeListener(applyReduced); });
  }

  layout();
  measureSlots();
  render(0);
  applyReduced();
  function applyStatic(on) {
    if (flight) { about.classList.toggle('is-static', on); pinWrap.classList.toggle('is-static', on); }
    measureSlots(); render(simT);
  }
  applyStatic(reduced);
  if (mqReduce.addEventListener) on(mqReduce, 'change', function () { applyStatic(mqReduce.matches); });   // PORT
  // Cuộn: vẽ lại ngay cả khi vòng lặp đang dừng (tạm dừng / Hero ra khỏi màn hình)
  var scrollQueued = false, scrollRaf = 0;
  on(window, 'scroll', function () {   // PORT
    if (destroyed || scrollQueued) return; scrollQueued = true;   // PORT: guard
    scrollRaf = requestAnimationFrame(function () { scrollQueued = false; if (!running && !glideRaf) glide(); });
  }, { passive: true });
  if ('ResizeObserver' in window) {
    var roAbout = new ResizeObserver(relayout);
    if (flight) roAbout.observe(about);
    disposers.push(function () { roAbout.disconnect(); });   // PORT
  }
  on(window, 'resize', relayout);   // đổi chiều cao cửa sổ (thanh địa chỉ điện thoại) làm đổi nhịp đứng yên

  // PORT: teardown — stop the loop, drop every listener/observer/timer, remove DOM the module created,
  // so a remount (route change back to "/", React StrictMode) starts clean.
  return function destroy() {
    destroyed = true;
    stop();
    if (relayoutRaf) cancelAnimationFrame(relayoutRaf);
    if (scrollRaf) cancelAnimationFrame(scrollRaf);
    if (glideRaf) cancelAnimationFrame(glideRaf);
    disposers.forEach(function (d) { d(); });
    disposers.length = 0;
    layer.textContent = '';
    svg.textContent = '';
    hero.classList.remove('is-ready', 'is-paused');
    toggle.setAttribute('aria-pressed', 'false');
    toggleLabel.textContent = 'Tạm dừng chuyển động';
    hero.querySelector('.ho__orbits').style.opacity = '';
    if (flight) { about.classList.remove('is-landed', 'is-static'); pinWrap.classList.remove('is-static'); }
  };
}
