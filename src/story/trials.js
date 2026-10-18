// Trials (演武試煉): score-attack battles in THE chapter format (./chapters.js header). The same director runs them, so
// a trial is only data — CH + BEATS + OFF / SPK / EPILOGUE — listed in TRIALS (the title's trial panel, in this order).
// What differs from a story chapter:
//   · no prologue (PROLOGUE / PL_MAP omitted) and no roster (CH.heroes omitted = every officer); the map's gates stay open
//   · the hero starts on the map's free-battle arena (def.spawn.free) unless CH.start says otherwise; CH.van omitted =
//     the free battle's allied block behind him, [] = alone
//   · CH.num is the list tag (試煉), CH.rule { zh, en } the card's line, CH.best 'time' | 'kos' the record the card leads
//     with (the rank formula is the chapters': CH.rank)
//   · positions may be ['hero', dx, dz] (metres from where the hero stands as the beat fires); `army: true` fields the
//     free battle's army round the arena (blocks, the foe army's named officers, waves on)
// Records are kept per officer × difficulty (core/progress.js). A trial stays locked while UNLOCKS there has an entry
// under its id that is still shut; one without an entry is open from the start.
// Rank pacing is measured by checks/trials-bot.mjs (real 60 Hz sim, input-only bots, seeds 1/2/3). Trial S additionally
// needs CH.rank.s: slay / hold ≤35% cumulative damage and the fastest third's time cutoff (hold: highest third's KOs, as
// survival time is fixed); gauntlet keeps the story bosses' HP and its own, estimated gate (see its pacing note).
import { OFF as CHANGBAN_OFF } from './changban.js';

const NUM = { zh: 'چالش', en: 'مأموریت ویژه' };
/** One epilogue for every officer (result.js: a missing hero = the first entry). */
const epi = (zh, en) => ({ any: { zh: [zh], en: [en] } });
/** n charging blocks fanned round the hero, d metres out (they run straight in). */
const surge = (n, d = 22) => Array.from({ length: n }, (_, k) => {
  const a = (k + 0.5) / n * Math.PI * 2;
  return { at: ['hero', Math.sin(a) * d, Math.cos(a) * d], n: 18, charge: true };
});

// 千人斬 — offence: a thousand KOs against the clock on the open plain before 汜水關.
const slay = {
  CH: {
    id: 'slay', num: NUM, title: { zh: 'شکست هزار دشمن', en: 'نبرد با هزار سرباز' }, seal: 'سرعت', map: 'hulao',
    army: { foe: 'dong', ally: 'liu' }, best: 'time',
    rule: { zh: 'در سه دقیقه هزار سرباز را شکست دهید؛ هرچه سریع‌تر، رتبه بهتر.', en: 'مهلت: سه دقیقه' },
    rank: { kos: [1000, 1000, 1000], time: [90, 115, 150], s: { time: 99, dmg: 0.35 } },
  },
  SPK: {}, OFF: {},
  // Pacing (normal, input-only bot, seeds 1/2/3; time/KOs/damage, captured on victory):
  // Zhang Fei 99/1012/70, 103/1004/50, 106/1004/70; Huang Zhong 107/1013/214, 86/1004/94, 100/1033/124.
  // Four A, two S. The fastest two of six finish ≤99 s; S also needs damage ≤140. 180 s leaves beginner headroom.
  BEATS: [
    {
      when: { wait: 30 }, army: true,
      obj: { zh: 'هزار سرباز را شکست دهید', en: 'هدف: ۱۰۰۰ دشمن', timer: 180 },
      fail: { when: { timer: true }, zh: 'زمان به پایان رسید…', en: 'مهلت چالش تمام شد' },
    },
    { when: { kos: 300 }, squads: surge(3), banner: { html: '<em>۳۰۰ دشمن</em> شکست خوردند', en: 'سیصد نفر', dur: 130 } },
    { when: { kos: 300 }, heal: 0.2, squads: surge(4), banner: { html: '<em>۶۰۰ دشمن</em> شکست خوردند', en: 'ششصد نفر', dur: 130 } },
    { when: { kos: 400 }, win: true, fail: null, morale: 1, banner: { html: '<em>هزار دشمن</em> شکست خوردند!', en: 'هدف انجام شد', dur: 260, big: true } },
  ],
  EPILOGUE: epi('یک سوار در برابر هزاران دشمن ایستاد.', 'همه عقب‌نشینی کردند.'),
};

