// Capability-based viewport state, shared by flow, input and mobile UI. No orientation lock required.
import { emit, on } from './events.js';
const coarse = matchMedia('(pointer: coarse)');
export const viewport = { touch: false, landscape: true, blocked: false, width: 1, height: 1 };
export function updateViewport() {
  const width = Math.max(1, Math.round(globalThis.visualViewport?.width || innerWidth));
  const height = Math.max(1, Math.round(globalThis.visualViewport?.height || innerHeight));
  const touch = coarse.matches || navigator.maxTouchPoints > 0;
  Object.assign(viewport, { width, height, touch, landscape: width >= height, blocked: touch && width < height });
  const root = document.documentElement;
  root.classList.toggle('touch-device', touch);
  root.classList.toggle('portrait-blocked', viewport.blocked);
  root.style.setProperty('--view-height', `${height}px`);
  document.getElementById('rotate-device').hidden = !viewport.blocked;
  emit('viewport', { ...viewport });
}
addEventListener('resize', updateViewport);
addEventListener('orientationchange', updateViewport);
globalThis.visualViewport?.addEventListener('resize', updateViewport);
coarse.addEventListener('change', updateViewport);
// A hidden screen stays inert while the rotate message covers it (including menus).
on('viewport', ({ blocked }) => {
  for (const el of document.querySelectorAll('#c, #hud, #menu, .scr')) el.inert = blocked;
});
updateViewport();
