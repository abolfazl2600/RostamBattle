import assert from 'node:assert/strict';
// Native Android bridge contract: no automatic gameplay resume, never
// auto-exit when a panel or a battle is active.
const win = new EventTarget(), doc = new EventTarget();
globalThis.addEventListener = win.addEventListener.bind(win);
globalThis.dispatchEvent = win.dispatchEvent.bind(win);
globalThis.document = doc;
document.hidden = false;
const { createLifecycle } = await import('../src/core/lifecycle.js');
const interrupts = [], foregrounds = [];
createLifecycle(reason => interrupts.push(reason), reason => foregrounds.push(reason));
for (const type of ['rostam:native-pause', 'rostam:native-blur', 'rostam:native-stop']) {
  dispatchEvent(new Event(type));
}
assert.deepEqual(interrupts, ['rostam:native-pause','rostam:native-blur','rostam:native-stop']);
dispatchEvent(new Event('rostam:native-resume'));
dispatchEvent(new Event('rostam:native-focus'));
assert.deepEqual(foregrounds, ['rostam:native-resume','rostam:native-focus']);
assert.equal(interrupts.length, 3, 'foreground must never trigger battle resume');
document.hidden = true;
document.dispatchEvent(new Event('visibilitychange'));
assert.equal(interrupts.at(-1), 'hidden');
document.hidden = false;
document.dispatchEvent(new Event('visibilitychange'));
assert.equal(foregrounds.at(-1), 'visible');
console.log('PASS Android pause/stop/blur and foreground signals remain separate');
