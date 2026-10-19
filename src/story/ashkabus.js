// Persian-first narrative adaptation for the Ashkabus chapter.
// Keep the inherited battle timings, encounter keys and geometry; never mutate Dingjun's original data.
import {
  CH as base, BEATS as baseBeats, PROLOGUE as basePrologue,
  SPK as baseSPK, OFF as baseOFF, PL_MAP as basePLMap,
} from './dingjun.js';

export const CH = {
  ...base,
  map: 'ashkabus',
  id: 'ashkabus',
  num: { zh: 'فصل اول', en: 'Chapter I' },
  title: { zh: 'جنگ ایران و اشکبوس', en: 'Iran and Ashkabus' },
  seal: 'ایران',
  era: { zh: 'روزگار شاهنامه', en: 'Shahnameh era' },
  heroes: ['rostam'],
  army: { ...base.army, ally: 'iran' }, // visual identity only; enemy and encounter logic unchanged
  ally: { ...base.ally, rostam: 'zhaoyun' },
};

// Reuse the current speaker portraits / actor models, but give the story its Iranian and Turanian names.
export const SPK = {
  ...baseSPK,
  tus: { name: { zh: 'طوس', en: 'Tous' }, seal: 'طوس', side: 'shu' },
  raham: { name: { zh: 'رهام', en: 'Roham' }, seal: 'رهام', side: 'shu' },
  turanVanguard: { name: { zh: 'پهلوان تورانی', en: 'Turanian Champion' }, seal: 'پهلوان', side: 'wei' },
  turanAmbush: { name: { zh: 'فرماندهٔ کمین', en: 'Ambush Commander' }, seal: 'کمین', side: 'wei' },
  turanGuard: { name: { zh: 'نگهبان دژ', en: 'Fortress Guard' }, seal: 'دژ', side: 'wei' },
  turanSoldier: { name: { zh: 'سرباز تورانی', en: 'Turanian Soldier' }, seal: 'سرباز', side: 'wei' },
  ashkabus: { name: { zh: 'اشکبوس', en: 'Ashkabus' }, seal: 'اشک', side: 'wei', char: 'xiahouyuan' },
};

export const OFF = {
  ...baseOFF,
  shang: { ...baseOFF.shang, name: { zh: 'پهلوان تورانی', en: 'Turanian Champion' } },
  duxi: { ...baseOFF.duxi, name: { zh: 'فرماندهٔ کمین', en: 'Ambush Commander' } },
  zhanghe: { ...baseOFF.zhanghe, name: { zh: 'نگهبان دژ', en: 'Fortress Guard' } },
  guard: { ...baseOFF.guard, name: { zh: 'سرباز برگزیدهٔ توران', en: 'Turanian Elite' } },
};

// Keep the prologue illustration and its arrow IDs, replacing only its visible place/person labels.
const replaceLabel = (source, oldText, newText) => {
  if (!source.includes(oldText)) throw new Error('Ashkabus prologue label missing: ' + oldText);
  return source.replace(oldText, newText);
};
export const PL_MAP = {
  ...basePLMap,
  art: [
    ['陽平關', 'اردوگاه ایران'],
    ['南鄭', 'دژ توران'],
    ['定軍山', 'میدان نبرد'],
    ['夏侯淵', 'اشکبوس'],
    ['張郃 東圍', 'سپاه توران'],
    ['漢 水', 'گذرگاه رود'],
  ].reduce((art, pair) => replaceLabel(art, pair[0], pair[1]), basePLMap.art),
};

const OBJECTIVES = {
  0: { zh: 'پیشروی در میدان نبرد', en: 'Advance across the battlefield' },
  2: { zh: 'شکست پهلوان پیشتاز توران', en: 'Defeat the Turanian vanguard' },
  3: { zh: 'راه را به سوی دژ توران باز کنید', en: 'Open the road to the Turanian stronghold' },
  5: { zh: 'شکست فرماندهٔ کمین توران', en: 'Defeat the Turanian ambush commander' },
  6: { zh: 'نگهبان دژ را شکست دهید و دروازه را بگشایید', en: 'Defeat the fortress guard and open the gate' },
  8: { zh: 'به بلندی میدان بروید و با اشکبوس روبه‌رو شوید', en: 'Reach the high ground and face Ashkabus' },
  9: { zh: 'مانع نهایی را از میان بردارید', en: 'Break through the final barricade' },
  10: { zh: 'اشکبوس، پهلوان تورانی را شکست دهید', en: 'Defeat Ashkabus, the Turanian champion' },
};

