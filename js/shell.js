import { el, formatDate } from './format.js';
import { mockRepository } from './repository.js';
import { isStatic } from './config.js';

const NAV = [
  { title: 'האזור שלי', items: [
    { key: 'home', href: 'index.html', text: 'המקורות שלי' },
    { key: 'mine', href: 'research.html?mine=1', text: 'המחקרים שלי' },
    { key: 'requests-mine', href: 'requests.html', text: 'הבקשות שלי' },
    { key: 'analysis', href: 'analysis.html', text: 'ניתוח הוצאות' },
    { key: 'calls', href: 'calls.html', text: 'קולות קוראים' }
  ] },
  { title: 'רשות המחקר', items: [
    { key: 'authority', href: 'authority.html', text: 'תמונת מצב חוקרים' },
    { key: 'all', href: 'research.html', text: 'כל המחקרים' },
    { key: 'requests-all', href: 'requests.html?all=1', text: 'מעקב בקשות' },
    { key: 'admin', href: 'admin.html', text: 'ניהול' }
  ] },
  { title: 'קשרי חוץ וגיוס תורמים', items: [
    { key: 'donors-unit', href: 'donors.html', text: 'תורמים ותרומות' },
    { key: 'donor-reports', href: 'donors.html?view=reports', text: 'דוחות לתורמים' }
  ] },
  { title: 'תורם (דמו)', items: [
    { key: 'donor', href: 'donors.html?view=donor', text: 'תצוגת תורם' }
  ] },
  { title: 'בקרוב', items: [
    { text: 'מסמכים' }, { text: 'התראות' }
  ] }
];

const ICONS = {
  home: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M16 14.5h2"/>',
  mine: '<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3"/>',
  'requests-mine': '<path d="M9 4h6a1 1 0 0 1 1 1v1H8V5a1 1 0 0 1 1-1zM6 6h12v14H6zM9 12l2 2 4-4"/>',
  'requests-all': '<path d="M8 4h8v2H8zM5 6h14v14H5zM8 11h8M8 15h5"/>',
  calls: '<path d="M4 10v4h3l7 4V6L7 10H4zM17.5 9a4 4 0 0 1 0 6"/>',
  'calls-manage': '<path d="M4 10v4h3l7 4V6L7 10H4zM17.5 9a4 4 0 0 1 0 6M20 4v4M18 6h4"/>',
  profile: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
  analysis: '<path d="M4 19h16M6 16l4-5 3 3 5-7"/>',
  authority: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  all: '<path d="M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5"/>',
  donors: '<path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.5-7 10-7 10z"/>',
  'donors-unit': '<path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.5-7 10-7 10z"/>',
  'donor-reports': '<path d="M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h5"/>',
  donor: '<path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.5-7 10-7 10z"/><circle cx="12" cy="11" r="1.5"/>',
  monday: '<path d="M9 8H5a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4M15 8h4a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-4M8 12h8"/>',
  admin: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/>'
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
  const banner = el('div', { class: 'demo-banner', role: 'region', 'aria-label': 'הודעת דמו' });
  banner.append(el('strong', { text: isStatic ? 'מוקאפ סטטי' : 'דמו בלבד' }), ' · נתונים פיקטיביים, אין חיבור למערכות אמת');
  // Action center: filled after the chrome is painted, so a slow data call never delays the page.
  const notifSlot = el('div', { class: 'notif-slot' });
  banner.append(notifSlot);
  if (!isStatic) import('./notifications.js').then(m => m.mountNotifications(notifSlot)).catch(() => {});

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

  // Dark theme: white wordmark + green mark, no plate. Light theme: gray-wordmark SVG on a white plate (brandbook).
  // CSS shows one image per theme. A missing file -> plain text, never a redrawn logo.
  const logo = () => {
    const alt = 'אוניברסיטת קריית שמונה בגליל – תל-חי';
    const light = el('img', { class: 'logo logo-light', src: 'assets/logo-green.svg', alt });
    const dark = el('img', { class: 'logo logo-dark', src: 'assets/logo-dark.png', alt });
    for (const img of [light, dark]) img.addEventListener('error', () => img.replaceWith(el('div', { class: 'logo-fallback', text: 'אוניברסיטת תל-חי' })), { once: true });
    return el('div', { class: 'logo-plate' }, light, dark);
  };

  // Theme (dark default / light), remembered per browser. Text size, contrast and spacing come from the a11y widget (vendor/a11y-widget.js). Storage may be blocked: always try/catch.
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* ignore */ } }
  };
  const root = document.documentElement;
  const apply = () => {
    const theme = store.get('rp-theme') === 'light' ? 'light' : 'dark';
    root.dataset.theme = theme;
    themeBtn.setAttribute('aria-pressed', String(theme === 'light'));
    themeBtn.textContent = theme === 'light' ? 'מצב כהה' : 'מצב בהיר';
  };
  const themeBtn = el('button', { class: 'pref-btn', type: 'button' });
  themeBtn.addEventListener('click', () => { store.set('rp-theme', root.dataset.theme === 'light' ? 'dark' : 'light'); apply(); });
  const staticBtn = el('button', { class: 'pref-btn', type: 'button', 'aria-pressed': String(isStatic), text: 'מוקאפ', title: 'מצב הצגה סטטי: בלי אנימציות ובלי טעינה' });
  staticBtn.addEventListener('click', () => {
    const u = new URL(location.href);
    u.searchParams.set('static', isStatic ? '0' : '1');
    location.href = u.toString();
  });
  const prefs = el('div', { class: 'prefs', role: 'group', 'aria-label': 'תצוגה' }, themeBtn, staticBtn);

  const user = el('a', { class: 'user', href: 'profile.html', title: 'הפרופיל שלי' },
    el('div', { class: 'avatar', 'aria-hidden': 'true', text: 'א' }),
    el('div', {}, el('div', { class: 'user-name', text: 'חוקר/ת א׳' }), el('div', { class: 'muted small', text: 'הפרופיל שלי' })));

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
  const topbar = el('header', { class: 'topbar' }, logo(), menuBtn);

  const main = document.querySelector('main');
  const app = el('div', { class: 'app' });
  const content = el('div', { class: 'content' }, banner, topbar);
  main.replaceWith(app);
  content.append(main);
  app.append(sidebar, content);
  apply();

  // A scrollable table must be reachable by keyboard (WCAG 2.1.1). Tables render asynchronously, so watch for them.
  const focusable = () => document.querySelectorAll('.table-wrap:not([tabindex])').forEach(t => t.setAttribute('tabindex', '0'));
  focusable();
  new MutationObserver(focusable).observe(main, { childList: true, subtree: true });
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
