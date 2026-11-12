import { el, ltr, formatDate } from './format.js';
import { mockRepository as repo } from './repository.js';
import { setAsOf } from './shell.js';

const kind = new URLSearchParams(location.search).get('kind') === 'external' ? 'external' : 'internal';
await setAsOf();

const kinds = await repo.getCallKinds();
const all = await repo.listCalls({ kind });

document.getElementById('title').textContent = kinds[kind].label;
document.getElementById('subtitle').textContent = kind === 'internal'
  ? 'מקורות תקציב של האוניברסיטה. קול קורא שזכית בו הופך למחקר עם תקציב משלו.'
  : 'מימון מגורמים חיצוניים. קול קורא שזכית בו הופך למחקר עם תקציב משלו, לפעמים במטבע זר.';
if (kind === 'internal') document.getElementById('funder-th').hidden = true;

const rows = document.getElementById('rows');
const q = document.getElementById('q');

/** One call = a main row + a full-width detail row that opens beneath it (never changes column widths). */
function callRows(c, n) {
  const cols = kind === 'external' ? 4 : 3;
  const detailId = `call-detail-${n}`;
  const toggle = el('button', { class: 'link-btn', type: 'button', 'aria-expanded': 'false', 'aria-controls': detailId, text: 'להצגה' });
  const detail = el('tr', { class: 'detail-row', id: detailId, hidden: '' },
    el('td', { colspan: String(cols) }, el('p', { class: 'small', text: c.info })));
  toggle.addEventListener('click', () => {
    const open = detail.hidden;
    detail.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.textContent = open ? 'הסתר' : 'להצגה';
  });
  const main = el('tr', {},
    el('th', { scope: 'row', text: c.title }),
    kind === 'external' ? el('td', { text: c.funder }) : null,
    el('td', {}, ltr(formatDate(c.deadline))),
    el('td', {}, toggle));
  return [main, detail];
}

function render() {
  const term = q.value.trim().toLowerCase();
  const shown = all.filter(c => !term || `${c.title} ${c.funder}`.toLowerCase().includes(term));
  rows.replaceChildren(...shown.flatMap(callRows));
  document.getElementById('empty').hidden = shown.length > 0;
}
q.addEventListener('input', render);
render();
