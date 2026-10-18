// Some touch compositors keep native scrolling in physical axes after a 90° CSS rotation.
// Drag scrollable menu panels in logical coordinates; taps, wheel and native landscape stay unchanged.
import { viewport, gamePoint } from '../core/surface.js';
import { on } from '../core/events.js';

export function createLandscapeScroll(shell) {
  let pan = null, suppressClick = null;
  const clear = () => {
    const p = pan; pan = null;
    if (p) try { if (p.el.hasPointerCapture(p.id)) p.el.releasePointerCapture(p.id); } catch { /* detached */ }
  };
  shell.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'touch') return;
    suppressClick = null;
    if (!viewport.rotated || pan) return;
    for (let el = e.target; el && el !== shell; el = el.parentElement) {
      if (el.scrollHeight <= el.clientHeight + 1 || !/^(auto|scroll)$/.test(getComputedStyle(el).overflowY)) continue;
      const p = gamePoint(e.clientX, e.clientY);
      pan = { id: e.pointerId, el, x: p.x, y: p.y, lastY: p.y, dragging: false };
      break;
    }
  });
  shell.addEventListener('pointermove', (e) => {
    if (pan?.id !== e.pointerId) return;
    const p = gamePoint(e.clientX, e.clientY);
    if (!pan.dragging) {
      if (Math.abs(p.y - pan.y) < 8 || Math.abs(p.y - pan.y) < Math.abs(p.x - pan.x)) return;
      pan.dragging = true;
      try { pan.el.setPointerCapture(e.pointerId); } catch { /* synthetic pointer */ }
    }
    pan.el.scrollTop -= p.y - pan.lastY; pan.lastY = p.y;
    e.preventDefault();
  });
  shell.addEventListener('pointerup', (e) => {
    if (pan?.id !== e.pointerId) return;
    if (pan.dragging) { suppressClick = pan.el; e.preventDefault(); }
    clear();
  });
  shell.addEventListener('pointercancel', (e) => { if (pan?.id === e.pointerId) clear(); });
  shell.addEventListener('lostpointercapture', (e) => {
    if (pan?.id === e.pointerId && e.target === pan.el && !pan.el.hasPointerCapture(e.pointerId)) clear();
  });
  shell.addEventListener('click', (e) => {
    if (!suppressClick || !suppressClick.contains(e.target)) return;
    suppressClick = null; e.preventDefault(); e.stopImmediatePropagation();
  }, true);
  const reset = () => { clear(); suppressClick = null; };
  on('viewport', reset); on('flow', reset);
  addEventListener('blur', reset); addEventListener('pagehide', reset);
  document.addEventListener('visibilitychange', () => { if (document.hidden) reset(); });
}
