# استراتژی امضای Android — قرارداد امضا و ساخت Direct APK (#43 و #44)

> **وضعیت:** زیرساخت امضای **Direct APK** با وظیفه صریح و fail-closed در شاخه پیاده‌سازی #43/#44 فراهم شده است. ساخت کلید خصوصی ناشر، تولید APK امضاشده با آن کلید، آزمون نصب/ارتقا، Play Console و AAB **هنوز انجام یا تأیید نشده‌اند**. [راهنمای اجرایی مستقیم](DIRECT_APK.md).

## تصمیم ثابت

- **برنامه رسمی برای هر دو کانال:** `io.github.abolfazl.nabardrostam`.
- **APK Direct:** خروجی مستقل و امضاشده با **App Signing Key** اختصاصی ناشر؛ قابل تولید بدون راه‌اندازی Play Console.
- **AAB Play:** خروجی مستقل و امضاشده با **Upload Key متفاوت** برای ارسال به Play Console.
- **APK نصب‌شده از Google Play:** توسط Play App Signing با **همان App Signing Key** نسخه Direct امضا شود.
- برای نخستین پیکربندی Play App Signing، به‌جای «Google-generated app signing key» گزینه **ارائه کلید App Signing از پیش ایجادشده توسط ناشر** انتخاب شود؛ روش انتقال امن کلید مطابق راهنمای خود Play Console (مانند PEPK در صورت ارائه) باشد.
- **هدف:** نصب/ارتقای نسخه جدیدتر از هر یک از کانال‌های Direct و Play بدون حذف اپ و رکوردها. این هدف هنوز با دستگاه واقعی آزمایش نشده است.
- **Debug:** بسته آزمایشی با شناسه توسعه‌ای مجزا و کلید Debug؛ هرگز با خروجی رسمی یا کلید Release اشتباه نشود. شناسه توسعه فعلی در `capacitor.config.json` برابر `io.github.abolfazl2600.voxelgame.dev` است؛ تصمیم باز برای هماهنگ‌سازی نهایی آن در #34.

## دو مسیر مستقل

```text
                   منبع مشترک بازی / build:web / Android Native
                                         |
                          +--------------+--------------+
                          |                             |
             اجرای مستقل Direct APK       اجرای مستقل Play AAB
                          |                             |
           Release signing: App Key          Upload signing: Upload Key
                          |                             |
               signed-direct.apk              signed-play.aab
                          |                             |
               نصب / GitHub Release             ارسال به Play Console
                                                        |
                                             Google Play App Signing
                                             با همان App Signing Key
                                                        |
                                              APK تحویلی به دستگاه
```

ساخت یک خروجی نباید به ساخت هم‌زمان دیگری وابسته باشد. مقدار `versionCode` و هویت محصول باید در هر دو مسیر از منبع واحد و هماهنگ دریافت شوند. فایل مرجع نسخه در پروژه `android/version.properties` است؛ مسیر Play هنگام پیاده‌سازی #45 باید همین منبع را استفاده کند.

## نسخه‌بندی و به‌روزرسانی بین دو کانال

1. `applicationId` نصب نهایی هر دو کانال دقیقاً `io.github.abolfazl.nabardrostam` باشد (بررسی `applicationId` واقعی APK و خروجی `bundletool`).
2. fingerprint گواهی امضای Direct APK با **App signing certificate** ثبت‌شده در Play Console مطابقت داشته باشد؛ **Upload certificate** نباید به جای آن به‌کار رود.
3. `versionCode` نسخه جدیدتر باید از نسخه قبلی نصب‌شده بیشتر باشد؛ برای دو کانال **یک قرارداد نسخه‌بندی مشترک** داشته باشید. نسخه منتشرنشده با `versionCode` بالاتر می‌تواند مانع جایگزینی با نسخه Play قدیمی‌تر شود؛ امکان downgrade عمومی را فرض نکنید.
4. WebView origin (`https://localhost`)، مسیر/شناسه داده و schema ذخیره ثابت بمانند، یا برای تغییرشان migration ایمن ایجاد شود. وجود امضای یکسان **به‌تنهایی** حفاظت از رکوردها را تضمین نمی‌کند.
5. نصب مستقیم و جابه‌جایی کانال ممکن است تحت سیاست‌های نصب، تحویل نسخه و محدودیت‌های توزیع دستگاه/Play قرار گیرد؛ هر دو جهت واقعاً با `adb` و نصب از Play بررسی شوند، نه صرفاً با شباهت SHA-256 گواهی.

