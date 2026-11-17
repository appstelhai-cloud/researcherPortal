import { el, ltr, formatDate } from './format.js';
import { mockRepository as repo } from './repository.js';
import { setAsOf } from './shell.js';
import { suggestMapping } from './monday-monitor.js';

await setAsOf();
const hub = await repo.getMondayHub();
const view = document.getElementById('view');

const table = (heads, rows) => el('div', { class: 'table-wrap' }, el('table', { class: 'narrow' },
  el('thead', {}, el('tr', {}, ...heads.map(h => el('th', { scope: 'col', text: h })))),
  el('tbody', {}, ...rows)));
const panel = (title, ...children) => el('div', { class: 'panel' }, el('h2', { text: title }), ...children);
const field = (id, label, control) => el('div', { class: 'field' }, el('label', { for: id, text: label }), control);
const note = (box, title, text) => { box.hidden = false; box.replaceChildren(el('strong', { text: `${title} ` }), text); };

// 1. Connection
const c = hub.connection;
view.append(panel('חיבור',
  el('div', { class: 'alert ok', role: 'status' }, el('strong', { text: 'מחובר: ' }), `סביבת העבודה "${c.workspace}". נבדק לאחרונה `, ltr(formatDate(c.testedAt)), '.'),
  table(['פרט', 'ערך'], [
    el('tr', {}, el('th', { scope: 'row', text: 'מפתח API' }), el('td', {}, ltr(c.keyHint))),
    el('tr', {}, el('th', { scope: 'row', text: 'הרשאות' }), el('td', {}, ltr(c.scopes.join(', '))))]),
  el('p', { class: 'muted small', text: 'המפתח נשמר בשרת בלבד ולא מוצג בדפדפן. מומלץ מפתח של משתמש שירות ייעודי, עם הרשאות לבורדים של הרשות בלבד, כדי שהחיבור לא יהיה תלוי באדם מסוים.' })));

// 2. Boards
const stateChip = (s) => el('span', { class: `chip ${s === 'imported' ? 'paid' : 'wait'}`, text: s === 'imported' ? 'מיובא' : 'לא מיובא' });
const boards = hub.boards;
view.append(panel('בורדים בסביבת העבודה',
  table(['בורד', 'פריטים', 'מצב', 'סנכרון אחרון'], boards.map(b => el('tr', {},
    el('th', { scope: 'row', text: b.name }), el('td', {}, ltr(String(b.items))), el('td', {}, stateChip(b.state)),
    el('td', {}, b.syncedAt ? ltr(formatDate(b.syncedAt)) : '—'))))));

// 3. Import wizard: pick board -> map the mandatory columns -> import
const boardSel = el('select', { id: 'board' }, ...boards.filter(b => b.state === 'new').map(b => el('option', { value: b.id, text: b.name })));
const mapBox = el('div', { id: 'map-box' });
const doneImport = el('div', { class: 'alert ok', role: 'status', hidden: '' });
const importBtn = el('button', { class: 'btn primary', type: 'button', text: 'ייבוא הבורד' });

function renderMap() {
  const b = boards.find(x => x.id === boardSel.value);
  const guess = suggestMapping(hub.required, b.columns);
  const noneLabel = '— בחירה ידנית —';
  const selects = hub.required.map(r => {
    const sel = el('select', { id: `col-${r.key}` }, el('option', { value: '', text: noneLabel }), ...b.columns.map(col => el('option', { value: col, text: col })));
    sel.value = guess[r.key] ?? '';
    return [r, sel];
  });
  const check = () => {
    const open = selects.filter(([, s]) => !s.value).map(([r]) => r.label);
    importBtn.disabled = open.length > 0;
    status.className = open.length ? 'alert' : 'alert ok';
    status.replaceChildren(open.length
      ? el('span', {}, el('strong', { text: 'חסר מיפוי: ' }), open.join(', '), '. אי אפשר לייבא עד שיוגדרו כל עמודות החובה.')
      : 'כל עמודות החובה ממופות. שאר העמודות נשארות חופשיות.');
  };
  const status = el('div', { role: 'status' });
  for (const [, s] of selects) s.addEventListener('change', check);
  mapBox.replaceChildren(
    el('p', { class: 'muted small', text: 'ההתאמה הראשונית לפי שם העמודה. כל עמודה שלא נמצאה נבחרת ידנית.' }),
    el('div', { class: 'form-grid' }, ...selects.map(([r, s]) => field(`col-${r.key}`, r.label, s))),
    status);
  doneImport.hidden = true;
  check();
}
boardSel.addEventListener('change', renderMap);
importBtn.addEventListener('click', () => note(doneImport, 'הבורד יובא (הדגמה).', 'הפריטים יופיעו במעקב, והמיפוי יישמר בקובץ ההגדרות.'));
view.append(panel('ייבוא בורד קיים',
  field('board', 'בורד לייבוא', boardSel), mapBox, importBtn, doneImport));
renderMap();

// 4. Create a board from a template
const tplSel = el('select', { id: 'tpl' }, ...hub.templates.map(t => el('option', { value: t.key, text: t.label })));
const tplCols = el('p', { class: 'muted small' });
const showCols = () => { tplCols.replaceChildren('עמודות: ', ltr(hub.templates.find(t => t.key === tplSel.value).columns.join(', '))); };
tplSel.addEventListener('change', showCols);
showCols();
const nameIn = el('input', { id: 'bname', type: 'text', value: 'מחקר חדש (דמו)' });
const doneCreate = el('div', { class: 'alert ok', role: 'status', hidden: '' });
const createBtn = el('button', { class: 'btn primary', type: 'button', text: 'יצירת בורד' });
createBtn.addEventListener('click', () => note(doneCreate, 'הבורד נוצר (הדגמה).', `"${nameIn.value || 'ללא שם'}" נוצר עם עמודות החובה כבר ממופות.`));
view.append(panel('יצירת בורד חדש מתבנית',
  el('p', { class: 'muted small', text: 'התבנית כוללת את עמודות החובה, לכן אין צורך במיפוי ידני.' }),
  el('div', { class: 'form-grid' }, field('tpl', 'תבנית', tplSel), field('bname', 'שם הבורד', nameIn)),
  tplCols, createBtn, doneCreate));

// 5. Update back to monday: field ownership + log
view.append(panel('עדכון חזרה ל-Monday: מי כותב מה',
  el('p', { class: 'muted small', text: 'לכל שדה יש בעלים אחד, והצד השני רק קורא. כך שני הצדדים לא דורסים אחד את השני.' }),
  table(['שדה', 'בעלים', 'כיוון', 'מתי'], hub.rules.map(r => el('tr', {},
    el('th', { scope: 'row', text: r.field }), el('td', { text: r.owner === 'monday' ? 'Monday' : 'הפורטל' }), el('td', { text: r.direction }), el('td', { text: r.trigger }))))));

view.append(panel('יומן סנכרון',
  table(['מועד', 'פעולה', 'תוצאה', 'הערה'], hub.log.map(l => el('tr', {},
    el('td', {}, ltr(formatDate(l.at))), el('th', { scope: 'row', text: l.what }),
    el('td', {}, el('span', { class: `chip ${l.result === 'ok' ? 'paid' : 'late'}`, text: l.result === 'ok' ? 'הצליח' : 'נכשל' })),
    el('td', { text: l.note }))))));
