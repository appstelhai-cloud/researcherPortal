import { el, ltr, formatILS, formatMoney, formatPercent, formatDate } from './format.js';
import { mockRepository as repo } from './repository.js';
import { setAsOf } from './shell.js';
import { kpi, utilizationBar, legend, deficitChip, categoryList } from './ui.js';
import { MAPPING } from './config-mapping.js';

const DEMO_RESEARCHER_ID = 'a'; // real adapter: derived server-side from SSO identity
const id = new URLSearchParams(location.search).get('id') === 'intake' ? 'intake' : 'kkm';

await setAsOf();
const [detail, labels] = await Promise.all([repo.getSourceDetail(DEMO_RESEARCHER_ID, id), repo.getCategories()]);
const { source, summary, categoryUsed, transactions } = detail;

document.getElementById('title').textContent = source.fullName ? `${source.fullName} (${source.name})` : source.name;
document.getElementById('subtitle').textContent = `${detail.researcher.name} · ${detail.researcher.dept}`;

const root = document.getElementById('sources');
root.replaceChildren();
const section = el('section');

section.append(el('div', { class: 'kpis' },
  kpi(id === 'kkm' ? 'זמין (הקצאה + צבירה)' : 'תקציב הקליטה', summary.available, { currency: summary.currency }),
  kpi('שולם', summary.used, { currency: summary.currency }),
  kpi('התחייבויות פתוחות', summary.committed, { currency: summary.currency }),
  kpi('יתרה', summary.balance, { currency: summary.currency, ...(summary.isDeficit ? { variant: 'deficit', note: 'גירעון' } : { variant: 'accent' }) })));

section.append(el('div', { class: 'panel' },
  el('h2', { text: `ניצול: ${formatPercent(summary.utilization)}` }), utilizationBar(summary), legend(),
  summary.isDeficit ? el('p', {}, deficitChip()) : null,
  detail.period ? el('p', { class: 'muted small' }, 'תקופת ההסכם: ', ltr(`${formatDate(detail.period.start)} – ${formatDate(detail.period.end)}`)) : null));

// How this source appears in Priority (the 4 existing fields) plus the missing "expense type" field.
const map = MAPPING.sourceTypes.find(t => t.type === id);
const priority = el('div', { class: 'panel' }, el('h2', { text: 'כך המקור מופיע ב-Priority' }),
  el('ul', { class: 'source-list' },
    el('li', {}, el('strong', { text: 'מעבדה: ' }), map.lab),
    el('li', {}, el('strong', { text: 'קרן: ' }), map.fund),
    el('li', {}, el('strong', { text: 'סעיף תקציבי: ' }), ltr(map.budgetItems)),
    el('li', {}, el('strong', { text: 'מחקר: ' }), map.research),
    el('li', { class: 'muted', text: 'סוג הוצאה: שדה חדש מוצע (היום משתמשים בשדה "פיננסי").' })));
if (id === 'kkm') {
  section.append(el('div', { class: 'grid2' },
    el('div', { class: 'panel' }, el('h2', { text: 'התפלגות הוצאות לפי קטגוריה' }), categoryList(categoryUsed, labels, source.rules.categoryCaps ?? {})),
    priority));
} else {
  section.append(priority);
}

const rows = transactions.map(t => {
  const paid = t.status === 'paid';
  return el('tr', {},
    el('td', {}, ltr(formatDate(t.date))),
    el('td', { text: t.description }),
    el('td', {}, t.budgetItem.label, ' ', el('span', { class: 'muted small' }, ltr(t.budgetItem.code))),
    el('td', { text: t.expenseType }),
    el('td', { text: t.source }),
    el('td', {}, el('span', { class: `chip ${paid ? 'paid' : 'pending'}`, text: paid ? 'שולם' : 'מאושר, טרם שולם' })),
    el('td', { class: 'num' }, ltr(id === 'kkm' ? formatILS(t.amount) : formatMoney(t.amount, summary.currency))));
});
section.append(el('div', { class: 'panel' }, el('h2', { text: 'תנועות אחרונות' }),
  el('div', { class: 'table-wrap' }, el('table', {},
    el('thead', {}, el('tr', {}, ...['תאריך', 'תיאור', 'סעיף תקציבי', 'סוג הוצאה', 'מקור', 'סטטוס'].map(h => el('th', { scope: 'col', text: h })), el('th', { scope: 'col', class: 'num', text: 'סכום' }))),
    el('tbody', {}, ...rows)))));

root.append(section);
