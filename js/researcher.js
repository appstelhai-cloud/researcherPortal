import { el, ltr, formatILS, formatMoney, formatPercent, formatDate } from './format.js';
import { mockRepository as repo } from './repository.js';
import { setAsOf } from './shell.js';
import { kpi, utilizationBar, legend, deficitChip, categoryList } from './ui.js';

const DEMO_RESEARCHER_ID = 'a'; // real adapter: derived server-side from SSO identity

await setAsOf();

const [card, year, labels] = await Promise.all([
  repo.getResearcherCard(DEMO_RESEARCHER_ID),
  repo.getBudgetYear(),
  repo.getCategories()
]);

document.getElementById('title').textContent = `${card.researcher.name} · ${card.researcher.dept}`;
document.getElementById('year').textContent = `שנת תקציב ${year.label} (1.10 – 30.9)`;

const root = document.getElementById('sources');
root.replaceChildren();

// One block per funding source; MVP has exactly one (KKM).
for (const { source, summary, categoryUsed, transactions } of card.sources) {
  const section = el('section', { 'aria-labelledby': `src-${source.id}` });
  section.append(el('h2', { id: `src-${source.id}`, text: source.name }));

  const kpis = el('div', { class: 'kpis' },
    kpi('זמין (הקצאה + צבירה)', summary.available),
    kpi('שולם', summary.used),
    kpi('התחייבויות פתוחות', summary.committed),
    kpi('יתרה', summary.balance, summary.isDeficit
      ? { variant: 'deficit', note: 'גירעון, עובר לשנה הבאה' }
      : { variant: 'accent' }));
  section.append(kpis);

  const util = el('div', { class: 'panel' },
    el('h2', { text: `ניצול: ${formatPercent(summary.utilization)}` }),
    utilizationBar(summary), legend());
  if (summary.isDeficit) util.append(el('p', {}, deficitChip()));
  section.append(util);

  const caps = source.rules.categoryCaps ?? {};
  const grid = el('div', { class: 'grid2' },
    el('div', { class: 'panel' }, el('h2', { text: 'התפלגות הוצאות לפי קטגוריה' }), categoryList(categoryUsed, labels, caps)),
    el('div', { class: 'panel' }, el('h2', { text: 'מקורות נתונים' }),
      el('ul', { class: 'source-list' },
        el('li', {}, el('strong', { text: 'Priority' }), ' – הקצאה, צבירה והוצאות בפועל'),
        el('li', {}, el('strong', { text: 'Quotes' }), ' – בקשות רכש מאושרות שטרם שולמו (התחייבויות)'),
        el('li', { class: 'muted', text: 'בגרסת הדמו המקורות מדומים.' }))));
  section.append(grid);

  const rows = transactions.map(t => {
    const paid = t.status === 'paid';
    return el('tr', {},
      el('td', {}, ltr(formatDate(t.date))),
      el('td', { text: t.description }),
      el('td', { text: labels[t.category] ?? t.category }),
      el('td', { text: t.source }),
      el('td', {}, el('span', { class: `chip ${paid ? 'paid' : 'pending'}`, text: paid ? 'שולם' : 'מאושר, טרם שולם' })),
      el('td', { class: 'num' }, ltr(formatILS(t.amount))));
  });
  const table = el('table', {},
    el('caption', { class: 'muted', text: 'תנועות אחרונות' }),
    el('thead', {}, el('tr', {}, ...['תאריך', 'תיאור', 'קטגוריה', 'מקור', 'סטטוס'].map(h => el('th', { scope: 'col', text: h })), el('th', { scope: 'col', class: 'num', text: 'סכום' }))),
    el('tbody', {}, ...rows));
  section.append(el('div', { class: 'panel' }, el('h2', { text: 'תנועות אחרונות' }), el('div', { class: 'table-wrap' }, table)));

  root.append(section);
}

// The researcher is also a participant in researches (grants); each has its own budget.
const researches = await repo.listResearches({ researcherId: DEMO_RESEARCHER_ID });
if (researches.length) {
  const rows = researches.map(r => el('tr', {},
    el('th', { scope: 'row' }, el('a', { href: `research.html?id=${r.id}&from=mine`, text: r.title })),
    el('td', { text: r.center }),
    el('td', { class: 'num' }, ltr(formatMoney(r.summary.balance, r.summary.currency))),
    el('td', {}, utilizationBar(r.summary, { small: true }), el('span', { class: 'muted', text: formatPercent(r.summary.utilization) })),
    el('td', {}, r.summary.isDeficit ? deficitChip() : null)));
  root.append(el('section', { 'aria-labelledby': 'my-researches' },
    el('h2', { id: 'my-researches', text: 'המחקרים שלי' }),
    el('div', { class: 'panel' }, el('div', { class: 'table-wrap' }, el('table', {},
      el('thead', {}, el('tr', {}, ...['מחקר', 'מרכז מחקר'].map(h => el('th', { scope: 'col', text: h })), el('th', { scope: 'col', class: 'num', text: 'יתרה' }), el('th', { scope: 'col', text: 'ניצול' }), el('th', { scope: 'col', text: 'סטטוס' }))),
      el('tbody', {}, ...rows))))));
}
