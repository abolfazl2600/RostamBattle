// Title screen (#title, ui lane). DW-style key art over the live battlefield: Zhao Yun in front (spear planted, free fist
// thrown up) and Huang Zhong half a metre behind and to the right, drawing toward the lens-right and looking into it, on
// their real voxel models (kit.model on their own rigs, cloth/hair chains), backlit by the low sun up the pass with the
// burning Wei camp, smoke over the right cliff, their 趙 / 黃 standards and rising embers behind them in deep bokeh, low
// sunlit haze over the ground under the menu; a slow push-in on enter (from farther back), then a breathing drift
// (+ a little mouse parallax). The lens is fitted every frame to the pair's posed bounds, so both stay whole in the
// column right of the logo/menu band at any window shape (16:9, ultrawide, 4:3).
// Render-only: view(scene, camera, focus, dt) runs after the gameplay camera rig while this screen is up (main.js header).
// 2D: ink scrim band on the left carrying the approved Persian text logo and the menu, officer name
// tags projected beside each officer's head (hidden at ≤ 4:3), key/pad prompts along the bottom. First boot shows a
// "press any key" card (also unlocks audio); returns go straight to the menu.
// Menu: 劇情模式 → the chapter panel in place of the menu (the four chapters in campaign order, story/chapters.js: a
// locked one shows 鎖, a cleared one its best rank; beside them a card: number, title + seal, era, the prologue's
// opening lines or the unlock rule, the chapter's officers each with his own best rank). 演武試煉 → the same panel as the
// trial list (story/trials.js TRIALS: the card shows the rule, the field and the best record; a trial the records have
// not opened yet shows 鎖 + its rule, core/progress.js) with 自由演武 as its last entry → the panel again as the
// battlefield list (every chapter's field, all open, no records). A pick → the difficulty panel (初級 普通 上級 修羅,
// each with the best rank won on it for that pick, + a card: the tier's line and 敵勢 / 敵將 / 傷害 pips; 修羅 shows its
// unlock rule while locked), confirm → select {mode, ch, map}. Esc steps back one panel at a time.
// 戰績 → the records wall (every chapter and trial × every officer: best rank and a pip per tier cleared, the count
// cleared, what is still locked and how to open it) · 操作說明 → controls panel (both: Esc back).
// Mouse: hover highlights an item, click activates it.
// Screen contract: createTitle(el, flow) → { enter(ctx), exit(), view } (src/main.js header). ctx.ch (result 繼續 after
// a win, with ctx.mode): open straight on that mode's panel, focused on that chapter / trial.
import { GAME_NAME_FA } from '../i18n/brand.js';
import { renderControlGuide } from './control-guide.js';
import { recordsModel, renderRecords } from './records-view.js';
import { ltr, numberFa } from './text.js';
import * as THREE from 'three';
import { on } from '../core/events.js';
import { viewport, gamePoint, gameRect } from '../core/viewport.js';
import { CHARS, CHAR_ORDER, paintPortrait } from '../chars/index.js';
import { sampleClip, POSE_SIZE, CH } from '../hero/rig.js';
import { heroLook } from '../hero/model.js';
import { createNav, sfx, inkWipe, wiping, afterWipe, stamp, clearStamp, replay } from './menu.js';
import { ground } from '../world/map.js';
import { dotTex, scatter, stagePoint, standOfficer, poseOfficer } from './stage.js';
import { DIFFS, unlocked, difficulty, setDifficulty } from '../core/difficulty.js';
import { best, records, locked, UNLOCKS } from '../core/progress.js';
import { CHAPTERS, STORY_CHAPTERS, storyAvailable } from '../story/chapters.js';
import { TRIALS } from '../story/trials.js';
import { storyMenuFa } from '../i18n/story-menu-fa.js';
import { OFFICERS_FA, officerFa, stageFa, difficultyFa, unlockFa, modeFa } from '../i18n/fa.js';

// brush swash drawn under the focused item (revealed left → right) — one tapered stroke, dry tail
export const SWASH = `<svg class="swash" viewBox="0 0 400 26" preserveAspectRatio="none" aria-hidden="true"><path d="M3 15C40 7 118 4 214 8
  S352 11 397 5L395 9C368 15 330 17 280 18C226 19 170 17 128 19C84 21 38 22 3 15ZM300 20C330 19 360 17 384 14L382 16C356 20 326 22 300 20Z"/></svg>`;

const ITEMS = [
  { go: 'story', zh: 'داستان', en: 'نبردهای سه پادشاهی' },
  { go: 'trial', zh: 'چالش‌ها', en: 'آزمون‌ها و نبرد آزاد' },
  { go: 'rec', zh: 'رکوردها', en: 'افتخارات شما' },
  { go: 'ctl', zh: 'راهنمای بازی', en: 'کلیدها و کنترل‌ها' },
  { go: 'settings', zh: 'تنظیمات', en: 'نمایش، کنترل و گرافیک' },
];
// the trial panel's last entry: not a trial (no records, no map of its own) — picking it opens the battlefield list
const FREE = { CH: { id: 'free', num: { zh: 'بی‌پایان', en: 'بی‌پایان' }, title: { zh: 'نبرد آزاد', en: 'نبرد آزاد' }, seal: '無盡',
  rule: { zh: 'هر شخصیت و میدان نبردی را انتخاب کنید؛ رکوردی ثبت نمی‌شود.', en: 'موج‌های بی‌پایان دشمنان' } } };
