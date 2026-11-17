import { el, ltr, formatDate, formatILS } from './format.js';
import { mockRepository as repo } from './repository.js';
import { setAsOf } from './shell.js';
import { bucketize, displayState, daysLeft, routeOf } from './request-model.js';

const all = new URLSearchParams(location.search).get('all') === '1';
const viewerRole = all ? 'authority' : 'researcher';
const DEMO_RESEARCHER = 'a';

await setAsOf();
const asOf = await repo.getAsOf();
const meta = await repo.getRequestMeta();
const requests = await repo.listRequests(all ? {} : { researcherId: DEMO_RESEARCHER });

document.getElementById('title').textContent = all ? 'מעקב בקשות' : 'הבקשות שלי';
document.getElementById('subtitle').textContent = all
  ? 'כל הבקשות של החוקרים במקום אחד, לפי שלב טיפול וגורם מטפל.'
  : 'מה ממתין לך, מה בטיפול של אחרים, ומה השלב הבא בכל בקשה.';
if (all) document.getElementById('who-th').hidden = false;

const typeSel = document.getElementById('type');
for (const [k, v] of Object.entries(meta.types)) typeSel.append(el('option', { value: k, text: v }));
const q = document.getElementById('q');
const rows = document.getElementById('rows');
const cols = all ? 7 : 6;

function kpis(list) {
  const b = bucketize(list, asOf, viewerRole);
  const card = (label, n, variant) => el('div', { class: `kpi ${variant}` },
    el('div', { class: 'label', text: label }), el('div', { class: 'value', text: String(n) }));
  document.getElementById('kpis').replaceChildren(
    card('באיחור', b.late, b.late ? 'deficit' : ''),
    card(all ? 'ממתינות לרשות המחקר' : 'ממתינות לך', b.mine, 'accent'),
    card('בטיפול גורם אחר', b.other, ''));
}

function historyList(req) {
  const ol = el('ol', { class: 'timeline' });
  for (const e of [...req.history].reverse()) {
    const change = e.from && e.from !== e.to ? `${e.from} ← ${e.to}` : e.to;
    ol.append(el('li', {},
      el('span', { class: 'ltr', text: formatDate(e.at) }), ' · ',
      el('strong', { text: e.by }), ': ', change, e.note ? el('span', { class: 'muted', text: ` (${e.note})` }) : null));
  }
  return ol;
}

function requestRows(r, n) {
  const st = displayState(r, asOf);
  const detailId = `req-detail-${n}`;
  const toggle = el('button', { class: 'link-btn', type: 'button', 'aria-expanded': 'false', 'aria-controls': detailId, text: 'להצגה' });
  const detail = el('tr', { class: 'detail-row', id: detailId, hidden: '' },
    el('td', { colspan: String(cols) },
      el('p', { class: 'small' }, el('strong', { text: 'הפעולה הבאה: ' }), r.next),
      routeOf(r.type) ? el('p', { class: 'small' }, el('strong', { text: 'מסלול: ' }), routeOf(r.type)) : null,
      r.amount ? el('p', { class: 'small' }, `סכום: `, ltr(formatILS(r.amount)), ` · מקור: ${r.source}`) : el('p', { class: 'small', text: `מקור: ${r.source}` }),
      historyList(r)));
  toggle.addEventListener('click', () => {
    const open = detail.hidden;
    detail.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.textContent = open ? 'הסתר' : 'להצגה';
  });
  const left = daysLeft(r, asOf);
  const due = r.dueDate
    ? el('td', {}, ltr(formatDate(r.dueDate)), left > 0 && left <= 7 ? el('span', { class: 'muted small', text: ` (עוד ${left} ימים)` }) : null)
    : el('td', { class: 'muted', text: '—' });
  const main = el('tr', {},
    el('th', { scope: 'row', text: r.title }),
    all ? el('td', { text: r.researcher }) : null,
    el('td', {}, el('span', { class: 'tag', text: meta.types[r.type] })),
    el('td', { text: meta.roles[r.assignee.role] }),
    due,
    el('td', {}, el('span', { class: `chip ${st.key}`, text: st.label })),
    el('td', {}, toggle));
  return [main, detail];
}

function render() {
  const term = q.value.trim().toLowerCase();
  const shown = requests.filter(r =>
    (!typeSel.value || r.type === typeSel.value) &&
    (!term || `${r.title} ${r.researcher} ${meta.types[r.type]}`.toLowerCase().includes(term)));
  kpis(shown);
  rows.replaceChildren(...shown.flatMap(requestRows));
  document.getElementById('empty').hidden = shown.length > 0;
}
q.addEventListener('input', render);
typeSel.addEventListener('change', render);
render();
