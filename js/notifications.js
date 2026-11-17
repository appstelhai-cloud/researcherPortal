/**
 * Action center (bell in the top bar). One list of things that need the user's attention, each with the action to take.
 * Items are derived from the same data the screens use, so nothing is maintained by hand.
 * Demo shows every role's group; a real adapter returns only the groups of the signed-in role, filtered server-side.
 */
import { el, formatMoney, formatDate } from './format.js';
import { mockRepository as repo } from './repository.js';
import { paceFlag, daysBetween } from './pace.js';
import { tasksOf } from './donors-logic.js';

const DEMO_RESEARCHER_ID = 'a';
export const GROUPS = { mine: 'אצלי כחוקר/ת', authority: 'רשות המחקר', donors: 'קשרי חוץ וגיוס תורמים' };

/* ---------- derivation ---------- */

async function mineItems() {
  const [groups, asOf, year] = await Promise.all([repo.listSourcesForResearcher(DEMO_RESEARCHER_ID), repo.getAsOf(), repo.getBudgetYear()]);
  const out = [];
  for (const g of groups) for (const i of g.items) {
    const s = i.summary, end = i.period?.end ?? year.end, left = daysBetween(asOf, end);
    const name = i.kind === 'research' ? i.title : g.label;
    if (s.isDeficit) out.push({ id: `mine:${i.id}:deficit`, rank: 0, tone: 'bad', title: `${name}: גירעון`, text: `חריגה של ${formatMoney(Math.abs(s.balance), s.currency)}. לטיפול מול המממן.`, action: ['לפירוט', i.href] });
    if (i.id === 'kkm' && s.balance > 0 && left <= 365) out.push({ id: 'mine:kkm:unused', rank: 10 + left, tone: left <= 120 ? 'warn' : 'info',
      title: 'יתרה בקק״מ לניצול', text: `${formatMoney(s.balance, s.currency)} פגים ב-${formatDate(end)} (בעוד ${left} ימים).`, action: ['בקשת רכש', 'actions.html?type=purchase&source=kkm'] });
    else if (i.id !== 'kkm' && left >= 0 && left <= 180) out.push({ id: `mine:${i.id}:ending`, rank: 20 + left, tone: 'warn', title: `${name}: ההקצאה מסתיימת`, text: `בעוד ${left} ימים, ב-${formatDate(end)}.`, action: ['לפירוט', i.href] });
  }
  for (const type of ['kkm', 'intake']) {
    const d = await repo.getSourceDetail(DEMO_RESEARCHER_ID, type).catch(() => null);
    const open = d?.transactions.filter(t => t.status === 'approved_unpaid') ?? [];
    if (open.length) out.push({ id: `mine:${type}:open`, rank: 500, tone: 'info', title: `${type === 'kkm' ? 'קק״מ' : 'תקציב קליטה'}: התחייבויות פתוחות`,
      text: `${open.length} הזמנות מאושרות, ${formatMoney(open.reduce((a, t) => a + t.amount, 0))} עדיין לא שולמו.`, action: ['לתנועות', `source.html?id=${type}`] });
  }
  return out;
}

async function authorityItems() {
  const [items, types] = await Promise.all([repo.listAllSources(), repo.getSourceTypes()]);
  const out = [];
  for (const [type, meta] of Object.entries(types)) {
    const mine = items.filter(i => i.type === type);
    const bucket = (pred) => mine.filter(pred).map(i => i.title);
    const list = (names) => names.slice(0, 3).join(', ') + (names.length > 3 ? ` ועוד ${names.length - 3}` : '');
    const deficit = bucket(i => i.summary.isDeficit);
    const over = bucket(i => !i.summary.isDeficit && paceFlag(i.summary.utilization, i.elapsed) === 'over');
    const under = bucket(i => paceFlag(i.summary.utilization, i.elapsed) === 'under');
    const go = ['לבדיקה', 'authority.html?risk=1'];
    if (deficit.length) out.push({ id: `auth:${type}:deficit`, rank: 0, tone: 'bad', title: `${meta.label}: ${deficit.length} בגירעון`, text: list(deficit), action: go });
    if (over.length) out.push({ id: `auth:${type}:over`, rank: 5, tone: 'warn', title: `${meta.label}: ${over.length} מוציאים מהר מהזמן`, text: list(over), action: go });
    if (under.length) out.push({ id: `auth:${type}:under`, rank: 50, tone: 'info', title: `${meta.label}: ${under.length} מוציאים לאט מהזמן`, text: list(under), action: go });
  }
  return out;
}

