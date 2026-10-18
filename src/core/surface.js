// Shared logical dimensions and pure coordinate transforms; safe for headless kit checks.
export const viewport = { touch: false, rotated: false, mode: 'native-landscape', width: 1, height: 1,
  physicalWidth: 1, physicalHeight: 1, offsetX: 0, offsetY: 0 };
export function gamePoint(clientX, clientY) {
  const x = clientX - viewport.offsetX, y = clientY - viewport.offsetY;
  return viewport.rotated ? { x: y, y: viewport.height - x } : { x, y };
}
export function gameRect(el) {
  const r = el.getBoundingClientRect(), a = gamePoint(r.left, r.top), b = gamePoint(r.right, r.bottom);
  return { left: Math.min(a.x, b.x), right: Math.max(a.x, b.x), top: Math.min(a.y, b.y), bottom: Math.max(a.y, b.y),
    width: Math.abs(b.x - a.x), height: Math.abs(b.y - a.y) };
}
