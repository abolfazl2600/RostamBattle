// Progress: every battle record and what it unlocks, kept per browser.
//   localStorage voxel-musou.save = { v: 1, rec: { [stage id]: { [char id]: { [difficulty id]: { rank, time, kos } } } } }
// A stage = a story chapter or a trial (story/chapters.js chapter(id)). A win (main.js, story:end → record()) keeps each
// best on its own: the best rank, the fastest clear (s), the most KOs. Nothing else is stored — every unlock is derived
// from the records (UNLOCKS: open(rec)), so no flag can fall out of step with them. Story chapters open in order
// (chapters.js chapterOpen, same records). Readers: the title (chapter / trial / difficulty panels, the 戰績 wall),
// select (rank chips, locked officers), result (new records, unlock lines).
// Never change the origin, key or v:1 shape just to package the game for
// Android: existing web saves must remain readable and updateable.
export const PROGRESS_KEY = 'voxel-musou.save';
const KEY = PROGRESS_KEY, ORDER = 'SABC';
const empty = () => ({ v: 1, rec: {} });
const object = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const valid = (s) => {
  if (!object(s) || s.v !== 1 || !object(s.rec)) return false;
  for (const [stage, chars] of Object.entries(s.rec)) {
    if (stage === '__proto__' || !object(chars)) return false;
    for (const [char, diffs] of Object.entries(chars)) {
      if (char === '__proto__' || !object(diffs)) return false;
      for (const [diff, r] of Object.entries(diffs)) {
        if (diff === '__proto__' || !object(r) || !ORDER.includes(r.rank) ||
          !Number.isFinite(r.time) || r.time < 0 ||
          !Number.isFinite(r.kos) || r.kos < 0) return false;
      }
    }
  }
  return true;
};

// If localStorage is blocked, a win still survives other screens in this
// session. If the saved schema is corrupt/newer than supported, never overwrite
// its original bytes with an empty v1 save: only an explicit reset may delete it.
let pending = null, writeProtected = false, status = 'unchecked', warned = false;
function issue(reason) {
  status = reason;
  if (!warned) {
    warned = true;
    console.warn('Progress storage unavailable or incompatible: original saved data will not be overwritten (' + reason + ')');
  }
}
const load = () => {
  if (pending) return pending;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw == null) { status = 'empty'; return empty(); }
    const s = JSON.parse(raw);
    if (valid(s)) { status = 'persisted'; return s; }
    writeProtected = true; issue('protected-save');
  } catch {
    writeProtected = true; issue('storage-unavailable');
  }
  return (pending = empty());
};
const better = (a, b) => ORDER.indexOf(a) < ORDER.indexOf(b);

/** Inspect save health without reading or exposing record contents. */
export function progressStatus() {
  load();
  return { mode: status, persistent: !writeProtected && !pending,
    protected: writeProtected, key: KEY, version: 1 };
}

/** Destructive reset is only possible after the calling UI obtains explicit
 * confirmation. No automatic migration or reset is run on Android update. */
export function resetProgress(confirmed = false) {
  if (confirmed !== true) return false;
  try { localStorage.removeItem(KEY); } catch { return false; }
  pending = null; writeProtected = false; status = 'empty'; warned = false;
  return true;
}

/** The whole record tree { [stage]: { [char]: { [difficulty]: { rank, time, kos } } } } (read it, never write it). */
export const records = () => load().rec;

/** Bests over every record matching the given ids (an omitted one = any): { rank, time, kos }, or null when none. */
export function best(stage, char, diff) {
  const R = load().rec;
  let out = null;
  for (const s in R) if (!stage || s === stage) for (const c in R[s]) if (!char || c === char) for (const d in R[s][c]) if (!diff || d === diff) {
    const r = R[s][c][d];
    out = out ? { rank: better(r.rank, out.rank) ? r.rank : out.rank, time: Math.min(out.time, r.time), kos: Math.max(out.kos, r.kos) } : { ...r };
  }
  return out;
}
/** Best rank on a stage by anyone on any tier, or undefined while it is uncleared. */
export const cleared = (stage) => best(stage)?.rank;

// What the records open. id = the thing's own id (a difficulty, an officer, a trial); anything without an entry is always
// open. zh / en: the result screen's line when it opens; rule: [zh, en] shown on the locked thing.
const onHard = (R) => Object.values(R).some((s) => Object.values(s).some((c) => c.hard || c.chaos));
export const UNLOCKS = [
  { id: 'chaos', zh: '修羅難度', en: 'Chaos difficulty', rule: ['以上級攻克任一戰場後解鎖', 'Clear any battle on Hard to unlock'], open: onHard },
  { id: 'lubu', zh: '武將「呂布」', en: 'Officer Lü Bu', rule: ['攻克第一章「虎牢關」後解鎖', 'Clear Chapter I · Hulao Gate to unlock'], open: (R) => !!R.hulao },
  { id: 'hold', zh: '試煉「死守」', en: 'Trial · Hold the Bridge', rule: ['攻克第二章「長坂坡」後解鎖', 'Clear Chapter II · Changban to unlock'], open: (R) => !!R.changban },
  { id: 'gauntlet', zh: '試煉「過關斬將」', en: 'Trial · The Gauntlet', rule: ['攻克第四章「定軍山」後解鎖', 'Clear Chapter IV · Mount Dingjun to unlock'], open: (R) => !!R.dingjun },
];
/** The UNLOCKS entry still keeping `id` shut (its rule is what to show), or null when it is open. */
export function locked(id) {
  const u = UNLOCKS.find((q) => q.id === id);
  return u && !u.open(load().rec) ? u : null;
}

/** A win on stage / char / difficulty id with stats { rank, time, kos } (story/index.js stats()). Returns { first: the
 *  stage's first clear, prev: this cell before ({ rank, time, kos } | null), fresh: { rank, time, kos } = which bests it
 *  beat (all false on a first entry), unlocks: the UNLOCKS entries this win opened }. */
export function record(stage, char, diff, { rank = 'C', time, kos }) {
  const s = load(), was = UNLOCKS.filter((u) => u.open(s.rec)), first = !s.rec[stage];
  const row = (s.rec[stage] ||= {})[char] ||= {}, prev = row[diff] || null;
  const fresh = { rank: !!prev && better(rank, prev.rank), time: !!prev && time < prev.time, kos: !!prev && kos > prev.kos };
  row[diff] = prev ? { rank: fresh.rank ? rank : prev.rank, time: Math.min(time, prev.time), kos: Math.max(kos, prev.kos) } : { rank, time, kos };
  // Commit the complete v1 tree atomically. Keep a same-session copy if storage
  // refuses the write, but never erase an unknown/corrupt or future-version save.
  pending = s;
  if (!writeProtected) {
    try {
      localStorage.setItem(KEY, JSON.stringify(s));
      pending = null; status = 'persisted';
    } catch {
      writeProtected = true; issue('memory-only');
    }
  }
  return { first, prev, fresh, unlocks: UNLOCKS.filter((u) => u.open(s.rec) && !was.includes(u)) };
}
