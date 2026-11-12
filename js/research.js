import { el, ltr, formatMoney, formatPercent, formatDate } from './format.js';
import { mockRepository as repo } from './repository.js';
import { setAsOf } from './shell.js';
import { kpi, utilizationBar, legend, deficitChip } from './ui.js';

const DEMO_RESEARCHER_ID = 'a'; // real adapter: derived server-side from SSO identity
const params = new URLSearchParams(location.search);
const id = params.get('id');
const mine = params.get('mine') === '1' || params.get('from') === 'mine';

await setAsOf();
const roles = await repo.getResearchRoles();
const view = document.getElementById('view');
view.replaceChildren();

const period = (r) => `${formatDate(r.start)} – ${formatDate(r.end)}`;

function researchCard(r) {
  const s = r.summary;
  const pi = r.participants.find(p => p.role === 'pi');
  const href = `research.html?id=${r.id}${mine ? '&from=mine' : ''}`;
  const card = el('article', { class: 'research-card' },
    el('div', { class: 'rc-top' },
      el('span', { class: 'tag', text: r.center }),
      s.isDeficit ? deficitChip() : null),
    el('h2', {}, el('a', { href, text: r.title })),
    el('p', { class: 'muted small' }, `${r.funder} · `, ltr(period(r))),
    el('p', { class: 'small' }, `חוקר/ת ראשי/ת: ${pi.name} · ${r.participants.length} חוקרים`),
    utilizationBar(s),
    el('div', { class: 'rc-foot' },
      el('span', {}, 'יתרה: ', ltr(formatMoney(s.balance, s.currency))),
      el('span', { class: 'muted', text: `ניצול ${formatPercent(s.utilization)}` })));
  return card;
}

async function renderList() {
  document.getElementById('title').textContent = mine ? 'המחקרים שלי' : 'כל המחקרים';
  document.getElementById('subtitle').textContent = mine
    ? 'מחקרים שאני משתתף/ת בהם. כל מחקר מנוהל בתקציב משלו, בנפרד מהקק״מ האישי.'
    : 'מבט כולל של רשות המחקר: מחקר הוא ישות בפני עצמה, עם כמה חוקרים.';
  const list = await repo.listResearches(mine ? { researcherId: DEMO_RESEARCHER_ID } : {});
  if (!list.length) { view.append(el('p', { class: 'muted', text: 'אין מחקרים להצגה.' })); return; }
  view.append(el('div', { class: 'cards' }, ...list.map(researchCard)));
}

async function renderDetail() {
  const r = await repo.getResearch(id);
  const s = r.summary;
  document.title = `פורטל חוקר – ${r.title}`;
  document.getElementById('title').textContent = r.title;
  document.getElementById('subtitle').textContent = `${r.center} · ${r.funder} · ${period(r)}`;
  const crumbs = document.getElementById('crumbs');
  crumbs.hidden = false;
  crumbs.append(el('a', { href: mine ? 'research.html?mine=1' : 'research.html', text: mine ? 'המחקרים שלי' : 'כל המחקרים' }));

  view.append(el('div', { class: 'kpis' },
    kpi('תקציב המחקר', s.available, { currency: s.currency }),
    kpi('שולם', s.used, { currency: s.currency }),
    kpi('התחייבויות פתוחות', s.committed, { currency: s.currency }),
    kpi('יתרה', s.balance, { currency: s.currency, ...(s.isDeficit ? { variant: 'deficit', note: 'חריגה מהתקציב, לטיפול מול המממן' } : { variant: 'accent' }) })));

  view.append(el('div', { class: 'panel' },
    el('h2', { text: `ניצול: ${formatPercent(s.utilization)}` }), utilizationBar(s), legend(),
    el('p', { class: 'muted small', text: `מטבע התקציב: ${s.currency}. ההצגה במטבע המקורי, ללא המרה לש״ח.` })));

  const people = r.participants.map(p => el('tr', {},
    el('th', { scope: 'row', text: p.name }),
    el('td', { text: p.dept }),
    el('td', {}, el('span', { class: `chip ${p.role === 'pi' ? 'paid' : ''}`, text: roles[p.role] }))));
  const peopleTable = el('table', { class: 'narrow' },
    el('thead', {}, el('tr', {}, ...['חוקר/ת', 'מרכז מחקר', 'תפקיד'].map(h => el('th', { scope: 'col', text: h })))),
    el('tbody', {}, ...people));

  const tx = r.transactions.map(t => {
    const paid = t.status === 'paid';
    return el('tr', {},
      el('td', {}, ltr(formatDate(t.date))),
      el('td', { text: t.description }),
      el('td', {}, el('span', { class: `chip ${paid ? 'paid' : 'pending'}`, text: paid ? 'שולם' : 'מאושר, טרם שולם' })),
      el('td', { class: 'num' }, ltr(formatMoney(t.amount, r.currency))));
  });
  const txTable = el('table', {},
    el('thead', {}, el('tr', {}, ...['תאריך', 'תיאור', 'סטטוס'].map(h => el('th', { scope: 'col', text: h })), el('th', { scope: 'col', class: 'num', text: 'סכום' }))),
    el('tbody', {}, ...tx));

  view.append(el('div', { class: 'panel' }, el('h2', { text: 'חוקרים במחקר' }), el('div', { class: 'table-wrap' }, peopleTable)));
  view.append(el('div', { class: 'panel' }, el('h2', { text: 'תנועות אחרונות' }), el('div', { class: 'table-wrap' }, txTable)));
}

try {
  await (id ? renderDetail() : renderList());
} catch {
  view.append(el('p', { text: 'המחקר לא נמצא.' }));
}
