import { TOUCH_ACTIONS } from './touch-layout.js';

export function renderControlGuide(touch, rows) {
  if (!touch) return `<h2 id="controls-heading">راهنمای کنترل‌ها</h2><p class="panel-intro">صفحه‌کلید، ماوس و دستهٔ بازی</p>
    <div class="desktop-controls">${rows.map(([name, detail, keys, pad]) => `<article class="control-row"><h3>${name}<small>${detail}</small></h3><p>${keys}</p>${pad ? `<p class="control-pad">دسته: ${pad}</p>` : ''}</article>`).join('')}</div>
    <p class="guide-note">حملهٔ معمولی را چند بار بزنید و سپس حملهٔ قدرتی را اضافه کنید. آرش کمانگیر با نگه‌داشتن قدرتی نشانه می‌گیرد و با رهاکردن شلیک می‌کند.</p>`;
  return `<h2 id="controls-heading">راهنمای کنترل لمسی</h2><p class="panel-intro">جای دکمه‌ها در میدان افقی؛ می‌توانید حرکت، دوربین و حمله را هم‌زمان کنترل کنید.</p>
    <figure class="touch-guide"><div class="guide-field" role="img" aria-label="جوی‌استیک پایین چپ، شش دکمهٔ مبارزه پایین راست، توقف بالا راست و حرکت دوربین با کشیدن روی فضای خالی میدان">
      <span class="guide-pause">توقف Ⅱ</span>
      <div class="guide-stick"><span>حرکت</span><i aria-hidden="true"></i><small>جوی‌استیک چپ</small></div>
      <div class="guide-look"><svg viewBox="0 0 100 65" aria-hidden="true"><path d="M12 32h76m-12-12 12 12-12 12M24 20 12 32l12 12M50 8v49m-8-41 8-8 8 8m-16 33 8 8 8-8"/></svg><b>دوربین</b><small>انگشت را روی فضای خالی میدان بکشید</small></div>
      <div class="guide-actions">${TOUCH_ACTIONS.map(a => `<span class="guide-action" data-guide-action="${a.id}" style="grid-column:${a.column};grid-row:${a.row}">${a.label}</span>`).join('')}</div>
    </div><figcaption>این تصویر راهنماست؛ دکمه‌های نبرد پس از ورود به میدان فعال می‌شوند.</figcaption></figure>
    <div class="guide-notes">
      <article><h3>حمله و کمبو</h3><p>حمله را پیاپی لمس کنید؛ میان زنجیره، «قدرتی» را بزنید.</p></article>
      <article><h3>نگه‌داشتن و رهاکردن</h3><p>برای آرش کمانگیر، قدرتی را نگه دارید؛ روی میدان برای نشانه‌گیری بکشید و برای شلیک رها کنید.</p></article>
      <article><h3>موسو و هدف</h3><p>موسو وقتی نوار طلایی پر است، روی زمین هستید و موسوی دیگری اجرا نمی‌شود آماده است. «هدف» دوربین را روی فرماندهٔ نزدیک تنظیم می‌کند.</p></article>
      <article><h3>پرش، جاخالی و توقف</h3><p>پرش و جاخالی هرکدام دکمهٔ خود را دارند. توقف بالای صفحه است؛ ادامهٔ نبرد فقط با انتخاب «ادامه» انجام می‌شود.</p></article>
    </div><p class="guide-states"><span>○ عادی</span><span>▣ نگه‌داشته</span><span>◇ آمادهٔ موسو</span><span>┄ موسو هنوز آماده نیست</span></p>`;
}
