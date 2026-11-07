// Persian presentation for painted standards and scene inscriptions.
// Internal faction IDs, historical glyph data and save keys stay unchanged.
const LABELS = Object.freeze({
  '魏': 'وی', '蜀': 'شو', '曹': 'سائو', '董': 'دونگ', '劉': 'کیخسرو',
  '漢': 'هان', '袁': 'یوان', '孫': 'سون', '公孫': 'گونگ‌سون',
  '華': 'هوآ', '吳': 'وو', '周': 'ژو', '黃': 'هوانگ',
  '帥': 'سردار', '毛': 'مائو', '于': 'یو', '夏侯': 'شیا‌هو',
  '赤壁': 'صخره‌های سرخ', '華容道': 'راه هوآرونگ',
  '角亢氐房心尾箕': 'هفت اختر',
  '斗牛女虛危室壁': 'هفت ستاره',
  '奎婁胃昴畢觜參': 'اختران آسمان',
  '井鬼柳星張翼軫': 'ستارگان هفت‌گانه',
});
const HAN = /[\u3400-\u9fff]/u;
export const glyphFa = (text = '') => {
  if (!HAN.test(text)) return text;
  // A new decorative glyph must never leak Chinese characters into the displayed texture.
  return LABELS[text] || 'نشان';
};
