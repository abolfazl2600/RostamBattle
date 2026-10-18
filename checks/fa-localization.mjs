// Static coverage probe for Persian presentation strings.
// Run with: node checks/fa-localization.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { OFFICERS_FA, CHAPTERS_FA, TRIALS_FA, DIFFICULTIES_FA, UNLOCKS_FA,
  officerFa, stageFa, difficultyFa, unlockFa, modeLabelFa } from '../src/i18n/fa.js';
import { PROLOGUE_FA, EPILOGUE_FA, MAP_LABELS_FA, prologueFa, epilogueFa, mapLabelFa } from '../src/i18n/narrative-fa.js';
import { BATTLE_NAMES_FA, BATTLE_EVENTS_FA, BATTLE_DIALOGUE_FA, HULAO_DIALOGUE_FA,
  CHANGBAN_DIALOGUE_FA, CHIBI_DIALOGUE_FA, battleNameFa, battleTextFa } from '../src/i18n/battle-fa.js';

const officers = ['liubei', 'guanyu', 'zhangfei', 'zhaoyun', 'zhugeliang', 'huangzhong', 'lubu'];
const chapters = ['hulao', 'changban', 'chibi', 'dingjun'];
const trials = ['slay', 'hold', 'gauntlet', 'free'];
const levels = ['easy', 'normal', 'hard', 'chaos'];
const locks = ['chaos', 'lubu', 'hold', 'gauntlet'];
const persian = /[\u0600-\u06FF]/u;
const required = (value, label) => assert.ok(typeof value === 'string' && persian.test(value), label);

for (const id of officers) {
  const o = OFFICERS_FA[id];
  assert.ok(o, `Officer ${id} is missing`);
  for (const k of ['name', 'courtesy', 'seal', 'side', 'title', 'weapon', 'musou', 'intro', 'motto', 'line'])
    required(o[k], `Officer ${id}.${k}`);
  assert.equal(o.bio.length, 2, `Officer ${id} biography must have two paragraphs`);
  o.bio.forEach((p, i) => required(p, `Officer ${id}.bio[${i}]`));
  assert.equal(officerFa(id), o.name);
}
for (const id of chapters) {
  for (const k of ['num', 'title', 'era', 'seal', 'description']) required(CHAPTERS_FA[id]?.[k], `Chapter ${id}.${k}`);
  assert.equal(stageFa(id), CHAPTERS_FA[id]);
}
for (const id of trials) {
  for (const k of ['num', 'title', 'seal', 'description']) required(TRIALS_FA[id]?.[k], `Trial ${id}.${k}`);
  assert.equal(stageFa(id), TRIALS_FA[id]);
}
for (const id of levels) {
  required(DIFFICULTIES_FA[id]?.name, `Difficulty ${id}.name`);
  required(DIFFICULTIES_FA[id]?.line, `Difficulty ${id}.line`);
  assert.equal(difficultyFa(id), DIFFICULTIES_FA[id]);
}
for (const id of locks) {
  required(UNLOCKS_FA[id]?.name, `Unlock ${id}.name`);
  required(UNLOCKS_FA[id]?.rule, `Unlock ${id}.rule`);
  assert.equal(unlockFa(id), UNLOCKS_FA[id]);
}
for (const mode of ['story', 'trial', 'free']) required(modeLabelFa({mode, ch:'hulao'}), `Mode ${mode}`);
assert.match(readFileSync(new URL('../index.html', import.meta.url), 'utf8'), /<html lang="fa" dir="rtl">/);
console.log('Persian localization: 7 officers, 4 chapters, 4 trial/free entries, 4 difficulties, 4 unlock rules OK');