// 死守 — defence: 長坂橋 for four minutes while 曹軍 comes on in ever heavier pushes (the bridgehead of chapter II,
// open to every officer; its defend point and bounds are that chapter's).
const DECK = ['bridge', 0, 8];
const hold = {
  CH: {
    id: 'hold', num: NUM, title: { zh: 'دفاع از پل', en: 'پل چانگ‌بان' }, seal: 'دفاع', map: 'changban',
    army: { foe: 'cao', ally: 'liu' }, best: 'kos',
    rule: { zh: 'چهار دقیقه از پل چانگ‌بان دفاع کنید؛ دشمنان بیشتری شکست دهید.', en: 'از پل محافظت کنید' },
    start: { x: 0, z: -121, yaw: 0, tilt: -0.06 },
    van: [{ x: -5, z: -142, n: 10, cols: 5, hold: true }, { x: 5, z: -142, n: 10, cols: 5, hold: true }],
    rank: { kos: [1200, 1700, 2400], time: [999, 999, 999], s: { kos: 2217, dmg: 0.35 } },  // fixed clock: KOs and damage decide
  },
  SPK: {}, OFF: CHANGBAN_OFF,
  // Pacing (normal, same seeds/policy; guard the northern bridge approach, actual walking, no rolls):
  // Fixed 241 s on the result (240 s hold + opening 0.5 s). Zhang Fei KOs 2217/2233/2149, damage 60/80/62;
  // Huang Zhong KOs 1915/1806/1811, damage 216/206/256. Four A, two S; highest third ≥2217 KOs, S damage ≤140.
  // 600 HP lost both guards; 2000/3200 still lost Huang Zhong seed 2. 4000 clears all six, bridge HP 11.2–81.1%.
  // Fixed-duration defence cannot rank by fastest time: its S third is measured in KOs instead.
  BEATS: [
    {
      when: { wait: 30 }, waves: true, morale: -0.1,
      defend: { key: 'bridge', at: DECK, r: 5, hp: 4000, name: { zh: 'پل چانگ‌بان', en: 'پل چانگ‌بان' } },
      fail: { when: { hp: ['bridge', 0.01] }, zh: 'پل چانگ‌بان سقوط کرد…', en: 'دفاع از پل شکست خورد' },
      obj: { zh: 'از پل چانگ‌بان دفاع کنید', en: 'مانع سقوط پل شوید', go: DECK, timer: 240 },
      squads: [{ at: ['bridge', -12, 33], n: 18 }, { at: ['bridge', 14, 36], n: 18 }, { at: ['slopes', -0.2, -0.82], n: 20 }],
      limit: { z: ['slopes', 0, -0.75], back: ['bridge', 0, -6] },
    },
    {
      when: { wait: 40 * 60 },
      officers: { caochun: { at: ['bridge', 0, 31], engaged: true } },
      squads: [{ at: ['bridge', -16, 30], n: 16, charge: true }, { at: ['bridge', 16, 31], n: 16, charge: true }],
    },
    {
      when: { wait: 50 * 60 },
      banner: { html: '<em>سائو هونگ</em> و <em>شو چو</em> وارد نبرد شدند', en: 'نیروهای تازه‌نفس دشمن', dur: 150 },
      officers: { caohong: { at: ['bridge', -14, 33], engaged: true }, xuchu: { at: ['bridge', 14, 34], engaged: true } },
      squads: [{ at: ['bridge', -20, 31], n: 18, charge: true }, { at: ['bridge', 20, 33], n: 18, charge: true }, { at: ['slopes', 0, -0.8], n: 20, charge: true }],
    },
    {
      when: { wait: 60 * 60 }, heal: 0.2,
      officers: { zhanghe: { at: ['bridge', 0, 32], engaged: true } },
      squads: [{ at: ['bridge', -16, 30], n: 18, charge: true }, { at: ['bridge', 16, 31], n: 18, charge: true }],
    },
    {
      when: { wait: 50 * 60 }, morale: -0.1,
      banner: { html: '<em>یورش سراسری</em> سپاه سائو سائو', en: 'حملهٔ نهایی دشمن', dur: 170, big: true },
      officers: { xiahouen: { at: ['bridge', -12, 32], engaged: true }, yanming: { at: ['bridge', 12, 33], engaged: true } },
      squads: [{ at: ['bridge', -20, 31], n: 20, charge: true }, { at: ['bridge', 20, 33], n: 20, charge: true }, { at: ['slopes', 0, -0.8], n: 20, charge: true }],
    },
    {
      when: { timer: true }, win: true, defend: null, fail: null, morale: 1,
      banner: { html: 'از <em>پل چانگ‌بان</em> دفاع شد!', en: 'پیروزی در دفاع', dur: 260, big: true },
    },
  ],
  EPILOGUE: epi('پل چانگ‌بان در برابر یورش دشمن پایدار ماند.', 'سپاه سائو سائو عقب نشست.'),
};

