import { el, ltr, formatMoney, formatPercent, formatDate } from './format.js';
import { mockRepository as repo } from './repository.js';
import { setAsOf } from './shell.js';
import { utilizationBar, deficitChip, legend } from './ui.js';

const DEMO_RESEARCHER_ID = 'a'; // real adapter: derived server-side from SSO identity

await setAsOf();
const [groups, year, asOfIso] = await Promise.all([
  repo.listSourcesForResearcher(DEMO_RESEARCHER_ID), repo.getBudgetYear(), repo.getAsOf()]);
const NOW = new Date(asOfIso).getTime();
const periodOf = (item) => item.period ?? { start: year.start, end: year.end };
const elapsed = (item) => { const p = periodOf(item); const a = new Date(p.start).getTime(), b = new Date(p.end).getTime(); return Math.min(1, Math.max(0, (NOW - a) / (b - a))); };

document.getElementById('subtitle').textContent =
  `מקורות המימון הרלוונטיים אליך, ובתוכם הפרויקטים. אין סכום כולל: כל כסף צבוע לייעוד ולקרן. שנת תקציב קק״מ ${year.label}. הפעולות (רכש חדש, פתיחת פרויקט) נמצאות בתוך כל מקור.`;

// Only the date range is forced LTR; Hebrew text stays in the RTL flow so ranges and parentheses read correctly.
function metaLine(item) {
  const range = (p) => ltr(`${formatDate(p.start)} – ${formatDate(p.end)}`);
  if (item.kind === 'research') return el('p', { class: 'muted small' }, `${item.funder} · `, range(item.period));
  if (item.period) return el('p', { class: 'muted small' }, range(item.period));
  return el('p', { class: 'muted small' }, `שנת תקציב ${year.label} `, ltr('(1.10 – 30.9)'));
}

// One compact row per source or project: budget line and amounts only. Everything else lives on the source screen.
function itemRow(item, group) {
  const s = item.summary;
  // A personal source row repeats its group heading: give it a distinct title instead.
  const title = item.kind !== 'research' && item.title === group.label ? 'פירוט התנועות' : item.title;
  return el('li', { class: 'src-row' },
    el('div', { class: 'sr-name' },
      el('a', { href: item.href, text: title }),
      el('span', { class: 'tag', text: item.kind === 'research' ? `פרויקט · ${item.center}` : 'מקור אישי' }),
      s.isDeficit ? deficitChip() : null),
    el('div', { class: 'sr-period muted small' }, metaLine(item)),
    el('div', { class: 'sr-bar' }, utilizationBar(s, { small: true }),
      el('span', { class: 'muted small', text: `ניצול ${formatPercent(s.utilization)} · זמן ${formatPercent(elapsed(item))}` })),
    el('div', { class: 'sr-bal' }, el('span', { class: 'muted small', text: 'יתרה ' }), ltr(formatMoney(s.balance, s.currency))));
}

const root = document.getElementById('groups');
root.replaceChildren(...groups.map(g => el('section', { class: 'src-group', 'aria-labelledby': `g-${g.type}` },
  el('h2', { id: `g-${g.type}`, text: g.label }),
  el('ul', { class: 'src-rows' }, ...g.items.map(i => itemRow(i, g))))));

// One legend for every bar on the page (green = paid, blue = open commitments; red chip = deficit).
root.before(el('div', { class: 'legend-row' }, legend()));
