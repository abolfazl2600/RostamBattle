import assert from 'node:assert/strict';

// Focused save contract: preserving existing v1 keys is critical for signed
// Android in-place upgrades and the original GitHub Pages implementation.
let mem = new Map(), failRead = false, failWrite = false;
globalThis.localStorage = {
  getItem(k) { if (failRead) throw Error('WebView storage denied'); return mem.get(k) ?? null; },
  setItem(k, v) { if (failWrite) throw Error('quota'); mem.set(k, v); },
  removeItem(k) { if (failWrite) throw Error('read only'); mem.delete(k); },
};
const fresh = async label => import('../src/core/progress.js?' + label);
let p = await fresh('first');
assert.equal(p.PROGRESS_KEY, 'voxel-musou.save');
assert.equal(p.progressStatus().mode, 'empty');
p.record('hulao', 'rostam', 'normal', { rank: 'B', time: 140, kos: 10 });
assert.equal(JSON.parse(mem.get(p.PROGRESS_KEY)).v, 1);
p.record('hulao', 'rostam', 'normal', { rank: 'A', time: 170, kos: 15 });
assert.deepEqual(p.best('hulao', 'rostam', 'normal'), { rank: 'A', time: 140, kos: 15 });
assert.equal(p.progressStatus().persistent, true);
p = await fresh('relaunch');
assert.deepEqual(p.best('hulao','rostam','normal'), { rank: 'A', time: 140, kos: 15 },
  'Stored v1 progress must survive a simulated WebView reload');
// Denied write: the user can still finish two battles, and neither erases the
// same-session progress merely because localStorage throws on every write.
mem = new Map(); failWrite = true;
p = await fresh('quota');
p.record('hulao','rostam','normal',{ rank:'C',time:210,kos:5 });
p.record('changban','rostam','hard',{ rank:'B',time:190,kos:8 });
assert.equal(p.records().hulao.rostam.normal.rank, 'C');
assert.equal(p.records().changban.rostam.hard.rank, 'B');
assert.equal(p.progressStatus().mode, 'memory-only');
assert.equal(p.progressStatus().persistent, false);
// A newer schema may exist after a downgrade or a partially completed
// migration. It must stay byte-for-byte identical until user confirmation.
failWrite = false;
const future = '{"v":99,"rec":{"new-feature":{"rostam":{"normal":{"rank":"S","time":12,"kos":300}}}}}';
mem.set(p.PROGRESS_KEY, future);
p = await fresh('future');
p.record('hulao','rostam','normal',{ rank:'S',time:90,kos:20 });
assert.equal(mem.get(p.PROGRESS_KEY), future);
assert.equal(p.progressStatus().protected, true);
assert.equal(p.resetProgress(), false);
assert.equal(mem.get(p.PROGRESS_KEY), future);
assert.equal(p.resetProgress(true), true);
assert.equal(mem.has(p.PROGRESS_KEY), false);
// Corrupt v1 must not be silently replaced with empty records on the next win.
mem.set(p.PROGRESS_KEY, '{"v":1,"rec":{"hulao":null}}');
p = await fresh('corrupt');
p.record('changban','rostam','normal',{ rank:'B',time:300,kos:30 });
assert.equal(mem.get(p.PROGRESS_KEY), '{"v":1,"rec":{"hulao":null}}');
// When reads are blocked, do not pretend persistence succeeded.
mem.clear(); failRead = true;
p = await fresh('denied');
p.record('hulao','rostam','normal',{rank:'A',time:99,kos:12});
assert.equal(p.progressStatus().persistent, false);
assert.equal(p.records().hulao.rostam.normal.rank, 'A');
console.log('PASS Android progress v1 persistence, bests, blocked storage, future-schema protection and confirmed reset');
