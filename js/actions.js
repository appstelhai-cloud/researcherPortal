import { el } from './format.js';
import { mockRepository as repo } from './repository.js';
import { setAsOf } from './shell.js';

const DEMO_RESEARCHER_ID = 'a';
const raw = new URLSearchParams(location.search).get('type');
const type = ['purchase', 'reimbursement', 'report'].includes(raw) ? raw : 'purchase';

/** Approval paths differ per request type (CIO meeting 16.11): purchase goes through procurement, reimbursement does not. */
const FLOWS = {
  purchase: {
    title: 'בקשת רכש', subtitle: 'בחירת הסעיף התקציבי מעבירה את הבקשה למערכת הרכש, עם תהליך אישורים.',
    steps: ['חוקר/ת: הגשת בקשה וסעיף תקציבי', 'רשות המחקר: אישור הסעיף', 'מערכת הרכש: הצעות מחיר וספק', 'אחראי רכש: הזמנה', 'יחידת הכספים: תשלום'],
    note: 'מסלול עם מערכת הרכש.'
  },
  reimbursement: {
    title: 'בקשת החזר', subtitle: 'קבלות וסעיף תקציבי, עם אישורים אך בלי תהליך רכש.',
    steps: ['חוקר/ת: הגשה עם קבלות וסעיף תקציבי', 'רשות המחקר: אישור', 'יחידת הכספים: החזר'],
    note: 'מסלול ללא מערכת הרכש. הגשה עד 60 יום מההוצאה.'
  },
  report: {
    title: 'דיווח התקדמות לקרן', subtitle: 'מסמכים ומלל, לפי הקרן שאליה מדווחים.',
    steps: ['חוקר/ת: טיוטה, מסמכים ומלל', 'רשות המחקר: בדיקה', 'הגשה לקרן'],
    note: 'כל דיווח משויך לקרן אחת.'
  }
};
const flow = FLOWS[type];

await setAsOf();
document.title = `פורטל חוקר – ${flow.title}`;
document.getElementById('title').textContent = flow.title;
document.getElementById('subtitle').textContent = flow.subtitle;
document.getElementById('path').replaceChildren(...flow.steps.map(s => el('li', { text: s })));
document.getElementById('path-note').textContent = flow.note;

// Choices: the researcher's own sources and projects (only relevant ones), each with its own budget items.
const groups = await repo.listSourcesForResearcher(DEMO_RESEARCHER_ID);
const choices = groups.flatMap(g => g.items.map(i => ({ key: `${g.type}:${i.id}`, type: g.type, label: `${g.label}: ${i.title}` })));
const itemsByType = Object.fromEntries(await Promise.all(groups.map(async g => [g.type, await repo.getBudgetItems(g.type)])));

const form = document.getElementById('form');
const field = (id, label, control) => el('div', { class: 'field' }, el('label', { for: id, text: label }), control);

const source = el('select', { id: 'source', required: '' }, ...choices.map(c => el('option', { value: c.key, text: c.label })));
const item = el('select', { id: 'item' });
const fillItems = () => {
  const t = choices.find(c => c.key === source.value).type;
  item.replaceChildren(...(itemsByType[t] ?? []).map(i => el('option', { value: i.code, text: `${i.label} (${i.code})` })));
};
source.addEventListener('change', fillItems);
fillItems();

form.append(field('source', 'מקור מימון', source));
if (type !== 'report') form.append(field('item', 'סעיף תקציבי', item));
if (type === 'purchase') {
  form.append(
    field('what', 'מה רוצים לרכוש', el('input', { id: 'what', type: 'text', required: '' })),
    field('amount', 'סכום משוער (₪)', el('input', { id: 'amount', type: 'number', min: '0', inputmode: 'numeric' })),
    field('why', 'נימוק', el('textarea', { id: 'why', rows: '3' })));
} else if (type === 'reimbursement') {
  form.append(
    field('what', 'תיאור ההוצאה', el('input', { id: 'what', type: 'text', required: '' })),
    field('amount', 'סכום (₪)', el('input', { id: 'amount', type: 'number', min: '0', inputmode: 'numeric' })),
    field('receipts', 'קבלות', el('input', { id: 'receipts', type: 'file', multiple: '' })));
} else {
  form.append(
    field('docs', 'מסמכים', el('input', { id: 'docs', type: 'file', multiple: '' })),
    field('text', 'תיאור ההתקדמות', el('textarea', { id: 'text', rows: '6' })));
}
form.append(el('button', { class: 'btn primary', type: 'submit', text: 'שליחה' }));

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const done = document.getElementById('done');
  done.hidden = false;
  done.replaceChildren(
    el('h2', { text: 'הבקשה נקלטה (הדגמה)' }),
    el('p', { text: `${flow.title} נשלחה לשלב הראשון במסלול. אפשר לעקוב אחריה במסך הבקשות.` }),
    el('a', { class: 'btn', href: 'requests.html', text: 'למעקב בקשות' }));
  done.focus?.();
});
