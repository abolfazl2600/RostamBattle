// UI preference is independent of actual hardware capabilities and graphics quality.
import { emit } from './events.js';
export const DEVICE_MODES = { auto: 'خودکار (پیشنهادی)', mobile: 'موبایل / تبلت', desktop: 'دسکتاپ' };
export const normalizeDeviceMode = value => Object.hasOwn(DEVICE_MODES, value) ? value : 'auto';
let choice = 'auto';
try { choice = normalizeDeviceMode(localStorage.getItem('voxel-device-mode')); } catch { /* private/disabled storage */ }
export const deviceMode = () => choice;
export const mobileUI = (value, touchCapable) => value === 'mobile' || (value === 'auto' && touchCapable);
export function setDeviceMode(value) {
  choice = normalizeDeviceMode(value);
  try { localStorage.setItem('voxel-device-mode', choice); } catch { /* keep session preference */ }
  emit('device:mode', { choice });
}
