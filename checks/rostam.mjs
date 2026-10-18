// Focused copy-isolation, roster and narrative checks for Issue #72.
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
registerHooks({ resolve(id, context, next) {
  return next(id === 'three' ? new URL('../vendor/three/three.module.js', import.meta.url).href : id, context);
} });
const [{ CHARS, CHAR_ORDER }, { CH, BEATS, PROLOGUE, EPILOGUE },
  { CH: OLD, BEATS: OLD_BEATS, PROLOGUE: OLD_PROLOGUE, EPILOGUE: OLD_EPILOGUE },
  { chapter, storyContext }, { OFFICERS_FA }, { prologueFa, epilogueFa }] = await Promise.all([
  import('../src/chars/index.js'), import('../src/story/ashkabus.js'), import('../src/story/dingjun.js'),
  import('../src/story/chapters.js'), import('../src/i18n/fa.js'), import('../src/i18n/narrative-fa.js'),
]);
assert.equal(CHAR_ORDER.length, 8);
assert.ok(CHAR_ORDER.includes('rostam') && CHARS.rostam);
assert.notEqual(CHARS.rostam.kit, CHARS.zhangfei.kit);
assert.notEqual(CHARS.rostam.kit.moves, CHARS.zhangfei.kit.moves);
assert.notEqual(CHARS.rostam.portrait.face, CHARS.zhangfei.portrait.face);
assert.notEqual(CHARS.rostam.portrait.pal, CHARS.zhangfei.portrait.pal);
assert.deepEqual(CHARS.rostam.kit.moves, CHARS.zhangfei.kit.moves, 'unchanged spear moves');
for (const key of ['scale', 'reach', 'trail', 'weight', 'voice', 'fx'])
  assert.deepEqual(CHARS.rostam.kit[key], CHARS.zhangfei.kit[key], key + ' must match Zhang Fei');
assert.deepEqual(CH.heroes, ['rostam']);
assert.equal(CH.id, 'ashkabus');
assert.equal(chapter('ashkabus').CH.heroes[0], 'rostam');
assert.equal(storyContext({ ch: 'ashkabus', char: 'huangzhong' }).char, 'rostam');
assert.deepEqual(OLD.heroes, ['huangzhong', 'zhaoyun']);
assert.equal(BEATS.length, OLD_BEATS.length);
let branches = 0;
BEATS.forEach((beat, i) => {
  assert.equal(beat.when, OLD_BEATS[i].when, 'story triggers unchanged');
  if (beat.say) beat.say.forEach((line) => {
    if (!line.huangzhong) return;
    branches++;
    assert.ok(line.rostam?.[0] && line.rostam?.[1], 'Rostam dialogue missing');
    assert.ok(!line.rostam[1].includes('Huang Zhong'));
  });
});
assert.equal(branches, 9);
assert.ok(OLD_BEATS.every(b => b.say?.every(line => !('rostam' in line)) ?? true));
assert.ok(PROLOGUE[3].rostam?.cols?.length === 3 && !OLD_PROLOGUE[3].rostam);
assert.equal(EPILOGUE.rostam.en.length, 2);
assert.ok(!OLD_EPILOGUE.rostam);
assert.equal(OFFICERS_FA.rostam.side, 'ایران');
assert.equal(OFFICERS_FA.rostam.weapon, OFFICERS_FA.zhangfei.weapon);
for (let i = 0; i < 5; i++) assert.equal(prologueFa('ashkabus', i, 'rostam')?.cols.length, 3);
assert.equal(epilogueFa('ashkabus', 'rostam')?.length, 2);
console.log('Rostam spear kit, story-only roster and narrative isolation: OK');
