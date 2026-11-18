import { el, ltr, formatDate, formatILS } from './format.js';
import { mockRepository as repo } from './repository.js';
import { setAsOf } from './shell.js';
import { bucketize, displayState, daysLeft, routeOf, matchesState, canOpenRound, openApprovalRound, APPROVAL_ROUND } from './request-model.js';

const all = new URLSearchParams(location.search).get('all') === '1';
const viewerRole = all ? 'authority' : 'researcher';
const DEMO_RESEARCHER = 'a';

await setAsOf();
const asOf = await repo.getAsOf();
const meta = await repo.getRequestMeta();
let requests = await repo.listRequests(all ? {} : { researcherId: DEMO_RESEARCHER });

document.getElementById('title').textContent = all ? 'מעקב בקשות' : 'הבקשות שלי';
document.getElementById('subtitle').textContent = all
  ? 'כל הבקשות של החוקרים במקום אחד, לפי שלב טיפול וגורם מטפל.'
  : 'מה ממתין לך, מה בטיפול של אחרים, ומה השלב הבא בכל בקשה.';
if (all) document.getElementById('who-th').hidden = false;

// The list mixes types (funder report, purchase, research proposal, ...): filter by type with chips that show counts.
let activeType = '';
const typeBox = document.getElementById('type-filter');
const stateSel = document.getElementById('state');
if (all) stateSel.querySelector('[value="mine"]').textContent = 'ממתין לרשות המחקר';
const q = document.getElementById('q');
const rows = document.getElementById('rows');
const cols = all ? 7 : 6;
const notice = document.getElementById('round-note');

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

/** Approval round of a research proposal: the steps, and which one holds it now. */
function roundSteps(r) {
  const idx = APPROVAL_ROUND.findIndex(s => s.role === r.assignee.role);
  const started = r.status !== 'waiting_researcher';
  return el('div', { class: 'round' },
    el('p', { class: 'small' }, el('strong', { text: 'סבב אישורים: ' }), started ? '' : 'טרם נפתח. ייפתח בלחיצה על "פתח סבב אישורים".'),
    el('ol', { class: 'round-steps' }, ...APPROVAL_ROUND.map((s, i) =>
      el('li', { class: started && i === idx ? 'now' : started && i < idx ? 'past' : '', text: s.label }))));
}

function openRound(r) {
  const next = openApprovalRound(r, asOf);
  requests = requests.map(x => x.id === r.id ? next : x);
  notice.textContent = `נפתח סבב אישורים להצעה "${r.title}". היא עברה אל ${meta.roles[next.assignee.role]} (הדגמה: אין שליחה אמיתית).`;
  render();
}

function requestRows(r, n) {
  const st = displayState(r, asOf);
  const detailId = `req-detail-${n}`;
  const toggle = el('button', { class: 'link-btn', type: 'button', 'aria-expanded': 'false', 'aria-controls': detailId, text: 'להצגה' });
  const detail = el('tr', { class: 'detail-row', id: detailId, hidden: '' },
    el('td', { colspan: String(cols) },
      el('p', { class: 'small' }, el('strong', { text: 'הפעולה הבאה: ' }), r.next),
      r.type === 'proposal' ? roundSteps(r) : null,
      routeOf(r.type) ? el('p', { class: 'small' }, el('strong', { text: 'מסלול: ' }), routeOf(r.type)) : null,
      r.amount ? el('p', { class: 'small' }, `סכום: `, ltr(formatILS(r.amount)), ` · מקור: ${r.source}`) : el('p', { class: 'small', text: `מקור: ${r.source}` }),
      historyList(r)));
  toggle.addEventListener('click', () => {
    const open = detail.hidden;
    detail.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.textContent = open ? 'הסתר' : 'להצגה';
  });
  const roundBtn = !all && canOpenRound(r) ? el('button', { class: 'btn primary sm', type: 'button', text: 'פתח סבב אישורים' }) : null;
  roundBtn?.addEventListener('click', () => openRound(r));
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
    el('td', { class: 'row-actions' }, toggle, roundBtn));
  return [main, detail];
}

function renderTypeChips(base) {
  const count = (t) => base.filter(r => !t || r.type === t).length;
  const chip = (key, label) => {
    const b = el('button', { type: 'button', class: 'btn chip-btn', 'aria-pressed': String(activeType === key), text: `${label} · ${count(key)}` });
    b.addEventListener('click', () => { activeType = key; render(); });
    return b;
  };
  typeBox.replaceChildren(chip('', 'הכול'), ...Object.entries(meta.types).filter(([k]) => requests.some(r => r.type === k)).map(([k, v]) => chip(k, v)));
}

function render() {
  const term = q.value.trim().toLowerCase();
  const base = requests.filter(r =>
    matchesState(r, asOf, viewerRole, stateSel.value) &&
    (!term || `${r.title} ${r.researcher} ${meta.types[r.type]}`.toLowerCase().includes(term)));
  renderTypeChips(base);
  const shown = base.filter(r => !activeType || r.type === activeType);
  kpis(shown);
  rows.replaceChildren(...shown.flatMap(requestRows));
  document.getElementById('empty').hidden = shown.length > 0;
}
q.addEventListener('input', render);
stateSel.addEventListener('change', render);
render();
