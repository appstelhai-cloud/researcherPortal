import { el, ltr, formatMoney, formatDate } from './format.js';
import { mockRepository as repo } from './repository.js';
import { setAsOf } from './shell.js';
import { filterRows, totalsByCurrency } from './analysis-logic.js';

const DEMO_RESEARCHER_ID = 'a'; // real adapter: derived server-side from SSO identity

await setAsOf();
const [rows, expenseTypes, groups] = await Promise.all([
  repo.listAllTransactions(DEMO_RESEARCHER_ID), repo.getExpenseTypes(), repo.listSourcesForResearcher(DEMO_RESEARCHER_ID)]);
const sources = groups.flatMap(g => g.items.map(i => ({ id: i.id, label: i.title })));

const controls = document.getElementById('controls');
const view = document.getElementById('view');

const select = (id, label, all, options) => el('label', {}, `${label} `,
  el('select', { id }, el('option', { value: '', text: all }), ...options.map(o => el('option', { value: o.value, text: o.label }))));
const search = el('input', { type: 'search', id: 'q', class: 'search' });
const from = el('input', { type: 'date', id: 'from' });
const to = el('input', { type: 'date', id: 'to' });
const srcSel = select('src', 'מקור', 'כל המקורות', sources.map(s => ({ value: s.id, label: s.label })));
const typeSel = select('type', 'סוג הוצאה', 'כל הסוגים', expenseTypes.map(t => ({ value: t, label: t })));
controls.append(el('div', { class: 'filters' }, el('label', {}, 'חיפוש ', search), srcSel, typeSel, el('label', {}, 'מתאריך ', from), el('label', {}, 'עד תאריך ', to)));
for (const c of [search, from, to, srcSel.querySelector('select'), typeSel.querySelector('select')]) c.addEventListener('input', render);

const money = (n, c) => ltr(formatMoney(n, c));
const monthLabel = (iso) => new Intl.DateTimeFormat('he-IL', { month: 'long', year: 'numeric' }).format(new Date(iso));

/** One statement line: date, description with source and expense type underneath, amount at the end. */
function line(t) {
  const [d, m] = formatDate(t.date).split('.');
  return el('li', { class: 'tx' },
    el('div', { class: 'tx-date', 'aria-label': formatDate(t.date) }, el('strong', { text: d }), el('span', { class: 'muted small', text: `.${m}` })),
    el('div', { class: 'tx-main' },
      el('div', { class: 'tx-desc', text: t.description }),
      el('div', { class: 'muted small', text: `${t.sourceLabel} · ${t.expenseType}` })),
    el('div', { class: 'tx-amt' }, money(t.amount, t.currency)));
}

function block(title, list, note) {
  const sums = totalsByCurrency(list).map(t => money(t.paid + t.committed, t.currency));
  const head = el('div', { class: 'tx-head' }, el('h2', { text: title }),
    el('span', { class: 'muted small' }, note ? `${note} · ` : '', ...sums.flatMap((s, i) => i ? [' + ', s] : [s])));
  return el('section', { class: 'panel tx-block' }, head, el('ul', { class: 'tx-list' }, ...list.map(line)));
}

function render() {
  const term = search.value.trim().toLowerCase();
  const shown = filterRows(rows, {
    expenseTypes: typeSel.querySelector('select').value ? [typeSel.querySelector('select').value] : [],
    sourceIds: srcSel.querySelector('select').value ? [srcSel.querySelector('select').value] : [],
    from: from.value, to: to.value
  }).filter(r => !term || `${r.description} ${r.sourceLabel} ${r.expenseType}`.toLowerCase().includes(term));
  view.replaceChildren();
  if (!shown.length) { view.append(el('p', { class: 'muted', text: 'לא נמצאו תנועות לפי הסינון.' })); return; }

  // Like a card statement: pending charges first, then charged ones by month (rows arrive newest first).
  const pending = shown.filter(r => r.status !== 'paid');
  if (pending.length) view.append(block('ממתינות לחיוב', pending, 'מאושרות, טרם שולמו'));
  const byMonth = new Map();
  for (const r of shown.filter(r => r.status === 'paid')) {
    const k = r.date.slice(0, 7);
    byMonth.set(k, [...(byMonth.get(k) ?? []), r]);
  }
  for (const [k, list] of byMonth) view.append(block(monthLabel(`${k}-01`), list, `${list.length} תנועות`));
}
render();
