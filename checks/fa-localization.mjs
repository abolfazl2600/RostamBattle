// Static coverage probe for Persian presentation strings.
// Run with: node checks/fa-localization.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { OFFICERS_FA, CHAPTERS_FA, TRIALS_FA, DIFFICULTIES_FA, UNLOCKS_FA,
  officerFa, stageFa, difficultyFa, unlockFa, modeLabelFa } from '../src/i18n/fa.js';

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
