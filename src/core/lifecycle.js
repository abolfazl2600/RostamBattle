// Browser interruptions always require an explicit Resume. Returning focus never resumes a battle.
export function createLifecycle(interrupt) {
  for (const type of ['blur', 'pagehide']) addEventListener(type, () => interrupt(type));
  document.addEventListener('visibilitychange', () => { if (document.hidden) interrupt('hidden'); });
}