const heroRoutes = {
  hulao: ['liubei', 'guanyu', 'zhangfei'],
  changban: ['zhaoyun', 'zhangfei'],
  chibi: ['zhugeliang', 'zhaoyun'],
  dingjun: ['huangzhong', 'zhaoyun'],
};
for (const [id, heroes] of Object.entries(heroRoutes)) {
  assert.equal(PROLOGUE_FA[id]?.length, 5, id + ' should have five prologue cards');
  for (const hero of heroes) {
    for (let i = 0; i < 5; i++) {
      const card = prologueFa(id, i, hero);
      assert.equal(card?.cols.length, 3, 'Prologue ' + id + '/' + hero + '/' + i + ': needs three columns');
      card.cols.forEach((x) => required(x, 'Prologue ' + id + '/' + hero + '/' + i));
      assert.equal(card.en, '', 'Persian cards should not duplicate English subtitles');
    }
    const ending = epilogueFa(id, hero);
    assert.equal(ending?.length, 2, 'Missing ending ' + id + '/' + hero);
    ending.forEach((x) => required(x, 'Ending ' + id + '/' + hero));
  }
}
for (const id of ['slay', 'hold', 'gauntlet']) {
  const ending = epilogueFa(id, 'liubei');
  assert.equal(ending?.length, 1, 'Missing trial ending ' + id);
  required(ending[0], 'Trial ending ' + id);
}
for (const [key, fa] of Object.entries(MAP_LABELS_FA)) {
  required(fa, 'Map label ' + key);
  assert.equal(mapLabelFa(key), fa);
}
for (const [key, fa] of Object.entries(BATTLE_NAMES_FA)) {
  required(fa, 'Battle name ' + key);
  assert.equal(battleNameFa({ en: key }), fa);
  assert.equal(battleNameFa({ en: key.toUpperCase() }), fa);
}
for (const [kind, dictionary] of Object.entries({
  event: BATTLE_EVENTS_FA, dingjunDialogue: BATTLE_DIALOGUE_FA, hulaoDialogue: HULAO_DIALOGUE_FA,
  changbanDialogue: CHANGBAN_DIALOGUE_FA, chibiDialogue: CHIBI_DIALOGUE_FA,
})) {
  for (const [key, fa] of Object.entries(dictionary)) {
    required(fa, kind + ': ' + key);
    assert.equal(battleTextFa(key), fa);
  }
}
function englishOnLine(line) {
  const i = line.indexOf("en: '");
  if (i < 0) return null;
  let out = '';
  for (let j = i + 5; j < line.length; j++) {
    if (line[j] === '\\' && j + 1 < line.length) { out += line[++j]; continue; }
    if (line[j] === "'") return out;
    out += line[j];
  }
  return null;
}
assert.equal(Object.keys(BATTLE_DIALOGUE_FA).length, 33, 'Expected all Dingjun dialogue lines');
assert.equal(Object.keys(HULAO_DIALOGUE_FA).length, 56, 'Expected all Hulao dialogue lines');
assert.equal(Object.keys(CHANGBAN_DIALOGUE_FA).length, 69, 'Expected all Changban dialogue lines');
assert.equal(Object.keys(CHIBI_DIALOGUE_FA).length, 56, 'Expected all Chibi dialogue lines');
const eventKeys = new Set();
for (const id of chapters) {
  const lines = readFileSync(new URL('../src/story/' + id + '.js', import.meta.url), 'utf8').split('\n');
  for (const line of lines) {
    if (!/\b(obj|banner|fail):/.test(line)) continue;
    const en = englishOnLine(line);
    if (en) {
      eventKeys.add(en);
      required(BATTLE_EVENTS_FA[en], 'Missing script event ' + id + ': ' + en);
    }
  }
}
assert.ok(eventKeys.size >= 80, 'Unexpectedly low number of campaign events: ' + eventKeys.size);
console.log('Persian narrative: four prologues, all hero endings, three trials, ' + eventKeys.size + ' scripted events OK');