const BANNERS = {
  3: { html: '<em>میدان نبرد</em> پاک‌سازی شد؛ راه پیشروی باز است!', en: 'The battlefield is secured — Iran advances' },
  5: { html: '<em>کمین توران</em>! نیروها از دو سوی گذرگاه یورش آوردند', en: 'Turanian troops spring an ambush from both sides' },
  6: { html: '<em>کمین توران</em> درهم شکست!', en: 'The Turanian ambush is broken' },
  8: { html: '<em>دروازهٔ دژ</em> گشوده شد!', en: 'The stronghold gate is open' },
  10: { html: '<em>راه بلندی میدان</em> باز شد!', en: 'The route to the high ground is open' },
  11: { html: '<em>اشکبوس</em>، پهلوان تورانی', en: 'Ashkabus, the Turanian champion' },
  12: { html: 'طبل‌های <em>توران</em> به صدا درآمد؛ نیروهای کمکی رسیدند!', en: 'Turanian war drums sound — reinforcements arrive' },
  13: { html: '<em>اشکبوس</em> شکست خورد!', en: 'Ashkabus has been defeated' },
};

const DIALOGUE = [
  [
    { who: 'tus', zh: 'سپاه ایران، صف‌ها را استوار کنید؛ راه پیشروی باید باز شود!', en: 'Warriors of Iran, hold the line and open the road ahead!' },
    { who: 'raham', zh: 'اشکبوس میدان را به مبارزه طلبیده است؛ پیش از رسیدن به او، راه را پاک‌سازی کنید.', en: 'Ashkabus has challenged Iran. Clear the route before you reach him.' },
    { who: 'hero', zh: 'من رستم دستانم؛ تا اشکبوس را نبینم از این میدان بازنمی‌گردم.', en: 'I am Rostam Dastan. I will not leave this field until I face Ashkabus.' },
    { who: 'raham', zh: 'رستم، من سپاه را پشتیبانی می‌کنم؛ تو راه دژ را باز کن.', en: 'Rostam, I will support the line. You clear the road to the stronghold.' },
  ],
  [
    { who: 'turanSoldier', zh: 'ایرانیان از این گذرگاه نخواهند گذشت! صف‌ها را نگه دارید!', en: 'The Iranians will not pass this way! Hold the line!' },
    { who: 'hero', zh: 'راه را با فریاد نمی‌بندند؛ پیش بیایید!', en: 'Shouts will not stop me. Come and face me!' },
  ],
  [
    { who: 'turanVanguard', zh: 'من پیشتاز سپاه تورانم! اگر جرئت داری، از این میدان بگذر.', en: 'I lead Turan’s vanguard. If you dare, cross this field.' },
  ],
  [
    { who: 'raham', zh: 'پیشتازان عقب نشستند؛ از گذرگاه بگذر و به سوی دژ توران پیش برو.', en: 'The vanguard has fallen back. Cross the pass and press toward Turan’s stronghold.' },
  ],
  [
    { who: 'turanSoldier', zh: 'رستم به گذرگاه رسیده است! نیروهای کمین را خبر کنید!', en: 'Rostam has reached the pass! Alert the ambush!' },
  ],
  [
    { who: 'turanAmbush', zh: 'به دام افتادی، پهلوان ایرانی! این گذرگاه گورستان تو خواهد شد!', en: 'You have walked into our trap, Iranian champion. This pass will be your grave!' },
    { who: 'raham', zh: 'کمین است! فرماندهٔ آن‌ها را شکست بده تا راه به دژ باز شود!', en: 'An ambush! Defeat their commander to clear the road to the stronghold!' },
  ],
  [
    { who: 'raham', zh: 'کمین درهم شکست؛ نگهبان دژ پیش روی توست. دروازه را بگشا!', en: 'The ambush is broken. The fortress guard stands ahead. Open the gate!' },
  ],
  [
    { who: 'turanGuard', zh: 'این دروازه را به توران سوگند بسته نگه می‌دارم؛ از من نخواهی گذشت!', en: 'I have sworn to hold this gate for Turan. You shall not pass!' },
    { who: 'hero', zh: 'دروازه‌ات فرو می‌ریزد و راه اشکبوس را خواهم یافت!', en: 'Your gate will fall, and I will find Ashkabus!' },
  ],
  [
    { who: 'turanGuard', zh: 'دژ دیگر تاب پایداری ندارد؛ نیروها عقب‌نشینی کنند!', en: 'The stronghold can no longer hold. Fall back!' },
    { who: 'raham', zh: 'اشکبوس بر بلندی میدان منتظر است؛ از میان نیروهای باقی‌مانده بگذر و با او روبه‌رو شو!', en: 'Ashkabus waits on the high ground. Push through the remaining troops and face him!' },
  ],
  [
    { who: 'turanSoldier', zh: 'نگذارید رستم به پهلوان ما نزدیک شود!', en: 'Do not let Rostam reach our champion!' },
  ],
  null,
  [
    { who: 'ashkabus', zh: 'پس تویی رستم دستان! امروز نامت را از میدان پاک خواهم کرد.', en: 'So you are Rostam Dastan. Today I will erase your name from this field.' },
    { who: 'hero', zh: 'من برای ایران می‌جنگم؛ نیزه‌ام پاسخ هماوردی توست!', en: 'I fight for Iran. My spear will answer your challenge!' },
  ],
  [
    { who: 'ashkabus', zh: 'طبل‌ها را بنوازید! رستم را از پای درآورید!', en: 'Beat the drums! Bring Rostam down!' },
    { who: 'raham', zh: 'من نیروهای کمکی را سرگرم می‌کنم؛ تو اشکبوس را شکست بده!', en: 'I will hold the reinforcements. You defeat Ashkabus!' },
  ],
  [
    { who: 'hero', zh: 'اشکبوس شکست خورد و راه سپاه ایران گشوده شد!', en: 'Ashkabus has fallen, and Iran’s path forward is open!' },
  ],
];

