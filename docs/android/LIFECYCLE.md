# Android Back and lifecycle — Issue #37

Branch `android/37-back-pause-lifecycle`. Runs on the native Capacitor 8.5.3 Activity; no `@capacitor/app` plugin needed. This issue builds on the Android native foundation already in main; full #36 WindowInsets/safe-area work remains open.

## Priority of the system Back gesture / hardware Back

1. Settings dialog open → close it and restore the underlying menu (no accidental unpause).
2. Battle running → immediately pause, release all pointers/held inputs, and suspend battle audio.
3. Battle paused → highlight and arm the **exit battle** confirmation (a subsequent Back exits to title; tap on Continue resumes explicitly).
4. Title → first Back shows the Persian exit hint; second Back within two seconds exits the Activity.
5. Select/prologue/result → return to the title via the existing ink transition; during transitions the Back event is consumed.

The Activity uses AndroidX's `OnBackPressedDispatcher`. Java calls `window.__rostamNativeBack()` and only calls `finish()` if JS returns `exit`. JS is authoritative; a Back without loaded web content fails closed, rather than exiting an active battle.

## Interruption and input contract

Native `onPause/onStop/onResume/onWindowFocusChanged` forward events to WebView, complementing `document.visibilitychange`, blur and pagehide. Every interruption resets keyboard/mouse/gamepad/touch latches, stops rendering-time accumulation and pauses battle; foregrounding **never** resumes it. UI and battle AudioContexts suspend when backgrounded; battle resumes only after a deliberate user action. Control reset includes pointer capture release, joystick neutral, charge/attack holds cleared, and camera deltas discarded.

## Verification boundary

`node checks/android-lifecycle.mjs` verifies signal coverage. Existing `checks/mobile-input.mjs` covers three pointers, interrupt reset, key/pad holds. **Still required before declaring #37 complete:** Android phone tests with hardware and gesture Back, Home, phone call, notification shade, audio focus, return from background, old and new WebView, uninterrupted gameplay and safe-area behavior (#36). GitHub Actions results are not awaited per owner request. No PR or merge is created.
