import { el, formatDate } from './format.js';
import { mockRepository } from './repository.js';
import { isStatic } from './config.js';

const NAV = [
  { title: 'האזור שלי', items: [
    { key: 'home', href: 'index.html', text: 'התקציב שלי' },
    { key: 'mine', href: 'research.html?mine=1', text: 'המחקרים שלי' },
    { key: 'requests-mine', href: 'requests.html', text: 'הבקשות שלי' }
  ] },
  { title: 'רשות המחקר', items: [
    { key: 'authority', href: 'authority.html', text: 'תמונת מצב חוקרים' },
    { key: 'requests-all', href: 'requests.html?all=1', text: 'מעקב בקשות' },
    { key: 'all', href: 'research.html', text: 'כל המחקרים' }
  ] },
  { title: 'מקורות מימון', items: [
    { key: 'calls-internal', href: 'calls.html?kind=internal', text: 'קולות קוראים פנימיים' },
    { key: 'calls-external', href: 'calls.html?kind=external', text: 'קולות קוראים חיצוניים' }
  ] },
  { title: 'בקרוב', items: [
    { text: 'הגשת הצעות מחקר' }, { text: 'מסמכים' }, { text: 'התראות' }
  ] }
];

const ICONS = {
  home: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M16 14.5h2"/>',
  mine: '<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3"/>',
  'requests-mine': '<path d="M9 4h6a1 1 0 0 1 1 1v1H8V5a1 1 0 0 1 1-1zM6 6h12v14H6zM9 12l2 2 4-4"/>',
  'requests-all': '<path d="M8 4h8v2H8zM5 6h14v14H5zM8 11h8M8 15h5"/>',
  authority: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  all: '<path d="M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5"/>',
  'calls-internal': '<path d="M4 10v4h3l7 4V6L7 10H4zM17.5 9a4 4 0 0 1 0 6"/>',
  'calls-external': '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>'
};
function icon(key) {
  const wrap = document.createElement('span');
  wrap.className = 'nav-ico';
  wrap.setAttribute('aria-hidden', 'true');
  wrap.innerHTML = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[key] ?? ''}</svg>`;
  return wrap;
}

/**
 * Shared page chrome: demo banner, right-hand sidebar (RTL), mobile top bar, "as of" line.
 * `active` is a NAV key. The banner stays on any deployment that uses fixtures.
 */
export function buildShell(active) {
  const banner = el('div', { class: 'demo-banner', role: 'note' });
  banner.append(el('strong', { text: isStatic ? 'מוקאפ סטטי' : 'דמו בלבד' }), ' · נתונים פיקטיביים, אין חיבור למערכות אמת');

  const nav = el('nav', { class: 'side-nav', 'aria-label': 'ניווט ראשי' });
  for (const group of NAV) {
    const soon = group.title === 'בקרוב';
    nav.append(el('div', { class: 'nav-title', text: group.title }));
    for (const it of group.items) {
      if (soon) {
        nav.append(el('span', { class: 'nav-link disabled', 'aria-disabled': 'true' }, el('span', { class: 'lbl', text: it.text })));
      } else {
        const a = el('a', { class: 'nav-link', href: it.href, title: it.text }, icon(it.key), el('span', { class: 'lbl', text: it.text }));
        if (it.key === active) a.setAttribute('aria-current', 'page');
        nav.append(a);
      }
    }
  }

  // Logo always on a white plate (its wordmark is gray). Missing file -> plain text, never a redrawn logo.
  const logo = () => {
    const img = el('img', { class: 'logo', src: 'assets/logo-green.svg', alt: 'אוניברסיטת קריית שמונה בגליל – תל-חי' });
    const plate = el('div', { class: 'logo-plate' }, img);
    img.addEventListener('error', () => img.replaceWith(el('div', { class: 'logo-fallback', text: 'אוניברסיטת תל-חי' })), { once: true });
    return plate;
  };

  // Theme (dark default / light) and font size, remembered per browser. Storage may be blocked: always try/catch.
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* ignore */ } }
  };
  const root = document.documentElement;
  const apply = () => {
    const theme = store.get('rp-theme') === 'light' ? 'light' : 'dark';
    const font = ['large', 'xl'].includes(store.get('rp-font')) ? store.get('rp-font') : 'normal';
    root.dataset.theme = theme; root.dataset.font = font;
    themeBtn.setAttribute('aria-pressed', String(theme === 'light'));
    themeBtn.textContent = theme === 'light' ? 'מצב כהה' : 'מצב בהיר';
    fontBtns.forEach(([b, v]) => b.setAttribute('aria-pressed', String(font === v)));
  };
  const themeBtn = el('button', { class: 'pref-btn', type: 'button' });
  themeBtn.addEventListener('click', () => { store.set('rp-theme', root.dataset.theme === 'light' ? 'dark' : 'light'); apply(); });
  const fontBtns = [['A', 'normal', 'גודל טקסט רגיל'], ['A+', 'large', 'טקסט גדול'], ['A++', 'xl', 'טקסט גדול מאוד']].map(([t, v, label]) => {
    const b = el('button', { class: 'pref-btn', type: 'button', 'aria-label': label, text: t });
    b.addEventListener('click', () => { store.set('rp-font', v); apply(); });
    return [b, v];
  });
  const staticBtn = el('button', { class: 'pref-btn', type: 'button', 'aria-pressed': String(isStatic), text: 'מוקאפ', title: 'מצב הצגה סטטי: בלי אנימציות ובלי טעינה' });
  staticBtn.addEventListener('click', () => {
    const u = new URL(location.href);
    u.searchParams.set('static', isStatic ? '0' : '1');
    location.href = u.toString();
  });
  const prefs = el('div', { class: 'prefs', role: 'group', 'aria-label': 'תצוגה' }, themeBtn, ...fontBtns.map(([b]) => b), staticBtn);

  const user = el('div', { class: 'user' },
    el('div', { class: 'avatar', 'aria-hidden': 'true', text: 'א' }),
    el('div', {}, el('div', { class: 'user-name', text: 'חוקר/ת א׳' }), el('div', { class: 'muted small', text: 'חשבון דמו' })));

  // Edge handle tab: collapses the sidebar to an icon rail and back. Desktop only.
  const handle = el('button', { class: 'sb-handle', type: 'button', 'aria-controls': 'sidebar', 'aria-expanded': String(root.dataset.sidebar !== 'hidden'), 'aria-label': 'כווץ או הרחב את תפריט הצד', title: 'כווץ / הרחב תפריט' });
  handle.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>';
  handle.addEventListener('click', () => {
    const collapsed = root.dataset.sidebar !== 'hidden';
    if (collapsed) root.dataset.sidebar = 'hidden'; else delete root.dataset.sidebar;
    store.set('rp-sidebar', collapsed ? 'hidden' : 'shown');
    handle.setAttribute('aria-expanded', String(!collapsed));
  });

  const sidebar = el('aside', { class: 'sidebar', id: 'sidebar' },
    el('div', { class: 'side-inner' },
      el('div', { class: 'side-head' }, logo(), el('div', { class: 'portal-name', text: 'פורטל חוקר' })),
      nav, el('div', { class: 'side-foot' }, prefs, user)),
    handle);

  const menuBtn = el('button', { class: 'menu-btn', type: 'button', 'aria-controls': 'sidebar', 'aria-expanded': 'false', text: 'תפריט' });
  menuBtn.addEventListener('click', () => {
    const open = sidebar.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', String(open));
  });
  const topbar = el('div', { class: 'topbar' }, logo(), menuBtn);

  const main = document.querySelector('main');
  const app = el('div', { class: 'app' });
  const content = el('div', { class: 'content' }, banner, topbar);
  main.replaceWith(app);
  content.append(main);
  app.append(sidebar, content);
  apply();

}

/** Fills the "as of" line. Separate from buildShell so the chrome never waits on data. */
export async function setAsOf() {
  const asOf = await mockRepository.getAsOf();
  const target = document.getElementById('asof');
  if (target) {
    const time = new Date(asOf).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
    target.textContent = `נכון ל־${formatDate(asOf)} ${time}`;
  }
}
