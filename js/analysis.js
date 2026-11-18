import { el, ltr, formatMoney, formatDate } from './format.js';
import { mockRepository as repo } from './repository.js';
import { setAsOf } from './shell.js';
import { filterRows, totalsBy, totalsByCurrency } from './analysis-logic.js';

const DEMO_RESEARCHER_ID = 'a'; // real adapter: derived server-side from SSO identity

await setAsOf();
const [rows, expenseTypes, groups] = await Promise.all([
  repo.listAllTransactions(DEMO_RESEARCHER_ID), repo.getExpenseTypes(), repo.listSourcesForResearcher(DEMO_RESEARCHER_ID)]);
const sources = groups.flatMap(g => g.items.map(i => ({ id: i.id, label: i.title })));

const controls = document.getElementById('controls');
const view = document.getElementById('view');

function checks(name, legend, options) {
  const fs = el('fieldset', { class: 'chips' }, el('legend', { text: legend }));
  for (const o of options) {
    const input = el('input', { type: 'checkbox', name, value: o.value });
    input.addEventListener('change', render);
    fs.append(el('label', { class: 'chip-check' }, input, o.label));
  }
  return fs;
}
const picked = (name) => [...controls.querySelectorAll(`input[name="${name}"]:checked`)].map(i => i.value);

const from = el('input', { type: 'date', id: 'from' });
const to = el('input', { type: 'date', id: 'to' });
const groupBy = el('select', { id: 'groupby' },
  el('option', { value: 'expenseType', text: 'סוג הוצאה' }), el('option', { value: 'sourceLabel', text: 'מקור או פרויקט' }));
for (const c of [from, to, groupBy]) c.addEventListener('input', render);

controls.append(
  checks('type', 'סוג הוצאה (ריק = הכול)', expenseTypes.map(t => ({ value: t, label: t }))),
  checks('src', 'מקור או פרויקט (ריק = הכול)', sources.map(s => ({ value: s.id, label: s.label }))),
  el('div', { class: 'filters' },
    el('label', {}, 'מתאריך ', from), el('label', {}, 'עד תאריך ', to), el('label', {}, 'קיבוץ לפי ', groupBy)));

const money = (n, c) => ltr(formatMoney(n, c));

function render() {
  const shown = filterRows(rows, { expenseTypes: picked('type'), sourceIds: picked('src'), from: from.value, to: to.value });
  const gb = groupBy.value;
  view.replaceChildren();
  if (!shown.length) { view.append(el('p', { class: 'muted', text: 'לא נמצאו תנועות לפי הסינון.' })); return; }

  // One KPI pair per currency: amounts of different currencies are never added together.
  view.append(el('div', { class: 'kpis' }, ...totalsByCurrency(shown).flatMap(t => [
    el('div', { class: 'kpi accent' }, el('div', { class: 'label', text: `שולם (${t.currency})` }), el('div', { class: 'value' }, money(t.paid, t.currency))),
    el('div', { class: 'kpi' }, el('div', { class: 'label', text: `התחייבויות פתוחות (${t.currency})` }), el('div', { class: 'value' }, money(t.committed, t.currency)))])));

  const totals = totalsBy(shown, gb);
  view.append(el('div', { class: 'panel' }, el('h2', { text: gb === 'expenseType' ? 'סיכום לפי סוג הוצאה' : 'סיכום לפי מקור או פרויקט' }),
    el('div', { class: 'table-wrap' }, el('table', { class: 'narrow' },
      el('thead', {}, el('tr', {}, ...['קבוצה', 'מטבע', 'תנועות'].map(h => el('th', { scope: 'col', text: h })), el('th', { scope: 'col', class: 'num', text: 'שולם' }), el('th', { scope: 'col', class: 'num', text: 'התחייבויות פתוחות' }))),
      el('tbody', {}, ...totals.map(g => el('tr', {},
        el('th', { scope: 'row', text: g.group }), el('td', { text: g.currency }), el('td', { text: String(g.count) }),
        el('td', { class: 'num' }, money(g.paid, g.currency)), el('td', { class: 'num' }, money(g.committed, g.currency)))))))));

  view.append(el('div', { class: 'panel' }, el('h2', { text: `התנועות (${shown.length})` }),
    el('div', { class: 'table-wrap' }, el('table', {},
      el('thead', {}, el('tr', {}, ...['תאריך', 'תיאור', 'מקור או פרויקט', 'סוג הוצאה', 'סטטוס'].map(h => el('th', { scope: 'col', text: h })), el('th', { scope: 'col', class: 'num', text: 'סכום' }))),
      el('tbody', {}, ...shown.map(t => {
        const paid = t.status === 'paid';
        return el('tr', {}, el('td', {}, ltr(formatDate(t.date))), el('td', { text: t.description }), el('td', { text: t.sourceLabel }), el('td', { text: t.expenseType }),
          el('td', {}, el('span', { class: `chip ${paid ? 'paid' : 'pending'}`, text: paid ? 'שולם' : 'מאושר, טרם שולם' })),
          el('td', { class: 'num' }, money(t.amount, t.currency)));
      }))))));
}
render();
