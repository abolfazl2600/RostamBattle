import { viewport } from '../core/viewport.js';
import { on } from '../core/events.js';

export function joystickVector(dx, dy, radius, dead = 0.12) {
  const distance = Math.hypot(dx, dy), length = Math.min(1, distance / radius);
  const magnitude = Math.max(0, (length - dead) / (1 - dead));
  return distance ? { x: dx / distance * magnitude, y: -dy / distance * magnitude,
    knobX: dx / distance * length * radius, knobY: dy / distance * length * radius } : { x: 0, y: 0, knobX: 0, knobY: 0 };
}

export function createTouchControls(touch, { isActive }) {
  const root = document.createElement('div'); root.id = 'touch-controls'; root.hidden = true;
  root.innerHTML = '<div class="touch-stick" role="group" aria-label="جوی‌استیک حرکت"><i></i><span>حرکت</span></div>';
  document.body.append(root);
  const stick = root.querySelector('.touch-stick'), knob = stick.querySelector('i');
  let center = null;
  const clearStick = () => { center = null; knob.style.transform = 'translate(0px, 0px)'; stick.classList.remove('held'); };
  touch.onReset(clearStick);
  function move(e) {
    if (touch.pointers.get(e.pointerId)?.role !== 'move' || !center) return;
    const v = joystickVector(e.clientX - center.x, e.clientY - center.y, center.r);
    touch.move(e.pointerId, v.x, v.y); knob.style.transform = `translate(${v.knobX}px, ${v.knobY}px)`;
    e.preventDefault();
  }
  stick.addEventListener('pointerdown', (e) => {
    if (!touch.claim(e, 'move')) return;
    const b = stick.getBoundingClientRect(); center = { x: b.x + b.width / 2, y: b.y + b.height / 2, r: b.width * 0.35 };
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
  }
  on('viewport', update);
  return { update, root };
}
