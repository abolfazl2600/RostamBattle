// Branding contract: only the Persian product title appears in shipped entry points;
// legacy storage keys remain readable via one-time migration without losing progress.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { readGameStorage, writeGameStorage, gameStorageKey } from '../src/core/storage.js';
import { GAME_NAME_FA } from '../src/i18n/brand.js';

const text = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const name = 'نبرد رستم';
assert.equal(GAME_NAME_FA, name);
assert(text('index.html').includes(`<title>${name}</title>`));
assert(text('android/app/src/main/res/values/strings.xml').includes(`<string name="app_name">${name}</string>`));
assert(text('android/app/src/main/res/values/strings.xml').includes(`<string name="title_activity_main">${name}</string>`));
assert.equal(JSON.parse(text('capacitor.config.json')).appName, name);
assert(text('src/ui/title.js').includes('GAME_NAME_FA'));
assert(text('src/main.js').includes('GAME_NAME_FA'));
assert(!/نبردهای سه پادشاهی|Voxel Musou|Voxel Game/i.test(text('src/ui/title.js')));
assert(!/Voxel Musou|Voxel Game/i.test(text('index.html')));
const pkg = JSON.parse(text('package.json'));
const lock = JSON.parse(text('package-lock.json'));
assert.equal(pkg.name, 'nabard-rostam');
assert.equal(lock.name, pkg.name);
assert.equal(lock.packages[''].name, pkg.name);

const old = new Map([
  ['voxel-musou.save', JSON.stringify({ v: 1, rec: { ashkabus: { rostam: { normal: { rank: 'S', time: 99, kos: 500 } } } } })],
  ['voxel-musou.diff', 'hard'],
  ['voxel-device-mode', 'mobile'],
  ['voxel-quality', 'medium'],
]);
globalThis.localStorage = {
  getItem: (k) => old.get(k) ?? null,
  setItem: (k, v) => old.set(k, v),
  removeItem: (k) => old.delete(k),
};
for (const id of ['save', 'diff', 'deviceMode', 'quality']) {
  const oldValue = old.get({ save: 'voxel-musou.save', diff: 'voxel-musou.diff', deviceMode: 'voxel-device-mode', quality: 'voxel-quality' }[id]);
  assert.equal(readGameStorage(id), oldValue, `Migrate ${id}`);
  assert.equal(old.get(gameStorageKey(id)), oldValue, `Preserve ${id}`);
}
assert.equal(JSON.parse(readGameStorage('save')).rec.ashkabus.rostam.normal.rank, 'S');
assert(!old.has('voxel-musou.save'), 'Migrate without leaving the former save key');
writeGameStorage('diff', 'normal');
assert.equal(readGameStorage('diff'), 'normal', 'New key takes precedence');

old.delete(gameStorageKey('quality'));
old.set('voxel-quality', 'low');
localStorage.setItem = () => { throw new Error('blocked writes'); };
assert.equal(readGameStorage('quality'), 'low', 'Read-only storage still reads previous setting');
assert.equal(old.get('voxel-quality'), 'low', 'Do not remove the old value on failed migration');

console.log('PASS official Nabard Rostam branding, npm metadata and lossless legacy-storage migration');
