import { el, ltr, formatMoney, formatPercent, formatDate } from './format.js';
import { mockRepository as repo } from './repository.js';
import { setAsOf } from './shell.js';
import { utilizationBar, deficitChip, legend } from './ui.js';

const DEMO_RESEARCHER_ID = 'a'; // real adapter: derived server-side from SSO identity

await setAsOf();
const [groups, year, asOfIso, kkmDetail, intakeDetail] = await Promise.all([
  repo.listSourcesForResearcher(DEMO_RESEARCHER_ID), repo.getBudgetYear(), repo.getAsOf(),
  repo.getSourceDetail(DEMO_RESEARCHER_ID, 'kkm'), repo.getSourceDetail(DEMO_RESEARCHER_ID, 'intake').catch(() => null)]);
const NOW = new Date(asOfIso).getTime();
const DAY = 86400000;
const daysTo = (iso) => Math.ceil((new Date(iso).getTime() - NOW) / DAY);
const periodOf = (item) => item.period ?? { start: year.start, end: year.end };
const elapsed = (item) => { const p = periodOf(item); const a = new Date(p.start).getTime(), b = new Date(p.end).getTime(); return Math.min(1, Math.max(0, (NOW - a) / (b - a))); };

document.getElementById('subtitle').textContent =
  `מקורות המימון הרלוונטיים אליך, ובתוכם הפרויקטים. אין סכום כולל: כל כסף צבוע לייעוד ולקרן. שנת תקציב קק״מ ${year.label}.`;

// Only the date range is forced LTR; Hebrew text stays in the RTL flow so ranges and parentheses read correctly.
function metaLine(item) {
  const range = (p) => ltr(`${formatDate(p.start)} – ${formatDate(p.end)}`);
  if (item.kind === 'research') return el('p', { class: 'muted small' }, `${item.funder} · `, range(item.period));
  if (item.period) return el('p', { class: 'muted small' }, range(item.period));
  return el('p', { class: 'muted small' }, `שנת תקציב ${year.label} `, ltr('(1.10 – 30.9)'));
}

function itemCard(item, group) {
  const s = item.summary;
  // A personal source card repeats its group heading: give it a distinct title instead.
  const title = item.kind !== 'research' && item.title === group.label ? 'פירוט התנועות' : item.title;
  return el('article', { class: 'research-card' },
    el('div', { class: 'rc-top' },
      el('span', { class: 'tag', text: item.kind === 'research' ? `פרויקט · ${item.center}` : 'מקור אישי' }),
      s.isDeficit ? deficitChip() : null),
    el('h3', {}, el('a', { href: item.href, text: title })),
    metaLine(item),
    utilizationBar(s),
    el('div', { class: 'rc-foot' },
      el('span', {}, 'יתרה: ', ltr(formatMoney(s.balance, s.currency))),
      el('span', { class: 'muted', text: `ניצול ${formatPercent(s.utilization)} · זמן שחלף ${formatPercent(elapsed(item))}` })),
    item.kind === 'source' ? el('a', { class: 'btn rc-act', href: `actions.html?type=purchase&source=${item.id}`, text: 'בקשת רכש מהמקור הזה' }) : null);
}

// List view: one compact row per source, easier to scan when there are many projects.
function itemRow(item, group) {
  const s = item.summary;
  const title = item.kind !== 'research' && item.title === group.label ? 'פירוט התנועות' : item.title;
  return el('li', { class: 'src-row' },
    el('div', { class: 'sr-name' },
      el('a', { href: item.href, text: title }),
      el('span', { class: 'tag', text: item.kind === 'research' ? `פרויקט · ${item.center}` : 'מקור אישי' }),
      s.isDeficit ? deficitChip() : null),
    el('div', { class: 'sr-period muted small' }, metaLine(item)),
    el('div', { class: 'sr-bar' }, utilizationBar(s, { small: true }),
      el('span', { class: 'muted small', text: `ניצול ${formatPercent(s.utilization)} · זמן ${formatPercent(elapsed(item))}` })),
    el('div', { class: 'sr-bal' }, ltr(formatMoney(s.balance, s.currency))),
    item.kind === 'source' ? el('a', { class: 'btn sr-act', href: `actions.html?type=purchase&source=${item.id}`, text: 'בקשת רכש' }) : el('span'));
}

function recentMovements() {
  const rows = [];
  for (const [label, d] of [['קק״מ', kkmDetail], ['תקציב קליטה', intakeDetail]]) if (d) for (const t of d.transactions) rows.push({ ...t, label });
  return rows.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
}

document.getElementById('side').replaceChildren(
  el('section', { class: 'side-card', 'aria-labelledby': 'mv-h' },
    el('h2', { id: 'mv-h', text: 'תנועות אחרונות' }),
    el('ul', { class: 'mv-list' }, ...recentMovements().map(t => el('li', {},
      el('div', { class: 'mv-main' }, el('span', { text: t.description }), el('strong', {}, ltr(formatMoney(t.amount)))),
      el('div', { class: 'muted small', text: `${t.label} · ${formatDate(t.date)} · ${t.status === 'paid' ? 'שולם' : 'התחייבות פתוחה'}` }))))));

const root = document.getElementById('groups');
let view = 'tiles';
try { if (localStorage.getItem('rp-home-view') === 'list') view = 'list'; } catch {}

function renderGroups() {
  root.replaceChildren(...groups.map(g => el('section', { class: 'src-group', 'aria-labelledby': `g-${g.type}` },
    el('h2', { id: `g-${g.type}`, text: g.label }),
    view === 'list'
      ? el('ul', { class: 'src-rows' }, ...g.items.map(i => itemRow(i, g)))
      : el('div', { class: 'cards' }, ...g.items.map(i => itemCard(i, g))))));
}
renderGroups();

const toggle = el('div', { class: 'view-toggle', role: 'group', 'aria-label': 'תצוגה' });
function setView(v) {
  view = v;
  try { localStorage.setItem('rp-home-view', v); } catch {}
  for (const b of toggle.children) b.setAttribute('aria-pressed', String(b.dataset.v === v));
  renderGroups();
}
for (const [v, label] of [['tiles', 'אריחים'], ['list', 'רשימה']]) {
  const b = el('button', { type: 'button', class: 'btn vt', 'data-v': v, 'aria-pressed': String(v === view), text: label });
  b.addEventListener('click', () => setView(v));
  toggle.append(b);
}

// One legend for every bar on the page (green = paid, blue = open commitments; red chip = deficit).
const bar = el('div', { class: 'legend-row' }, legend(), toggle);
root.closest('.home-split').before(bar);

// Buttons that would open another system. Concept only: no integration.
const note = document.getElementById('demo-note');
document.querySelectorAll('[data-demo]').forEach(b => b.addEventListener('click', () => {
  note.textContent = `בהדגמה אין חיבור: כאן ייפתח ${b.dataset.demo}.`;
}));
