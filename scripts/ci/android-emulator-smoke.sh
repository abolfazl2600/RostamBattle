#!/usr/bin/env bash
# Executed by reactivecircus/android-emulator-runner as ONE shell command;
# the runner invokes multiline YAML script lines as separate commands.
set -euo pipefail

api="${1:?Android API level required}"
pkg='io.github.abolfazl.nabardrostam.dev'
activity='io.github.abolfazl.nabardrostam.MainActivity'
mkdir -p emulator-evidence

collect() {
  adb logcat -d -t 6000 > emulator-evidence/logcat.txt 2>&1 || true
  adb shell dumpsys activity activities > emulator-evidence/activity.txt 2>&1 || true
  adb shell screencap -p /sdcard/rostam-startup.png >/dev/null 2>&1 || true
  adb pull /sdcard/rostam-startup.png emulator-evidence/rostam-startup.png >/dev/null 2>&1 || true
}
trap collect EXIT

adb install -r android-apk/app-debug.apk
adb logcat -c
adb shell am start -W -n "${pkg}/${activity}"
sleep 25
adb shell pidof "${pkg}"
collect

if [ "${api}" = "28" ]; then
  # Factory Android 9 WebView lacks import maps. The app should clearly
  # request a WebView update, rather than failing with a syntax error.
  grep -F 'ROSTAM_WEBVIEW_UPGRADE_REQUIRED' emulator-evidence/logcat.txt
else
  grep -F 'ROSTAM_WEBVIEW_IMPORTMAP_SUPPORTED' emulator-evidence/logcat.txt
  grep -F 'ROSTAM_TITLE_VISIBLE' emulator-evidence/logcat.txt
fi

if grep -E 'Uncaught SyntaxError|ROSTAM_TITLE_TIMEOUT' emulator-evidence/logcat.txt; then
  echo 'Unexpected script error or title initialization timeout'
  exit 1
fi

echo "PASS native emulator smoke: API ${api}"
