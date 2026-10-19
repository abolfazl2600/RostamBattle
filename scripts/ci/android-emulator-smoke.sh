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
# The hosted Google APIs emulator occasionally crashes GMS's FontsProvider and
# Android then kills this otherwise healthy app as a dependent client. Do not
# turn that platform failure into a false app regression: allow exactly ONE
# fresh launch, but only when the GMS-provider kill is explicitly in logcat.
# Retain first-attempt evidence; the second attempt gets a clean log and must
# independently pass ALL startup/font checks.
if ! adb shell pidof "${pkg}" >/dev/null 2>&1; then
  if [ "${api}" != "28" ] && grep -F "depends on provider com.google.android.gms/.fonts.provider.FontsProvider in dying proc" emulator-evidence/logcat-live.txt | grep -Fq "Killing "; then
    echo "Emulator Google Play Services FontsProvider crash killed the app; retrying native launch once"
    if [ -n "$logpid" ]; then
      kill "$logpid" >/dev/null 2>&1 || true
      wait "$logpid" >/dev/null 2>&1 || true
      logpid=''
    fi
    mv emulator-evidence/logcat-live.txt emulator-evidence/logcat-first-attempt.txt
    adb logcat -c
    adb logcat -v time > emulator-evidence/logcat-live.txt 2>&1 &
    logpid=$!
    adb shell am start -W -n "${pkg}/${activity}"
    for attempt in $(seq 1 36); do
      sleep 5
      if grep -q 'ROSTAM_TITLE_VISIBLE' emulator-evidence/logcat-live.txt; then
        break
      fi
      if grep -Eq 'ROSTAM_TITLE_TIMEOUT|Uncaught SyntaxError' emulator-evidence/logcat-live.txt; then
        break
      fi
      if ! adb shell pidof "${pkg}" >/dev/null 2>&1; then
        break
      fi
    done
  else
    echo "App process exited without the known GMS FontsProvider crash; failing smoke test" >&2
    exit 1
  fi
fi

# A startup marker can be emitted just before an OS-level process kill.
# Require the app to still exist AND be the resumed foreground Activity when
# taking screenshots; never count the emulator home screen as a passing test.
adb shell pidof "${pkg}"
adb shell dumpsys activity activities | grep -E 'topResumedActivity=.*io.github.abolfazl.nabardrostam.dev/'
collect

if [ "${api}" = "28" ]; then
  # Factory Android 9 WebView lacks import maps. The app should clearly
  # request a WebView update, rather than failing with a syntax error.
  grep -F 'ROSTAM_WEBVIEW_UPGRADE_REQUIRED' emulator-evidence/logcat-live.txt
else
  grep -F 'ROSTAM_WEBVIEW_IMPORTMAP_SUPPORTED' emulator-evidence/logcat-live.txt
  grep -F 'ROSTAM_TITLE_VISIBLE' emulator-evidence/logcat-live.txt
  grep -F 'ROSTAM_LOCAL_FONT_READY' emulator-evidence/logcat-live.txt

  echo 'PASS: Native title and bundled Persian font are ready'
fi

if grep -E 'Uncaught SyntaxError|ROSTAM_TITLE_TIMEOUT' emulator-evidence/logcat-live.txt; then
  echo 'Unexpected script error or title initialization timeout'
  exit 1
fi

echo "PASS native emulator smoke: API ${api}"
