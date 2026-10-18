// Battle result (#result), DW8 style: the battlefield stays frozen behind an ink wash; the hero's portrait and a big
// brush 勝利 / 敗北, then the tallies count up one by one (KOs, max chain, time, damage taken), the rank stamps in (win:
// S/A/B/C, rules in index.js rank()), and the chapter's epilogue (its EPILOGUE, chapters.js) closes it.
// Win → 繼續 (title, opened on the chapter panel at the next chapter; a trial: on the trial panel at that trial). Defeat → 再戰 (the loading card, then straight
// back into the battle, no prologue) or 返回 (title). The defeat line is the fail reason when a `fail` beat lost it.
// Every exit is an ink wipe (ui lane menu.js). ctx.art (the officer's key-art still, main.js snapArt) fills the right side.
// Keys (menu.js createNav, + gamepad): Enter / Space press the focused button (← → move between them), Esc → title.
// The battle's difficulty rides beside VICTORY / DEFEAT. Records (ctx.rec, core/progress.js record(), wins only): a
// tally that beat the officer's best on this chapter / trial and tier is marked 新紀錄 over the old value, a better rank
// 更新; under the tallies, one compact block shows what the win opened — the next chapter on a first clear, and each
// UNLOCKS entry. Three notices fit above the epilogue and bottom prompts at 720p (16:9 and 4:3).
// ctx in: { win, stats: { kos, time, hpMax, maxChain, dmg, rank? }, reason?: {zh, en}, mode ('story' | 'trial'), ch,
// char, art?, diff (core/difficulty.js tier), rec?: { first, prev, fresh, unlocks } }.
import { viewport } from '../core/viewport.js';
import { CHARS, paintPortrait } from '../chars/index.js';
import { chapter, nextStory } from './chapters.js';
import { inkWipe, afterWipe, createNav } from '../ui/menu.js';
import { officerFa, stageFa, difficultyFa, unlockFa } from '../i18n/fa.js';
import { epilogueFa } from '../i18n/narrative-fa.js';
import { battleTextFa } from '../i18n/battle-fa.js';

