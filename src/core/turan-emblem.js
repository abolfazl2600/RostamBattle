// Font-independent, Shahnameh-inspired Turanian sun/star emblem.
// An original stylised faction mark, not a claimed historical Turanian flag.
// The same symbol is used on carried standards, camp banners and fallen cloth.
export function drawTuranEmblem(ctx, cx, cy, size) {
  const r = size * 0.45;
  ctx.save();
  ctx.translate(cx, cy);

  // Dark round shield and bronze rim make the enemy mark readable at small sizes.
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = '#2c1c22';
  ctx.fill();
  ctx.strokeStyle = '#c9a15e';
  ctx.lineWidth = Math.max(1.5, size * 0.055);
  ctx.stroke();

  // Eight pointed sun, deliberately distinct from Iran's four-rayed Derafsh.
  ctx.beginPath();
  for (let i = 0; i < 16; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 8;
    const reach = i % 2 === 0 ? r * 0.83 : r * 0.39;
    const px = Math.cos(a) * reach, py = Math.sin(a) * reach;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = '#efd39a';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(0, 0, r * 0.25, 0, Math.PI * 2);
  ctx.fillStyle = '#87372d';
  ctx.fill();
  ctx.restore();
}
