# ساخت APK امضاشدهٔ نصب مستقیم — نبرد رستم (#43 و #44)

> **وضعیت:** مسیر ساخت امن و بررسی امضا در کد آماده است؛ **هیچ keystore خصوصی و هیچ APK امضاشده‌ای داخل مخزن ساخته یا منتشر نشده**. امضا و آزمون نصب/ارتقا روی دستگاه فقط با کلید متعلق به ناشر انجام می‌شوند. این دستورها جایگزین ممیزی حقوق محتوا، QA سخت‌افزار و انتشار Google Play نیستند.

## قرارداد قطعی انتشار
- `applicationId`: `io.github.abolfazl.nabardrostam`
- نسخه واحد هر دو کانال آینده: `android/version.properties`، با `versionCode` **صعودی** و `versionName`.
- **Direct APK:** کلید **App Signing** متعلق به ناشر؛ Google Play در صورت عرضه آینده باید از **همین App Signing Key** برای APKهای نصبی استفاده کند.
- **Play AAB:** کلید **Upload Key** مستقل و متفاوت؛ استفاده از آن برای امضای APK مستقیم اشتباه است.
- Debug: شناسه `io.github.abolfazl.nabardrostam.dev` و امضای Debug؛ قابل جایگزینی با APK رسمی نیست.
- دستور معمول `assembleRelease` در CI فعلی عمداً **unsigned** می‌ماند؛ فقط `:app:assembleDirectRelease` خروجی signed مستقیم می‌سازد. **نباید خروجی `app-release-unsigned.apk` را منتشر کرد.**

## ابزارهای لازم
- Node `22.22.0`، `npm ci`؛ JDK 21؛ Android SDK Platform 36، Build-Tools `36.0.0`، Gradle wrapper موجود پروژه.
- در Linux/macOS یا shell سازگار با Bash، `ANDROID_HOME` یا `ANDROID_SDK_ROOT` به ریشه SDK اشاره کند. ابزارهای `aapt` و `apksigner` از `$ANDROID_HOME/build-tools/36.0.0/` یا PATH پیدا می‌شوند.
- برای نصب/ارتقا: Android Debug Bridge (`adb`) و یک گوشی/تبلت واقعی با اجازه Debugging.

## گام ۱ — ایجاد و نگهداری کلید App Signing (فقط در رایانه امن مالک)
اگر **قبلاً برای این اپ کلید اصلی تولید شده است، به‌جای ساخت کلید جدید همان را با پشتیبان معتبر استفاده کنید.** پس از نخستین انتشار، تولید مجدد کلید به‌عنوان جایگزین، مسیر به‌روزرسانی کاربران را می‌شکند.

در رایانه شخصی و خارج از مخزن:

```bash
umask 077
mkdir -p "$HOME/.config/nabard-rostam/keys"
keytool -genkeypair -v \
  -keystore "$HOME/.config/nabard-rostam/keys/app-signing.jks" \
  -storetype PKCS12 \
  -alias nabard-rostam-app \
  -keyalg RSA -keysize 4096 -validity 10000
```

`keytool` گذرواژه را تعاملی می‌پرسد. گذرواژه قوی و غیرتکراری بگذارید. با PKCS12 معمولاً `keyPassword` همان `storePassword` است. **هیچ رمز، فایل `.jks`، کلید خصوصی یا خروجی بازگشایی‌شده را به GitHub، Issues، گفتگو، پیوست PR یا artifact عمومی نفرستید.**

برای کلید **Upload** آینده یک keystore و alias مستقل با روال مشابه، نام دیگر و رمز جدا لازم خواهد بود؛ این تسک AAB نمی‌سازد. اصل App Signing Key را با حداقل دو پشتیبان رمزگذاری‌شده آفلاین و روش بازیابی کنترل‌شده حفظ کنید؛ گواهی عمومی/fingerprint را می‌توان ثبت کرد.

## گام ۲ — تنظیم موقت متغیرها
در همان ترمینال امن (هیچ رمزی را به command-line literal وارد نکنید تا در history نماند):

```bash
export ROSTAM_DIRECT_KEYSTORE="$HOME/.config/nabard-rostam/keys/app-signing.jks"
export ROSTAM_DIRECT_KEY_ALIAS="nabard-rostam-app"
read -r -s -p "Store password: " ROSTAM_DIRECT_STORE_PASSWORD; echo
export ROSTAM_DIRECT_STORE_PASSWORD
read -r -s -p "Key password: " ROSTAM_DIRECT_KEY_PASSWORD; echo
export ROSTAM_DIRECT_KEY_PASSWORD
```

چهار متغیر محیطی فقط هنگام اجرای محلی Gradle خوانده می‌شوند؛ هیچ کدام در فایل tracked Gradle، `gradle.properties`، آرگومان `-P...`، commit یا log نوشته نشوند. روی رایانه مشترک/ناامن امضا نکنید.

## گام ۳ — تولید APK مستقل signed
از پوشه ریشه مخزن:

```bash
npm ci
npm run android:direct
```

این دستور assets وب را محلی بسته‌بندی و به Capacitor sync می‌کند، سپس `:app:assembleDirectRelease` را اجرا می‌کند. در نبود رمز/کلید معتبر build باید **متوقف** شود؛ fallback به unsigned ندارد.

