// Render-only choices: never change crowd counts, fixed-step timing, combat or records.
export const QUALITY = {
  low: { label: 'موبایل سبک', scale: 0.6, samples: 0, dof: false, bloom: false, rays: false, shadows: false },
  medium: { label: 'موبایل متعادل', scale: 0.8, samples: 0, dof: false, bloom: true, rays: false, shadows: true },
  high: { label: 'کیفیت بالا', scale: 1, samples: 4, dof: true, bloom: true, rays: true, shadows: true },
};
export const defaultQuality = ({ touch, cores = 4, memory = 4 }) => !touch ? 'high' : cores <= 4 || memory <= 4 ? 'low' : 'medium';

export function createAdaptiveScale(max, budget, change) {
  let scale = max, last = 0, ema = budget, slow = 0, fast = 0, cooldown = 0;
  const reset = () => { last = 0; ema = budget; slow = fast = 0; };
  return {
    reset,
    frame(now) {
      const dt = last ? now - last : 0; last = now;
      if (!dt || dt > 250) { slow = fast = 0; return; }
      ema += (dt - ema) * 0.05;
      if (now < cooldown) return;
      slow = ema > budget * 1.15 ? slow + dt : 0;
      fast = ema < budget * 0.72 ? fast + dt : 0;
      const next = slow > 3000 ? Math.max(0.6, scale - 0.1) : fast > 10000 ? Math.min(max, scale + 0.1) : scale;
      if (Math.abs(next - scale) > 0.01) {
        scale = Math.round(next * 10) / 10; change(scale); slow = fast = 0; cooldown = now + 10000;
      }
    },
  };
}
