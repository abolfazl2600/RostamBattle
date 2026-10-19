// Small, dependency-free validation for CI version numbering.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { computeReleaseVersion } from '../scripts/android/stamp-release-version.mjs';

const base = 'versionCode=1\nversionName=1.0.0\n';
const first = computeReleaseVersion(base, 4);
const later = computeReleaseVersion(base, 5);
assert.deepEqual([first.versionCode, first.versionName], [5, '1.0.4']);
assert.deepEqual([later.versionCode, later.versionName], [6, '1.0.5']);
assert.equal(computeReleaseVersion(base, 4).content, first.content, 'Retry keeps the same version');
assert.equal(first.content, 'versionCode=5\nversionName=1.0.4\n');
assert.deepEqual(
  [computeReleaseVersion('versionCode=20\nversionName=2.3.7\n', 2).versionCode,
    computeReleaseVersion('versionCode=20\nversionName=2.3.7\n', 2).versionName],
  [22, '2.3.9']
);
for (const invalid of [0, -1, 'hello', '1.5', '01']) {
  assert.throws(() => computeReleaseVersion(base, invalid), /GITHUB_RUN_NUMBER/);
}
for (const invalid of ['versionCode=0\nversionName=1.0.0\n', 'versionCode=1\nversionName=1.0-beta\n',
  'versionCode=1\nversionCode=2\nversionName=1.0.0\n', 'versionCode=2100000000\nversionName=1.0.0\n']) {
  assert.throws(() => computeReleaseVersion(invalid, 1));
}
const repoBase = readFileSync(new URL('../android/version.properties', import.meta.url), 'utf8');
assert.ok(computeReleaseVersion(repoBase, 1).versionCode > 1);
console.log('PASS: Android release version increment, retry determinism and invalid inputs.');
