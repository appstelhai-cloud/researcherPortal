import { el, ltr, formatDate } from './format.js';
import { mockRepository as repo } from './repository.js';
import { setAsOf } from './shell.js';
import { missing } from './monday-monitor.js';
import { ALERT_GROUPS, ALERT_RULES, readRules, writeRules, isOn } from './alert-rules.js';

await setAsOf();
const [map, monitor] = await Promise.all([repo.getMapping(), repo.getMondayMonitor()]);
const view = document.getElementById('view');

const table = (heads, rows, narrow = false) => el('div', { class: 'table-wrap' }, el('table', { class: narrow ? 'narrow' : '' },
  el('thead', {}, el('tr', {}, ...heads.map(h => el('th', { scope: 'col', text: h })))),
  el('tbody', {}, ...rows)));
const panel = (title, ...children) => el('div', { class: 'panel' }, el('h2', { text: title }), ...children);

// 1. Source types <-> the 4 Priority fields
view.append(panel('מקורות מימון ושדות Priority',
  el('p', { class: 'muted small', text: `ארבעה שדות קיימים: ${map.priorityFields.join(', ')}.` }),
  table(['סוג מקור', 'מעבדה', 'קרן', 'סעיף תקציבי', 'מחקר'],
    map.sourceTypes.map(t => el('tr', {}, el('th', { scope: 'row', text: t.label }), el('td', { text: t.lab }), el('td', { text: t.fund }), el('td', {}, ltr(t.budgetItems)), el('td', { text: t.research }))))));

// 2. Expense type: the missing field
view.append(panel('סוג הוצאה (שדה חסר ב-Priority)',
  el('p', { class: 'muted small', text: 'היום משתמשים בשדה "פיננסי" לסיווג הוצאות. הצעה: שדה נפרד "סוג הוצאה", עד שיוגדר מופיע המיפוי לערך הקיים.' }),
  table(['סוג הוצאה (חדש)', 'ערך "פיננסי" קיים'], map.expenseTypes.map(e => el('tr', {}, el('th', { scope: 'row', text: e.label }), el('td', { text: e.legacyFinancial }))), true)));

// 3. monday: mandatory columns + monitor
const bad = missing(monitor.results);
const alert = bad.length
  ? el('div', { class: 'alert', role: 'alert' }, el('strong', { text: 'התראה: ' }), `בבורד "${monitor.board.name}" חסרות עמודות חובה: ${bad.map(b => `${b.label} (${b.column})`).join(', ')}.`)
  : el('div', { class: 'alert ok', role: 'status', text: 'כל עמודות החובה קיימות בבורד.' });
view.append(panel('Monday: עמודות חובה וניטור',
  el('p', { class: 'muted small', text: 'ממפים רק עמודות חובה. שאר העמודות חופשיות, והשליפה דינמית. אם עמודת מפתח נמחקת, המסך מתריע. שמות העמודות הם הצעה: רשות המחקר תקבע אותם.' }),
  alert,
  table(['שדה במערכת', 'עמודה ב-Monday', 'מצב'], monitor.results.map(r => el('tr', {},
    el('th', { scope: 'row', text: r.label }), el('td', {}, ltr(r.column)),
    el('td', {}, el('span', { class: `chip ${r.ok ? 'paid' : 'late'}`, text: r.ok ? 'קיימת' : 'חסרה' })))), true),
  el('p', { class: 'muted small' }, 'נבדק לאחרונה: ', ltr(formatDate(monitor.board.checkedAt)))));

// 4. External users
view.append(panel('משתמשים חיצוניים',
  el('p', { class: 'muted small', text: 'שותפי מחקר מחוץ לאוניברסיטה ותורמים. כל משתמש חיצוני רואה רק את מה שהוא צד לו.' }),
  table(['שם', 'סוג', 'היקף גישה', 'מצב'], map.externalUsers.map(u => el('tr', {},
    el('th', { scope: 'row', text: u.name }), el('td', { text: u.kind }), el('td', { text: u.scope }), el('td', { text: u.status }))))));

// 5. Alerts: which ones the action center (bell) shows. A choice is saved per browser here; a real adapter saves it per user.
const choices = readRules();
const alertRows = ALERT_RULES.map(r => {
  const box = el('input', { type: 'checkbox', id: `rule-${r.key}` });
  box.checked = isOn(r.key, choices);
  box.addEventListener('change', () => { choices[r.key] = box.checked; writeRules(choices); });
  return el('tr', {},
    el('td', {}, box),
    el('th', { scope: 'row' }, el('label', { for: box.id, text: r.label })),
    el('td', {}, el('span', { class: 'tag', text: r.kind })),
    el('td', { text: ALERT_GROUPS[r.group] }),
    el('td', { class: 'muted small', text: r.desc }));
});
view.append(panel('התראות: מה מוצג במרכז הפעולות',
  el('p', { class: 'muted small', text: 'ההתראות כוללות הוצאות, כסף שנכנס מקרנות, ומועדי הגשה יחד עם הפעולה הבאה (למשל "דוח התקדמות באיחור"). כל אחת ניתנת להפעלה או לכיבוי. השינוי חל בטעינה הבאה של הדף.' }),
  table(['מוצגת', 'התראה', 'סוג', 'תפקיד', 'מתי'], alertRows)));
