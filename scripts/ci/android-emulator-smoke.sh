#!/usr/bin/env bash
# Executed by reactivecircus/android-emulator-runner as ONE shell command;
# the runner invokes multiline YAML script lines as separate commands.
set -euo pipefail

api="${1:?Android API level required}"
pkg='io.github.abolfazl.nabardrostam.dev'
activity='io.github.abolfazl.nabardrostam.MainActivity'
mkdir -p emulator-evidence
logpid=''

collect() {
  if [ -n "$logpid" ]; then
    kill "$logpid" >/dev/null 2>&1 || true
    wait "$logpid" >/dev/null 2>&1 || true
    logpid=''
  fi
  adb logcat -d -t 6000 > emulator-evidence/logcat.txt 2>&1 || true
  adb shell dumpsys activity activities > emulator-evidence/activity.txt 2>&1 || true
  adb shell screencap -p /sdcard/rostam-startup.png >/dev/null 2>&1 || true
  adb pull /sdcard/rostam-startup.png emulator-evidence/rostam-startup.png >/dev/null 2>&1 || true
}
trap collect EXIT

adb install -r android-apk/app-debug.apk
adb logcat -c
# Capture from BEFORE Activity launch; -t/-d alone may truncate startup
# messages on noisy Play Services emulator images.
adb logcat -v time > emulator-evidence/logcat-live.txt 2>&1 &
logpid=$!
adb shell am start -W -n "${pkg}/${activity}"
if [ "${api}" = "28" ]; then
  sleep 12
else
  # Three.js shader compilation on the emulator's SwiftShader GPU may
  # significantly exceed a fixed 25-second screenshot delay.
  for attempt in $(seq 1 26); do
    sleep 5
    if grep -q 'ROSTAM_TITLE_VISIBLE' emulator-evidence/logcat-live.txt; then
      break
    fi
    if grep -q 'ROSTAM_TITLE_TIMEOUT' emulator-evidence/logcat-live.txt; then
      break
    fi
  done
fi
adb shell pidof "${pkg}"
collect

if [ "${api}" = "28" ]; then
  # Factory Android 9 WebView lacks import maps. The app should clearly
  # request a WebView update, rather than failing with a syntax error.
  grep -F 'ROSTAM_WEBVIEW_UPGRADE_REQUIRED' emulator-evidence/logcat-live.txt
else
  grep -F 'ROSTAM_WEBVIEW_IMPORTMAP_SUPPORTED' emulator-evidence/logcat-live.txt
  grep -F 'ROSTAM_TITLE_VISIBLE' emulator-evidence/logcat-live.txt
fi

if grep -E 'Uncaught SyntaxError|ROSTAM_TITLE_TIMEOUT' emulator-evidence/logcat-live.txt; then
  echo 'Unexpected script error or title initialization timeout'
  exit 1
fi

echo "PASS native emulator smoke: API ${api}"
