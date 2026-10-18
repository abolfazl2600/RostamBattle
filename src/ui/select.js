// Character select (#select, ui lane). DW8 officer select over the live battlefield: the focused officer's actual voxel
// model (kit.model on its own rig, idle clip, cloth/hair chains) stands at the foot of the pass on the right third of the frame,
// backlit by the low sun, a warm firelight key on his front (world.js stage-key), the field behind in deep bokeh (post.js DoF focused on him), slow turntable, a spin-in on
// every focus change and warm dust motes drifting through the light. Left: the focused officer's faction banner
// (CHARS[id].side {zh, en}, default 蜀 Shu Han) over a compact roster (a row per officer: pixel portrait, brush name,
// romanisation, seal; up to 7 fit), the info panel (brush name, courtesy name, epithet, weapon, bio, 攻/防/速/射程 bars,
// Musou name) and the intro line as vertical calligraphy beside the model. All data comes from CHARS / CHAR_ORDER
// (src/chars/index.js), nothing per-hero. Roster: the chapter's CH.heroes (story), else CHAR_ORDER (trial / free; ids
// not in CHARS are left out). Records (core/progress.js): each card carries the officer's best rank on this chapter /
// trial at the picked difficulty, and the line between the header and info his record there (rank, fastest clear, most
// KOs), leaving the officer's body clear. The info column scrolls below that line (a new focus returns to its top);
// at ≤ 4:3 it and the roster tighten to keep the model visible. An officer the records have not opened yet (UNLOCKS)
// can be looked at but not deployed: 鎖 on his card, his rule on that line.
// Input: hover only highlights a card; a click (tap) on a card focuses that officer (spin-in, info panel swaps), ↑/↓ /
// d-pad too. Deploy = 出陣 button, Enter / A, or a double-click on the card that was already focused.
// ctx in: { mode, ch, map? }. Deploy → ink wipe → flow.go('loading', { ...ctx, char }) (loading.js); back → title.
// 3D is render-only: view(scene, camera, focus, dt) runs after the gameplay camera rig while this screen is up; an
// officer's model is built the first time he is focused (kept for the session).
import * as THREE from 'three';
import { viewport, gamePoint } from '../core/viewport.js';
import { on } from '../core/events.js';
import { CHARS, CHAR_ORDER, paintPortrait } from '../chars/index.js';
import { sampleClip, POSE_SIZE } from '../hero/rig.js';
import { createNav, sfx, inkWipe, wiping, afterWipe, stamp, clearStamp, replay } from './menu.js';
import { SWASH, STAGE as TITLE } from './title.js';
import { modeLabel } from './loading.js';
import { difficulty } from '../core/difficulty.js';
import { best, locked } from '../core/progress.js';
import { chapter } from '../story/chapters.js';
import { OFFICERS_FA, officerFa, difficultyFa, unlockFa, modeLabelFa } from '../i18n/fa.js';
import { dotTex, scatter, stagePoint, standOfficer, poseOfficer } from './stage.js';

