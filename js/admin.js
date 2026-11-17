import { el } from './format.js';
import { mockRepository as repo } from './repository.js';
import { setAsOf } from './shell.js';
import { missing } from './monday-monitor.js';

await setAsOf();
const monitor = await repo.getMondayMonitor();
const bad = missing(monitor.results);

/** The authority's tools live here, not in the sidebar, so the menu stays short as tools are added. */
const TOOLS = [
  { href: 'calls.html?manage=1', title: 'ניהול קולות קוראים', text: 'מה מוצג לכולם, ומה מנותב לפי תחום.' },
  { href: 'donors.html', title: 'דוחות תורמים', text: 'דוח סטטי להדפסה לכל תורם, וניצול בפועל לפי פרויקט.' },
  { href: 'monday.html', title: 'חיבור Monday', text: 'ייבוא בורדים, יצירה ועדכון חזרה.',
    alert: bad.length ? `${bad.length} עמודות חובה חסרות` : null },
  { href: 'settings.html', title: 'הגדרות ומיפוי', text: 'מקורות מול שדות Priority, סוג הוצאה, משתמשים חיצוניים.' }
];

document.getElementById('view').replaceChildren(...TOOLS.map(t => el('article', { class: 'research-card' },
  t.alert ? el('div', { class: 'rc-top' }, el('span', { class: 'chip late', text: t.alert })) : null,
  el('h2', {}, el('a', { href: t.href, text: t.title })),
  el('p', { class: 'muted', text: t.text }))));
