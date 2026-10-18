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

Install Android SDK Platform 36 and Build Tools 36.0.0 (Android Studio SDK Manager), JDK 21, Node 22.22.0, and Gradle 8.14.3.

```sh
nvm use
npm ci
npm run check:build
npm run check:game
npm run android:sync
```

**Important bootstrap limitation:** The binary `android/gradle/wrapper/gradle-wrapper.jar` could not be transferred through this repository's GitHub connector; it is not checked in by this PR. Regenerate the official wrapper locally using a trusted installation of the pinned Gradle 8.14.3 distribution:

```sh
gradle -p android wrapper --gradle-version 8.14.3 --distribution-type all
# Then use the wrapper for the actual build
cd android
./gradlew --no-daemon assembleDebug
./gradlew --no-daemon assembleRelease
```

On Windows use `gradlew.bat`. Once generated, commit the verified `gradle-wrapper.jar` in a follow-up update to #34; verify the wrapper integrity before using it. **Do not download an unverified replacement JAR from an arbitrary site.** The [Android native CI](../../.github/workflows/android-native.yml) performs the same bootstrap using `gradle/actions/setup-gradle@v4` and uploads only the debug APK.

Debug output: `android/app/build/outputs/apk/debug/app-debug.apk` (debug-signed, *not for distribution*).

Release compilation output: `android/app/build/outputs/apk/release/app-release-unsigned.apk` (**not signed**, for compilation verification only). **Never publish this as a signed APK.** Actual secured Direct APK signing is #43/#44; independently Upload-signed AAB is #45, with separate workflows #46. No Play account is required for native build compilation or future Direct APK signing.

## Smoke test on Android device/emulator (pending)

```sh
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
adb shell am start -n io.github.abolfazl.nabardrostam.dev/io.github.abolfazl.nabardrostam.MainActivity
adb logcat -d | grep -E '(Capacitor|chromium|WebGL)'
```

Check: Persian title and menus, start new story, enter battle without white screen, render WebGL2, joystick + multi-touch, audio activation, pause/return, relaunch and data persistence. Test **Android 9** with updated Chrome WebView and a current Android API 36 emulator/device; save measured FPS and errors. Simulate Airplane Mode as part of #35. `applicationId`, `minSdk`, `targetSdk` and native dependencies must be inspected in the output APK before declaring #34 complete.

**No emulator/device evidence and no signed Release artifact are claimed in this PR.** The web package's optional Google Fonts link is stripped, but bundling a licensed local Vazirmatn and offline QA remain #35. Because Google Play can ignore landscape enforcement on some Android 16 large screens, #36 must resolve orientation and Safe Area separately.
