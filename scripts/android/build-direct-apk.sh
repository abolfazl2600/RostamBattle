#!/usr/bin/env bash
# Local-only build. Never ask users to paste secret passwords into a CI log.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
for name in ROSTAM_DIRECT_KEYSTORE ROSTAM_DIRECT_STORE_PASSWORD ROSTAM_DIRECT_KEY_ALIAS ROSTAM_DIRECT_KEY_PASSWORD; do
  if [[ -z "${!name:-}" ]]; then
    echo "Missing $name. See docs/android/DIRECT_APK.md (no keys or passwords in Git)." >&2
    exit 2
  fi
done
if [[ ! -f "$ROSTAM_DIRECT_KEYSTORE" ]]; then
  echo "Signing keystore path does not exist." >&2
  exit 2
fi
npm run android:sync
(
  cd android
  chmod +x ./gradlew
  ./gradlew --no-daemon :app:assembleDirectRelease
)
APK="$ROOT/android/app/build/outputs/apk/release/app-release.apk"
if [[ ! -f "$APK" ]]; then
  echo "Signed output not found: $APK (refusing to deliver unsigned release)" >&2
  exit 1
fi
bash "$ROOT/scripts/android/verify-direct-apk.sh" "$APK"
VERSION_NAME="$(sed -n 's/^versionName=//p' "$ROOT/android/version.properties" | tr -d '\r')"
VERSION_CODE="$(sed -n 's/^versionCode=//p' "$ROOT/android/version.properties" | tr -d '\r')"
OUT_DIR="$ROOT/release-out"
mkdir -p "$OUT_DIR"
OUT="$OUT_DIR/rostams-battle-${VERSION_NAME}-vc${VERSION_CODE}-direct-signed.apk"
cp "$APK" "$OUT"
# Verify the distributed copy too; do not deliver if validation fails.
bash "$ROOT/scripts/android/verify-direct-apk.sh" "$OUT"
if command -v sha256sum >/dev/null 2>&1; then
  (cd "$OUT_DIR" && sha256sum "$(basename "$OUT")" > "$(basename "$OUT").sha256")
else
  (cd "$OUT_DIR" && shasum -a 256 "$(basename "$OUT")" > "$(basename "$OUT").sha256")
fi
echo "SIGNED DIRECT APK: $OUT"
echo "SHA-256 file: $OUT.sha256"