const LISTS = { story: STORY_CHAPTERS, trial: [...TRIALS, FREE], free: CHAPTERS };   // what the chapter panel lists per mode
const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
const rk = (r) => (r ? `<i class="t-rk r${r}">${ltr(r)}</i>` : '');                    // a rank as a ringed brush letter
export const CONTROLS = [
  ['حرکت', 'راه رفتن', '<kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> / کلیدهای جهت‌دار', 'آنالوگ چپ'],
  ['حمله', 'ضربهٔ معمولی', '<kbd>J</kbd> / کلیک چپ — چند بار برای زنجیرهٔ ضربات', '<kbd>X</kbd> □'],
  ['حملهٔ قدرتی', 'ضربهٔ پایانی', '<kbd>K</kbd> / کلیک راست — پس از ضربات معمولی', '<kbd>Y</kbd> △'],
  ['پرش', 'پریدن', '<kbd>Space</kbd>', '<kbd>A</kbd> ×'],
  ['جاخالی', 'دفاع با حرکت', '<kbd>L</kbd> / <kbd>Shift</kbd>', '<kbd>R1</kbd> <kbd>R2</kbd>'],
  ['موسو', 'قدرت ویژه', '<kbd>I</kbd> — پس از پر شدن نوار طلایی', '<kbd>B</kbd> ○'],
  ['دوربین', 'تغییر زاویهٔ دید', 'حرکت موس (پس از کلیک روی میدان) / <kbd>Q</kbd><kbd>E</kbd>', 'آنالوگ راست'],
  ['تنظیم دوربین', 'تمرکز روی فرمانده', '<kbd>R</kbd> — رو به نزدیک‌ترین فرمانده', '<kbd>L1</kbd> <kbd>L2</kbd>'],
  ['نشانه‌گیری', 'ویژهٔ هوانگ ژونگ', 'نگه‌داشتن <kbd>K</kbd> / کلیک راست، رهاکردن برای شلیک', 'نگه‌داشتن <kbd>Y</kbd> △'],
  ['توقف', 'مکث در نبرد', '<kbd>Esc</kbd> (رهاسازی نشانگر موس)', ''],
];

const TOUCH_GUIDE = ['جوی‌استیک پایین چپ', 'دکمهٔ حمله؛ چند بار برای کمبو', 'دکمهٔ قدرتی پس از حمله', 'دکمهٔ پرش', 'دکمهٔ جاخالی', 'دکمهٔ موسو پس از روشن شدن', 'کشیدن انگشت روی میدان خالی', 'دکمهٔ هدف', 'نگه‌داشتن قدرتی، کشیدن برای هدف و رهاکردن برای شلیک', 'دکمهٔ توقف بالای صفحه'];
export const controlRows = () => viewport.touch ? CONTROLS.map(([zh, en], i) => [zh, en, TOUCH_GUIDE[i], '']) : CONTROLS;

// ---- key-art stage. Frame: origin at the HOME map's def.stage.title point (定軍山: up its pass road, north of the idle
// gameplay hero), camera looks +Z (up the valley, into the low sun → rim light).
// Cast offsets in metres (x + = world +X = screen-left), face = yaw (0 = facing +Z, π = facing the camera), pose = a held
// frame of one of the kit's own clips. banner = the officer's surname standard planted behind him.
export const STAGE = {
  eye: 1.05, fov: 32,          // low heroic eye (m above the road), tilted up to the pair
  fitR: 0.975, fitT: 0.05, fitK: 0.97,   // framing (title.js view): right edge, top of the highest point, Zhao Yun's knees
  push: 0.22, pushT: 3.2,      // enter: start this much farther back and push in to the fitted frame over pushT s (the pair
                               // only grows into the frame: nothing is ever cropped mid-move)
  embers: 340,
  // Zhao Yun in front (arm: armL FK override, degrees — the fist straight up, clear of Huang Zhong); Huang Zhong half a
  // metre behind and right, drawing (the aim clip early in the draw: the string meets his hand in front of the chest, not
  // across his eyes), the arrow aimed toward the lens-right, head turned to the lens (root-space look override), his head
  // at Zhao Yun's shoulder line with air between them. x/z in metres; narrow = [x, z] on ≤ 4:3 windows (nk in view()).
  // tag = [x, y] rem from the head to the tag's bottom centre. banner = the surname standard behind its officer (DoF).
  cast: [
    { id: 'zhaoyun', clip: 'mu_act', u: 1, x: 0.2, z: 0, face: Math.PI + 0.1, arm: [-6, 0, 172, 8], look: [0.7, 1.8], tag: [-4.5, 6, 'L'], banner: [-0.2, 7.5] },
    { id: 'huangzhong', clip: 'aim', u: 5 / 30, x: -1.0, z: 0.7, face: Math.PI + 0.25, head: [-4, -10, 0], look: [1.0, 2.0], tag: [-1.5, -6],
      narrow: [-0.95, 0.5], banner: [-4.6, 10] },
  ],
};

// warm glows [x, y, z, width, height, r, g, b, flicker] in the stage frame (additive soft sprites, blurred by the DoF)
const GLOWS = [[1, 2.5, 30, 46, 16, 0.55, 0.24, 0.07], [-7, 1.2, 12, 9, 6, 0.9, 0.38, 0.08], [6, 0.8, 16, 7, 4, 0.7, 0.3, 0.06],
  [11, 3.5, 22, 26, 13, 0.42, 0.17, 0.05],        // backlit smoke-glow behind the logo side (screen-left), no dead black
  [-18, 7, 40, 34, 16, 0.55, 0.22, 0.05, 0.25], [-10, 4, 27, 14, 9, 0.7, 0.28, 0.06, 0.3],   // fires under the smoke, right
  // low sunlit smoke and fire bounce over the empty ground under the logo / menu (screen-left), slow breathing
  [4, 0.5, 12, 14, 2.2, 0.32, 0.15, 0.05, 0.08], [9, 1.0, 20, 24, 3.6, 0.3, 0.14, 0.05, 0.08], [2.5, 0.35, 7, 9, 1.4, 0.34, 0.15, 0.05, 0.08]];

// smoke from the burning camp [x, y, z, width, height, r, g, b, opacity]: soft normal-blended plumes over the backlit
// cliff at the top-right (it read as a black block with sky specks through its blurred voxels), lit warm from below by
// the fires above; drifting slowly
const SMOKE = [[-17, 16, 40, 38, 24, 0.2, 0.1, 0.06, 0.9], [-26, 22, 46, 44, 26, 0.24, 0.12, 0.07, 0.85], [-9, 12, 34, 22, 14, 0.26, 0.13, 0.07, 0.6],
  [-29, 25, 52, 42, 26, 0.22, 0.11, 0.07, 0.85]];