async function donorItems() {
  const rows = await repo.listDonationsOverview();
  return rows.flatMap(tasksOf).map(t => ({
    id: t.id, rank: t.rank, tone: t.tone, title: `${t.row.donor} · ${t.row.title}`, text: `${t.text} (${t.row.coordinator})`,
    action: t.action ?? ['לתרומה', 'donors.html']
  }));
}

export async function loadNotifications() {
  const [mine, authority, donors] = await Promise.all([mineItems(), authorityItems(), donorItems()]);
  const tag = (list, group) => list.map(n => ({ ...n, group })).sort((a, b) => a.rank - b.rank);
  return [...tag(mine, 'mine'), ...tag(authority, 'authority'), ...tag(donors, 'donors')];
}

/* ---------- done-state (per browser; a real adapter stores it per user) ---------- */

const KEY = 'rp-notif-done';
const readDone = () => { try { return new Set(JSON.parse(localStorage.getItem(KEY) ?? '[]')); } catch { return new Set(); } };
const writeDone = (set) => { try { localStorage.setItem(KEY, JSON.stringify([...set])); } catch { /* storage blocked: state lives for this page only */ } };

/* ---------- UI ---------- */

const BELL = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 17V11a6 6 0 0 1 12 0v6l1.5 2h-15zM10 21a2 2 0 0 0 4 0"/></svg>';

export async function mountNotifications(slot) {
  let all = [];
  const done = readDone();
  const btn = el('button', { class: 'notif-btn', type: 'button', 'aria-haspopup': 'dialog', 'aria-expanded': 'false', 'aria-controls': 'notif-panel' });
  btn.innerHTML = BELL;
  const badge = el('span', { class: 'notif-badge', 'aria-hidden': 'true' });
  const live = el('span', { class: 'sr-only', role: 'status' });
  btn.append(badge, live);
  const panel = el('section', { class: 'notif-panel', id: 'notif-panel', role: 'dialog', 'aria-label': 'מרכז פעולות', tabindex: '-1', hidden: '' });
  slot.append(btn, panel);

  const pending = () => all.filter(n => !done.has(n.id));

  function paint() {
    const p = pending();
    badge.textContent = String(p.length);
    badge.hidden = p.length === 0;
    badge.classList.toggle('urgent', p.some(n => n.tone === 'bad'));
    btn.setAttribute('aria-label', p.length ? `מרכז פעולות, ${p.length} פעולות ממתינות` : 'מרכז פעולות, אין פעולות ממתינות');

    const head = el('div', { class: 'np-head' }, el('h2', { text: 'מרכז פעולות' }));
    if (p.length) {
      const clear = el('button', { type: 'button', class: 'np-link', text: 'סמן הכול כטופל' });
      clear.addEventListener('click', () => { for (const n of p) done.add(n.id); writeDone(done); paint(); });
      head.append(clear);
    }
    const body = el('div', { class: 'np-body' });
    for (const [key, label] of Object.entries(GROUPS)) {
      const list = p.filter(n => n.group === key);
      if (!list.length) continue;
      body.append(el('h3', { class: 'np-group', text: `${label} · ${list.length}` }),
        ...list.map(n => {
          const ok = el('button', { type: 'button', class: 'np-link', text: 'טופל' });
          ok.addEventListener('click', () => { done.add(n.id); writeDone(done); paint(); });
          return el('article', { class: `np-card ${n.tone}` },
            el('div', { class: 'np-title', text: n.title }),
            el('p', { class: 'np-text', text: n.text }),
            el('div', { class: 'np-actions' }, el('a', { class: 'btn np-act', href: n.action[1], text: n.action[0] }), ok));
        }));
    }
    if (!p.length) body.append(el('p', { class: 'np-empty muted', text: 'הכול טופל. אין פעולות ממתינות.' }));
    body.append(el('p', { class: 'muted small np-note', text: 'בדמו מוצגות הפעולות של כל התפקידים. בפועל כל משתמש יראה רק את שלו.' }));
    panel.replaceChildren(head, body);
  }

  const close = () => { panel.hidden = true; btn.setAttribute('aria-expanded', 'false'); };
  btn.addEventListener('click', () => {
    const open = panel.hidden;
    panel.hidden = !open;
    btn.setAttribute('aria-expanded', String(open));
    if (open) panel.focus();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !panel.hidden) { close(); btn.focus(); } });
  document.addEventListener('click', (e) => { if (!panel.hidden && !slot.contains(e.target)) close(); });

  try { all = await loadNotifications(); } catch { all = []; }
  paint();
}
