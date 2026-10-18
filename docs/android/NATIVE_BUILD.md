# Native Android build — #34 / Capacitor 8.5.3

## Boundaries and identifiers

The repository now contains a native Android project based on the **official Capacitor 8.5.3** Android template. The normal website and generated offline `dist/` remain unchanged. The Capacitor app ID is the approved release ID `io.github.abolfazl.nabardrostam`; in Gradle, the `debug` buildType appends `.dev` to the application ID and `-dev` to the version name. The Android namespace and `MainActivity` package use the unsuffixed release ID.

| Setting | Value |
| --- | --- |
| Node / Capacitor | Node 22.22.0 / Capacitor 8.5.3 (lockfile) |
| JDK | 21 |
| Gradle distribution | 8.14.3 (official Capacitor template) |
| Android Gradle Plugin | 8.13.0 |
| compileSdk / targetSdk | 36 / 36 |
| minSdk | 28 (Android 9; provisional pending real-device QA) |
| Debug applicationId | `io.github.abolfazl.nabardrostam.dev` |
| Release applicationId | `io.github.abolfazl.nabardrostam` |
| Origin | `https://localhost` (do not change without save migration) |

The temporary vector launcher icon and simple dark launch theme are **not** final artwork; replace under [#42](https://github.com/abolfazl2600/voxel-game/issues/42). Orientation, immersive UI and safe areas are owned by [#36](https://github.com/abolfazl2600/voxel-game/issues/36). Phone/tablet touch and WebGL2 require real-device QA (#11/#40). No hardware or emulator run is asserted by the source changes alone.

## Local build

Install Android SDK Platform 36 and Build Tools 36.0.0 (Android Studio SDK Manager), JDK 21 and Node 22.22.0. The committed Gradle wrapper downloads Gradle 8.14.3.

```sh
nvm use
npm ci
npm run check:build
npm run check:game
npm run android:sync
```

The official `android/gradle/wrapper/gradle-wrapper.jar` is committed and was verified to match **SHA-1 Git blob `1b33c55baabb587c669f562ae36f953de2481846`**, the binary in the official Capacitor 8.5.3 Android template. Use the committed Gradle wrapper (it downloads pinned Gradle 8.14.3) — **no global Gradle install or manual wrapper bootstrap is required**:

```sh
cd android
./gradlew --no-daemon assembleDebug
./gradlew --no-daemon assembleRelease
```

On Windows use `gradlew.bat`. CI validates the wrapper and uploads only the Debug APK; the Release APK built by this command is **unsigned**.

Debug output: `android/app/build/outputs/apk/debug/app-debug.apk` (debug-signed, *not for distribution*).

Release compilation output: `android/app/build/outputs/apk/release/app-release-unsigned.apk` (**not signed**, for compilation verification only). **Never publish this as a signed APK.** Actual secured Direct APK signing is #43/#44; independently Upload-signed AAB is #45, with separate workflows #46. No Play account is required for native build compilation or future Direct APK signing.

## WebView compatibility and Android emulator smoke checks

Android 9 (API 28) supports installing this app, but the *factory emulator's* outdated WebView cannot parse the game's modern JavaScript and lacks import-map support. The Android-only HTML boot guard reports that the user must update **Android System WebView/Chrome** instead of showing a misleading generic load failure. Do not interpret that old emulator as evidence Android 9 with a newer supported WebView is incompatible. The emulator CI matrix checks for an upgrade message on factory API 28 and a rendered title on a newer API emulator. The actual minimum supported **WebView version and GPU/WebGL2 features** still require physical Android 9 tests (#40).

The native game Activity currently requests landscape orientation. Android 16 tablets may ignore orientation requests, and Safe Area, immersive UI and multitouch testing remain #36/#11.

## Smoke test on Android device/emulator (partly automated; physical QA pending)

```sh
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
adb shell am start -n io.github.abolfazl.nabardrostam.dev/io.github.abolfazl.nabardrostam.MainActivity
adb logcat -d | grep -E '(Capacitor|chromium|WebGL)'
```

Check: Persian title and menus, start new story, enter battle without white screen, render WebGL2, joystick + multi-touch, audio activation, pause/return, relaunch and data persistence. Test **Android 9** with updated Chrome WebView and a current Android API 36 emulator/device; save measured FPS and errors. Simulate Airplane Mode as part of #35. `applicationId`, `minSdk`, `targetSdk` and native dependencies must be inspected in the output APK before declaring #34 complete.

**No emulator/device evidence and no signed Release artifact are claimed in this PR.** The web package's optional Google Fonts link is stripped, but bundling a licensed local Vazirmatn and offline QA remain #35. Because Google Play can ignore landscape enforcement on some Android 16 large screens, #36 must resolve orientation and Safe Area separately.
