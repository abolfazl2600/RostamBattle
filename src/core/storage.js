// Official game storage namespace. Preserve existing progress on first launch after rebranding.
// Legacy names are used only as one-time read-and-migrate compatibility keys.
const PREFIX = 'nabard-rostam.';
const LEGACY = Object.freeze({
  save: 'voxel-musou.save',
  diff: 'voxel-musou.diff',
  deviceMode: 'voxel-device-mode',
  quality: 'voxel-quality',
});

export const gameStorageKey = (id) => `${PREFIX}${id}`;

export function readGameStorage(id) {
  const current = localStorage.getItem(gameStorageKey(id));
  if (current !== null) return current;
  const oldKey = LEGACY[id];
  if (!oldKey) return null;
  const previous = localStorage.getItem(oldKey);
  if (previous === null) return null;
  // Reading still succeeds if storage is read-only. Never delete a prior save before a successful write.
  try {
    localStorage.setItem(gameStorageKey(id), previous);
    localStorage.removeItem?.(oldKey);
  } catch { /* keep the legacy value available on restricted storage */ }
  return previous;
}

export function writeGameStorage(id, value) {
  localStorage.setItem(gameStorageKey(id), value);
}
