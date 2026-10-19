# Android progress and in-place update — Issue #39

Branch: `android/39-progress-persistence` (independent of #37; no PR/merge).

## Existing production contract preserved

- `src/core/progress.js` stores the **same existing v1** `{v:1, rec}` at **`localStorage['voxel-musou.save']`**. Stage, character and difficulty IDs and best-rank/time/KO aggregation are unchanged. No migration is necessary because this task does not change the schema.
- Android Capacitor app serves assets from **`https://localhost`**, and its official application ID is `io.github.abolfazl.nabardrostam`. Do not change Android's hostname, scheme or `applicationId` after saving progress without explicit migration.
- Debug appends `.dev` and has a **different application sandbox** from Release. The public GitHub Pages browser origin has separate storage. Neither Debug→Release nor website→Android progress migration happens automatically.
- In-place updates preserve app data only if Android accepts the update: same package ID, compatible **app-signing certificate**, higher `versionCode`, and unchanged WebView storage origin. Google Play and direct APK must share the installed **App Signing Key**, while the Play AAB is signed with a separate Upload Key (#43–#46). This branch does not create signing credentials or Play artifacts.

## Safety behavior implemented

- A blocked/quota-limited localStorage retains session progress in memory so switching game screens does not discard the latest win.
- Future schema versions and malformed records are **read-only/protected**. They are never silently replaced with an empty v1 record tree by a new win. The original bytes remain available for a future explicit migration or recovery.
- `progressStatus()` reports `persisted`, `memory-only`, `protected-save`, etc. without exposing record contents; `resetProgress(true)` deletes only after explicit confirmation supplied by a future UI. No destructive reset is presented to players by this change.
- The original rank/time/KOs best-of aggregation remains unchanged; the validation gate checks finite nonnegative `time` and `kos` and known rank codes.

## Verification

`node checks/android-progress.mjs` tests v1 save reload, best scores, blocked storage session fallback, protected future-version records, explicit reset, and corrupt input. It is appended to `npm run check:game`.

**Not verified here**: native persistent storage across process death, device reboot, app update or real Play↔Direct cross-channel migration. After Android signing is ready, test installed versionCode N → N+1 on a real device with the same app signing identity, retain a real saved story battle, and test both channel directions when a Play Console account exists. Check data by visiting the in-game records screen before/after; do not copy private WebView data or signing keys into issue logs. Real-device steps, signed test APKs and Play access remain #39/#43/#44/#45/#54.
