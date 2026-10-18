// A DOM fallback also works when no renderer could be created.
export function showRecovery(message) {
  let el = document.getElementById('graphics-recovery');
  if (!el) {
    el = document.createElement('section'); el.id = 'graphics-recovery'; el.setAttribute('role', 'alert');
    Object.assign(el.style, { position: 'fixed', inset: '0', zIndex: '11000', background: '#1a120d', color: '#f4ead8',
      display: 'grid', placeContent: 'center', gap: '24px', textAlign: 'center', padding: '24px', font: '600 18px/1.8 var(--sans)' });
    const p = document.createElement('p'), b = document.createElement('button');
    b.textContent = 'بارگذاری دوباره'; b.type = 'button';
    Object.assign(b.style, { minHeight: '48px', padding: '10px 24px', font: 'inherit', cursor: 'pointer' });
    b.addEventListener('click', () => location.reload());
    const low = document.createElement('button'); low.type = 'button'; low.textContent = 'تلاش با کیفیت سبک';
    low.style.cssText = b.style.cssText;
    low.addEventListener('click', () => { const url = new URL(location.href); url.searchParams.set('quality', 'low'); url.searchParams.delete('hq'); location.href = url.href; });
    el.append(p, b, low); document.body.append(el);
  }
  el.querySelector('p').textContent = message;
}
