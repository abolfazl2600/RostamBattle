// Small, font-independent, Shahnameh-inspired Derafsh Kaviani motif.
// Canvas-only so both carried flags and fixed camp banners share the same symbol.
export function drawDerafsh(ctx, cx, cy, size) {
  const r = size / 2;
  ctx.save();
  ctx.translate(cx, cy);

  // Four short rays and the central gold diamond remain legible on a 64px flag.
  ctx.fillStyle = '#f2cf78';
  ctx.fillRect(-r * 0.12, -r, r * 0.24, r * 2);
  ctx.fillRect(-r, -r * 0.12, r * 2, r * 0.24);

  ctx.beginPath();
  ctx.moveTo(0, -r * 0.8);
  ctx.lineTo(r * 0.72, 0);
  ctx.lineTo(0, r * 0.8);
  ctx.lineTo(-r * 0.72, 0);
  ctx.closePath();
  ctx.fillStyle = '#f5d58a';
  ctx.fill();
  ctx.strokeStyle = '#784024';
  ctx.lineWidth = Math.max(1, size * 0.05);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0, -r * 0.38);
  ctx.lineTo(r * 0.34, 0);
  ctx.lineTo(0, r * 0.38);
  ctx.lineTo(-r * 0.34, 0);
  ctx.closePath();
  ctx.fillStyle = '#9a3828';
  ctx.fill();

  ctx.restore();
}