// Focused menu contracts: preserve record eligibility/counts and keep brand/bidi/contrast consistent.
const { recordsModel, renderRecords } = await import('../src/ui/records-view.js');
const { GAME_NAME_FA } = await import('../src/i18n/brand.js');
const { TOUCH_ACTIONS } = await import('../src/ui/touch-layout.js');
const { renderControlGuide } = await import('../src/ui/control-guide.js');
const { escapeHtml } = await import('../src/ui/text.js');
const groups = [{ id: 'story', label: 'داستان', stages: [{ CH: { id: 'hulao', heroes: ['liubei', 'guanyu'] }, available: false }] },
  { id: 'trials', label: 'چالش', stages: [{ CH: { id: 'slay' } }] }];
const diffs = levels.map(id => ({ id })), heroIds = ['liubei', 'guanyu'];
for (const variant of ['empty', 'partial', 'full']) {
  const tree = {};
  if (variant !== 'empty') tree.hulao = { liubei: { normal: { rank: 'A' } } };
  if (variant === 'full') for (const stage of ['hulao', 'slay']) for (const hero of heroIds)
    (tree[stage] ??= {})[hero] = Object.fromEntries(levels.map(id => [id, { rank: 'S' }]));
  const before = JSON.stringify(tree);
  const bestRead = (stage, hero) => {
    const ranks = Object.entries(tree).flatMap(([s, heroes]) => stage && s !== stage ? [] : Object.entries(heroes).flatMap(([h, values]) => hero && h !== hero ? [] : Object.values(values).map(v => v.rank)));
    return ranks.length ? { rank: ranks.includes('S') ? 'S' : 'A' } : null;
  };
  const model = recordsModel({ groups, heroes: heroIds, diffs, records: () => tree, best: bestRead, locked: () => variant === 'empty', unlocks: [{ id: 'lubu' }] });
  // The old wall counted one eligible hero/stage pair, regardless of completed difficulty count.
  const legacy = groups.flatMap(g => g.stages).flatMap(({ CH }) => heroIds.filter(id => !CH.heroes || CH.heroes.includes(id)).map(id => bestRead(CH.id, id)));
  assert.equal(model.total, legacy.length); assert.equal(model.done, legacy.filter(Boolean).length);
  const html = renderRecords(model);
  assert.equal((html.match(/data-record-hero=/g) || []).length, legacy.length);
  assert.equal((html.match(/class="cleared"/g) || []).length, variant === 'full' ? 16 : variant === 'partial' ? 1 : 0);
  assert(html.includes('قفل است') || html.includes('باز شده است'));
  assert(html.includes('به‌زودی')); assert.equal(JSON.stringify(tree), before, 'Rendering must never mutate saved data');
}
assert.equal(escapeHtml('<b>&'), '&lt;b&gt;&amp;');
const touchGuide = renderControlGuide(true, []);
for (const { id, label } of TOUCH_ACTIONS) assert(touchGuide.includes(`data-guide-action="${id}"`) && touchGuide.includes(label));
assert(renderControlGuide(false, [['حرکت', 'راه رفتن', '<kbd>W</kbd>', 'آنالوگ چپ']]).includes('<kbd>W</kbd>'));
const entry = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
assert(entry.includes(`<title>${GAME_NAME_FA}</title>`)); assert(entry.includes(`<i>${GAME_NAME_FA}</i>`));
const css = readFileSync(new URL('../src/ui/title.css', import.meta.url), 'utf8');
const color = key => css.match(new RegExp(`--menu-${key}: (#[0-9a-f]{6})`))[1];
const luminance = hex => hex.slice(1).match(/../g).map(v => parseInt(v,16)/255).map(v => v <= .04045 ? v/12.92 : ((v+.055)/1.055)**2.4).reduce((sum,v,i) => sum+v*[.2126,.7152,.0722][i],0);
for (const foreground of ['text','secondary','gold']) for (const background of ['panel','card']) {
  const ratio = (luminance(color(foreground))+.05)/(luminance(color(background))+.05);
  assert(ratio >= 4.5, `${foreground}/${background}: ${ratio}`);
}
console.log('PASS record cards preserve old counts/tier marks/data; touch labels, official brand and opaque-panel text contrast');
