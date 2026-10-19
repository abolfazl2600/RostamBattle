#!/usr/bin/env bash
# Verify a Direct release APK without needing access to its private signing key.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
APK="${1:-}"
if [[ -z "$APK" || ! -f "$APK" ]]; then
  echo "Usage: bash scripts/android/verify-direct-apk.sh PATH_TO_SIGNED_APK" >&2
  exit 2
fi
find_android_tool() {
  local name="$1" sdk="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-}}"
  if [[ -n "$sdk" && -x "$sdk/build-tools/36.0.0/$name" ]]; then
    printf '%s\n' "$sdk/build-tools/36.0.0/$name"
  elif command -v "$name" >/dev/null 2>&1; then
    command -v "$name"
  else
    echo "Missing Android build tool '$name' (SDK Build-Tools 36.0.0 required)" >&2
    exit 2
  fi
}
AAPT="$(find_android_tool aapt)"
APKSIGNER="$(find_android_tool apksigner)"
VERSION_CODE="$(sed -n 's/^versionCode=//p' "$ROOT/android/version.properties" | tr -d '\r')"
VERSION_NAME="$(sed -n 's/^versionName=//p' "$ROOT/android/version.properties" | tr -d '\r')"
BADGING="$("$AAPT" dump badging "$APK")"
if ! grep -Fq "name='io.github.abolfazl.nabardrostam'" <<< "$BADGING"; then
  echo "ERROR: package ID is not the official Release ID." >&2
  exit 1
fi
if ! grep -Fq "versionCode='$VERSION_CODE'" <<< "$BADGING" || ! grep -Fq "versionName='$VERSION_NAME'" <<< "$BADGING"; then
  echo "ERROR: APK version differs from android/version.properties." >&2
  exit 1
fi
if grep -Eq "name='io.github.abolfazl.nabardrostam.dev'" <<< "$BADGING"; then
  echo "ERROR: Debug application package detected." >&2
  exit 1
fi
echo "Package/version verified: io.github.abolfazl.nabardrostam v$VERSION_NAME (code $VERSION_CODE)"
# Nonzero exit rejects unsigned, invalidly signed, or unsupported-minSdk APKs.
"$APKSIGNER" verify --min-sdk-version 28 --verbose --print-certs "$APK"
echo "APK SHA-256:"
if command -v sha256sum >/dev/null 2>&1; then
  sha256sum "$APK"
else
  shasum -a 256 "$APK"
fi
