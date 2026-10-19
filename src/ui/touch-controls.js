import { viewport, gamePoint, gameRect } from '../core/viewport.js';
import { on } from '../core/events.js';
import { TOUCH_ACTIONS, touchButtonMarkup } from './touch-layout.js';

export function joystickVector(dx, dy, radius, dead = 0.12) {
  const distance = Math.hypot(dx, dy), length = Math.min(1, distance / radius);
  const magnitude = Math.max(0, (length - dead) / (1 - dead));
  return distance ? { x: dx / distance * magnitude, y: -dy / distance * magnitude,
    knobX: dx / distance * length * radius, knobY: dy / distance * length * radius } : { x: 0, y: 0, knobX: 0, knobY: 0 };
}

export function createTouchControls(touch, { isActive, pause, musouReady = () => false }) {
  const root = document.createElement('div'); root.id = 'touch-controls'; root.hidden = true;
  root.innerHTML = '<div class="touch-stick" role="group" aria-label="جوی‌استیک حرکت"><i></i></div>';
  root.insertAdjacentHTML('beforeend', `<div class="touch-actions">${TOUCH_ACTIONS.map(touchButtonMarkup).join('')}</div>`);
  root.insertAdjacentHTML('beforeend', '<button class="touch-pause" type="button" aria-label="توقف بازی"><span class="touch-pause-icon" aria-hidden="true"><i></i><i></i></span></button>');
  root.querySelector('.touch-pause').addEventListener('pointerdown', (e) => { e.stopPropagation(); });
  root.querySelector('.touch-pause').addEventListener('click', (e) => { e.stopPropagation(); touch.reset(); pause(); });
  document.getElementById('game-shell').append(root);
  const buttons = [...root.querySelectorAll('[data-action]')];
  const paintButtons = () => {
    const heldActions = new Set();
    for (const pointer of touch.pointers.values()) if (pointer.action) heldActions.add(pointer.action);
    for (const b of buttons) {
      const held = heldActions.has(b.dataset.action);
      if (b.classList.contains('held') === held) continue;
      b.classList.toggle('held', held);
      b.setAttribute('aria-pressed', String(held));
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
  const musou = root.querySelector('[data-action="musou"]');
  let lastReady = null;
  function update() {
    const active = isActive();
    if (!active && !root.hidden) touch.reset();
    if (root.hidden === active) root.hidden = !active;
    const ready = active && musouReady();
    if (ready !== lastReady) {
      lastReady = ready;
      musou.classList.toggle('ready', ready);
      musou.setAttribute('aria-disabled', String(!ready));
      musou.title = ready ? 'موسو آماده است' : 'موسو: پرشدن نوار طلایی و قرارگرفتن روی زمین لازم است';
    }
  }
  on('viewport', update);
  return { update, root };
}
