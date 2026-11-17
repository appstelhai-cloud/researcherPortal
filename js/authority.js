import { el, ltr, formatMoney, formatPercent, formatDate } from './format.js';
import { mockRepository as repo } from './repository.js';
import { setAsOf } from './shell.js';
import { aggregate } from './kkm.js';
import { paceFlag } from './pace.js';
import { kpi, paceBar as paceBarUi, legend, deficitChip, categoryList } from './ui.js';

await setAsOf();

const [items, researchers, types, year, totalsByCat, labels] = await Promise.all([
  repo.listAllSources(), repo.listResearchers(), repo.getSourceTypes(), repo.getBudgetYear(),
  repo.getCategoryTotals(), repo.getCategories()
]);
document.getElementById('year').textContent = `שנת תקציב קק״מ ${year.label} (1.10 – 30.9). מקורות אחרים פועלים לפי תקופת ההסכם שלהם.`;
document.getElementById('legend').replaceChildren(legend());

const deptSelect = document.getElementById('dept');
for (const d of [...new Set(items.map(i => i.center))].sort()) deptSelect.append(el('option', { value: d, text: d }));
const riskOnly = document.getElementById('risk');
riskOnly.checked = new URLSearchParams(location.search).get('risk') === '1';
let mode = 'source';

const flagOf = (i) => paceFlag(i.summary.utilization, i.elapsed);
const isRisk = (i) => i.summary.isDeficit || flagOf(i) !== 'ok';
const isPersonal = (type) => type === 'kkm' || type === 'intake';
const period = (i) => ltr(`${formatDate(i.period.start)} – ${formatDate(i.period.end)}`);

const paceBar = (i) => paceBarUi(i.summary, i.elapsed);

function statusCell(i) {
  const f = flagOf(i);
  return el('td', {},
    i.summary.isDeficit ? deficitChip() : null,
    f === 'over' && !i.summary.isDeficit ? el('span', { class: 'chip late', text: 'מוציא מהר מהזמן' }) : null,
    f === 'under' ? el('span', { class: 'chip wait', text: 'מוציא לאט מהזמן' }) : null,
    f === 'ok' && !i.summary.isDeficit ? el('span', { class: 'muted small', text: 'בקצב' }) : null);
}

function sourceRow(i) {
  const s = i.summary, c = i.currency;
  const name = i.href ? el('a', { href: i.href, text: i.title }) : document.createTextNode(i.title);
  return el('tr', {},
    el('th', { scope: 'row' }, name),
    el('td', { text: i.center }),
    el('td', { text: i.funder ? `${i.funder} · ${i.owner}` : '' }),
    el('td', {}, period(i)),
    el('td', { class: 'num' }, ltr(formatMoney(s.available, c))),
    el('td', { class: 'num' }, ltr(formatMoney(s.used, c))),
    el('td', { class: 'num' }, ltr(formatMoney(s.committed, c))),
    el('td', { class: `num${s.isDeficit ? ' neg' : ''}` }, ltr(formatMoney(s.balance, c))),
    el('td', {}, paceBar(i)),
    statusCell(i));
}

/** One KPI row per currency: never add shekels to euros, and never add across source types. */
function sectionKpis(list, planLabel) {
  const byCur = Map.groupBy(list, i => i.currency);
  const wrap = el('div', { class: 'kpis' });
  for (const [cur, group] of byCur) {
    const t = aggregate(group.map(i => i.summary));
    const tag = byCur.size > 1 ? ` · ${cur}` : '';
    wrap.append(
      kpi(planLabel + tag, t.available, { currency: cur }),
      kpi('שולם' + tag, t.used, { currency: cur }),
      kpi('התחייבויות פתוחות' + tag, t.committed, { currency: cur }),
      kpi('יתרה' + tag, t.balance, { currency: cur, ...(t.balance < 0 ? { variant: 'deficit', note: 'גירעון' } : { variant: 'accent' }) }));
  }
  return wrap;
}

const PLAN_LABEL = { kkm: 'הקצאה זמינה', intake: 'תקציב ההסכמים', external: 'תקציב המחקרים', donation: 'תקציב התרומות' };
const sorted = () => Object.entries(types).sort((a, b) => a[1].order - b[1].order);