export function createTitle(el, flow) {
  el.classList.add('menu-refined');
  el.innerHTML = `
    <div class="t-veil"></div><p class="t-status" role="status" hidden></p><button type="button" class="t-back">بازگشت</button>
    ${STAGE.cast.map(({ id }) => { const c = CHARS[id]; return `<div class="t-tag" style="visibility:hidden" data-id="${id}"><i>${OFFICERS_FA[id].seal}</i><b>${officerFa(id)}</b><small>${OFFICERS_FA[id].title}</small></div>`; }).join('')}
    <div class="t-band">
      <div class="t-logo"><p class="brand-kicker">بازی اکشن وکسل</p><h1 data-t="${GAME_NAME_FA}"><span>${GAME_NAME_FA}</span></h1></div>
      <div class="t-press"><b>${viewport.touch ? 'برای شروع صفحه را لمس کنید' : 'برای شروع یک کلید فشار دهید'}</b><small>${viewport.touch ? 'بازی در حالت افقی' : '<kbd>Enter</kbd> ورود به بازی'}</small></div>
      <nav class="t-menu t-main">${ITEMS.map((it, i) => `<button data-i="${i}" style="--i:${i}"><b>${it.zh}</b><small>${it.en}</small>${SWASH}</button>`).join('')}</nav>
      <div class="t-cpanel"><nav class="t-menu t-chs"></nav>
        <div class="t-ccard"><h3></h3><p class="t-cname"><b></b><i></i></p><p class="t-cera"></p>
          <div class="t-cdetail" role="region" aria-label="جزئیات گزینه" tabindex="0"><p class="t-cline"><b></b><small></small></p>
            <p class="t-cfoot"></p></div></div></div>
      <div class="t-dpanel"><nav class="t-menu t-dif">${DIFFS.map((d, i) => `<button data-d="${i}" style="--i:${i}"><b>${difficultyFa(d.id).name}<i class="t-lk">قفل</i><i class="t-rk"></i></b><small>درجهٔ سختی</small>${SWASH}</button>`).join('')}</nav>
        <div class="t-dcard"><h3>سختی بازی<small>انتخاب درجهٔ سختی</small></h3><p class="t-dline"><b></b><small></small></p>
          <ul class="s-stats t-dbars">${[['فشار دشمن', 'تعداد مهاجمان'], ['فرماندهان', 'قدرت افسران'], ['آسیب', 'شدت ضربات']].map(([zh, en]) => `<li><b>${zh}</b><small>${en}</small><span>${'<i></i>'.repeat(5)}</span></li>`).join('')}</ul></div></div>
    </div>
    <section class="t-ctl title-panel" role="region" aria-labelledby="controls-heading" tabindex="0" hidden></section>
    <section class="t-rec title-panel" role="region" aria-labelledby="records-heading" tabindex="0" hidden></section>
    `;
  const $ = (s) => el.querySelector(s), btns = [...el.querySelectorAll('.t-main button')], dbtns = [...el.querySelectorAll('.t-dif button')];
  const tags = [...el.querySelectorAll('.t-tag')];
  let cur = 0, pre = true, panel = null, busy = false, dcur = 1, dmode = null;   // panel: 'ctl' | 'rec' overlay; dmode: the mode picked, while the difficulty panel is up
  let cmode = null, ccur = 0, cpick = 0, cbtns = [], list = CHAPTERS;   // cmode: 'story' | 'trial' | 'free' while the chapter / trial / battlefield panel (its list) is up

  const focus = (i, quiet) => {
    i = (i + btns.length) % btns.length;
    if (i === cur && btns[i].classList.contains('on')) return;
    btns[cur].classList.remove('on'); cur = i; btns[cur].classList.add('on');
    const list = $('.t-main'), listBox = gameRect(list), buttonBox = gameRect(btns[cur]);
    if (buttonBox.top < listBox.top) list.scrollTop -= listBox.top - buttonBox.top;
    else if (buttonBox.bottom > listBox.bottom) list.scrollTop += buttonBox.bottom - listBox.bottom;
    if (!quiet) sfx('move');
  };
  /** Why entry i of the panel's list can't be picked yet ([zh, en]), or null: a story chapter waits on the one before
   *  it, a trial on the records (progress.js UNLOCKS); battlefields are all open. */
  const lockOf = (i) => {
    if (cmode === 'story') return storyAvailable(list[i].CH.id) ? null : ['این فصل هنوز منتشر نشده است', 'به‌زودی'];
    return cmode === 'trial' && locked(list[i].CH.id) ? [unlockFa(list[i].CH.id).rule, 'چالش قفل است'] : null;
  };
  // chapter panel: the card shows the focused chapter (story: era, the prologue's opening, its officers each with his
  // best rank), trial (its field, rule and best record) or battlefield (free); a locked one: what opens it
  const cfocus = (i, quiet) => {
    i = (i + cbtns.length) % cbtns.length;
    if (i === ccur && cbtns[i].classList.contains('on')) return;
    ccur = i; cbtns.forEach((b, k) => b.classList.toggle('on', k === i));
    const { CH, PROLOGUE } = list[i], story = cmode === 'story', trial = cmode === 'trial', lock = lockOf(i);
    const presentation = story ? storyMenuFa(CH.id) : stageFa(CH.id);
    const p = PROLOGUE?.find((q) => q.cols), field = CHAPTERS.find((m) => m.CH.map === CH.map)?.CH.title;
    const [zh, en] = lock || [presentation.description, story ? 'نمونهٔ موقت با محتوای دینگ‌جون' : trial ? 'قانون چالش' : 'نبرد بی‌پایان'];
    $('.t-ccard').classList.toggle('lock', !!lock);
    $('.t-ccard h3').innerHTML = cmode === 'free' ? 'میدان نبرد<small>انتخاب نقشه</small>' : `${presentation.num}<small>${modeFa(cmode)}</small>`;
    $('.t-cname b').textContent = presentation.title; $('.t-cname i').textContent = stageFa(CH.id).seal;
    $('.t-cera').innerHTML = !trial ? `${stageFa(CH.id).era}<small>زمان نبرد</small>` : field ? `میدان · ${stageFa(CH.map).title}<small>نقشه</small>` : '';
    $('.t-cline b').textContent = zh; $('.t-cline small').textContent = en;
    // foot: a chapter's officers, each with his own best rank; a trial's best record (the stat it is ranked on first)
    const who = story ? CH.heroes.filter((id) => CHARS[id]) : [], b = trial && best(CH.id);
    $('.t-cfoot').innerHTML = who.length ? `<span>شخصیت‌ها<small>قابل بازی</small></span>${who.map((id) => `<em><canvas width="20" height="20"></canvas>${officerFa(id)}${rk(best(CH.id, id)?.rank)}</em>`).join('')}`
      : b ? `<span>بهترین<small>رکورد ثبت‌شده</small></span>${(CH.best === 'kos' ? [`${numberFa(b.kos)} شکست`, ltr(mmss(b.time))] : [ltr(mmss(b.time)), `${numberFa(b.kos)} شکست`]).map((t) => `<em>${t}</em>`).join('')}<strong class="r${b.rank}"><b>${b.rank}</b></strong>` : '';
    el.querySelectorAll('.t-cfoot canvas').forEach((cv, k) => paintPortrait(cv, CHARS[who[k]]));
    $('.t-cdetail').scrollTop = 0; // A newly focused chapter starts with its own description visible.
    if (viewport.touch && !quiet) cbtns[i].scrollIntoView({ block: 'nearest' });
    if (!quiet) sfx('move');
  };
  /** Open the chapter panel for mode ('story' | 'trial' | 'free'; null closes it), focused on entry id (default: story
   *  = the furthest open chapter, else the first). */
  const setCh = (mode, id) => {
    cmode = mode; el.classList.toggle('chp', !!mode); el.classList.toggle('story-chapters', mode === 'story');
    if (mode) {
      const story = mode === 'story';
      list = LISTS[mode];
      $('.t-chs').innerHTML = list.map(({ CH }, i) => {
        const meta = story ? storyMenuFa(CH.id) : stageFa(CH.id), closed = !!lockOf(i);
        return `<button data-c="${i}" aria-disabled="${closed}" class="${closed ? 'lock' : ''}" style="--i:${i}"><b>${story ? `<em>${meta.num}</em>` : ''}${meta.title}<i class="t-lk">${story ? 'به‌زودی' : 'قفل'}</i>${mode === 'free' || (story && closed) ? '' : rk(best(CH.id)?.rank)}</b><small>${story ? closed ? 'این فصل هنوز منتشر نشده است' : 'نمونهٔ موقت با محتوای دینگ‌جون' : meta.description}</small>${SWASH}</button>`;
      }).join('');
      cbtns = [...el.querySelectorAll('.t-chs button')];
      let k = list.findIndex((m) => m.CH.id === id);
      if (k < 0) k = story ? list.findIndex((m) => storyAvailable(m.CH.id)) : 0;
      cfocus(k, true);
    }
    measure();                                          // the band changed width: the key art glides
  };
  // The same readers and eligible stage/hero pairs as the historical table; no writes/migration.
  function wall() {
    const model = recordsModel({
      groups: [{ id: 'story', label: 'فصل‌های داستانی', stages: STORY_CHAPTERS.map(m => ({ ...m, available: storyAvailable(m.CH.id) })) },
        { id: 'trials', label: 'چالش‌ها', stages: TRIALS }],
      heroes: CHAR_ORDER, diffs: DIFFS, records, best, locked, unlocks: UNLOCKS,
    });
    $('.t-rec').innerHTML = renderRecords(model);
    el.querySelectorAll('.t-rec [data-portrait]').forEach(cv => paintPortrait(cv, CHARS[cv.dataset.portrait]));
  }
  const guide = () => { $('.t-ctl').innerHTML = renderControlGuide(viewport.touch, CONTROLS); };
  guide();
  const setPanel = v => {
    panel = v; el.classList.toggle('ctl', v === 'ctl'); el.classList.toggle('rec', v === 'rec');
    $('.t-band').inert = !!v;
    $('.t-ctl').hidden = v !== 'ctl'; $('.t-rec').hidden = v !== 'rec';
    if (v === 'rec') wall();
    if (v) { const region = v === 'ctl' ? $('.t-ctl') : $('.t-rec'); region.scrollTop = 0; region.focus({ preventScroll: true }); }
    else if (active) btns[cur].focus({ preventScroll: true });
  };
  const scrollPanel = d => {
    const region = panel === 'ctl' ? $('.t-ctl') : $('.t-rec');
    region.scrollBy({ top: d * Math.max(48, region.clientHeight * .35), behavior: 'instant' });
  };
  // difficulty panel: the card shows the focused tier (a locked 修羅: its unlock rule instead of the line)
  const dfocus = (i, quiet) => {
    i = (i + dbtns.length) % dbtns.length;
    if (i === dcur && dbtns[i].classList.contains('on')) return;
    dcur = i; dbtns.forEach((b, k) => b.classList.toggle('on', k === i));
    const d = DIFFS[i], open = unlocked(d), [zh, en] = open ? [difficultyFa(d.id).line, 'ویژگی‌های سطح'] : [unlockFa(d.id).rule, 'قفل است'];
    $('.t-dcard').classList.toggle('lock', !open);
    $('.t-dline b').textContent = zh; $('.t-dline small').textContent = en;
    el.querySelectorAll('.t-dbars li').forEach((li, k) => li.querySelectorAll('i').forEach((q, j) => q.classList.toggle('f', j < d.bars[k])));
    if (!quiet) sfx('move');
  };
  const setDif = (mode) => {
    dmode = mode; el.classList.toggle('dif', !!mode);
    if (!mode) return;
    dbtns.forEach((b, k) => {                             // each tier: its lock, the best rank won on it for this pick
      const r = (mode !== 'free' && best(list[cpick].CH.id, null, DIFFS[k].id)?.rank) || '', chip = b.querySelector('.t-rk');
      b.classList.toggle('lock', !unlocked(DIFFS[k])); chip.textContent = r; chip.className = `t-rk r${r}`;
    });
    dbtns[dcur].classList.remove('on'); dfocus(DIFFS.indexOf(difficulty()), true);
    measure();                                          // the band widened: the key art glides right (the tiers slide in: CSS)
  };
  const wake = () => { pre = false; el.classList.remove('pre'); sfx('ok'); };
  const ok = () => {
    if (busy) return;
    if (wiping()) return afterWipe(ok);
    if (pre) return wake();
    if (panel) return;
    if (dmode) {
      const d = DIFFS[dcur], mode = dmode, { CH } = list[cpick];
      if (!unlocked(d)) return sfx('back');
      setDifficulty(d); busy = true;
      stamp(dbtns[dcur], '✓');
      return setTimeout(() => inkWipe(() => flow.go('select', { mode, ch: CH.id, map: CH.map })), 380);
    }
    if (cmode) {
      if (cbtns[ccur].classList.contains('lock')) return sfx('back');
      sfx('ok');
      if (list[ccur] === FREE) return setCh('free');    // 自由演武: on to the battlefield list
      cpick = ccur; return setDif(cmode);
    }
    const it = ITEMS[cur];
    sfx('ok');
    if (it.go === 'settings') { nav.stop(); flow.openSettings(btns[cur], () => nav.start()); return; }
    if (it.go === 'ctl' || it.go === 'rec') setPanel(it.go); else setCh(it.go);
  };
  const back = () => {
    if (busy) return;
    if (wiping()) return afterWipe(back);
    if (pre) return wake();
    if (panel) { sfx('back'); setPanel(null); }
    else if (dmode) { sfx('back'); setDif(null); measure(); }
    else if (cmode) { sfx('back'); setCh(cmode === 'free' ? 'trial' : null, FREE.CH.id); }   // battlefields: back to the trial list
  };
  // "press any key": any key wakes the menu and is swallowed (capture, before the menu driver would act on it too)
  let active = false;
  addEventListener('keydown', (e) => { if (active && pre && !e.metaKey && !e.ctrlKey) { e.stopImmediatePropagation(); e.preventDefault(); wake(); } }, true);
  const pick = (d) => (dmode ? dfocus(dcur + d) : cmode ? cfocus(ccur + d) : focus(cur + d));
  const nav = createNav({ move: (d) => { if (pre) wake(); else if (panel) scrollPanel(d); else if (!busy) pick(d); }, ok, back });
  const point = (b, quiet) => (b.dataset.d ? dfocus(+b.dataset.d, quiet) : b.dataset.c ? cfocus(+b.dataset.c, quiet) : focus(+b.dataset.i, quiet));

  el.addEventListener('pointerover', (e) => {
    if (e.pointerType === 'touch') return;
    const b = e.target.closest('.t-menu button');
    if (b && !pre && !panel && !busy) point(b);
  });
  el.addEventListener('click', (e) => {
    if (pre) return wake();
    const jump = e.target.closest('[data-record-section]');
    if (jump) { $('.t-rec').querySelector(`[data-record-group="${jump.dataset.recordSection}"]`)?.scrollIntoView({ block: 'start' }); return; }
    if (e.target.closest('.t-back')) return back();
    const b = e.target.closest('.t-menu button');
    if (b) { if (panel) back(); else { point(b, true); ok(); } }
    else if (panel && !e.target.closest('.t-ctl, .t-rec')) back();
  });
  el.addEventListener('keydown', e => {
    if (!panel) return;
    if (e.target.closest('[data-record-section]') && ['Enter', 'Space'].includes(e.code)) { e.stopPropagation(); return; }
    if (['PageDown', 'PageUp', 'Home', 'End'].includes(e.code)) {
      e.preventDefault(); e.stopPropagation();
      const region = panel === 'ctl' ? $('.t-ctl') : $('.t-rec');
      if (e.code === 'Home' || e.code === 'End') region.scrollTop = e.code === 'Home' ? 0 : region.scrollHeight;
      else scrollPanel(e.code === 'PageDown' ? 2 : -2);
    }
  });
  // mouse parallax target (-1..1), eased in view()
  const ptr = { x: 0, y: 0, ex: 0, ey: 0 };
  el.addEventListener('pointermove', (e) => { const p = gamePoint(e.clientX, e.clientY); ptr.x = p.x / viewport.width * 2 - 1; ptr.y = p.y / viewport.height * 2 - 1; });

  // ---- 3D stage (render-only; built on the first view, hidden on exit, kept for the session)
  let group = null, embers = null, t = 0, enterT = 0;
  const cast = [], banners = [], glows = [], smoke = [];
  const pose = new Float32Array(POSE_SIZE), S0 = new THREE.Vector3(), P = new THREE.Vector3(), V = new THREE.Vector3(), Q = new THREE.Vector3();
  const BOX = [new THREE.Box3(), new THREE.Box3()];
  // left edge of the key art = right edge of the logo/menu band + a gutter (measured on resize, not per frame)
  let fitL = 0.45, fitLe = 0.45;   // measured, eased (a late webfont widens the band: the frame glides, never jumps)
  // menuR: right edge of the menu text (the name tag left of the spear stays clear of it); tagW: the tags' widths
  let menuR = 0; const tagW = [0, 0], tagH = [0, 0];
  const measure = () => {
    const r = gameRect($('.t-band')); if (r.width) fitL = Math.min(0.6, (r.right + viewport.height / 72 * 3) / viewport.width);
    menuR = Math.max(r.right, ...[...el.querySelectorAll('.t-menu b, .t-menu small, .t-dcard, .t-ccard')].map((e) => gameRect(e).right)) + viewport.height / 72 * 1.2;
    tags.forEach((e, i) => { tagW[i] = e.offsetWidth; tagH[i] = e.offsetHeight; });
  };
  let guideTouch = viewport.touch;
  on('viewport', () => {
    if (guideTouch !== viewport.touch) { guideTouch = viewport.touch; guide(); }
    $('.t-press b').textContent = viewport.touch ? 'برای شروع صفحه را لمس کنید' : 'برای شروع یک کلید فشار دهید';
    $('.t-press small').innerHTML = viewport.touch ? 'بازی در حالت افقی' : '<kbd>Enter</kbd> ورود به بازی'; measure();
  }); document.fonts?.ready.then(measure);

  function bannerTex(glyph) {
    const cv = document.createElement('canvas'); cv.width = 128; cv.height = 320;
    const g = cv.getContext('2d');
    const paint = () => {
      // weathered dye: smoke-dulled cream that darkens toward the hem, soot stains, a faded vermilion border
      const bg = g.createLinearGradient(0, 0, 0, 320);
      bg.addColorStop(0, '#bfa67a'); bg.addColorStop(0.55, '#9c835c'); bg.addColorStop(1, '#5a4530');
      g.fillStyle = bg; g.fillRect(0, 0, 128, 320);
      for (let i = 0; i < 26; i++) {                                                       // soot / water stains (fixed scatter)
        const r = (k) => Math.abs((Math.sin(i * 91.7 + k * 12.3) * 43758.5) % 1);
        g.fillStyle = `rgba(30,18,10,${(0.05 + r(3) * 0.1).toFixed(3)})`;
        g.beginPath(); g.ellipse(r(1) * 128, 60 + r(2) * 260, 6 + r(4) * 22, 4 + r(5) * 16, 0, 0, 7); g.fill();
      }
      // thin faded-vermilion hems (a wide dark border read as a black doorway frame round the cloth when backlit)
      g.fillStyle = '#a8442a'; g.fillRect(0, 0, 128, 10); g.fillRect(0, 0, 5, 320); g.fillRect(123, 0, 5, 320);
      for (let y = 300; y < 320; y += 4) g.clearRect(5 + ((y * 7) % 20), y, 110 - ((y * 13) % 30), 4);    // frayed hem
      g.fillStyle = '#140905'; g.font = '700 96px "Xingkai SC", "STXingkai", "HudBrush", serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(glyph, 64, 150);
      tex.needsUpdate = true;
    };
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
    paint();
    document.fonts?.load('700 96px HudBrush', glyph).then(paint, () => {});
    return tex;
  }
  function build(scene) {
    group = new THREE.Group(); scene.add(group);
    for (const c of STAGE.cast) {
      const o = standOfficer(c.id, group), m = o.m, parts = [];
      heroLook(m.material, ...c.look);          // key-art grade: brighter camera-side fill, hot sun rim (title copies only)
      // the raised fist: the dark glove went to a flat black cube against the sky; a firelit gauntlet here (title only)
      if (c.arm && m.meshes?.handL) m.meshes.handL.material = heroLook(new THREE.MeshStandardMaterial({ vertexColors: true,
        color: new THREE.Color(2.6, 2.3, 2), emissive: 0x5a2c10, roughness: 0.4, metalness: 0.35, flatShading: true }), 0.9, 2.4);
      // the body, weapon and cloth for the framing box (not the unculled world-space overlays: bow string etc.)
      o.root.traverse((e) => { if (e.isMesh && e.frustumCulled) parts.push(e); });
      cast.push(Object.assign(o, { c, parts }));
      // surname standard: pole + a nobori cloth (CPU wave on a 5 × 12 grid)
      const tex = bannerTex(CHARS[c.id].name.zh[0]);
      const cloth = new THREE.PlaneGeometry(1.15, 3.1, 4, 12);
      // low warm emissive = the low sun glowing through the cloth from behind (the camera sees its shaded face)
      const mat = new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: 0xffa060, emissiveIntensity: 0.3, side: THREE.DoubleSide,
        roughness: 0.95, flatShading: true, alphaTest: 0.5 });
      const mesh = new THREE.Mesh(cloth, mat), pole = new THREE.Mesh(new THREE.BoxGeometry(0.09, 6.2, 0.09), new THREE.MeshStandardMaterial({ color: 0x2e1d15, roughness: 0.8 }));
      group.add(mesh, pole);
      banners.push({ c, mesh, pole, base: Float32Array.from(cloth.attributes.position.array), ph: banners.length * 1.7 });
    }
    // embers: soft round sprites, HDR orange so they bloom; flicker via vertex colours
    const n = STAGE.embers, geo = new THREE.BufferGeometry(), seed = scatter(n * 4, 4.1).map(Math.abs);
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    embers = new THREE.Points(geo, new THREE.PointsMaterial({ map: dotTex(0.35, 0.5), size: 0.085, vertexColors: true,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    embers.userData.seed = seed; embers.frustumCulled = false;
    group.add(embers);
    // warm glow: the burning camp behind the pair and fires off to the sides (additive, soft, blurred further by the DoF)
    for (const [x, y, z, sx, sy, r, g2, b] of GLOWS) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: embers.material.map, color: new THREE.Color(r, g2, b), blending: THREE.AdditiveBlending,
        transparent: true, depthWrite: false, fog: false }));
      sp.scale.set(sx, sy, 1); sp.userData.at = [x, y, z]; glows.push(sp); group.add(sp);
    }
    for (const [x, y, z, sx, sy, r, g2, b, a] of SMOKE) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: embers.material.map, color: new THREE.Color(r, g2, b), opacity: a,
        transparent: true, depthWrite: false, fog: false }));
      sp.scale.set(sx, sy, 1); sp.userData.at = [x, y, z]; smoke.push(sp); group.add(sp);
    }
  }

  function view(scene, camera, focus, dt) {
    if (!group) build(scene);
    group.visible = true;
    dt = Math.min(dt || 1 / 60, 0.1); t += dt;
    const S = STAGE, O = stagePoint(S0, 'title');
    // narrower than 16:9 the art column shrinks: an officer with `narrow` [x, z] moves toward it (0 at 16:9, all of it at
    // ≤ 4:3), so the pair stays large without the silhouettes merging
    const nk = Math.min(1, Math.max(0, (1.78 - camera.aspect) / 0.45));
    // officers: a held frame of their own clip + breath (hips bob, chest swell) and the cloth/hair chains in the wind
    for (let i = 0; i < cast.length; i++) {
      const o = cast[i], c = o.c, br = Math.sin(t * 1.5 + i * 2.1);
      sampleClip(o.K.clips[c.clip], c.u, pose);
      if (c.arm) for (let k = 0; k < 4; k++) pose[CH.armL + k] = c.arm[k] * Math.PI / 180;   // key-art arm (free left arm FK)
      if (c.head) for (let k = 0; k < 3; k++) pose[CH.head + k] = c.head[k] * Math.PI / 180; // key-art look (root-space aim)
      pose[1] += br * 0.008; pose[9] += br * 0.02; pose[12] -= br * 0.015;
      const nx = c.narrow ? c.x + (c.narrow[0] - c.x) * nk : c.x, nz = c.narrow ? c.z + (c.narrow[1] - c.z) * nk : c.z;
      P.set(O.x + nx, 0, O.z + nz); P.y = ground(P.x, P.z);
      poseOfficer(o, pose, P, c.face + Math.sin(t * 0.4 + i) * 0.03, dt);
    }
    for (let i = 0; i < smoke.length; i++) {
      const [x, y, z] = smoke[i].userData.at;
      smoke[i].position.set(O.x + x + Math.sin(t * 0.06 + i * 2) * 1.5, O.y + y + Math.sin(t * 0.09 + i) * 0.8, O.z + z);
      smoke[i].material.rotation = Math.sin(t * 0.04 + i) * 0.15;
    }
    for (let i = 0; i < glows.length; i++) {
      const [x, y, z] = glows[i].userData.at;
      glows[i].position.set(O.x + x, O.y + y, O.z + z);
      const f = GLOWS[i][8] ?? 0.15, slow = f < 0.1;                    // haze breathes slowly, fires flicker
      glows[i].material.opacity = 1 - f + f * (slow ? Math.sin(t * 0.7 + i) : Math.sin(t * (3 + i * 2.3)) * Math.sin(t * 7.1 + i));
    }
    for (const b of banners) {
      const [bx, bz] = b.c.banner, x = O.x + bx, z = O.z + bz, gy = ground(x, z);
      b.pole.position.set(x, gy + 3.1, z);
      // front face toward the lens (rotation π: texture reads left-to-right), cloth hanging from the pole to screen-right
      b.mesh.position.set(x - 0.6, gy + 3.3, z + 0.11); b.mesh.rotation.y = Math.PI + 0.2;
      const a = b.mesh.geometry.attributes.position, B = b.base;
      for (let k = 0; k < a.count; k++) {
        const u = (B[k * 3] + 0.575) / 1.15, v = (1.55 - B[k * 3 + 1]) / 3.1;            // u 0 at the pole, v 0 at the top
        const w = u * 0.8 + v * 0.25;
        a.setXYZ(k, B[k * 3] + Math.sin(t * 2.2 + v * 4 + b.ph) * 0.03 * u, B[k * 3 + 1] - u * u * 0.08,
          Math.sin(t * 2.6 - u * 3.5 - v * 2 + b.ph) * 0.2 * w + Math.sin(t * 5.1 - u * 7 + b.ph) * 0.04 * w);
      }
      a.needsUpdate = true;                                                  // flatShading: normals from derivatives
    }
    // embers: a 14 × 5 × 12 m box around the pair and over the ground to screen-left, rising with a lazy curl, flickering,
    // wrapping at the top
    const ep = embers.geometry.attributes.position, ec = embers.geometry.attributes.color, sd = embers.userData.seed;
    for (let i = 0; i < S.embers; i++) {
      const a = sd[i * 4], b = sd[i * 4 + 1], c = sd[i * 4 + 2], d = sd[i * 4 + 3];
      const y = (b * 5 + t * (0.35 + c * 0.6)) % 5, life = y / 5;
      ep.setXYZ(i, O.x + 2 + (a - 0.5) * 14 + Math.sin(t * (0.6 + d) + i) * 0.4 + y * 0.25, O.y + y, O.z - 2.5 + c * 12 + Math.cos(t * 0.5 + i * 1.7) * 0.3);
      const f = (0.55 + 0.45 * Math.sin(t * (9 + d * 14) + i * 3.3)) * Math.sin(Math.PI * Math.min(1, life * 1.15)) * (0.6 + d);
      ec.setXYZ(i, 4.5 * f, 1.6 * f, 0.35 * f);
    }
    ep.needsUpdate = true; ec.needsUpdate = true;

    // camera: fitted every frame to the pair's posed bounds (any aspect): their union spans [fitL, S.fitR] of the width
    // (fitL = right of the logo/menu band), the highest point sits at S.fitT from the top and Zhao Yun's knees at S.fitK
    // (below them the ink strip: a deliberate crop). The lens looks straight up the valley (no yaw), tilted up from a low
    // eye; then the enter push-in (easeOutCubic, toward Zhao Yun), a slow breathing drift and eased mouse parallax.
    ptr.ex += (ptr.x - ptr.ex) * Math.min(1, dt * 2); ptr.ey += (ptr.y - ptr.ey) * Math.min(1, dt * 2);
    const aspect = camera.aspect, tH = Math.tan(S.fov * Math.PI / 360), tW = tH * aspect;
    // each extreme (highest point, leftmost, rightmost) is the part corner that projects farthest out from last frame's
    // lens (Q), fitted at that part's own nearer depth (spear tip, bow limb, the arrow reaching toward the lens): the
    // pair's mid-depth is up to a metre off for those, ~8 % of the frame this close
    if (!Q.z) Q.set(O.x, O.y + S.eye, O.z - 5.5);
    let top = 0, topZ = 0, pLx = 0, pLz = 0, pRx = 0, pRz = 0, sT = -Infinity, sL = -Infinity, sR = Infinity;
    const A = BOX[0], E = BOX[1];
    A.makeEmpty();
    for (let i = 0; i < 2; i++) for (const m of cast[i].parts) if (m.visible) {
      E.makeEmpty().expandByObject(m); if (!i) A.union(E);
      const d = 1 / Math.max(0.5, E.min.z - Q.z);
      if ((E.max.y - Q.y) * d > sT) { sT = (E.max.y - Q.y) * d; top = E.max.y; topZ = E.min.z; }
      if ((E.max.x - Q.x) * d > sL) { sL = (E.max.x - Q.x) * d; pLx = E.max.x; pLz = E.min.z; }
      if ((E.min.x - Q.x) * d < sR) { sR = (E.min.x - Q.x) * d; pRx = E.min.x; pRz = E.min.z; }
    }
    const zA = (A.min.z + A.max.z) / 2;
    fitLe += (fitL - fitLe) * Math.min(1, dt * 3);
    const L = fitLe, R = S.fitR, kL = (0.5 - L) * 2 * tW, kR = (0.5 - R) * 2 * tW;
    const knee = O.y + 0.5;
    const czW = (kL * pLz - kR * pRz - pLx + pRx) / (kL - kR);                           // width fit
    const czH = zA - (top - knee) / ((S.fitK - S.fitT) * 2 * tH);                        // height fit (at Zhao Yun's depth)
    let cz = Math.min(czW, czH);
    const gL = 1 / (2 * (pLz - cz) * tW), gR = 1 / (2 * (pRz - cz) * tW);
    let cx = (pLx * gL + pRx * gR - (1 - L - R)) / (gL + gR);                           // span centred in [L, R]
    const k = Math.min(1, (t - enterT) / S.pushT), push = S.push * (1 - k) ** 3;
    cz -= push * (zA - cz);
    cx += Math.sin(t * 0.13) * 0.08 - ptr.ex * 0.06;
    const cy = O.y + S.eye + Math.sin(t * 0.11) * 0.04 + ptr.ey * 0.04;
    // tilt: the knees on fitK (they stand on the ink strip) unless that would lift the highest point above fitT (height-
    // bound windows): then the top sits on fitT. Either way nothing leaves the top edge, on any frame of the push.
    const tilt = Math.max(Math.atan((top - cy) / (topZ - cz)) - Math.atan((0.5 - S.fitT) * 2 * tH),
      Math.atan((knee - cy) / (zA - cz)) - Math.atan((0.5 - S.fitK) * 2 * tH));
    camera.fov = S.fov; camera.updateProjectionMatrix();
    camera.position.set(cx, cy, cz); Q.set(cx, cy, cz);
    camera.lookAt(V.set(cx, cy + Math.tan(tilt) * 10, cz + 10));
    camera.updateMatrixWorld();
    focus.set(O.x + S.cast[0].x, O.y + 1.2, O.z + S.cast[0].z);
    // name tags in the air beside each silhouette: tag = [x, y] rem from the projected head (tag[2] 'L': from the pair's
    // leftmost point, the spear, at head height) to the tag's bottom centre; clear of the menu text and the frame edges
    const w = viewport.width, h = viewport.height, rem = h / 72;
    const placedTags = [];
    for (let i = 0; i < tags.length; i++) {
      const c = S.cast[i];
      cast[i].rig.joints.head.getWorldPosition(V);
      if (c.tag[2] === 'L') V.set(pLx, V.y, pLz);
      V.project(camera);
      const px = Math.max(menuR + 16 + tagW[i] / 2, Math.min(w - tagW[i] / 2 - 2 * rem, (V.x * 0.5 + 0.5) * w + c.tag[0] * rem));
      const py = Math.max(20 * rem, (0.5 - V.y * 0.5) * h + c.tag[1] * rem);
      const box = { left: px - tagW[i] / 2, right: px + tagW[i] / 2, top: py - tagH[i], bottom: py };
      const overlaps = placedTags.some(b => box.left < b.right + 12 && box.right > b.left - 12 && box.top < b.bottom + 12 && box.bottom > b.top - 12);
      const hidden = !!panel || w < 1000 || h < 520 || box.left < menuR + 12 || box.right > w - 16 || box.top < 16 || box.bottom > h - 70 || overlaps;
      tags[i].style.visibility = hidden ? 'hidden' : 'visible';
      if (!hidden) placedTags.push(box);
      tags[i].style.transform = `translate(${px.toFixed(1)}px, ${py.toFixed(1)}px) translate(-50%, -100%)`;
      // Validate the final DOM box as fonts/animations may have changed since measure().
      if (!hidden) {
        const actual = gameRect(tags[i]), band = gameRect($('.t-band'));
        if (actual.left < band.right + 12 && actual.right > band.left && actual.top < band.bottom && actual.bottom > band.top) tags[i].style.visibility = 'hidden';
      }
    }
  }

  return {
    view,
    enter(c = {}) {
      document.title = GAME_NAME_FA;
      if (c.ch || c.notice) pre = false;
      $('.t-status').textContent = c.notice || ''; $('.t-status').hidden = !c.notice;
      busy = false; clearStamp(el); dmode = null; el.classList.remove('dif'); setPanel(null);
      setCh(c.ch ? c.mode || 'story' : null, c.ch);                        // after a win: straight to the next chapter / the trial
      el.classList.toggle('pre', pre);
      focus(cur, true); btns[cur].classList.add('on');
      replay(el, 'in');                                                     // logo ink-in
      enterT = t; measure();
      for (const m of cast) m.fresh = true;
      nav.start(); active = true;
    },
    exit() { nav.stop(); busy = false; active = false; if (group) group.visible = false; },
  };
}
