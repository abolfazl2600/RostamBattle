// Loading card (#loading, ui lane). 出陣 on the select screen ink-wipes into this card (so does 再戰 on the result), then
// main.js deploy() sets the battle up for the chosen officer under it — kit views built, every material compiled, a few
// frames rendered — and ink-wipes on into the prologue (story) or the battle (free / retry). So the field is never seen
// with the wrong officer and the first battle frames don't stall on shader compiles.
// Layout (DW loading card): the officer's key art full-bleed (ctx.art: the select stage's key-art still, main.js snapArt)
// with a slow push-in and rising embers, an ink band on the left with the chapter band, brush name + red seal, the intro
// line; a tip (心得) and a gold brush-stroke progress bar with the current set-up stage along the bottom. No art (dev
// entry): the plain background.
// ctx in: { mode ('story' | 'trial' | 'free'), ch, char, art? }. main.js drives progress(p, zh?, en?) and ready(); nothing here touches the sim.
import { CHARS } from '../chars/index.js';
import { replay } from './menu.js';
import { difficulty } from '../core/difficulty.js';
import { chapter } from '../story/chapters.js';
import { OFFICERS_FA, officerFa, modeLabelFa, difficultyFa } from '../i18n/fa.js';

/** [zh, en] band label for a flow ctx: the chapter (story), the trial, or the battlefield (free: the chapter ctx.ch's
 *  field). */
export function modeLabel(c) {
  const { CH } = chapter(c.ch);
  return [modeLabelFa(c), c.mode === 'free' ? 'موج‌های بی‌پایان دشمن' : 'آماده‌سازی میدان نبرد'];
}
// [zh, en, char id | undefined = any officer] — keep in step with the controls table (title.js CONTROLS)
const TIPS = [
  ['با فشردن پیاپی J زنجیرهٔ ضربات بزنید؛ سپس K را برای حملهٔ قدرتی فشار دهید.', 'ترکیب حمله‌ها'],
  ['وقتی نوار طلایی پر شد، با I قدرت موسو را آزاد کنید.', 'قدرت ویژه'],
  ['با L یا Shift جاخالی دهید؛ هنگام غلت‌زدن از بسیاری ضربه‌ها در امانید.', 'دفاع و حرکت'],
  ['برای تنظیم مجدد دوربین یا تمرکز روی نزدیک‌ترین فرمانده، R را بزنید.', 'دوربین'],
  ['برای کنترل دوربین با موس روی میدان کلیک کنید؛ Q و E هم زاویه را تغییر می‌دهند.', 'کنترل دوربین'],
  ['با نگه‌داشتن K یا کلیک راست نشانه بگیرید و با رهاکردن آن تیر پرتاب کنید.', 'ویژهٔ هوانگ ژونگ', 'huangzhong'],
  ['با نشانه‌گیری به سر دشمن، آسیب بیشتری وارد کنید.', 'شلیک دقیق', 'huangzhong'],
];

export function createLoading(el) {
  el.innerHTML = `
    <div class="l-art"></div><div class="l-embers"></div><div class="l-veil"></div>
    <section class="l-main">
      <p class="l-ch"><b></b><small></small></p>
      <div class="l-name"><h1></h1><i class="l-seal"></i></div>
      <p class="l-en"></p>
      <p class="l-line"><b></b><small></small></p>
    </section>
    <footer class="l-foot">
      <p class="l-tip"><span>نکته</span><b></b><small></small></p>
      <div class="l-prog"><p class="l-state"><b></b><small></small></p><div class="l-bar"><i></i></div></div>
    </footer>`;
  const $ = (s) => el.querySelector(s), bar = $('.l-bar i');
  const state = (zh, en) => { $('.l-state b').textContent = zh; $('.l-state small').textContent = en; };
  return {
    enter(c) {
      const ch = CHARS[c.char] || CHARS.zhaoyun, [zh, en] = modeLabel(c);
      el.style.setProperty('--acc', ch.accent);
      $('.l-art').style.backgroundImage = c.art ? `url("${c.art}")` : 'none';
      el.classList.remove('ready'); replay(el, 'in');
      const d = difficulty();
      $('.l-ch b').textContent = `${zh} · ${difficultyFa(d.id).name}`; $('.l-ch small').textContent = en;
      $('.l-name h1').textContent = officerFa(ch.id); $('.l-seal').textContent = ch.seal;
      $('.l-en').textContent = OFFICERS_FA[ch.id].title;
      $('.l-line b').textContent = OFFICERS_FA[ch.id].intro; $('.l-line small').textContent = OFFICERS_FA[ch.id].motto;
      const tips = TIPS.filter((t) => !t[2] || t[2] === ch.id), t = tips[Math.floor(Math.random() * tips.length)];   // UI only, not the sim
      $('.l-tip b').textContent = t[0]; $('.l-tip small').textContent = t[1];
      state('آماده‌سازی نبرد', 'آرایش سپاه');           // first stage label; deploy() then climbs 點將 → 佈陣 → 整軍備戰
      this.progress(0.06);
    },
    exit() {},
    /** p 0..1 plus the stage's label: real set-up stages (main.js deploy). */
    progress(p, zh, en) { bar.style.transform = `scaleX(${p})`; if (zh) state(zh, en); },
    ready() { el.classList.add('ready'); state('آمادهٔ نبرد', 'ورود به میدان'); },
  };
}