خروجی معتبر پس از **راستی‌آزمایی `apksigner` و `aapt`** به این مسیر کپی می‌شود:

```text
release-out/rostams-battle-1.0.0-vc1-direct-signed.apk
release-out/rostams-battle-1.0.0-vc1-direct-signed.apk.sha256
```

`release-out/` در `.gitignore` است و فایل توزیعی فقط پس از تأیید نسخه، امضا و checksum آماده است. تغییر عدد نسخه در `android/version.properties` به‌صورت دستی و کنترل‌شده انجام می‌شود. برای هر انتشار واقعیِ جدید `versionCode` را افزایش دهید؛ با نسخه تکراری نمی‌توان به‌روزرسانی واقعی انجام داد.

برای راستی‌آزمایی مجدد فایل ساخته‌شده:

```bash
npm run android:verify-direct -- release-out/rostams-battle-1.0.0-vc1-direct-signed.apk
```

راستی‌آزمایی `apksigner` (امضای معتبر برای حداقل API 28)، شناسه برنامه و شماره نسخه را کنترل می‌کند و SHA-256 خروجی را چاپ می‌کند. مقدار SHA-256 گواهی App Signing در خروجی `apksigner --print-certs` **عمومی** است؛ آن را با گواهی همان کلید و بعداً با fingerprint **App Signing certificate** در Play مقایسه کنید (نه Upload certificate). SHA-256 فایل APK و fingerprint گواهی امضا دو مقدار متفاوت‌اند.

## گام ۴ — نصب واقعی و آزمون مستقل APK
1. فقط روی دستگاه تحت اختیار و با اجازه آزمایش، کابل USB و Developer Options/USB Debugging را فعال کنید.
2. `adb devices` باید دستگاه `device` نشان دهد.
3. نسخه signed را نصب کنید:

```bash
adb install -r release-out/rostams-battle-1.0.0-vc1-direct-signed.apk
adb shell pm path io.github.abolfazl.nabardrostam
```

4. روی **APK نصب‌شده، نه مرورگر**: ورود از صفحه اصلی به یک نبرد کامل، چندلمسی، صدا، Landscape، حالت آفلاین، Pause و ذخیره رکورد را بررسی و مدل گوشی/نسخه Android/نسخه System WebView/نتیجه را ثبت کنید. **حذف اپ ممکن است تمام داده محلی را پاک کند**.
5. اگر فایل نصب‌شده از قبل با امضای متفاوت (مثلاً APK دیگری با همین شناسه) باشد، `INSTALL_FAILED_UPDATE_INCOMPATIBLE` محتمل است؛ بدون بررسی داده و مالکیت، `adb uninstall` نکنید.

## گام ۵ — آزمایش به‌روزرسانی درجا (بدون حذف سیو)
این آزمون نیازمند **دو APK واقعی** است که هر دو با **همان کلید** امضا شده‌اند. پیش از ساخت نسخه دوم، یک رکورد داخل نسخه اول ثبت و تصویر/مقدار آن را نگه دارید.

1. نسخه اول را نصب و بازی کنید، رکورد را ثبت کنید.
2. `android/version.properties` را برای نسخه **جدیدتر** افزایش دهید، مثلاً `versionCode=2` و `versionName=1.0.1`؛ بدون تعویض keystore، `npm run android:direct` را دوباره اجرا کنید.
3. نسخه جدید را با `adb install -r release-out/rostams-battle-1.0.1-vc2-direct-signed.apk` روی همان دستگاه نصب کنید؛ **اپ را حذف نکنید و Clear Data نزنید**.
4. بازشدن اپ، رکورد نسخه قبلی، تنظیمات و اثر نسخه روی `adb shell dumpsys package io.github.abolfazl.nabardrostam` را بررسی کنید.
5. شواهد Pass/Fail و گواهی عمومی دو نسخه را در #44 و موضوع ذخیره در #39 ثبت کنید؛ **تا قبل از اجرای واقعی این آزمون، ارتقای نسخه تأییدشده تلقی نشود**.

**تست Direct ↔ Play** بعداً و فقط پس از وجود حساب Play Console و دریافت APK توزیعی Play قابل اثبات است (#39، #45، #53، #54). هر دو مسیر با versionCode بالاتر نیازمند تست هستند؛ صرف یکسان بودن applicationId کافی نیست.

## امنیت و محدودیت‌های باقی‌مانده
- GitHub Actions موجود فقط Debug و Release **بدون امضا** را در PR می‌سازد؛ این PR به هیچ workflow غیرقابل اعتماد دسترسی به کلید App Signing نمی‌دهد. برای امضای ابری آینده، #46 باید محیط محافظت‌شده دارای تأیید دستی یا runner خصوصی و fail-closed داشته باشد.
- قبل از انتشار عمومی: مجوزها و امنیت WebView (#41)، آیکون/Splash (#42)، مالکیت دارایی‌ها (#50)، و آزمون QA دستگاه‌ها (#34، #35، #40) باید نهایی شوند.
- وجود حساب Google Play Console **برای APK مستقیم ضروری نیست**؛ اما برای AAB/Play و تطبیق امضای دو کانال ضروری خواهد بود.

**مرجع قرارداد امضا:** [SIGNING_STRATEGY.md](SIGNING_STRATEGY.md). کلید خصوصی و رمز فقط نزد ناشر هستند.