function renderBySource(list) {
  const out = [];
  for (const [type, meta] of sorted()) {
    const group = list.filter(i => i.type === type);
    if (!group.length) continue;
    const risky = group.filter(isRisk).length;
    out.push(el('section', { class: 'panel', 'aria-labelledby': `s-${type}` },
      el('h2', { id: `s-${type}` }, `${meta.label} `, el('span', { class: 'muted small', text: `${group.length} פריטים${risky ? ` · ${risky} דורשים בדיקה` : ''}` })),
      sectionKpis(group, PLAN_LABEL[type]),
      el('div', { class: 'table-wrap' }, el('table', {},
        el('thead', {}, el('tr', {},
          el('th', { scope: 'col', text: isPersonal(type) ? 'חוקר/ת' : 'מחקר' }),
          el('th', { scope: 'col', text: 'מרכז מחקר' }),
          el('th', { scope: 'col', text: isPersonal(type) ? '' : 'מממן · ראשי/ת' }),
          el('th', { scope: 'col', text: 'תקופה' }),
          el('th', { scope: 'col', class: 'num', text: 'תכנון' }), el('th', { scope: 'col', class: 'num', text: 'שולם' }),
          el('th', { scope: 'col', class: 'num', text: 'התחייבויות' }), el('th', { scope: 'col', class: 'num', text: 'יתרה' }),
          el('th', { scope: 'col', text: 'ניצול מול זמן' }), el('th', { scope: 'col', text: 'סטטוס' }))),
        el('tbody', {}, ...group.map(sourceRow)))),
      type === 'kkm'
        ? el('details', { class: 'cat-details' }, el('summary', { text: 'הוצאות קק״מ לפי קטגוריה (כלל החוקרים, ללא סינון)' }),
            categoryList(totalsByCat, labels, { equipment: 3000 }))
        : null));
  }
  return out;
}

/** Matrix: a researcher's whole picture, split by funding source. Projects stay separate lines inside a cell. */
function cellFor(researcherId, type, list) {
  const mine = list.filter(i => i.type === type && i.ownerIds.includes(researcherId));
  if (!mine.length) return el('td', { class: 'muted', text: '—' });
  return el('td', {}, ...mine.map(i => el('div', { class: 'mcell' },
    isPersonal(type) ? null : el('div', { class: 'small' }, i.href ? el('a', { href: i.href, text: i.title }) : i.title),
    paceBar(i),
    el('div', { class: `small${i.summary.isDeficit ? ' neg' : ''}` }, 'יתרה: ', ltr(formatMoney(i.summary.balance, i.currency))))));
}

function renderByResearcher(list) {
  const order = sorted();
  const rows = researchers
    .filter(r => list.some(i => i.ownerIds.includes(r.id)))
    .map(r => el('tr', {},
      el('th', { scope: 'row' }, r.name, el('div', { class: 'muted small', text: r.dept })),
      ...order.map(([type]) => cellFor(r.id, type, list))));
  return [el('div', { class: 'panel' },
    el('h2', { text: 'כל חוקר, מפורק לפי מקורות המימון שלו' }),
    el('p', { class: 'muted small', text: 'כל תא הוא מקור נפרד עם התכנון והביצוע שלו. אין שורת סיכום לחוקר.' }),
    el('div', { class: 'table-wrap' }, el('table', { class: 'matrix' },
      el('thead', {}, el('tr', {}, el('th', { scope: 'col', text: 'חוקר/ת' }), ...order.map(([, m]) => el('th', { scope: 'col', text: m.label })))),
      el('tbody', {}, ...rows))))];
}

function render() {
  const list = items.filter(i => (!deptSelect.value || i.center === deptSelect.value) && (!riskOnly.checked || isRisk(i)));
  document.getElementById('view').replaceChildren(...(list.length ? (mode === 'source' ? renderBySource(list) : renderByResearcher(list)) : []));
  document.getElementById('empty').hidden = list.length > 0;
}

deptSelect.addEventListener('change', render);
riskOnly.addEventListener('change', render);
for (const b of document.querySelectorAll('#mode button')) b.addEventListener('click', () => {
  mode = b.dataset.v;
  for (const x of document.querySelectorAll('#mode button')) x.setAttribute('aria-pressed', String(x === b));
  render();
});
render();
