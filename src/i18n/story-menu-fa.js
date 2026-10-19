// Story-menu presentation ONLY. Historical chapter/map/record names stay in fa.js.
import { stageFa } from './fa.js';
const MENU = {
  ashkabus: { num: 'فصل اول', title: 'جنگ ایران و اشکبوس', description: 'رویارویی رستم و اشکبوس در میدان نبرد؛ فصل نخست از نبردهای شاهنامه.' },
  hulao: { num: 'فصل دوم', title: 'جنگ رستم و کاموس کشانی' },
  changban: { num: 'فصل سوم', title: 'نبرد رستم و سهراب' },
  chibi: { num: 'فصل چهارم', title: 'جنگ رستم و تورانیان' },
  dingjun: { num: 'فصل پنجم', title: 'نبرد رستم و اسفندیار' },
};
export const storyMenuFa = (id) => ({ ...stageFa(id), ...MENU[id] });
