import { el, ltr, formatILS, formatMoney, formatPercent, formatDate } from './format.js';
import { mockRepository as repo } from './repository.js';
import { setAsOf } from './shell.js';
import { kpi, utilizationBar, paceBar, categoryList } from './ui.js';
import { FLAG_LABELS, tasksOf } from './donors-logic.js';

const params = new URLSearchParams(location.search);
const mode = ['donor', 'reports'].includes(params.get('view')) ? params.get('view') : 'unit';
await setAsOf();

const $ = (id) => document.getElementById(id);
const view = $('view');
for (const a of document.querySelectorAll('#tabs a')) if (a.dataset.tab === mode) a.setAttribute('aria-current', 'page');
$('print').addEventListener('click', () => window.print());

/* ---------- What a donor sees: actual execution, what it achieved, what comes next. Never commitments or balance. ---------- */

function donationSection(d) {
  const share = { available: d.pledged, used: d.actualSpent, committed: 0, utilization: d.share, isDeficit: false, currency: 'ILS' };
  const latest = d.updates[0];
  return el('div', { class: 'panel' },
    el('h3', { text: d.title }),
    el('p', { class: 'muted small' }, `${d.center} · מאז `, ltr(formatDate(d.since))),
    el('p', { text: d.purpose }),
    el('div', { class: 'kpis' },
      kpi('סכום התרומה', d.pledged),
      kpi('בוצע בפועל', d.actualSpent, { variant: 'accent', note: `${formatPercent(d.share)} מהתרומה` })),
    utilizationBar(share),
    el('div', { class: 'grid2' },
      el('div', { class: 'panel' }, el('h4', { text: 'לאן הלך הכסף' }),
        Object.keys(d.byCategory).length ? categoryList(d.byCategory, {}) : el('p', { class: 'muted', text: 'אין עדיין הוצאות ששולמו.' })),
      el('div', { class: 'panel' }, el('h4', { text: 'מה הושג' }),
        el('ul', { class: 'plain-list' }, ...d.outputs.map(o => el('li', { text: o }))),
        latest ? el('blockquote', { class: 'update' }, el('p', { text: latest.text }),
          el('footer', { class: 'muted small' }, 'עדכון מהחוקר/ת, ', ltr(formatDate(latest.date)))) : null)),
    el('p', { class: 'small' }, `הדוח הבא אליך: עד `, ltr(formatDate(d.nextReport)), ` · איש/אשת קשר: ${d.contact}`),
    d.paid.length ? el('details', {}, el('summary', { text: 'פירוט התשלומים' }),
      el('div', { class: 'table-wrap' }, el('table', { class: 'narrow' },
        el('thead', {}, el('tr', {}, el('th', { scope: 'col', text: 'תאריך' }), el('th', { scope: 'col', text: 'תיאור' }), el('th', { scope: 'col', class: 'num', text: 'סכום ששולם' }))),
        el('tbody', {}, ...d.paid.map(t => el('tr', {},
          el('td', {}, ltr(formatDate(t.date))), el('td', { text: t.description }), el('td', { class: 'num' }, ltr(formatILS(t.amount))))))))) : null);
}

const donorSection = (rep) => el('section', { class: 'donor-report', 'aria-label': rep.donor.name },
  el('h2', { text: rep.donor.name }), ...rep.donations.map(donationSection));

/* ---------- What the External Relations unit sees: where to act this week ---------- */

const count = (label, value, note = '', variant = '') => el('div', { class: `kpi ${variant}` },
  el('div', { class: 'label', text: label }), el('div', { class: 'value', text: String(value) }), note ? el('div', { class: 'note', text: note }) : null);

function flagChips(r) {
  return el('td', {}, ...r.flags.map(f => el('span', { class: `chip ${f === 'report_overdue' ? 'late' : f === 'report_soon' || f === 'slow' ? 'wait' : ''}`, text: FLAG_LABELS[f] })));
}

function unitTable(rows) {
  return el('div', { class: 'table-wrap' }, el('table', {},
    el('thead', {}, el('tr', {}, ...['תורם', 'מחקר · חוקר/ת', 'רכז/ת'].map(h => el('th', { scope: 'col', text: h })),
      ...['התחייבות', 'התקבל', 'בוצע'].map(h => el('th', { scope: 'col', class: 'num', text: h })),
      ...['ניצול מול זמן', 'דוח הבא', 'קשר אחרון', 'מה לעשות'].map(h => el('th', { scope: 'col', text: h })))),
    el('tbody', {}, ...rows.map(r => {
      const summary = { available: r.pledged, used: r.used, committed: r.committed, utilization: r.spentShare, isDeficit: false };
      return el('tr', {},
        el('th', { scope: 'row', text: r.donor }),
        el('td', {}, el('a', { href: `research.html?id=${r.researchId}`, text: r.title }), el('div', { class: 'muted small', text: `${r.pi} · ${r.center}` })),
        el('td', { text: r.coordinator }),
        el('td', { class: 'num' }, ltr(formatMoney(r.pledged, r.currency))),
        el('td', { class: `num${r.received < r.pledged ? ' neg' : ''}` }, ltr(formatMoney(r.received, r.currency))),
        el('td', { class: 'num' }, ltr(formatMoney(r.used, r.currency))),
        el('td', {}, paceBar(summary, r.elapsed)),
        el('td', {}, ltr(formatDate(r.nextReport)), el('div', { class: 'muted small', text: r.lastReport ? `אחרון: ${formatDate(r.lastReport)}` : 'טרם נשלח דוח' })),
        el('td', {}, ltr(formatDate(r.lastContact))),
        flagChips(r));
    }))));
}

