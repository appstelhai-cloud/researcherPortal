import { el, ltr, formatDate } from './format.js';
import { mockRepository as repo } from './repository.js';
import { setAsOf } from './shell.js';
import { visibleCalls, matchesInterests } from './calls-logic.js';
import { getInterests } from './profile-store.js';

const manage = new URLSearchParams(location.search).get('manage') === '1';
await setAsOf();

const all = await repo.listCalls();
const interests = getInterests();

document.getElementById('title').textContent = manage ? 'ניהול קולות קוראים' : 'קולות קוראים';
document.getElementById('subtitle').textContent = manage
  ? 'קולות קוראים שנאספו מכמה מקורות. הרשות מחליטה: להציג לכולם, או לנתב לחוקרים לפי תחום.'
  : 'קולות קוראים חיצוניים שמתאימים לך. הרשימה מתעדכנת לפי תחומי העניין בפרופיל.';
document.getElementById('origin-note').textContent =
  'הקולות הקוראים לא מתפרסמים באתר. הם נאספים מכמה מקורות לטבלה בפורמט קבוע (אגרגטור), ובהדגמה מגיעים מנתוני דוגמה.';
if (manage) {
  document.getElementById('manage-th').hidden = false;
  document.getElementById('match-wrap').hidden = true;
}

const rows = document.getElementById('rows');
const q = document.getElementById('q');
const match = document.getElementById('match');
const cols = manage ? 5 : 4;

/** One call = a main row + a full-width detail row that opens beneath it (never changes column widths). */
function callRows(c, n) {
  const detailId = `call-detail-${n}`;
  const toggle = el('button', { class: 'link-btn', type: 'button', 'aria-expanded': 'false', 'aria-controls': detailId, text: 'להצגה' });
  const detail = el('tr', { class: 'detail-row', id: detailId, hidden: '' },
    el('td', { colspan: String(cols) },
      el('p', { class: 'small', text: c.info }),
      el('p', { class: 'small muted', text: `תחומים: ${c.areas.join(', ')} · מקור: ${c.origin}` })));
  toggle.addEventListener('click', () => {
    const open = detail.hidden;
    detail.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.textContent = open ? 'הסתר' : 'להצגה';
  });

  let expo = null;
  if (manage) {
    const sel = el('select', { 'aria-label': `חשיפה: ${c.title}` },
      el('option', { value: 'all', text: 'לכולם' }), el('option', { value: 'routed', text: 'לפי תחום' }));
    sel.value = c.exposure; // non-persistent: concept only
    expo = el('td', {}, sel);
  }
  const fit = !manage && matchesInterests(c, interests);
  const main = el('tr', {},
    el('th', { scope: 'row' }, c.title, fit ? el('span', { class: 'chip paid', text: ' מתאים לך' }) : null),
    el('td', { text: c.funder }),
    el('td', {}, ltr(formatDate(c.deadline))),
    expo,
    el('td', {}, toggle));
  return [main, detail];
}

function render() {
  const term = q.value.trim().toLowerCase();
  let list = manage ? all : visibleCalls(all, interests);
  if (!manage && match.checked) list = list.filter(c => matchesInterests(c, interests));
  const shown = list.filter(c => !term || `${c.title} ${c.funder} ${c.areas.join(' ')}`.toLowerCase().includes(term));
  rows.replaceChildren(...shown.flatMap(callRows));
  document.getElementById('empty').hidden = shown.length > 0;
}
q.addEventListener('input', render);
match.addEventListener('change', render);
render();
