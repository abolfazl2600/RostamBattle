// Pointer-owned touch source. UI adapters write here; only the fixed-step input sample consumes edges/look.
import { emit } from './events.js';
export const TOUCH_LOOK = { yaw: 0.004, pitch: 0.003, maxDelta: 0.3 };
export function createTouch(enabled = () => true) {
  const pointers = new Map(), latch = new Set(), resets = new Set();
  let mx = 0, my = 0, orbit = 0, tilt = 0, resetting = false;
  function claim(e, role, action = null) {
    if (e.pointerType !== 'touch' || !enabled() || pointers.has(e.pointerId)) return false;
    if ((role === 'move' || role === 'look') && [...pointers.values()].some((p) => p.role === role)) return false;
    const wasHeld = action && [...pointers.values()].some((p) => p.action === action);
    const p = { role, action, el: e.currentTarget, x: e.clientX, y: e.clientY };
    pointers.set(e.pointerId, p);
    try { p.el.setPointerCapture(e.pointerId); } catch { /* synthetic events / removed target */ }
    if (action && !wasHeld) latch.add(action);
    e.preventDefault(); e.stopPropagation(); return true;
  }
  function release(id, cancel = false) {
    const p = pointers.get(id); if (!p) return;
    pointers.delete(id);
    if (p.role === 'move') mx = my = 0;
    if (p.role === 'look' && cancel) orbit = tilt = 0;
    if (cancel && p.action) latch.delete(p.action);
    if (cancel && !resetting) emit('touch:cancel', {});
    try { if (p.el.hasPointerCapture(id)) p.el.releasePointerCapture(id); } catch { /* detached target */ }
  }
  function reset() {
    resetting = true;
    for (const id of [...pointers.keys()]) release(id, true);
    latch.clear(); mx = my = orbit = tilt = 0;
    for (const fn of resets) fn();
    resetting = false;
  }
  for (const type of ['blur', 'pagehide']) addEventListener(type, reset);
  document.addEventListener('visibilitychange', () => { if (document.hidden) reset(); });
  return {
    claim, release, reset, pointers,
    onReset(fn) { resets.add(fn); return () => resets.delete(fn); },
    move(id, x, y) { if (pointers.get(id)?.role === 'move') { mx = x; my = y; } },
    look(e) {
      const p = pointers.get(e.pointerId); if (p?.role !== 'look') return;
      orbit -= (e.clientX - p.x) * TOUCH_LOOK.yaw;
      tilt += (e.clientY - p.y) * TOUCH_LOOK.pitch;
      p.x = e.clientX; p.y = e.clientY;
    },
    sample() {
      if (!enabled()) reset();
      const held = {}, pressed = Object.fromEntries([...latch].map((a) => [a, true]));
      for (const p of pointers.values()) if (p.action) held[p.action] = true;
      const clamp = (v) => Math.max(-TOUCH_LOOK.maxDelta, Math.min(TOUCH_LOOK.maxDelta, v));
      const out = { mx, my, orbit: clamp(orbit), tilt: clamp(tilt), held, pressed };
      latch.clear(); orbit = tilt = 0; return out;
    },
  };
}