async function renderUnit() {
  const [all, coordinators] = await Promise.all([repo.listDonationsOverview(), repo.listCoordinators()]);
  $('coord-wrap').hidden = false; $('flag-wrap').hidden = false;
  const sel = $('coord');
  for (const c of coordinators) sel.append(el('option', { value: c, text: c }));
  const draw = () => {
    const rows = all.filter(r => (!sel.value || r.coordinator === sel.value) && (!$('flagged').checked || r.flags.length));
    const n = (f) => rows.filter(r => r.flags.includes(f)).length;
    const tasks = rows.flatMap(tasksOf).sort((a, b) => a.rank - b.rank);
    const open = rows.reduce((a, r) => a + (r.pledged - r.received), 0);
    view.replaceChildren(
      el('div', { class: 'kpis' },
        count('תרומות פעילות', rows.length, `${new Set(rows.map(r => r.donorId)).size} תורמים`),
        count('דוחות באיחור', n('report_overdue'), 'חייבים לצאת', n('report_overdue') ? 'deficit' : ''),
        count('דוחות ב-30 הימים הקרובים', n('report_soon')),
        count('ניצול איטי', n('slow'), 'סיכון לחידוש'),
        count('מסתיימות ב-6 חודשים', n('ending'), 'הזדמנות לחידוש'),
        kpi('התחייבויות שטרם התקבלו', open, { note: 'גבייה, לא כסף שאפשר להוציא' })),
      el('section', { class: 'panel', 'aria-labelledby': 'tasks-h' },
        el('h2', { id: 'tasks-h', text: 'מה דורש טיפול' }),
        tasks.length
          ? el('ul', { class: 'attn-list' }, ...tasks.map(t => el('li', { class: `attn ${t.tone}` },
              el('strong', { text: `${t.row.donor} · ` }), t.text, ` (${t.row.coordinator})`,
              t.action ? el('a', { class: 'btn rc-act', href: t.action[1], text: t.action[0] }) : null)))
          : el('p', { class: 'muted', text: 'אין פריטים שדורשים טיפול.' })),
      el('section', { class: 'panel', 'aria-labelledby': 'don-h' },
        el('h2', { id: 'don-h', text: 'כל התרומות' }),
        rows.length ? unitTable(rows) : el('p', { class: 'muted', text: 'אין תרומות התואמות את הסינון.' })));
  };
  sel.addEventListener('change', draw);
  $('flagged').addEventListener('change', draw);
  draw();
}

async function renderDonorView(single) {
  const donors = await repo.listDonors();
  $('print').hidden = false;
  if (single) {
    $('donor-wrap').hidden = false;
    const sel = $('donor');
    sel.replaceChildren(...donors.map(d => el('option', { value: d.id, text: d.name })));
    sel.value = params.get('donor') ?? donors[0].id;
    const show = async () => view.replaceChildren(donorSection(await repo.getDonorReport(sel.value)));
    sel.addEventListener('change', show);
    await show();
    return;
  }
  const wanted = params.get('donor');
  const list = wanted ? donors.filter(d => d.id === wanted) : donors;
  const reports = await Promise.all(list.map(d => repo.getDonorReport(d.id)));
  view.replaceChildren(...reports.map(donorSection));
}

const COPY = {
  unit: ['תורמים ותרומות', 'מבט של היחידה לקשרי חוץ וגיוס תורמים: איפה צריך לפעול השבוע, לא רק כמה כסף נכנס. תצוגה פנימית, התורמים לא רואים אותה.',
    'נקודה פתוחה: האם "התקבל" ו"דוח הבא" מנוהלים היום ב-Priority או במעקב נפרד של היחידה. כאן הם נתוני דמה.'],
  reports: ['דוחות לתורמים', 'דוח לכל תורם: ביצוע בפועל, לאן הלך הכסף ומה הושג. להדפסה או לשליחה כ-PDF.', ''],
  donor: ['כך התורם רואה', 'כך נראית הכניסה של תורם: רק התרומות שלו, ורק ביצוע בפועל, בלי התחייבויות פתוחות ובלי יתרה.',
    'נקודה פתוחה: האם תורמים נכנסים למערכת או מקבלים דוחות בלבד. שתי התצוגות הן סקיצות להשוואה.']
};
$('title').textContent = COPY[mode][0];
$('subtitle').textContent = COPY[mode][1];
$('note').textContent = COPY[mode][2];

if (mode === 'unit') await renderUnit(); else await renderDonorView(mode === 'donor');
