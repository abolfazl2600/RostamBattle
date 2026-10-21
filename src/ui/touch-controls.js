import { viewport, gamePoint, gameRect } from '../core/viewport.js';
import { on } from '../core/events.js';
import { TOUCH_ACTIONS } from './touch-layout.js';

export function joystickVector(dx, dy, radius, dead = 0.12) {
  const distance = Math.hypot(dx, dy), length = Math.min(1, distance / radius);
  const magnitude = Math.max(0, (length - dead) / (1 - dead));
  return distance ? { x: dx / distance * magnitude, y: -dy / distance * magnitude,
    knobX: dx / distance * length * radius, knobY: dy / distance * length * radius } : { x: 0, y: 0, knobX: 0, knobY: 0 };
}

export function createTouchControls(touch, { isActive, pause, musouReady = () => false }) {
  const root = document.createElement('div'); root.id = 'touch-controls'; root.hidden = true;
  root.innerHTML = '<div class="touch-stick" role="group" aria-label="جوی‌استیک حرکت"><i></i><span>حرکت</span></div>';
  root.insertAdjacentHTML('beforeend', `<div class="touch-actions">${TOUCH_ACTIONS.map(({ id, label, column, row }) => `<button type="button" data-action="${id}" style="grid-column:${column};grid-row:${row}" aria-label="${label}" aria-pressed="false">${label}</button>`).join('')}</div>`);
  root.insertAdjacentHTML('beforeend', '<button class="touch-pause" type="button" aria-label="توقف بازی">توقف Ⅱ</button>');
  root.querySelector('.touch-pause').addEventListener('pointerdown', (e) => { e.stopPropagation(); });
  root.querySelector('.touch-pause').addEventListener('click', (e) => { e.stopPropagation(); touch.reset(); pause(); });
  document.getElementById('game-shell').append(root);
  const buttons = [...root.querySelectorAll('[data-action]')];
  const paintButtons = () => {
    for (const b of buttons) {
      const held = [...touch.pointers.values()].some((p) => p.action === b.dataset.action);
      b.classList.toggle('held', held); b.setAttribute('aria-pressed', String(held));
    }
  };
  touch.onReset(paintButtons);
  for (const b of buttons) {
    b.addEventListener('pointerdown', (e) => {
      if (b.dataset.action === 'musou' && !musouReady()) { e.preventDefault(); return; }
      if (touch.claim(e, 'action', b.dataset.action)) paintButtons();
    });
    for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) b.addEventListener(name, (e) => {
      touch.release(e.pointerId, name !== 'pointerup'); paintButtons();
      if (e.pointerType === 'touch') e.preventDefault();
    });
    // Actions are driven by pointer edges, never compatibility clicks.
    b.addEventListener('click', (e) => e.preventDefault());
  }
  // Only a gesture beginning on the canvas owns the camera; controls never bubble into it.
  const canvas = document.getElementById('c');
  canvas.addEventListener('pointerdown', (e) => { touch.claim(e, 'look'); });
  canvas.addEventListener('pointermove', (e) => {
    if (touch.pointers.get(e.pointerId)?.role !== 'look') return;
    touch.look(e); e.preventDefault();
  });
  for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) canvas.addEventListener(name, (e) => {
    if (touch.pointers.get(e.pointerId)?.role === 'look') touch.release(e.pointerId, name !== 'pointerup');
  });
  const stick = root.querySelector('.touch-stick'), knob = stick.querySelector('i');
  let center = null;
  const clearStick = () => { center = null; knob.style.transform = 'translate(0px, 0px)'; stick.classList.remove('held'); };
  touch.onReset(clearStick);
  function move(e) {
    if (touch.pointers.get(e.pointerId)?.role !== 'move' || !center) return;
    const p = gamePoint(e.clientX, e.clientY);
    const v = joystickVector(p.x - center.x, p.y - center.y, center.r);
    touch.move(e.pointerId, v.x, v.y); knob.style.transform = `translate(${v.knobX}px, ${v.knobY}px)`;
    e.preventDefault();
  }
  stick.addEventListener('pointerdown', (e) => {
    if (!touch.claim(e, 'move')) return;
    const b = gameRect(stick); center = { x: b.left + b.width / 2, y: b.top + b.height / 2, r: b.width * 0.35 };
    stick.classList.add('held'); move(e);
  });
  stick.addEventListener('pointermove', move);
  for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) stick.addEventListener(name, (e) => {
    if (touch.pointers.get(e.pointerId)?.role !== 'move') return;
    touch.release(e.pointerId, name !== 'pointerup'); clearStick();
  });
  function update() {
    const active = isActive();
    if (!active && !root.hidden) touch.reset();
    root.hidden = !active;
    const ready = musouReady(), musou = buttons.find((b) => b.dataset.action === 'musou');
    musou.classList.toggle('ready', ready); musou.setAttribute('aria-disabled', String(!ready));
    musou.title = ready ? 'یورش آماده است' : 'یورش: نوار طلایی باید پر باشد و شخصیت روی زمین قرار داشته باشد';
  }
  on('viewport', update);
  return { update, root };
}