// 過關斬將 — the duel: four boss actors one after another in the 定軍山 basin, a little fodder with each for the gauge.
const boss = (kit, hp, more) => ({ kit, role: 'boss', at: ['hero', 0, 16], hp, ...more });
const fodder = [{ at: ['hero', -11, 12], n: 14 }, { at: ['hero', 11, 12], n: 14 }];
const gauntlet = {
  CH: {
    id: 'gauntlet', num: NUM, title: { zh: 'نبرد فرماندهان', en: 'نبرد پیاپی' }, seal: 'رزم', map: 'dingjun',
    army: { foe: 'wei', ally: 'shu' }, best: 'time', van: [],
    rule: { zh: 'شیا‌هو یوان، ژانگ لیائو، سائو سائو و لو بو را به‌ترتیب شکست دهید.', en: 'چهار نبرد پیاپی' },
    rank: { kos: [0, 0, 0], time: [200, 270, 360], s: { time: 200, dmg: 0.7 } },  // four beaten: time and damage decide
  },
  SPK: {}, OFF: {},
  // Pacing: the bosses carry their story HP (夏侯淵 2400, 張遼 2600, 呂布 4400 / poise 460; 曹操 3000), so a duel here is
  // the duel the chapters taught. Normal, input-only bot that never rolls (checks/trials-bot.mjs --baseline, seed 1):
  // 黃忠 fells one boss per ~20-25 s and dies at 97 s on 呂布 with 956 damage taken; 張飛 dies at 33 s on 夏侯淵. That is
  // intended: 初級 can trade blows, 普通 and up must read the wind-ups. A full clear is estimated at 150-200 s (not yet
  // measured with a rolling player): the time steps and the S gate (≤ 200 s, damage ≤ 70 %) come from that estimate.
  // the HUD announces each actor's entry and fall itself outside story mode (hud.js): no banners here
  BEATS: [
    { when: { wait: 30 }, actors: { yuan: boss('xiahouyuan', 2400) }, squads: fodder,
      obj: { zh: 'نبرد اول: شیا‌هو یوان را شکست دهید', en: 'حریف اول', go: 'yuan' } },
    { when: { down: 'yuan' }, heal: 0.35, actors: { liao: boss('zhangliao', 2600) }, squads: fodder,
      obj: { zh: 'نبرد دوم: ژانگ لیائو را شکست دهید', en: 'حریف دوم', go: 'liao' } },
    { when: { down: 'liao' }, heal: 0.35, actors: { cao: boss('caocao', 3000) }, squads: fodder,
      obj: { zh: 'نبرد سوم: سائو سائو را شکست دهید', en: 'حریف سوم', go: 'cao' } },
    { when: { down: 'cao' }, heal: 0.35, actors: { lubu: boss('lubu', 4400, { poise: 460 }) }, squads: fodder,
      obj: { zh: 'نبرد نهایی: لو بو را شکست دهید', en: 'حریف آخر', go: 'lubu' } },
    { when: { down: 'lubu' }, win: true, morale: 1 },
  ],
  EPILOGUE: epi('چهار سردار پیاپی شکست خوردند.', 'جنگجویی جرئت رویارویی نداشت.'),
};

export const TRIALS = [slay, hold, gauntlet];
