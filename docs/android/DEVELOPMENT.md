# Android packaging development — #33

The repository root remains the GitHub Pages entry point. No bundler, npm runtime, redirect or hosted-site wrapper is introduced. The Android build copies an explicit allowlist into `dist/`; all relative ES module imports and the Three.js import map retain their paths. `asset-manifest.json` contains sorted SHA-256 hashes without timestamps so repeated builds can be compared.

## Tools and commands

Use Node **22.14.0** (`nvm use`) and Capacitor core/android/CLI **8.0.0**. Commit the npm lockfile; normal installations use `npm ci`. No global Capacitor installation is needed.

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

These last commands require the native project from #34. Until then they should fail visibly rather than silently creating an unreviewed release identity. The configured `io.github.abolfazl2600.voxelgame.dev` is a development-only placeholder, **not** an approved Play package ID. No signing or publishing is implemented here. Final identity and channel decisions remain in #32/#43.

Capacitor 8 native setup will use JDK 21 and Android SDK 36. Gradle/AGP versions must come from the pinned Capacitor template and be committed with the wrapper in #34, then verified with an actual build. Minimum Android support is not claimed without device evidence.

## Offline boundary and CSP

The bundled WebView origin is fixed at `https://localhost`; do not change this after users have saved progress without a migration plan (#39). There is no `server.url`, remote live-reload URL, mixed content permission or unrestricted navigation allowlist. Production WebView debugging is disabled.

Only the generated Android HTML drops Google Fonts stylesheet/preconnect requests. Existing system font fallbacks remain usable; bundled licensed Vazirmatn and offline device QA remain #35. The original browser HTML is unchanged.

The generated HTML has a restrictive local CSP: connections, fonts and modules use self; inline scripts/styles remain allowed because the existing import map, boot handler and UI use them. This is an explicit compatibility exception, not a claim of strict CSP. Objects, frames, form submissions and external base URLs are disabled. Data/blob images and blob media support local rendering. There is no unsafe-eval permission.

The build copies index.html, src/, vendor/ and LICENSE only. Source assets such as brush.woff2 are retained; promotional media, docs, node_modules, environment files and signing material are excluded. License completeness remains #50. Build-time npm downloads do not imply network use during gameplay.

## Validation boundaries

`check:build` builds twice, verifies deterministic hashes and stale-file removal, checks the unchanged browser source, required assets and all static/literal dynamic module references. Existing gameplay checks run independently. Native installation, Airplane Mode, fonts, lifecycle, performance and Play policy acceptance require their own issue evidence; a passing packaging check does not complete those gates.
