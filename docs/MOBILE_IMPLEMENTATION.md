# Mobile implementation status — issues #2–#10

Landscape touch support is implemented. This is **not** a real-device release certification: the Android/iPhone/iPad QA gate is issue #11.

- Capability detection uses coarse pointer **or** maximum touch points, including hybrids. A portrait touch device shows a Persian rotation wall. A narrow non-touch desktop remains usable.
- A fixed-step touch source owns each pointer separately. Short taps latch one edge; holds, releases, cancellations, movement and camera deltas remain independent of keyboard, mouse and gamepad.
- Lower-left analog joystick, six Persian combat buttons, canvas drag camera and an explicit Pause button use existing simulation actions. Charge hold/release also drives Huang Zhong's existing bow aim.
- Menus, character selection, prologue, results, retry and confirmed quit have direct touch actions. Lists and low-height panels scroll; character dragging and prologue holds are cancelled on interruptions.
- Quality is available in title/pause: Auto, Low, Medium, High. Low renders at 0.6 scale, without DoF, bloom, rays, MSAA or shadows. Medium uses 0.8 scale, bloom and shadows. High starts at the original desktop quality. Every post target follows render scale; HUD/CSS stays at viewport resolution.
- Adaptation measures smoothed frame intervals (not GPU timer queries), steps resolution after sustained load, and uses a 10-second cooldown. It never changes soldier counts, 60 Hz simulation, objectives or records. Actual FPS/thermal results must be measured on hardware in #11.
- Blur, hidden/pagehide, portrait and cancelled capture clear input and pause. Focus/landscape return never auto-resumes a paused battle. Explicit Resume is required. AudioContext resume is attempted in trusted gestures; the reverb buffer matches the context's sample rate.
- Missing WebGL2/HDR support, target allocation failure and WebGL context loss show a Persian recovery panel. Context restoration requires explicit reload to rebuild all depth/post/shadow resources. Saved progression is never cleared; an unfinished battle is not persisted across reload.

## Validation

Run the focused dependency-free contracts:

```sh
node checks/mobile-input.mjs
```

Existing checks used for this change: `checks/fa-localization.mjs`, `checks/campaign.mjs`, `checks/trials.mjs`, `src/chars/check.mjs`, `checks/shared-originality.mjs`, `src/world/changban.check.mjs`. Two stale Chinese timeout/bridge assertions in trials now compare the authored failure reason, retaining their boundary assertions across localization.

Browser checks use Chromium with software WebGL and touch emulation, not physical hardware. The real-device checks in #11 must cover iOS audio interruptions/notification shade, device safe areas, sustained performance, full combat timing and complete mission runs before a mobile release claim.

Verified in emulation: touch wake does not choose the next menu item; story/mode/difficulty/character navigation; prologue hold cancellation and Skip; battle attack without pointer lock; movement + attack + camera ownership; portrait rotation and explicit Resume; Pause/Resume and blur; result/retry (result injected through the event bus for UI coverage); confirmed quit; 667×375, 812×375 and 1024×768 layouts; narrow 375×812 non-touch desktop keyboard wake; quality changes resize the drawing buffer; Huang Zhong Charge + look + release emits an aim shot; context loss/restoration presents reload recovery and leaves local storage intact. Browser execution uses software rendering, so its timings are not mobile GPU benchmarks.
