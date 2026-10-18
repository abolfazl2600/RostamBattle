// Native Android lifecycle signals complement browser visibility, which may not
// change for transient system overlays. They never resume gameplay automatically.
export function createLifecycle(interrupt, foreground = () => {}) {
  for (const type of ['blur', 'pagehide']) addEventListener(type, () => interrupt(type));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) interrupt('hidden');
    else foreground('visible');
  });
  for (const type of ['rostam:native-pause', 'rostam:native-stop', 'rostam:native-blur']) {
    addEventListener(type, () => interrupt(type));
  }
  for (const type of ['rostam:native-resume', 'rostam:native-focus', 'focus', 'pageshow']) {
    addEventListener(type, () => foreground(type));
  }
}
