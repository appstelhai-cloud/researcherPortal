import { el, ltr, formatILS, formatPercent } from './format.js';
import { mockRepository as repo } from './repository.js';
import { setAsOf } from './shell.js';
import { aggregate } from './kkm.js';
import { kpi, utilizationBar, legend, deficitChip, categoryList } from './ui.js';

await setAsOf();

const [rows, totalsByCat, labels, year] = await Promise.all([
  repo.listResearcherSummaries(),
  repo.getCategoryTotals(),
  repo.getCategories(),
  repo.getBudgetYear()
]);

document.getElementById('year').textContent = `שנת תקציב ${year.label} (1.10 – 30.9)`;

const deptSelect = document.getElementById('dept');
for (const d of [...new Set(rows.map(r => r.dept))]) deptSelect.append(el('option', { value: d, text: d }));
const negOnly = document.getElementById('neg');

function render() {
  const filtered = rows.filter(r =>
    (!deptSelect.value || r.dept === deptSelect.value) && (!negOnly.checked || r.summary.isDeficit));

  const t = aggregate(filtered.map(r => r.summary));
  document.getElementById('kpis').replaceChildren(
    kpi('זמין', t.available), kpi('שולם', t.used), kpi('התחייבויות פתוחות', t.committed),
    kpi('יתרה', t.balance, t.balance < 0 ? { variant: 'deficit', note: 'גירעון' } : { variant: 'accent' }));

  const tbody = document.getElementById('rows');
  tbody.replaceChildren(...filtered.map(r => {
    const s = r.summary;
    const bal = el('td', { class: `num${s.isDeficit ? ' neg' : ''}` }, ltr(formatILS(s.balance)));
    const bar = el('td', {}, utilizationBar(s, { small: true }), el('span', { class: 'muted', text: formatPercent(s.utilization) }));
    return el('tr', {},
      el('th', { scope: 'row', text: r.name }),
      el('td', { text: r.dept }),
      el('td', { class: 'num' }, ltr(formatILS(s.available))),
      el('td', { class: 'num' }, ltr(formatILS(s.used))),
      el('td', { class: 'num' }, ltr(formatILS(s.committed))),
      bal, bar,
      el('td', {}, s.isDeficit ? deficitChip() : null));
  }));
  document.getElementById('empty').hidden = filtered.length > 0;
}

deptSelect.addEventListener('change', render);
negOnly.addEventListener('change', render);
render();

// Category totals are aggregate-only in the fixtures, so they are not filtered.
document.getElementById('cats').replaceChildren(categoryList(totalsByCat, labels, { equipment: 3000 }));
document.getElementById('legend').replaceChildren(legend());
