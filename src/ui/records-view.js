import { officerFa, stageFa, difficultyFa, unlockFa } from '../i18n/fa.js';
import { escapeHtml as esc, numberFa as num, ltr } from './text.js';

// Inject the existing registries/readers: only presentation changes, never saved progress.
export function recordsModel({ groups, heroes, diffs, records, best, locked, unlocks }) {
  const tree = records();
  let done = 0, total = 0;
  const sections = groups.map(group => ({ ...group, stages: group.stages.map(({ CH, available }) => {
    const cells = heroes.filter(id => !CH.heroes || CH.heroes.includes(id)).map(id => {
      const rank = best(CH.id, id)?.rank || null;
      total++; if (rank) done++;
      return { id, rank, locked: !!locked(id), levels: diffs.map(d => ({ id: d.id, cleared: !!tree[CH.id]?.[id]?.[d.id] })) };
    });
    return { id: CH.id, available, rank: best(CH.id)?.rank || null, cells };
  }) }));
  return { done, total, rank: best()?.rank || null, sections,
    heroes: heroes.map(id => ({ id, rank: best(undefined, id)?.rank || null, locked: !!locked(id) })),
    unlocks: unlocks.map(u => ({ id: u.id, locked: !!locked(u.id) })) };
}
const rankLabel = rank => rank ? `بهترین رتبه ${ltr(rank)}` : 'هنوز تکمیل نشده';
export function renderRecords(model) {
  return `<h2 id="records-heading">رکوردها</h2><p class="panel-intro">کارنامهٔ مبارزه؛ هر شخصیت در هر مرحله یک مورد از مجموع تکمیل است.</p>
    <div class="record-summary"><p><strong><bdi>${num(model.done)}</bdi> از <bdi>${num(model.total)}</bdi></strong><span>تکمیل‌شده</span></p><p>${rankLabel(model.rank)}</p></div>
    ${model.done ? '' : '<p class="record-empty">هنوز رکوردی ثبت نشده است؛ پس از پیروزی، رتبه و درجات سختی تکمیل‌شده در همین صفحه دیده می‌شوند.</p>'}
    <nav class="record-jumps" aria-label="بخش‌های رکوردها">${model.sections.map(s => `<button type="button" data-record-section="${s.id}">${s.label}</button>`).join('')}<button type="button" data-record-section="officers">شخصیت‌ها</button><button type="button" data-record-section="unlocks">قفل‌ها</button></nav>
    ${model.sections.map(section => `<section class="record-section" data-record-group="${section.id}"><h3>${section.label}</h3><div class="record-grid">${section.stages.map(stage => {
      const meta = stageFa(stage.id);
      return `<article class="record-card" data-record-stage="${stage.id}"><header><h4>${esc(meta.title)}</h4><p>${esc(meta.num)} · ${rankLabel(stage.rank)}</p>
        ${section.id === 'story' ? `<p class="record-availability">${stage.available ? 'قابل بازی — نمونهٔ موقت اشکبوس' : 'در منوی داستان: به‌زودی؛ رکوردهای تاریخی حفظ می‌شوند'}</p>` : '<p class="record-availability">چالش امتیازی</p>'}</header>
        <div class="record-officers">${stage.cells.map(cell => `<div class="record-officer" data-record-hero="${cell.id}"><div class="record-person"><canvas data-portrait="${cell.id}" width="20" height="20" aria-hidden="true"></canvas><strong>${officerFa(cell.id)}</strong><span>${cell.locked ? 'شخصیت قفل' : 'شخصیت باز'}</span></div><p>${rankLabel(cell.rank)}</p><div class="record-levels">${cell.levels.map(d => `<span class="${d.cleared ? 'cleared' : ''}">${d.cleared ? '✓' : '—'} ${difficultyFa(d.id).name}<small>${d.cleared ? 'تکمیل‌شده' : 'ثبت نشده'}</small></span>`).join('')}</div></div>`).join('')}</div></article>`;
    }).join('')}</div></section>`).join('')}
    <section class="record-section" data-record-group="officers"><h3>رتبه‌های شخصیت‌ها</h3><div class="record-hero-grid">${model.heroes.map(hero => `<article class="record-hero"><canvas data-portrait="${hero.id}" width="20" height="20" aria-hidden="true"></canvas><h4>${officerFa(hero.id)}</h4><p>${rankLabel(hero.rank)}</p><span>${hero.locked ? 'قفل است' : 'باز است'}</span></article>`).join('')}</div></section>
    <section class="record-section" data-record-group="unlocks"><h3>وضعیت قفل‌ها و شرط بازشدن</h3><div class="record-grid">${model.unlocks.map(u => `<article class="record-unlock ${u.locked ? 'locked' : 'unlocked'}"><h4>${unlockFa(u.id).name}</h4><strong>${u.locked ? '◇ قفل است' : '✓ باز شده است'}</strong><p>${unlockFa(u.id).rule}</p><small>${u.locked ? 'شرط بازشدن' : 'شرط انجام شده؛ در دسترس است'}</small></article>`).join('')}</div></section>`;
}
