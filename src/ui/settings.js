import { DEVICE_MODES, deviceMode, setDeviceMode } from '../core/device-mode.js';
import { viewport } from '../core/viewport.js';
import { on } from '../core/events.js';
import { QUALITY } from '../post/quality.js';
import { createNav } from './menu.js';

export function createSettings({ post, resetInput }) {
  const el = document.createElement('section');
  el.id = 'settings'; el.hidden = true; el.dir = 'rtl';
  el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-labelledby', 'settings-title');
  el.innerHTML = `<div class="settings-card">
    <h2 id="settings-title">تنظیمات</h2>
    <label for="device-mode">حالت نمایش و کنترل</label>
    <select id="device-mode" aria-describedby="device-status device-help">${Object.entries(DEVICE_MODES).map(([id, label]) => `<option value="${id}">${label}</option>`).join('')}</select>
    <p id="device-status" role="status"></p>
    <p id="device-help">برای بازگشت به تشخیص دستگاه، «خودکار» را انتخاب کنید. در حالت دسکتاپ روی گوشی، دکمهٔ توقف و تنظیمات همچنان با لمس در دسترس است.</p>
    <label for="graphics-quality">کیفیت گرافیک</label>
    <select id="graphics-quality" aria-describedby="quality-status quality-help"><option value="auto">خودکار (پیشنهادی)</option>${Object.entries(QUALITY).map(([id, q]) => `<option value="${id}">${q.label}</option>`).join('')}</select>
    <p id="quality-status" role="status"></p>
    <p id="quality-help">در حالت خودکار، مقیاس رندر با زمان فریم سازگار می‌شود. کیفیت دستی، افکت‌ها و مقیاس رندر ثابت دارد. تغییر حالت دستگاه، کیفیت دستی را تغییر نمی‌دهد.</p>
    <p class="settings-pad-help">صفحه‌کلید: Tab جابه‌جایی، جهت‌ها تغییر گزینه، Escape بازگشت · دسته: جهت‌ها جابه‌جایی، A تغییر، B بازگشت</p>
    <button type="button" class="settings-back">بازگشت</button>
  </div>`;
  document.getElementById('game-shell').append(el);
  const device = el.querySelector('#device-mode'), quality = el.querySelector('#graphics-quality'), back = el.querySelector('button');
  const controls = [device, quality, back];
  let origin, done, background = [];
  function refresh() {
    device.value = deviceMode(); quality.value = post.quality.choice;
    el.querySelector('#device-status').textContent = `حالت فعال: ${viewport.touch ? 'موبایل / تبلت' : 'دسکتاپ'} · قابلیت لمس دستگاه: ${viewport.touchCapable ? 'دارد' : 'ندارد'}`;
    const q = post.quality;
    el.querySelector('#quality-status').textContent = `${q.adaptive ? 'خودکار — ' : 'کیفیت فعال: '}${QUALITY[q.id].label}`
      + (q.override !== null ? ' · اولویت با پارامتر آزمایشی نشانی است؛ انتخاب شما برای اجرای بدون این پارامتر ذخیره می‌شود.' : '');
  }
  device.addEventListener('change', () => { resetInput(); setDeviceMode(device.value); refresh(); });
  quality.addEventListener('change', () => { resetInput(); post.setQuality(quality.value); refresh(); });
  on('viewport', refresh);
  function close() {
    if (el.hidden) return;
    nav.stop(); el.hidden = true;
    for (const [node, inert] of background) node.inert = inert;
    background = []; resetInput();
    const callback = done; done = null; callback?.();
    origin?.focus({ preventScroll: true });
  }
  back.addEventListener('click', close);
  // A browser may consume the compatibility click after a rotated drag / viewport change.
  // Close only on a stationary touch release; dragging to scroll must never activate Back.
  let backTouch = null;
  back.addEventListener('pointerdown', e => { if (e.pointerType === 'touch') backTouch = { id: e.pointerId, x: e.clientX, y: e.clientY }; });
  back.addEventListener('pointercancel', () => { backTouch = null; });
  back.addEventListener('pointerup', e => {
    const tap = backTouch; backTouch = null;
    if (tap?.id === e.pointerId && Math.hypot(e.clientX - tap.x, e.clientY - tap.y) < 8) { e.preventDefault(); close(); }
  });
  const move = delta => {
    const index = controls.indexOf(document.activeElement);
    controls[(index + delta + controls.length) % controls.length].focus();
  };
  const nav = createNav({ move, back: close, ok() {
    const control = document.activeElement;
    if (control === back) return close();
    if (control === device || control === quality) {
      control.selectedIndex = (control.selectedIndex + 1) % control.options.length;
      control.dispatchEvent(new Event('change', { bubbles: true }));
    }
  } });
  // Capture before window menu/game handlers; native selects keep their default key behavior.
  addEventListener('keydown', e => {
    if (el.hidden) return;
    if (e.code === 'Escape' || e.code === 'Backspace') { e.preventDefault(); e.stopImmediatePropagation(); close(); return; }
    if (e.code === 'Tab') { e.preventDefault(); move(e.shiftKey ? -1 : 1); }
    e.stopImmediatePropagation();
  }, true);
  // Let the shell's logical scroll adapter see new gestures (and clear drag-click suppression).
  // Gameplay input stays gated by the Title/Pause flow while this panel is open.
  return {
    get isOpen() { return !el.hidden; }, refresh,
    open(from, onClose) {
      if (!el.hidden) return;
      origin = from || document.activeElement; done = onClose; resetInput(); refresh();
      background = [...el.parentElement.children].filter(node => node !== el).map(node => [node, node.inert]);
      for (const [node] of background) node.inert = true;
      el.hidden = false; device.focus({ preventScroll: true }); nav.start();
    }, close,
  };
}
