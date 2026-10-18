# Offline Android assets and Persian font — Issue #35

## Font licensing and fixed provenance

- Font: **Vazirmatn variable WOFF2** from [Vazirmatn official source](https://github.com/rastikerdar/vazirmatn), file `fonts/webfonts/Vazirmatn[wght].woff2`.
- Git blob SHA-1: `a501289a85595158570b0c2badcb4608b042e748`; full upstream font, 111,152 bytes, weights 100–900.
- License: **SIL Open Font License 1.1**, included unchanged at `src/ui/vazirmatn-OFL.txt`. The font is embedded with its original, unmodified family name.
- Stored at `src/ui/vazirmatn.woff2`. The Android build copies `src/` into `dist/`; source licenses travel with the font.
- `scripts/build-web.mjs` removes Google Fonts stylesheet and preconnect links **only from the generated Android HTML**, inserts a local @font-face and a preload; the original browser site keeps its current stylesheet and HTML unchanged. The font is loaded via `https://localhost/src/ui/vazirmatn.woff2` (local Capacitor origin, not the public Internet).

## Offline and security invariants

- `server.url` is absent; Capacitor origin stays at `https://localhost`; no arbitrary navigation allowlist or mixed content.
- The Android HTML CSP restricts connect/font/script resources to local assets. JS and Three.js importmaps resolve through bundled `src/` and `vendor/`.
- `npm run check:build` validates bundled import graph, font, license, local HTML styling and zero HTTP(S) CSS URL references. The test is not an exhaustive dynamic network monitor.
- Emulator API 34 uses Airplane Mode, disables Wi-Fi and mobile data, cold restarts the app, and verifies that **both the title and locally loaded font** become ready again; screenshots and Logcat are preserved.
- Android 9 factory emulator uses a WebView too old to support import maps; it will show a Persian WebView-upgrade instruction rather than run the game. Android 9 **with an updated WebView** still needs hardware evaluation.

## Explicit remaining work

- Actual Android phone/tablet QA: fresh installation fully offline, complete title→battle, audio, GPU/WebGL2, and multi-touch on several devices, especially Android 9 with an updated WebView.
- Confirm the license and complete inventory for all other game assets (#50); this font's license is not an assessment of all third-party content.
- Review security, download/network behavior and permissions before signed Release (#41, #47); no Play distribution is claimed from these checks.

Do not close #35 solely on emulator title smoke; the user-requested full offline gameplay remains untested.