const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export function createResult(el, flow) {
  let ctx = {}, raf = 0, gone = false, next = null;          // next: the chapter 繼續 opens the title on
  // one exit per visit; pressed while this screen is still being uncovered it is queued (afterWipe), not dropped
  const leave = (mid) => { if (!gone) { gone = true; afterWipe(() => inkWipe(mid)); } };
  el.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.act === 'retry') leave(() => flow.go('loading', { mode: ctx.mode, ch: ctx.ch, char: ctx.char, art: ctx.art, retry: true }));
    else if (b.dataset.act === 'next') leave(() => flow.go('title', { mode: ctx.mode, ch: next }));
    else leave(() => flow.go('title'));
  });
  const nav = createNav({
    move: (d) => { const bs = [...el.querySelectorAll('button')], i = bs.indexOf(document.activeElement); bs[(i + d + bs.length) % bs.length]?.focus(); },
    ok: () => (el.querySelector('button:focus') || el.querySelector('button'))?.click(),
    back: () => leave(() => flow.go('title')),
  });

  return {
    enter(c) {
      ctx = c; gone = false;
      const { win, stats: s } = c, ch = CHARS[c.char] || CHARS.zhaoyun, C = chapter(c.ch), { CH } = C;
      const epi = epilogueFa(CH.id, ch.id) || (C.EPILOGUE[ch.id] || Object.values(C.EPILOGUE)[0]).en, after = c.mode === 'story' ? nextStory(CH.id) : null;   // a trial: no next
      const R = c.rec, was = R?.prev;                        // records: what this win beat (was: the cell before it)
      const notices = [R?.first && after ? `<p class="rs-unlock">${stageFa(after.CH.id).num} «${stageFa(after.CH.id).title}» باز شد<small>مرحلهٔ جدید در دسترس است</small></p>` : '',
        ...(R?.unlocks || []).map((u) => `<p class="rs-unlock">${unlockFa(u.id).name} باز شد<small>محتوای جدید در دسترس است</small></p>`)].join('');
      next = after ? after.CH.id : CH.id;
      const why = c.reason ? battleTextFa(c.reason.en, c.reason.zh) : `${officerFa(ch.id)} از پا افتاد و پیشروی سپاه متوقف شد.`;
      // [zh, en, value, format, the record it beat (fresh) → its old value]
      const rows = [
        ['دشمنان شکست‌خورده', 'تعداد شکست‌ها', s.kos, (v) => v, R?.fresh.kos && was.kos],
        ['بیشترین ضربات پیاپی', 'زنجیرهٔ حمله', s.maxChain, (v) => v],
        ['مدت نبرد', 'زمان', s.time, mmss, R?.fresh.time && mmss(was.time)],
        ['آسیب دریافتی', 'خسارت', Math.round(s.dmg || 0), (v) => v],
      ];
      el.className = `scr ${win ? 'win' : 'lose'}${c.art ? ' art' : ''}`;
      el.style.setProperty('--art', c.art ? `url("${c.art}")` : 'none');
      el.innerHTML = `<div class="rs">
        <div class="rs-head"><div class="rs-badge"><canvas width="20" height="20"></canvas></div>
          <div><small>${stageFa(CH.id).num} · ${stageFa(CH.id).title}</small><h2>${win ? 'پیروزی' : 'شکست'}</h2><em>${win ? 'مأموریت انجام شد' : 'مأموریت ناموفق بود'}</em>${c.diff ? `<span class="rs-dif">${difficultyFa(c.diff.id).name}<small>درجهٔ سختی</small></span>` : ''}</div></div>
        <div class="rs-body">
          <table class="rs-stats">${rows.map(([zh, en, , , old], i) => `<tr style="--i:${i}"><th>${zh}<small>${en}</small></th><td>0</td><td class="rs-new">${
            old ? `<b>رکورد جدید</b><small>${old}</small>` : ''}</td></tr>`).join('')}</table>
          ${win && s.rank ? `<div class="rs-rank r${s.rank}"><span>رتبه<small>ارزیابی</small></span><b>${s.rank}</b>${R?.fresh.rank ? `<em>${was.rank} ← ${s.rank} ارتقا</em>` : ''}</div>` : ''}
        </div>
        ${notices ? `<div class="rs-unlocks">${notices}</div>` : ''}
        <div class="rs-epi">${win
          ? epi.map((z) => `<p>${z}</p>`).join('')
          : `<p>${why}</p>`}</div>
        <div class="rs-btns">${win
          ? c.mode === 'story' ? `<button data-act="next">${after ? 'ادامه' : 'بازگشت به داستان'}<small>${after ? 'مرحلهٔ بعد' : 'فهرست فصل‌ها'}</small></button><button data-act="retry" class="sub">تکرار نبرد<small>همین فصل</small></button>` : '<button data-act="next">ادامه<small>مرحلهٔ بعد</small></button>'
          : '<button data-act="retry">تلاش دوباره<small>تکرار نبرد</small></button><button data-act="title" class="sub">بازگشت<small>منوی اصلی</small></button>'}</div>
      </div>
      <footer class="ui-foot">${win ? '' : '<span><kbd>←</kbd><kbd>→</kbd>انتخاب<small>جابجایی</small></span>'}
        <span><kbd>Enter</kbd>تأیید<small>انتخاب</small></span><span><kbd>Esc</kbd>بازگشت<small>منوی اصلی</small></span></footer>`;
      if (viewport.touch) el.querySelector('.ui-foot').textContent = 'برای ادامه یا بازگشت، دکمه را لمس کنید.';
      paintPortrait(el.querySelector('canvas'), ch);
      // tallies count up in turn (0.7 s each, 0.35 s apart, after the title lands)
      const tds = [...el.querySelectorAll('.rs-stats td:not(.rs-new)')], t0 = performance.now() + 700;
      const tick = (now) => {
        let busy = false;
        rows.forEach(([, , v, fmt], i) => {
          const u = Math.max(0, Math.min(1, (now - t0 - i * 350) / 700));
          if (u < 1) busy = true;
          tds[i].textContent = fmt(Math.round(v * (1 - (1 - u) ** 3)));
        });
        if (busy) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      setTimeout(() => { if (!el.hidden) el.querySelector('button')?.focus({ preventScroll: true }); }, 50);
      nav.start();
    },
    exit() { cancelAnimationFrame(raf); nav.stop(); },
  };
}
