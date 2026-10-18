// Browser interruptions always require an explicit Resume. Returning focus never resumes a battle.
import { on } from './events.js';
export function createLifecycle(interrupt) {
  for (const type of ['blur', 'pagehide']) addEventListener(type, () => interrupt(type));
  document.addEventListener('visibilitychange', () => { if (document.hidden) interrupt('hidden'); });
  on('viewport', ({ blocked }) => { if (blocked) interrupt('portrait'); });
}
