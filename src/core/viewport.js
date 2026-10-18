// One logical landscape surface for rendering, DOM and pointer input.
import { deviceMode, mobileUI } from './device-mode.js';
import { emit, on } from './events.js';
import { viewport } from './surface.js';
export { viewport, gamePoint, gameRect } from './surface.js';
const coarse = matchMedia('(pointer: coarse)');
export function updateViewport() {
  const vv = globalThis.visualViewport;
  const physicalWidth = Math.max(1, Math.round(vv?.width || innerWidth));
  const physicalHeight = Math.max(1, Math.round(vv?.height || innerHeight));
  const touchCapable = coarse.matches || navigator.maxTouchPoints > 0;
  const touch = mobileUI(deviceMode(), touchCapable), rotated = touch && physicalWidth < physicalHeight;
  const width = rotated ? physicalHeight : physicalWidth, height = rotated ? physicalWidth : physicalHeight;
  const offsetX = vv?.offsetLeft || 0, offsetY = vv?.offsetTop || 0;
  Object.assign(viewport, { width, height, physicalWidth, physicalHeight, touch, touchCapable, deviceMode: deviceMode(), rotated,
    mode: rotated ? 'rotated-landscape' : 'native-landscape', offsetX, offsetY });
  const root = document.documentElement;
  root.classList.toggle('touch-device', touch);
  root.classList.toggle('rotated-landscape', rotated);
  root.style.setProperty('--game-width', `${width}px`);
  root.style.setProperty('--game-height', `${height}px`);
  root.style.setProperty('--game-vw', `${width / 100}px`);
  root.style.setProperty('--game-vh', `${height / 100}px`);
  root.style.setProperty('--view-height', `${height}px`);
  root.style.setProperty('--surface-x', `${offsetX + (rotated ? physicalWidth : 0)}px`);
  root.style.setProperty('--surface-y', `${offsetY}px`);
  root.style.fontSize = `${height / 72}px`;
  emit('viewport', { ...viewport });
}
on('device:mode', updateViewport);
addEventListener('resize', updateViewport);
addEventListener('orientationchange', updateViewport);
globalThis.visualViewport?.addEventListener('resize', updateViewport);
globalThis.visualViewport?.addEventListener('scroll', updateViewport);
coarse.addEventListener('change', updateViewport);
updateViewport();
