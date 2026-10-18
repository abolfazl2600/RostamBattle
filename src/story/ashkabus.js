// Temporary, independently recorded preview. This is NOT the finished Shahnameh adaptation.
// Reuse Dingjun's immutable scenario/art; never rename or mutate the original chapter.
import { CH as base, BEATS as baseBeats, PROLOGUE as basePrologue, EPILOGUE as baseEpilogue } from './dingjun.js';
export { SPK, OFF, PL_MAP } from './dingjun.js';
export const CH = {
  ...base,
  map: 'ashkabus',
  id: 'ashkabus',
  num: { zh: 'فصل اول', en: 'Chapter I' },
  title: { zh: 'جنگ ایران و اشکبوس', en: 'Iran and Ashkabus — temporary preview' },
  heroes: ['rostam'],
  ally: { ...base.ally, rostam: 'zhaoyun' }, // the reused preview still fields its original ally
};

// Branch only Rostam's lines; keep the inherited objectives, encounters and gate order unchanged.
const ROSTAM_LINES = [
  [
    "راه را بگشایید! رستم برای نبرد آمده است.",
    "Clear the way! Rostam has come to fight!"
  ],
  [
    "رستم، من راه پشت سرت را نگه می‌دارم؛ پیش برو!",
    "Rostam, I'll hold the rear. Press ahead!"
  ],
  [
    "این تیرها مانع پیشروی من نخواهند شد!",
    "Their arrows will not stop my advance!"
  ],
  [
    "رستم! راه پشت سر امن است؛ دروازه را به تو می‌سپارم!",
    "Rostam! The rear is secure. The gate is yours!"
  ],
  [
    "ای نگهبان دروازه، رستم هماورد توست!",
    "Guardian of the gate, face Rostam!"
  ],
  [
    "ای جنگجوی ایران، به قله نخواهی رسید!",
    "Warrior of Iran, you will not reach the summit!"
  ],
  [
    "راه قله را خواهم گشود و سپاهت را شکست خواهم داد!",
    "I will take the summit and defeat your army!"
  ],
  [
    "رستم، من نیروهای تازه‌رسیده را سرگرم می‌کنم؛ تو فرمانده را شکست بده!",
    "Rostam, I'll hold the reinforcements. Defeat their commander!"
  ],
  [
    "رستم دستان، فرمانده دشمن را در این میدان شکست داد!",
    "Rostam has defeated the enemy commander on this field!"
  ]
];
let nextRostamLine = 0;
export const BEATS = baseBeats.map((beat) => !beat.say ? beat : {
  ...beat,
  say: beat.say.map((line) => !line.huangzhong ? line : { ...line, rostam: ROSTAM_LINES[nextRostamLine++] }),
});
if (nextRostamLine !== ROSTAM_LINES.length) throw new Error('Ashkabus: Rostam dialogue branch count changed');

export const PROLOGUE = basePrologue.map((card, i) => i !== 3 ? card : {
  ...card,
  rostam: {
    cols: ['رستم دستان', 'برای رویارویی با دشمن', 'به میدان نبرد گام می‌گذارد'],
    en: 'Rostam enters the battlefield to confront the enemy.',
  },
});
export const EPILOGUE = {
  ...baseEpilogue,
  rostam: {
    zh: ['رستم دستان بر فرمانده دشمن چیره شد و راه را گشود.', 'این نبرد پیش‌نمایش است؛ داستان کامل رستم و اشکبوس هنوز پیاده نشده است.'],
    en: ['Rostam defeated the enemy commander and opened the way.',
      'This is a preview battle; the complete tale of Rostam and Ashkabus is not yet implemented.'],
  },
};
