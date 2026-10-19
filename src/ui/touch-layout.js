// Semantic action IDs and accessible Persian labels; battlefield controls are icon-only.
// Static inline vector geometry: no remote icons, fonts, filters, animation or re-rendering.
export const TOUCH_ACTIONS = Object.freeze([
  { id: 'attack', label: 'حمله' },
  { id: 'charge', label: 'قدرتی' },
  { id: 'jump', label: 'پرش' },
  { id: 'dodge', label: 'جاخالی' },
  { id: 'musou', label: 'موسو' },
  { id: 'target', label: 'هدف' },
]);

const ACTION_PATHS = Object.freeze({
  attack: '<path d="m20 3-8 8-2 5 5-2 8-8-3-3ZM11 13l-6 6m0-4 4 4M3 21l2-2"/>',
  charge: '<path d="m12 2 2.6 7.4L22 12l-7.4 2.6L12 22l-2.6-7.4L2 12l7.4-2.6Z"/>',
  jump: '<path d="m5 12 7-7 7 7M5 20l7-7 7 7"/>',
  dodge: '<circle cx="16.5" cy="4.5" r="2"/><path d="m12 10 4-2 3 3-4 2-3 5m3-5-5 8m1-12-5 2M3 16h5M2 20h4"/>',
  musou: '<path d="M12 22c4.2 0 7-3.1 7-7 0-2.7-1.2-4.7-3-6 .2 3-1 4-2 5-.4-4.5-3-7.8-6-11 .2 4.5-3 7.1-3 12 0 3.9 2.8 7 7 7Z"/><path d="M12 20c-1.8 0-3-1.3-3-3s2-3.4 3-5c.2 2.9 3 3.9 3 5s-1.2 3-3 3Z"/>',
  target: '<circle cx="12" cy="12" r="6.5"/><path d="M12 1v5m0 12v5M1 12h5m12 0h5"/>',
});

export function touchActionIcon(id) {
  const paths = ACTION_PATHS[id];
  if (!paths) throw new Error('Unknown touch action: ' + id);
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths}</svg>`;
}

export function touchButtonMarkup({ id, label }) {
  return `<button type="button" data-action="${id}" aria-label="${label}" aria-pressed="false">${touchActionIcon(id)}</button>`;
}