const NAGS = {
  0: { who: 'raham', zh: 'سردار، پیش از پاک‌سازی میدان جلوتر نروید!', en: 'General, clear the battlefield before advancing!' },
  3: { who: 'raham', zh: 'رستم، راه گذرگاه هنوز پاک‌سازی نشده است؛ پیش نرو!', en: 'Rostam, the pass is not clear yet. Hold your advance!' },
  6: { who: 'raham', zh: 'دروازه بسته است؛ نخست نگهبان دژ را شکست دهید!', en: 'The gate is barred. Defeat the fortress guard first!' },
};

export const BEATS = baseBeats.map((beat, i) => {
  const next = { ...beat };
  if (beat.obj) {
    if (!OBJECTIVES[i]) throw new Error('Ashkabus: missing objective text for beat ' + i);
    next.obj = { ...beat.obj, ...OBJECTIVES[i] };
  }
  if (beat.banner) {
    if (!BANNERS[i]) throw new Error('Ashkabus: missing banner text for beat ' + i);
    next.banner = { ...beat.banner, ...BANNERS[i] };
  }
  if (beat.limit?.nag) {
    if (!NAGS[i]) throw new Error('Ashkabus: missing warning text for beat ' + i);
    next.limit = { ...beat.limit, nag: NAGS[i] };
  }
  if (beat.say) {
    const lines = DIALOGUE[i];
    if (!lines || lines.length !== beat.say.length) throw new Error('Ashkabus: dialogue count changed at beat ' + i);
    next.say = beat.say.map((line, j) => {
      const replacement = lines[j];
      const updated = { ...line, ...replacement };
      if (line.huangzhong) updated.rostam = [replacement.zh, replacement.en];
      return updated;
    });
  } else if (DIALOGUE[i]) {
    throw new Error('Ashkabus: unexpected dialogue at beat ' + i);
  }
  if (beat.actors?.yuan) {
    next.actors = {
      ...beat.actors,
      yuan: {
        ...beat.actors.yuan,
        name: { zh: 'اشکبوس', en: 'Ashkabus' },
        seal: 'اشک',
        intro: { zh: 'اشکبوس، پهلوان تورانی، به میدان آمد!', en: 'Ashkabus, the Turanian champion, enters the field!' },
      },
    };
  }
  return next;
});

const PROLOGUE_TEXT = [
  { cols: ['سپاه ایران در برابر توران صف کشیده است', 'اشکبوس، پهلوان نامدار تورانی، به میدان آمده', 'و هیچ‌یک از دو سپاه قصد عقب‌نشینی ندارد.'], en: 'The armies of Iran and Turan face one another. Ashkabus has entered the field, and neither side will yield.' },
  { cols: ['پیشتازان توران راه را بسته‌اند', 'رستم باید صف دشمن را بشکافد', 'و مسیر رسیدن به دژ را باز کند.'], en: 'Turanian vanguards block the route. Rostam must break their line and open the road to the stronghold.' },
  { cols: ['رهام از خطر کمین خبر می‌دهد', 'گذرگاه باریک است و دشمن در کمین', 'اما رستم بی‌هراس پیش می‌رود.'], en: 'Roham warns of an ambush in the narrow pass, but Rostam presses on without fear.' },
  { cols: ['رستم دستان', 'پهلوان ایران به میدان می‌آید', 'تا با اشکبوس روبه‌رو شود.'], en: 'Rostam Dastan enters the field to face Ashkabus.' },
  { cols: ['طبل‌های توران به صدا درمی‌آیند', 'دو پهلوان برای رویارویی آماده می‌شوند', 'سرنوشت این میدان در آستانهٔ دگرگونی است.'], en: 'The drums of Turan thunder. The two champions prepare for their clash.' },
];

export const PROLOGUE = basePrologue.map((card, i) => {
  const { huangzhong, zhaoyun, ...rest } = card;
  const text = PROLOGUE_TEXT[i];
  return { ...rest, ...text, ...(i === 3 ? { rostam: { ...text } } : {}) };
});

export const EPILOGUE = {
  rostam: {
    zh: [
      'رستم در نبرد تن‌به‌تن اشکبوس را شکست داد و آوازهٔ پهلوانی‌اش در سپاه ایران پیچید.',
      'سپاه توران عقب نشست؛ اما جنگ پایان نیافته است و نبردهای بزرگ‌تری در راه‌اند.',
    ],
    en: [
      'Rostam defeated Ashkabus in single combat, and his victory spread through the Iranian ranks.',
      'Turan fell back, but the war was not over. Greater battles still lay ahead.',
    ],
  },
};
