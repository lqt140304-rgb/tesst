import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const read = (p: string) => readFileSync(fileURLToPath(new URL(p, import.meta.url)), 'utf8').split('\n').map((l) => l.trimEnd());

/** The orbit simulator is vendored, port-faithful (owner rule): only the documented wiring lines may differ. */
describe('hero port fidelity', () => {
  it('every original line is kept except the documented wiring lines', () => {
    const original = read('../../../../reference/hero-demo/hero-orbit.js');
    const port = new Set(read('./hero-orbit.js'));
    const missing = original.filter((l) => l.trim() && !port.has(l)).map((l) => l.trim());
    expect(missing).toEqual([
      '(function () {',
      "var hero = document.getElementById('hero-main');",
      "cta.addEventListener('animationstart', function (e) {",
      "cta.addEventListener('animationend', function (e) {",
      'if (readyAt !== null) return;',
      'new Promise(function (r) { setTimeout(r, FONT_WAIT_MS); })',
      // Part 2 (R34, 20/10/2026): the pinned Giới thiệu is gone, so its two toggles run behind the `flight` guard
      "about.classList.toggle('is-landed', P >= 1);",
      "toggle.addEventListener('click', function () {",
      "document.addEventListener('visibilitychange', sync);",
      'new IntersectionObserver(function (entries) {',
      '}).observe(hero);',
      'var relayoutQueued = false;',
      'if (relayoutQueued) return;',
      'requestAnimationFrame(function () {',
      "if ('ResizeObserver' in window) new ResizeObserver(relayout).observe(hero);",
      "else window.addEventListener('resize', relayout);",
      "if (mqReduce.addEventListener) mqReduce.addEventListener('change', applyReduced);",
      'else if (mqReduce.addListener) mqReduce.addListener(applyReduced);',
      "about.classList.toggle('is-static', on); pinWrap.classList.toggle('is-static', on);",
      // v3 (owner-approved 17/10): Hero → Giới thiệu transition wiring
      "if (mqReduce.addEventListener) mqReduce.addEventListener('change', function () { applyStatic(mqReduce.matches); });",
      'var scrollQueued = false;',
      "window.addEventListener('scroll', function () {",
      'if (scrollQueued) return; scrollQueued = true;',
      'requestAnimationFrame(function () { scrollQueued = false; if (!running && !glideRaf) glide(); });',
      "if ('ResizeObserver' in window) new ResizeObserver(relayout).observe(about);",
      "window.addEventListener('resize', relayout);   // đổi chiều cao cửa sổ (thanh địa chỉ điện thoại) làm đổi nhịp đứng yên",
      '})();',
    ]);
  });
  it('the stylesheet is the vendored copy', () => {
    expect(read('./hero-orbit.css').join('\n')).toBe(read('../../../../reference/probe/src/features/public/hero/hero-orbit.css').join('\n'));
  });
});