const STATS = [['atk', 'حمله', 'قدرت'], ['def', 'دفاع', 'مقاومت'], ['speed', 'سرعت', 'چابکی'], ['range', 'بُرد', 'فاصله']];
// stage framing: officer ≈ 6.3 m from the lens, 30° vFOV (full body + headroom), aim shifted so he stands at x ≈ 75 %
// (clear of the info column, which ends at ≈ 60 %)
const STAGE = { dist: 6.3, eye: 1.2, aim: 1.05, fov: 30, screenX: 0.5, face: Math.PI - 0.38, sway: 0.28, spin: 1.35, motes: 110 };
// key-art frame (snapshot for the loading card / result, main.js snapArt): closer, knees up, the title's held pose
const KEYART = { dist: 4.3, eye: 1.35, aim: 1.3, screenX: 0.42 };
const ALL = CHAR_ORDER.filter((id) => CHARS[id]), SHU = { zh: 'شو', en: 'پادشاهی شو هان' };
const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export function createSelect(el, flow) {
  el.innerHTML = `
    <div class="s-veil"></div>
    <header class="s-head"><h2>انتخاب شخصیت</h2><small>جنگجوی خود را انتخاب کنید</small><span class="s-mode"><b></b><small></small></span></header>
    <aside class="s-roster"><div class="s-fac"><i></i><small></small></div>
      <div class="s-list" tabindex="0" aria-label="فهرست شخصیت‌ها">${ALL.map((id) => { const c = CHARS[id]; return `<button class="s-card" data-id="${id}" style="--acc:${c.accent}" title="${officerFa(id)} — برای شروع، دوبار کلیک کنید">
        <canvas width="20" height="20"></canvas><b>${officerFa(id)}</b><small>${OFFICERS_FA[id].title}</small><i>${OFFICERS_FA[id].seal}</i><em class="t-rk"></em></button>`; }).join('')}</div><small class="s-scroll-hint" hidden>برای دیدن شخصیت‌های بیشتر بکشید ↓</small>
    </aside>
    <article class="s-info">
      <div class="s-name"><h1></h1><div><i class="s-seal"></i><p class="s-court"></p></div></div>
      <p class="s-en"></p>
      <p class="s-epi"><b></b><small></small></p>
      <p class="s-wpn"><span>سلاح</span><b></b><small></small></p>
      <p class="s-bio"></p>
      <ul class="s-stats">${STATS.map(([k, zh, en]) => `<li data-k="${k}"><b>${zh}</b><small>${en}</small><span>${[0, 1, 2, 3, 4].map((j) => `<i style="--i:${j}"></i>`).join('')}</span></li>`).join('')}</ul>
      <div class="s-musou"><span>قدرت ویژهٔ موسو</span><b></b><small></small>${SWASH}</div>
    </article>
    <div class="s-line"><p></p><small></small></div>
    <p class="s-rec"><span>رکورد</span><b></b><small></small></p>
    <div class="s-act"><button class="s-back"><b>بازگشت</b><small>قبلی</small></button><button class="s-go"><b>شروع نبرد</b><small>اعزام به میدان</small></button></div>
    <footer class="ui-foot"><span><kbd>↑</kbd><kbd>↓</kbd>تغییر شخصیت<small>جابجایی</small></span><span><kbd>Click</kbd>انتخاب<small>تأیید</small></span>
      <span><kbd>Enter</kbd><kbd class="pad">A</kbd>شروع<small>ورود به نبرد</small></span><span><kbd>Esc</kbd><kbd class="pad">B</kbd>بازگشت<small>قبلی</small></span>
      <span><kbd>Drag</kbd>چرخش<small>نمایش مدل</small></span></footer>`;
  const $ = (s) => el.querySelector(s), cards = {};
  for (const b of el.querySelectorAll('.s-card')) { cards[b.dataset.id] = b; paintPortrait(b.querySelector('canvas'), CHARS[b.dataset.id]); }
  let ctx = {}, ids = ALL, cur = ALL[0], busy = false, spinT = 0;   // ids: this visit's roster; cur: the focused id

  const list = $('.s-list'), hint = $('.s-scroll-hint');
  const updateOverflow = () => { hint.hidden = list.scrollHeight <= list.clientHeight + 1; };
  new ResizeObserver(updateOverflow).observe(list);
  on('viewport', () => requestAnimationFrame(updateOverflow));

  // ---- 2D: info panel
  function show(i, quiet) {
    const id = ids[(i + ids.length) % ids.length];
    if (id === cur && !quiet) return;
    cards[cur].classList.remove('on'); cur = id; cards[cur].classList.add('on');
    // DOM focus follows the selection (a clicked card kept focus and its ring after ↑/↓: two cards looked lit)
    if (document.activeElement?.classList.contains('s-card')) cards[cur].focus({ preventScroll: true });
    replay(cards[cur], 'pick');                           // the chosen card flashes in
    cards[cur].scrollIntoView({ block: 'nearest', inline: 'nearest' });
    updateOverflow();
    const c = CHARS[id], side = c.side || SHU;
    el.style.setProperty('--acc', c.accent);
    $('.s-fac i').textContent = side.en === 'Iran' ? 'ایران' : (side.en === 'Warlords' ? 'جنگ‌سالاران' : 'شو'); $('.s-fac small').textContent = OFFICERS_FA[id].side;
    $('.s-name h1').textContent = officerFa(id);
    $('.s-seal').textContent = OFFICERS_FA[id].seal;
    $('.s-court').textContent = `نام ادبی: ${OFFICERS_FA[id].courtesy}`;
    $('.s-en').textContent = `${OFFICERS_FA[id].title} · ${OFFICERS_FA[id].motto}`;
    $('.s-epi b').textContent = OFFICERS_FA[id].title; $('.s-epi small').textContent = 'لقب جنگجو';
    $('.s-wpn b').textContent = OFFICERS_FA[id].weapon; $('.s-wpn small').textContent = 'سلاح اصلی';
    $('.s-bio').innerHTML = OFFICERS_FA[id].bio.map((z) => `<span>${z}</span>`).join('');
    for (const li of el.querySelectorAll('.s-stats li')) {
      const n = c.stats[li.dataset.k];
      li.querySelectorAll('i').forEach((q, k) => q.classList.toggle('f', k < n));
    }
    $('.s-musou b').textContent = OFFICERS_FA[id].musou; $('.s-musou small').textContent = 'مهارت نهایی';
    $('.s-line p').textContent = OFFICERS_FA[id].intro; $('.s-line small').textContent = OFFICERS_FA[id].motto;
    // the line above the info: his unlock rule while locked, else his record here at this difficulty
    const lk = locked(id), d = difficulty(), r = ctx.mode !== 'free' && best(ctx.ch, id, d.id);
    const [zh, en] = lk ? [unlockFa(id).rule, 'شخصیت قفل است'] : r ? [`رتبه ${r.rank} · زمان ${mmss(r.time)} · ${r.kos} شکست`, `بهترین رکورد در سطح ${difficultyFa(d.id).name}`] : ['هنوز رکوردی ثبت نشده است', `سطح ${difficultyFa(d.id).name}`];
    $('.s-rec').hidden = !lk && ctx.mode === 'free';
    $('.s-rec').classList.toggle('lock', !!lk); $('.s-go').classList.toggle('lock', !!lk);
    $('.s-go').setAttribute('aria-disabled', String(!!lk));
    $('.s-rec span').textContent = lk ? 'قفل' : 'رکورد'; $('.s-rec b').textContent = zh; $('.s-rec small').textContent = en;
    $('.s-info').scrollTop = 0;
    replay(el, 'swap');                                    // name ink-in, stat bars refill, voice line brush reveal
    spinT = 0;
    if (!quiet) sfx('move');
  }

  const go = () => {
    if (busy) return;
    if (wiping()) return afterWipe(go);             // pressed while this screen is still being uncovered: queued
    if (locked(cur)) return sfx('back');
    busy = true;
    stamp($('.s-act'), 'برو');
    const id = cur;
    setTimeout(() => inkWipe(() => flow.go('loading', { mode: ctx.mode, ch: ctx.ch, map: ctx.map, char: id })), 520);
  };
  const back = () => {
    if (busy) return;
    if (wiping()) return afterWipe(back);
    busy = true; sfx('back');
    inkWipe(() => flow.go('title'));
  };
  const nav = createNav({ move: (d) => { if (!busy) show(ids.indexOf(cur) + d); }, ok: go, back });

  // click a card = focus it; a double-click deploys only if the first click landed on the already-focused card
  let armed = false;
  el.addEventListener('click', (e) => {
    const card = e.target.closest('.s-card');
    if (card) {
      if (busy) return;
      const i = ids.indexOf(card.dataset.id);
      if (card.dataset.id !== cur) { show(i); armed = false; }
      else if (e.detail >= 2 && armed) go();
      else armed = true;
    } else if (e.target.closest('.s-go')) go();
    else if (e.target.closest('.s-back')) back();
  });
  // drag anywhere off the panels turns the officer (eased back to the pose when let go)
  let drag = null, userYaw = 0;
  const stopDrag = () => {
    const p = drag; drag = null;
    if (p) try { if (el.hasPointerCapture(p.id)) el.releasePointerCapture(p.id); } catch { /* detached */ }
  };
  el.addEventListener('pointerdown', (e) => {
    if (el.hidden || drag || e.button !== 0 || e.target.closest('button, .s-info, .s-roster, .s-head, .ui-foot')) return;
    drag = { id: e.pointerId, x: gamePoint(e.clientX, e.clientY).x }; el.setPointerCapture(e.pointerId); e.preventDefault();
  });
  el.addEventListener('pointermove', (e) => {
    if (drag?.id !== e.pointerId) return;
    const p = gamePoint(e.clientX, e.clientY);
    userYaw += (p.x - drag.x) * 0.012; drag.x = p.x; e.preventDefault();
  });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) el.addEventListener(type, (e) => { if (drag?.id === e.pointerId) stopDrag(); });
  addEventListener('blur', stopDrag); addEventListener('pagehide', stopDrag); on('viewport', stopDrag);
  if (viewport.touch) $('.ui-foot').textContent = 'شخصیت را لمس کنید، سپس شروع نبرد؛ برای چرخش مدل، روی میدان بکشید.';

  // ---- 3D: officer stage (render-only; an officer is meshed when first focused, kept for the session)
  let group = null, motes = null, t = 0, keyart = false, key = null, keyHome = null;
  const models = {}, pose = new Float32Array(POSE_SIZE), P = new THREE.Vector3(), tmp = new THREE.Vector3();
  const model = (id) => models[id] || (models[id] = standOfficer(id, group));
  function build(scene) {
    group = new THREE.Group(); scene.add(group);
    // dust motes: soft round sprites, warm HDR white so the brightest catch a little bloom in the backlight
    const n = STAGE.motes, pos = new Float32Array(n * 3), seed = scatter(n * 3);
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    motes = new THREE.Points(geo, new THREE.PointsMaterial({ map: dotTex(0.4, 0.35), size: 0.035, color: new THREE.Color(2.2, 1.7, 1.1),
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    motes.userData.seed = seed; motes.frustumCulled = false;
    group.add(motes);
    // warm key: one of the world's firelights (world.js 'stage-key') moved to his front-left while this screen is up, so
    // his face and the ground round his feet catch fire-glow against the backlit field (same light count: no recompile)
    key = scene.getObjectByName('stage-key');
    keyHome = key && key.position.clone();
  }

  function view(scene, camera, focus, dt) {
    if (!group) build(scene);
    group.visible = true;
    dt = Math.min(dt || 1 / 60, 0.1); t += dt; spinT += dt;
    const S = STAGE, p = stagePoint(P, 'select'), id = cur;   // def.stage.select (定軍山: the foot of the pass road, looking up it)
    for (const k in models) models[k].root.visible = k === id;
    const M = model(id);
    if (key) key.position.set(p.x + 1.6, p.y + 2.3, p.z - 2.4);
    // idle clip, turntable sway + spin-in (easeOutCubic) + the player's drag, eased home when let go
    if (drag === null) userYaw *= Math.exp(-2.5 * dt);
    const u = Math.min(1, spinT / 0.75), spin = S.spin * (1 - u) ** 3;
    const ka = keyart && TITLE.cast.find((c) => c.id === id), F = ka ? KEYART : S;
    if (ka) sampleClip(M.K.clips[ka.clip], ka.u, pose);
    else sampleClip(M.K.clips.idle, (t % 2.5) / 2.5, pose);
    poseOfficer(M, pose, p, ka ? ka.face : S.face + Math.sin(t * 0.35) * S.sway + spin + userYaw, dt);
    // motes: a 5 × 3 × 4 m box around him, rising slowly with a lazy sideways drift, wrapping at the top
    const a = motes.geometry.attributes.position, sd = motes.userData.seed;
    for (let i = 0; i < S.motes; i++) {
      const sx = sd[i * 3], sy = Math.abs(sd[i * 3 + 1]), sz = sd[i * 3 + 2];
      const y = (sy * 3.2 + t * (0.05 + sy * 0.08)) % 3.2;
      a.setXYZ(i, p.x + sx * 2.6 + Math.sin(t * 0.4 + i) * 0.25, p.y + y, p.z + sz * 2 + Math.cos(t * 0.3 + i * 1.7) * 0.2);
    }
    a.needsUpdate = true;
    // camera: in front of him (toward -Z, looking up the field into the sun), aim shifted to screen-left so he stands
    // at x ≈ 68 %; DoF focus on his chest
    const aspect = camera.aspect, side = F.screenX * F.dist * Math.tan(S.fov * Math.PI / 360) * aspect;
    camera.fov = S.fov; camera.updateProjectionMatrix();
    camera.position.set(p.x + side * 0.3, p.y + F.eye, p.z - F.dist);
    tmp.set(p.x + side, p.y + F.aim, p.z);
    camera.lookAt(tmp);
    camera.updateMatrixWorld();
    focus.set(p.x, p.y + 1.1, p.z);
  }

  return {
    view,
    /** main.js snapArt: true for one render = the key-art frame of the focused officer. */
    keyart(v) { keyart = v; },
    enter(c) {
      ctx = c; busy = false; armed = false; clearStamp($('.s-act'));
      const [zh, en] = modeLabel(c);
      const d = difficulty();
      $('.s-mode b').textContent = `${modeLabelFa(c)} · ${difficultyFa(d.id).name}`; $('.s-mode small').textContent = 'انتخاب جنگجو';
      // this visit's roster: the chapter's heroes (story) or everyone (trial / free); the focus stays if he is in it
      const want = (c.mode !== 'free' && chapter(c.ch).CH.heroes) || ALL;
      // Only the Ashkabus story exposes Rostam; Free Battle and trials retain the original seven.
      ids = ALL.filter((id) => want.includes(id) && (id !== 'rostam' || (c.mode === 'story' && c.ch === 'ashkabus')));
      if (!ids.length) ids = ALL.filter((id) => id !== 'rostam'); // legacy fallback excludes Rostam
      for (const id in cards) {                             // 鎖 on a locked officer, else his best rank here on this tier
        const lk = !!locked(id), r = (!lk && c.mode !== 'free' && best(c.ch, id, d.id)?.rank) || '', chip = cards[id].querySelector('.t-rk');
        cards[id].hidden = !ids.includes(id); cards[id].classList.toggle('lock', lk);
        chip.textContent = lk ? 'قفل' : r; chip.className = `t-rk r${r}`;
      }
      if (!ids.includes(cur)) { cards[cur].classList.remove('on'); cur = ids[0]; }
      show(ids.indexOf(cur), true); replay(el, 'in');       // header, roster and actions slide in as the ink uncovers
      nav.start(); requestAnimationFrame(() => { updateOverflow(); cards[cur].scrollIntoView({ block: 'nearest', inline: 'nearest' }); });
    },
    exit() { stopDrag(); nav.stop(); drag = null; if (group) group.visible = false; if (key) key.position.copy(keyHome); },
  };
}
