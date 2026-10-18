# Android packaging development — #33

The repository root remains the GitHub Pages entry point. No bundler, npm runtime, redirect or hosted-site wrapper is introduced. The Android build copies an explicit allowlist into `dist/`; all relative ES module imports and the Three.js import map retain their paths. `asset-manifest.json` contains sorted SHA-256 hashes without timestamps so repeated builds can be compared.

## Tools and commands

Use Node **22.22.0** (`nvm use`) and Capacitor core/android/CLI **8.5.3**. Commit the npm lockfile; normal installations use `npm ci`. No global Capacitor installation is needed.

```sh
nvm use
npm ci
npm run build:web
npm run check:build
npm run check:game
```

Serve either the repository root (unchanged web version) or dist with a static HTTP server; opening ES modules using file:// is unsupported.

```sh
npm run android:sync
npm run android:open
```

The native project from #34 is now tracked. Do **not** run `npx cap add android` again or overwrite it. Capacitor uses the approved release ID `io.github.abolfazl.nabardrostam`; the Gradle debug variant adds `.dev` so it can coexist with Release. Release signing/Play are separate issues #43–#46. See [NATIVE_BUILD.md](NATIVE_BUILD.md) for native setup.

The native project uses JDK 21, Android SDK 36, Gradle 8.14.3, AGP 8.13.0 and **provisional minSdk 28**. The Gradle wrapper JAR is now committed and byte-identical to the official Capacitor 8.5.3 template blob (Git SHA-1 `1b33c55baabb587c669f562ae36f953de2481846`); `./gradlew` works without a separate Gradle installation. Capacitor assets load from `https://localhost`. Android 9's factory emulator contains an obsolete System WebView, so the Android-only bundled boot page displays a clear upgrade message rather than attempting unsupported import-map/optional-chaining code. The target Android 9 with an updated WebView and GPU/WebGL2/audio/input still requires physical-device verification.

## Offline boundary and CSP

The bundled WebView origin is fixed at `https://localhost`; do not change this after users have saved progress without a migration plan (#39). There is no `server.url`, remote live-reload URL, mixed content permission or unrestricted navigation allowlist. Production WebView debugging is disabled.

Only the generated Android HTML drops Google Fonts stylesheet/preconnect requests and adds the **bundled SIL-OFL-1.1 Vazirmatn variable font**, with the license shipped alongside the asset. The original browser HTML is unchanged. See [OFFLINE.md](OFFLINE.md). Full physical-device offline gameplay QA remains #35.

The generated HTML has a restrictive local CSP: connections, fonts and modules use self; inline scripts/styles remain allowed because the existing import map, boot handler and UI use them. This is an explicit compatibility exception, not a claim of strict CSP. Objects, frames, form submissions and external base URLs are disabled. Data/blob images and blob media support local rendering. There is no unsafe-eval permission.

The build copies index.html, src/, vendor/ and LICENSE only. Source assets such as brush.woff2 are retained; promotional media, docs, node_modules, environment files and signing material are excluded. License completeness remains #50. Build-time npm downloads do not imply network use during gameplay.

## Validation boundaries

`check:build` builds twice, verifies deterministic hashes and stale-file removal, checks the unchanged browser source, required assets and all static/literal dynamic module references. Existing gameplay checks run independently. Native installation, Airplane Mode, fonts, lifecycle, performance and Play policy acceptance require their own issue evidence; a passing packaging check does not complete those gates.
