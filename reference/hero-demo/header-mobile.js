// Copied from shared/requirements@196f2ba; shared-header integration hooks only.
document.addEventListener('DOMContentLoaded', function () {
(function () {
  var btn = document.getElementById('btnMobileMenu'), menu = document.getElementById('mobileMenu');
  var q = new URLSearchParams(location.search);
  if (q.get('user') === '1') document.getElementById('btnToggleAuth').click();
  /* Tên hiện trên header: 1–3 từ giữ đủ ("Nguyễn Văn An"); từ 4 từ trở lên chỉ lấy 2 từ cuối ("Nguyễn Thị Phương Anh" → "Phương Anh"). Tên đầy đủ nằm ở title và aria-label. */
  function shortName(full) { var w = full.trim().split(/\s+/); return w.length <= 3 ? w.join(' ') : w.slice(-2).join(' '); }
  var nm = q.get('name') || 'Khách Demo';
  var btnU = document.querySelector('.user-btn'), shown = shortName(nm);
  document.querySelector('.user-btn__name').textContent = shown;
  document.querySelector('.user-btn__ava').textContent = nm.trim().split(/\s+/).pop().charAt(0).toUpperCase();
  btnU.title = nm; btnU.setAttribute('aria-label', 'Tài khoản của ' + nm);
  document.querySelector('.user-dropdown-name').textContent = nm;
  function setOpen(o) { menu.hidden = !o; btn.setAttribute('aria-expanded', String(o)); btn.setAttribute('aria-label', o ? 'Đóng danh mục điều hướng' : 'Mở danh mục điều hướng'); }
  btn.addEventListener('click', function () { setOpen(menu.hidden); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) { setOpen(false); btn.focus(); } });
  document.addEventListener('click', function (e) { if (!menu.hidden && !menu.contains(e.target) && !btn.contains(e.target)) setOpen(false); });
  menu.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
  document.addEventListener('header:close', function () { setOpen(false); });
  document.getElementById('btnToggleAuth').addEventListener('click', function () { setOpen(false); });
  document.getElementById('btnUserProfile').addEventListener('click', function () { setOpen(false); });
  window.addEventListener('resize', function () { if (getComputedStyle(btn).display === 'none') setOpen(false); });
  if (q.get('open') === '1' || q.get('drawer') === 'open') setOpen(true);
})();
});
