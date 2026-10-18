// Focused input contracts. Run: node checks/mobile-input.mjs (no browser/dependencies).
import assert from 'node:assert/strict';
const win = new EventTarget(), doc = new EventTarget();
globalThis.addEventListener = win.addEventListener.bind(win);
globalThis.dispatchEvent = win.dispatchEvent.bind(win);
const nodes = Object.fromEntries(['c', 'menu', 'rotate-device', 'go'].map((id) => [id, Object.assign(new EventTarget(), { hidden: true })]));
Object.assign(doc, { getElementById: (id) => nodes[id], querySelectorAll: () => [], hidden: false,
  documentElement: { classList: { toggle() {} }, style: { setProperty() {} } } });
globalThis.document = doc;
let pad = null;
Object.defineProperty(globalThis, 'navigator', { value: { maxTouchPoints: 5, getGamepads: () => [pad] }, configurable: true });
globalThis.matchMedia = () => ({ matches: false, addEventListener() {} });
globalThis.innerWidth = 812; globalThis.innerHeight = 375;
const { createInput } = await import('../src/core/input.js');
const { emit } = await import('../src/core/events.js');
const { viewport, updateViewport } = await import('../src/core/viewport.js');
const { joystickVector } = await import('../src/ui/touch-controls.js');
const { defaultQuality, createAdaptiveScale } = await import('../src/post/quality.js');
const input = createInput(), touch = input.touch;
const el = { setPointerCapture() {}, hasPointerCapture: () => false };
const pointer = (id, x = 0, y = 0) => ({ pointerType: 'touch', pointerId: id, clientX: x, clientY: y, currentTarget: el, preventDefault() {}, stopPropagation() {} });
const send = (type, props = {}) => dispatchEvent(Object.assign(new Event(type), props));
emit('flow', { state: 'battle' });
// A tap between fixed steps survives as one pressed edge, with held already released.
assert(touch.claim(pointer(1), 'action', 'attack')); touch.release(1);
assert.equal(input.sample().pressed.attack, true); assert.equal(input.sample().pressed.attack, false);
assert.equal(input.sample().held.attack, false);
// Three owned pointers can move, hold charge and look independently.
assert(touch.claim(pointer(2), 'move')); touch.move(2, 0.3, 0.6);
assert(touch.claim(pointer(3), 'action', 'charge'));
assert(touch.claim(pointer(4, 100, 100), 'look')); touch.look(pointer(4, 125, 90));
assert.equal(touch.claim(pointer(5), 'look'), false);
let sample = input.sample();
assert.equal(sample.mx, 0.3); assert.equal(sample.my, 0.6); assert(sample.held.charge); assert(sample.orbit < 0); assert(sample.tilt < 0);
assert.equal(input.sample().orbit, 0);
touch.release(4); assert.equal(input.sample().held.charge, true);
touch.release(3); assert.equal(input.sample().held.charge, false);
touch.release(2); assert.equal(input.sample().mx, 0);
// Duplicate fingers on an action do not retrigger; releasing one preserves the other.
touch.claim(pointer(6), 'action', 'attack'); assert(input.sample().pressed.attack);
touch.claim(pointer(7), 'action', 'attack'); assert.equal(input.sample().pressed.attack, false);
touch.release(6); assert(input.sample().held.attack); touch.release(7);
touch.claim(pointer(8), 'action', 'jump'); touch.release(8, true); assert.equal(input.sample().pressed.jump, false);
// A mouseup cannot release a keyboard hold, and a touch on empty canvas never attacks/locks.
send('keydown', { code: 'KeyK', repeat: false }); assert(input.sample().held.charge);
send('pointerup', { pointerType: 'mouse', button: 2 }); assert(input.sample().held.charge);
send('keyup', { code: 'KeyK' }); assert.equal(input.sample().held.charge, false);
send('pointerdown', { pointerType: 'touch', button: 0 }); assert.equal(input.sample().pressed.attack, false);
// Interruptions clear edges, holds, camera deltas and movement, and screen input is gated.
touch.claim(pointer(9), 'action', 'attack'); touch.claim(pointer(10), 'move'); touch.move(10, 1, 0);
send('blur'); sample = input.sample(); assert.equal(sample.mx, 0); assert.equal(sample.held.attack, false); assert.equal(sample.pressed.attack, false);
emit('flow', { state: 'title' }); send('keydown', { code: 'KeyJ' }); assert.equal(input.sample().pressed.attack, false);
emit('flow', { state: 'battle' }); nodes.menu.hidden = false; assert.equal(touch.claim(pointer(11), 'action', 'attack'), false);
nodes.menu.hidden = true;
globalThis.innerWidth = 375; globalThis.innerHeight = 812; updateViewport(); assert(viewport.blocked); assert.equal(touch.claim(pointer(12), 'move'), false);
globalThis.innerWidth = 812; globalThis.innerHeight = 375; updateViewport(); assert(!viewport.blocked);
// Standard pad held and pressed, including release-before-rearm on resume.
pad = { axes: [0, 0, 0, 0], buttons: Array.from({ length: 16 }, () => ({ pressed: false })) };
pad.buttons[3].pressed = true; sample = input.sample(); assert(sample.pressed.charge); assert(sample.held.charge);
input.reset(); assert.equal(input.sample().held.charge, false);
pad.buttons[3].pressed = false; input.sample(); pad.buttons[3].pressed = true; assert(input.sample().pressed.charge);
// Joystick radial clamp, deadzone and proportional movement.
assert.deepEqual([joystickVector(1, 1, 50).x, joystickVector(1, 1, 50).y], [0, -0]);
const diagonal = joystickVector(100, -100, 50); assert(Math.abs(Math.hypot(diagonal.x, diagonal.y) - 1) < 1e-9);
assert(joystickVector(25, 0, 50).x > 0 && joystickVector(25, 0, 50).x < 1);
assert.equal(defaultQuality({ touch: false }), 'high'); assert.equal(defaultQuality({ touch: true, cores: 8, memory: 8 }), 'medium');
const scales = [], adaptive = createAdaptiveScale(1, 33.3, (s) => scales.push(s));
for (let t = 1; t < 6000; t += 50) adaptive.frame(t);
assert.deepEqual(scales, [0.9]);
for (let t = 6001; t < 12000; t += 50) adaptive.frame(t);
assert.deepEqual(scales, [0.9], 'cooldown prevents repeated target allocation');
console.log('PASS touch latch/hold/release/cancel, independent pointers/look, input isolation, pause/rotate/blur, pad holds, analog movement and quality hysteresis');
