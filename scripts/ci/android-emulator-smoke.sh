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
  grep -F 'ROSTAM_LOCAL_FONT_READY' emulator-evidence/logcat-live.txt

  # Confirm a second, cold app start while all device radios are disabled.
  # This is an offline smoke test, not a full gameplay acceptance test.
  initial_title_count=$(grep -c 'ROSTAM_TITLE_VISIBLE' emulator-evidence/logcat-live.txt || true)
  initial_font_count=$(grep -c 'ROSTAM_LOCAL_FONT_READY' emulator-evidence/logcat-live.txt || true)
  adb shell screencap -p /sdcard/rostam-online.png
  adb pull /sdcard/rostam-online.png emulator-evidence/rostam-online.png
  # Android 14+ blocks ACTION_AIRPLANE_MODE broadcasts from adb shell.
  # Use the privileged connectivity shell command, then explicitly disable
  # wifi/data to guarantee the game is relaunched without radio connectivity.
  if ! adb shell cmd connectivity airplane-mode enable; then
    adb shell settings put global airplane_mode_on 1
  fi
  adb shell svc wifi disable
  adb shell svc data disable
  mode=$(adb shell settings get global airplane_mode_on | tr -d '\r')
  if [ "$mode" != "1" ]; then
    echo "Could not enable Android Airplane Mode"
    exit 1
  fi
  adb shell am force-stop "${pkg}"
  adb shell am start -W -n "${pkg}/${activity}"
  for attempt in $(seq 1 30); do
    sleep 5
    title_count=$(grep -c 'ROSTAM_TITLE_VISIBLE' emulator-evidence/logcat-live.txt || true)
    font_count=$(grep -c 'ROSTAM_LOCAL_FONT_READY' emulator-evidence/logcat-live.txt || true)
    if (( title_count > initial_title_count && font_count > initial_font_count )); then
      break
    fi
  done
  if (( title_count <= initial_title_count || font_count <= initial_font_count )); then
    echo "Offline cold start never reached title with local Vazirmatn font"
    exit 1
  fi
  adb shell screencap -p /sdcard/rostam-offline.png
  adb pull /sdcard/rostam-offline.png emulator-evidence/rostam-offline.png
  echo "PASS: Android app restarted offline with the local font loaded"
fi

if grep -E 'Uncaught SyntaxError|ROSTAM_TITLE_TIMEOUT' emulator-evidence/logcat-live.txt; then
  echo 'Unexpected script error or title initialization timeout'
  exit 1
fi

echo "PASS native emulator smoke: API ${api}"