## مدیریت کلید و امنیت

- کلید **App Signing** برای این بازی اختصاصی و مستقل از اپ‌های قبلی ایجاد شود. رمز، کلید خصوصی، `.jks` یا فایل export رمزنگاری‌شده نباید در Git/Issue/PR/artifact عمومی ثبت شود.
- کلید **Upload** جدا باشد؛ از قابلیت reset آن در Play برای سناریوی مفقودی استفاده شود. از دست رفتن کلید App Signing که برای Direct استفاده می‌شود، امکان تولید آپدیت Direct با همان گواهی را به خطر می‌اندازد.
- محل مالکیت کلید، پشتیبان امن آفلاین، بازیابی، دسترسی و تأیید دو مرحله‌ای عملیات انتشار پیش از ساخت Release تعیین شود.
- اگر Direct APK در GitHub Actions امضا می‌شود، کلید App Signing تنها در **Environment حفاظت‌شده با approval دستی** و دسترسی حداقلی، نه از PR/forkهای نامطمئن، قابل استفاده باشد؛ در غیر این صورت امضای Direct به محیط خصوصی/runner محافظت‌شده واگذار شود. Upload Key نیز فقط به job مخصوص AAB داده شود.
- اگر secrets لازم موجود نیست، job Release باید **fail closed** باشد؛ هیچ APK/AAB unsigned با برچسب release منتشر نشود.
- fingerprintهای **عمومی** App Signing/Upload، نتیجه `apksigner verify --verbose --print-certs`، checksum artifact و `versionCode` در گزارش منتشر شوند. اطلاعات خصوصی در log چاپ نشود.

## شرایط پذیرش و اثبات

- [ ] مالک کلیدها و روش نگهداری/پشتیبان و دسترسی مشخص شده است؛ App Signing Key و Upload Key دو کلید مجزا هستند.
- [ ] Native Gradle با شناسه رسمی Release و شناسه جداگانه Debug ساخته و با نصب واقعی راستی‌آزمایی شده است.
- [ ] Direct APK مستقل امضا، verify، نصب و درجا با APK امضاشده جدیدتر به‌روزرسانی شده است (#44).
- [ ] AAB مستقل با Upload Key امضا شده و در نخستین تنظیم Play App Signing **کلید موجود ناشر** انتخاب و گواهی تطبیق داده شده است (#45، #53).
- [ ] GitHub Actions یا runner خصوصی برای هر خروجی جدا و درخواستی ساخته شده؛ isolation کلیدها، approval و fail-closed آزمایش شده است (#46).
- [ ] تست تغییر کانال **Direct → Play** و **Play → Direct** با `versionCode` بالاتر، همراه بررسی حفظ رکوردهای `localStorage` انجام و گزارش شده است (#39، #54).
- [ ] پیش از اولین آپلود، امکان ثبت شناسه در Play Console و هویت ناشر تأیید شده است (#32).
- [ ] تطبیق امضای نهاییِ تحویلی Google Play و Direct طبق fingerprint عمومی ثبت شده است.

## منابع رسمی

- https://developer.android.com/studio/publish/app-signing
- https://developer.android.com/guide/app-bundle/faq
- https://support.google.com/googleplay/android-developer/answer/9842756
- https://developer.android.com/studio/publish/versioning

**توجه:** طراحی و ابزارهای ساخت Direct APK به‌معنی وجود بسته امضاشده یا تأیید QA نیست؛ ایجاد/نگهداری کلید توسط مالک و اجرای واقعی امضا و نصب هنوز لازم‌اند. راهنما: [DIRECT_APK.md](DIRECT_APK.md).
