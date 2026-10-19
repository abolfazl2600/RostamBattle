// Stamp a new Android version only in the checked-out CI workspace.
// The repository's android/version.properties remains the shared local baseline.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const versionFile = resolve(dirname(fileURLToPath(import.meta.url)), '../../android/version.properties');
const PLAY_MAX_VERSION_CODE = 2100000000;

export function computeReleaseVersion(source, runNumber) {
  const runText = String(runNumber);
  if (!/^[1-9][0-9]*$/.test(runText)) throw new Error('GITHUB_RUN_NUMBER must be a positive integer.');
  const run = Number(runText);
  const codes = [...source.matchAll(/^versionCode=([^\r\n]*)\r?$/gm)];
  const names = [...source.matchAll(/^versionName=([^\r\n]*)\r?$/gm)];
  if (codes.length !== 1 || names.length !== 1) throw new Error('Expected exactly one versionCode and versionName.');
  const code = codes[0][1].trim(), name = names[0][1].trim();
  const version = /^([0-9]+)\.([0-9]+)\.([0-9]+)$/.exec(name);
  if (!/^[1-9][0-9]*$/.test(code) || !version) throw new Error('Base version must be numeric: code positive, name major.minor.patch.');
  const baseCode = Number(code), patch = Number(version[3]);
  if (!Number.isSafeInteger(run) || !Number.isSafeInteger(baseCode) || !Number.isSafeInteger(patch)) {
    throw new Error('Android version inputs exceed safe integer limits.');
  }
  const nextCode = baseCode + run, nextPatch = patch + run;
  if (nextCode > PLAY_MAX_VERSION_CODE || !Number.isSafeInteger(nextPatch)) {
    throw new Error('Generated Android version exceeds allowed limits.');
  }
  const nextName = version[1] + '.' + version[2] + '.' + nextPatch;
  const content = source.replace(/^versionCode=[^\r\n]*/m, 'versionCode=' + nextCode)
    .replace(/^versionName=[^\r\n]*/m, 'versionName=' + nextName);
  return { versionCode: nextCode, versionName: nextName, content };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  assert.ok(process.env.GITHUB_ACTIONS === 'true', 'Only stamp versions in GitHub Actions, not local checkouts.');
  const next = computeReleaseVersion(readFileSync(versionFile, 'utf8'), process.env.GITHUB_RUN_NUMBER);
  writeFileSync(versionFile, next.content);
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, 'version_code=' + next.versionCode + '\nversion_name=' + next.versionName + '\n');
  }
  console.log('Android release version: ' + next.versionName + ' (code ' + next.versionCode + ').');
}
