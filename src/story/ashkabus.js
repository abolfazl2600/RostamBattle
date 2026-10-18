// Temporary, independently recorded preview. This is NOT the finished Shahnameh adaptation.
// Reuse Dingjun's immutable scenario/art; never rename or mutate the original chapter.
import { CH as base } from './dingjun.js';
export { SPK, OFF, BEATS, PROLOGUE, PL_MAP, EPILOGUE } from './dingjun.js';
export const CH = {
  ...base,
  id: 'ashkabus',
  num: { zh: 'فصل اول', en: 'Chapter I' },
  title: { zh: 'جنگ ایران و اشکبوس', en: 'Iran and Ashkabus — temporary preview' },
  heroes: ['huangzhong'],
};
