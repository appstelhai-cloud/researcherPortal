/*! a11y-widget.js - self-contained accessibility menu (aids for WCAG 2.2 AA). No dependencies, no network, no tracking.
 *
 * Add ONE tag, preferably in <head> (so saved settings apply before first paint, no flash):
 *   <script src="/a11y-widget.js" data-anchor="#chat-bubble" data-hide-when="#chat-panel.open"></script>
 *
 * Options (all optional, as data-* attributes on that tag):
 *   data-anchor        CSS selector of a fixed element in the same corner (e.g. a chat bubble): the button sits just above it.
 *   data-hide-when     CSS selector; while it matches (e.g. "#chat-panel.open, .nav-open") the button is hidden.
 *   data-side          "end" (default: right in LTR, left in RTL) or "start".
 *   data-lang          "he" or "en". Default: <html lang>, falling back to "he".
 *   data-key           localStorage key. Default "a11y-widget" (use a different one per site on the same origin).
 *   data-invert        CSS selector of dark-on-transparent logos: shown white in dark contrast, black in light contrast.
 *   data-zoom-exclude  CSS selector of top-level elements that must NOT be enlarged.
 *   data-style-nonce   CSP nonce for the injected <style> (also reads meta[name="csp-nonce"]).
 * Brand colours: define --a11y-bg, --a11y-fg, --a11y-accent, --a11y-tint on :root (defaults below).
 *
 * API: window.A11yWidget.refresh() - call after adding top-level content dynamically (single-page apps) so it is enlarged too.
 * Settings are stored in localStorage on the visitor's device only.
 */
(function () {
  'use strict';
  if (window.A11yWidget) return;

  var script = document.currentScript;
  var attr = function (n, d) { var v = script && script.getAttribute('data-' + n); return v ? v : d; };
  var cfg = { key: attr('key', 'a11y-widget'), anchor: attr('anchor', ''), hideWhen: attr('hide-when', ''), side: attr('side', 'end') === 'start' ? 'start' : 'end', invert: attr('invert', ''), zoomExclude: attr('zoom-exclude', '') };
  var root = document.documentElement;
  var lang = (attr('lang', '') || root.lang || 'he').slice(0, 2).toLowerCase() === 'en' ? 'en' : 'he';

  var T = {
    he: { btn: 'תפריט נגישות', title: 'נגישות', close: 'סגירת תפריט הנגישות', size: 'גודל תצוגה', minus: 'הקטנת התצוגה', plus: 'הגדלת התצוגה', contrast: 'ניגודיות וצבע', hcDark: 'ניגודיות כהה', hcLight: 'ניגודיות בהירה', gray: 'גווני אפור', read: 'קריאה', links: 'הדגשת קישורים', font: 'גופן קריא', spacing: 'ריווח טקסט', still: 'עצירת אנימציות', reset: 'איפוס כל ההגדרות', note: 'ההגדרות נשמרות במכשיר זה בלבד. אפשר לסגור את התפריט גם במקש Esc.', on: ' הופעלה', off: ' כובתה', sizeSay: 'גודל תצוגה ', resetSay: 'כל הגדרות הנגישות אופסו' },
    en: { btn: 'Accessibility menu', title: 'Accessibility', close: 'Close the accessibility menu', size: 'Display size', minus: 'Decrease size', plus: 'Increase size', contrast: 'Contrast and colour', hcDark: 'Dark contrast', hcLight: 'Light contrast', gray: 'Grayscale', read: 'Reading', links: 'Highlight links', font: 'Readable font', spacing: 'Text spacing', still: 'Stop animations', reset: 'Reset all settings', note: 'Settings are saved on this device only. Press Esc to close the menu.', on: ' on', off: ' off', sizeSay: 'Display size ', resetSay: 'All accessibility settings were reset' }
  }[lang];
  var ZOOM = ['100%', '115%', '130%', '150%'];

  /* ---------- state (saved on this device) ---------- */
  var st = { zoom: 0, hc: '', gray: 0, links: 0, font: 0, spacing: 0, still: 0 };
  try {
    var saved = JSON.parse(localStorage.getItem(cfg.key) || '{}');
    st.zoom = Math.min(3, Math.max(0, saved.zoom | 0));
    st.hc = saved.hc === 'dark' || saved.hc === 'light' ? saved.hc : '';
    ['gray', 'links', 'font', 'spacing', 'still'].forEach(function (k) { st[k] = saved[k] ? 1 : 0; });
  } catch (e) { /* storage blocked: settings last for this visit only */ }
  var save = function () { try { localStorage.setItem(cfg.key, JSON.stringify(st)); } catch (e) { /* ignore */ } };
  var isOn = function (o) { return o === 'hcDark' ? st.hc === 'dark' : o === 'hcLight' ? st.hc === 'light' : !!st[o]; };

  function applyClasses() {
    var c = root.classList;
    for (var i = 1; i <= 3; i++) c.toggle('a11y-zoom-' + i, st.zoom === i);
    c.toggle('a11y-hc-dark', st.hc === 'dark'); c.toggle('a11y-hc-light', st.hc === 'light');
    c.toggle('a11y-gray', !!st.gray); c.toggle('a11y-links', !!st.links); c.toggle('a11y-font', !!st.font);
    c.toggle('a11y-spacing', !!st.spacing); c.toggle('a11y-still', !!st.still);
  }

  /* ---------- styles ---------- */
  var css = [
    '.a11y-btn{position:fixed;inset-inline-' + cfg.side + ':22px;bottom:var(--a11y-bottom,20px);z-index:2147482000;display:grid;place-items:center;width:48px;height:48px;padding:0;border:2px solid var(--a11y-fg,#fff);border-radius:50%;background:var(--a11y-bg,#254b39);color:var(--a11y-fg,#fff);box-shadow:0 3px 12px rgba(0,0,0,.35);cursor:pointer}',
    '.a11y-btn:hover{filter:brightness(.85)}',
    '.a11y-btn:focus-visible{outline:3px solid var(--a11y-accent,#3a56d4);outline-offset:3px}',
    '.a11y-btn.a11y-hide{display:none}',
    '.a11y-panel{position:fixed;inset-inline-' + cfg.side + ':16px;bottom:calc(var(--a11y-bottom,20px) + 58px);z-index:2147482000;width:min(340px,calc(100vw - 32px));max-height:calc(100vh - var(--a11y-bottom,20px) - 80px);max-height:calc(100dvh - var(--a11y-bottom,20px) - 80px);overflow:auto;box-sizing:border-box;background:#fff;color:#1c2b24;border:2px solid var(--a11y-bg,#254b39);box-shadow:0 10px 36px rgba(0,0,0,.35);font:15px/1.5 system-ui,-apple-system,"Segoe UI",Arial,sans-serif;text-align:start}',
    '.a11y-panel[hidden]{display:none}',
    '.a11y-panel *{box-sizing:border-box}',
    '.a11y-head{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 14px;background:var(--a11y-bg,#254b39);color:var(--a11y-fg,#fff)}',
    '.a11y-head h2{margin:0;font-size:18px;line-height:1.3;color:inherit;font-weight:700}',
    '.a11y-close{display:grid;place-items:center;width:44px;height:44px;border:0;background:none;color:inherit;font-size:20px;cursor:pointer}',
    '.a11y-close:focus-visible{outline:3px solid var(--a11y-fg,#fff);outline-offset:-3px}',
    '.a11y-body{padding:12px 14px 14px}',
    '.a11y-group{margin:0 0 12px;padding:0;border:0;min-width:0}',
    '.a11y-group>legend{display:block;padding:0;margin:0 0 6px;font-size:13px;font-weight:700;color:#37423c}',
    '.a11y-size{display:grid;grid-template-columns:1fr auto 1fr;gap:8px;align-items:center}',
    '.a11y-size output{min-width:3.4em;text-align:center;font-weight:700}',
    '.a11y-opts{display:grid;grid-template-columns:1fr 1fr;gap:8px}',
    '.a11y-opt,.a11y-step,.a11y-reset{display:flex;align-items:center;justify-content:center;gap:8px;min-height:48px;padding:6px 10px;border:2px solid var(--a11y-bg,#254b39);background:#fff;color:var(--a11y-bg,#254b39);font:inherit;font-weight:600;font-size:14px;line-height:1.25;text-align:center;cursor:pointer}',
    '.a11y-opt:hover,.a11y-step:hover:not(:disabled),.a11y-reset:hover{background:var(--a11y-tint,#e9f5ee)}',
    '.a11y-opt[aria-pressed=true]{background:var(--a11y-bg,#254b39);color:var(--a11y-fg,#fff)}',
    '.a11y-tick{flex:none;width:1.1em;font-weight:800}',
    '.a11y-opt[aria-pressed=true] .a11y-tick::before{content:"\\2713"}',
    '.a11y-step{font-size:24px;font-weight:700;line-height:1}',
    '.a11y-step:disabled{opacity:.45;cursor:not-allowed}',
    '.a11y-reset{width:100%;border-color:#606060;color:#37423c}',
    '.a11y-note{margin:10px 0 0;font-size:12px;color:#4a554f}',
    '.a11y-opt:focus-visible,.a11y-step:focus-visible,.a11y-reset:focus-visible{outline:3px solid var(--a11y-accent,#3a56d4);outline-offset:2px}',
    '.a11y-sr{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap;border:0}',
    '@media (max-width:480px){.a11y-btn{inset-inline-' + cfg.side + ':16px}.a11y-panel{inset-inline-' + cfg.side + ':12px}}',
    ':root{--a11y-bottom:20px}',
    /* modes: classes on <html> */
    'html.a11y-zoom-1{--a11y-z:1.15}html.a11y-zoom-2{--a11y-z:1.3}html.a11y-zoom-3{--a11y-z:1.5}',
    /* reflow safety (WCAG 1.4.10): enlarged content has less room, so long words break and form fields may shrink instead of overflowing */
    'html[class*="a11y-zoom-"] [data-a11y-z]{zoom:var(--a11y-z);overflow-wrap:anywhere}',
    'html[class*="a11y-zoom-"] [data-a11y-z] :is(input,select,textarea){min-width:0;max-width:100%}',
    'html.a11y-gray{filter:grayscale(1)}',
    'html.a11y-links a{text-decoration:underline!important;text-decoration-thickness:2px!important;text-underline-offset:3px!important;font-weight:700!important;outline:2px solid currentColor;outline-offset:2px}',
    'html.a11y-font body,html.a11y-font body *{font-family:Arial,Helvetica,"Segoe UI",sans-serif!important}',
    'html.a11y-spacing body *{line-height:1.6!important;letter-spacing:.12em!important;word-spacing:.16em!important}',
    'html.a11y-spacing p,html.a11y-spacing li{margin-bottom:2em!important}',
    'html.a11y-still *,html.a11y-still *::before,html.a11y-still *::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}',
    'html.a11y-hc-dark body,html.a11y-hc-dark body *:not(img):not(svg):not(svg *):not(video):not(canvas):not(iframe){background-color:#000!important;background-image:none!important;color:#fff!important;border-color:#fff!important;box-shadow:none!important;text-shadow:none!important;opacity:1!important}',
    'html.a11y-hc-dark a,html.a11y-hc-dark a *{color:#ffe600!important}',
    'html.a11y-hc-dark :focus-visible{outline:3px solid #ffe600!important;outline-offset:2px}',
    'html.a11y-hc-dark mark{background-color:#ffe600!important;color:#000!important}',
    'html.a11y-hc-dark input::placeholder,html.a11y-hc-dark textarea::placeholder{color:#d6d6d6!important;opacity:1!important}',
    'html.a11y-hc-dark .a11y-opt[aria-pressed=true]{background-color:#ffe600!important;color:#000!important}',
    'html.a11y-hc-light body,html.a11y-hc-light body *:not(img):not(svg):not(svg *):not(video):not(canvas):not(iframe){background-color:#fff!important;background-image:none!important;color:#000!important;border-color:#000!important;box-shadow:none!important;text-shadow:none!important;opacity:1!important}',
    'html.a11y-hc-light a,html.a11y-hc-light a *{color:#0000b3!important}',
    'html.a11y-hc-light :focus-visible{outline:3px solid #0000b3!important;outline-offset:2px}',
    'html.a11y-hc-light mark{background-color:#ffe600!important;color:#000!important}',
    'html.a11y-hc-light input::placeholder,html.a11y-hc-light textarea::placeholder{color:#333!important;opacity:1!important}',
    'html.a11y-hc-light .a11y-opt[aria-pressed=true]{background-color:#000!important;color:#fff!important}',
    '@media print{.a11y-btn,.a11y-panel{display:none!important}}'
  ];
  if (cfg.invert) css.push('html.a11y-hc-dark ' + cfg.invert + '{filter:brightness(0) invert(1)!important}', 'html.a11y-hc-light ' + cfg.invert + '{filter:brightness(0)!important}');
  var styleNonce = attr('style-nonce', '');
  if (!styleNonce) {
    var metaNonce = document.querySelector('meta[name="csp-nonce"]');
    styleNonce = metaNonce && metaNonce.getAttribute('content') || '';
  }
  var style = document.createElement('style'); style.id = 'a11y-widget-style'; style.textContent = css.join('\n');
  if (styleNonce) style.setAttribute('nonce', styleNonce);
  (document.head || root).appendChild(style);
  applyClasses(); /* before first paint when the script is in <head> */

  /* ---------- the widget ---------- */
  var btn, panel, live, val, minus, plus, zoomSupported = !!(window.CSS && CSS.supports && CSS.supports('zoom', '1.2'));

  function build() {
    var host = document.createElement('div'); host.className = 'a11y-ui'; host.setAttribute('data-a11y-ui', '');
    var opt = function (k, label) { return '<button type="button" class="a11y-opt" data-opt="' + k + '" aria-pressed="false"><span class="a11y-tick" aria-hidden="true"></span>' + label + '</button>'; };
    host.innerHTML =
      '<button id="a11y-btn" class="a11y-btn" type="button" aria-haspopup="dialog" aria-expanded="false" aria-controls="a11y-panel" aria-label="' + T.btn + '" title="' + T.title + '">' +
      '<svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true" focusable="false"><circle cx="12" cy="4.6" r="2.1" fill="currentColor"/><path d="M4.5 8.6 12 10l7.5-1.4M12 10v4.6m0 0-3.3 5.4M12 14.6l3.3 5.4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' +
      '<div id="a11y-panel" class="a11y-panel" role="dialog" aria-modal="true" aria-labelledby="a11y-title" hidden>' +
      '<div class="a11y-head"><h2 id="a11y-title">' + T.title + '</h2><button type="button" class="a11y-close" id="a11y-close" aria-label="' + T.close + '">&#10005;</button></div>' +
      '<div class="a11y-body">' +
      (zoomSupported ? '<fieldset class="a11y-group"><legend>' + T.size + '</legend><div class="a11y-size"><button type="button" class="a11y-step" id="a11y-minus" aria-label="' + T.minus + '">&minus;</button><output id="a11y-zoomval" aria-live="off">100%</output><button type="button" class="a11y-step" id="a11y-plus" aria-label="' + T.plus + '">+</button></div></fieldset>' : '') +
      '<fieldset class="a11y-group"><legend>' + T.contrast + '</legend><div class="a11y-opts">' + opt('hcDark', T.hcDark) + opt('hcLight', T.hcLight) + opt('gray', T.gray) + '</div></fieldset>' +
      '<fieldset class="a11y-group"><legend>' + T.read + '</legend><div class="a11y-opts">' + opt('links', T.links) + opt('font', T.font) + opt('spacing', T.spacing) + opt('still', T.still) + '</div></fieldset>' +
      '<button type="button" class="a11y-reset" id="a11y-reset">' + T.reset + '</button><p class="a11y-note">' + T.note + '</p></div></div>' +
      '<div id="a11y-live" class="a11y-sr" role="status" aria-live="polite"></div>';
    document.body.appendChild(host);
    btn = host.querySelector('#a11y-btn'); panel = host.querySelector('#a11y-panel'); live = host.querySelector('#a11y-live');
    val = host.querySelector('#a11y-zoomval'); minus = host.querySelector('#a11y-minus'); plus = host.querySelector('#a11y-plus');

    var names = { hcDark: T.hcDark, hcLight: T.hcLight, gray: T.gray, links: T.links, font: T.font, spacing: T.spacing, still: T.still };
    var say = function (t) { live.textContent = ''; setTimeout(function () { live.textContent = t; }, 40); };
    function refreshUI() {
      if (val) { val.textContent = ZOOM[st.zoom]; minus.disabled = st.zoom === 0; plus.disabled = st.zoom === 3; }
      Array.prototype.forEach.call(panel.querySelectorAll('.a11y-opt'), function (b) { b.setAttribute('aria-pressed', isOn(b.getAttribute('data-opt')) ? 'true' : 'false'); });
    }
    function change(announce) { applyClasses(); markZoom(); refreshUI(); save(); if (announce) say(announce); }
    panel.addEventListener('click', function (e) {
      var o = e.target.closest('.a11y-opt');
      if (o) {
        var k = o.getAttribute('data-opt');
        if (k === 'hcDark') st.hc = st.hc === 'dark' ? '' : 'dark'; else if (k === 'hcLight') st.hc = st.hc === 'light' ? '' : 'light'; else st[k] = st[k] ? 0 : 1;
        change(names[k] + (isOn(k) ? T.on : T.off)); return;
      }
      if (e.target.closest('#a11y-reset')) { st = { zoom: 0, hc: '', gray: 0, links: 0, font: 0, spacing: 0, still: 0 }; change(T.resetSay); }
    });
    if (minus) { minus.addEventListener('click', function () { st.zoom = Math.max(0, st.zoom - 1); change(T.sizeSay + ZOOM[st.zoom]); }); plus.addEventListener('click', function () { st.zoom = Math.min(3, st.zoom + 1); change(T.sizeSay + ZOOM[st.zoom]); }); }

    /* dialog behaviour: focus moves in and stays in; Esc or outside click close; focus returns to the button */
    var focusables = function () { return Array.prototype.filter.call(panel.querySelectorAll('button'), function (b) { return !b.disabled; }); };
    function open() { panel.hidden = false; btn.setAttribute('aria-expanded', 'true'); (panel.querySelector('.a11y-opt') || focusables()[0]).focus(); }
    function close(back) { panel.hidden = true; btn.setAttribute('aria-expanded', 'false'); if (back !== false) btn.focus(); }
    api.close = close;
    btn.addEventListener('click', function () { if (panel.hidden) open(); else close(); });
    host.querySelector('#a11y-close').addEventListener('click', function () { close(); });
    document.addEventListener('keydown', function (e) {
      if (panel.hidden) return;
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); return; }
      if (e.key !== 'Tab') return;
      var f = focusables(), first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }, true);
    document.addEventListener('mousedown', function (e) { if (!panel.hidden && !panel.contains(e.target) && !btn.contains(e.target)) close(false); });

    refreshUI(); markZoom(); place();
    if (cfg.anchor || cfg.hideWhen) {
      var queued = false;
      new MutationObserver(function () { if (queued) return; queued = true; requestAnimationFrame(function () { queued = false; place(); }); })
        .observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style', 'hidden'] });
    }
    window.addEventListener('resize', place);
    window.addEventListener('load', function () { place(); setTimeout(place, 3000); });
  }

  /* sit just above the anchor element (e.g. a chat bubble); hide while data-hide-when matches.
   * --a11y-bottom is set via the nonced stylesheet (CSSOM), not element.style — CSP style-src nonce blocks inline styles. */
  function setBottomPx(px) {
    try {
      var sheet = style.sheet;
      if (!sheet) return;
      for (var i = 0; i < sheet.cssRules.length; i++) {
        var rule = sheet.cssRules[i];
        if (rule.selectorText === ':root' && rule.style && rule.style.getPropertyValue('--a11y-bottom') !== '') {
          rule.style.setProperty('--a11y-bottom', px + 'px');
          return;
        }
      }
      sheet.insertRule(':root{--a11y-bottom:' + px + 'px}', 0);
    } catch (e) { /* sheet unavailable */ }
  }
  function place() {
    if (!btn) return;
    var bottom = 20;
    if (cfg.anchor) {
      var a = document.querySelector(cfg.anchor);
      if (a && getComputedStyle(a).display !== 'none') { var r = a.getBoundingClientRect(); if (r.width > 0 && r.height > 0) bottom = Math.max(bottom, Math.round(window.innerHeight - r.top + 14)); }
    }
    setBottomPx(bottom);
    var hide = false; try { hide = !!(cfg.hideWhen && document.querySelector(cfg.hideWhen)); } catch (e) { /* bad selector */ }
    btn.classList.toggle('a11y-hide', hide);
    if (hide && panel && !panel.hidden && api.close) api.close(false);
  }

  /* enlarge the page: CSS "zoom" on the top-level elements of <body> (not on fixed ones, so chat bubbles and docks stay put) */
  function markZoom() {
    var skip = { SCRIPT: 1, STYLE: 1, LINK: 1, NOSCRIPT: 1, TEMPLATE: 1 };
    Array.prototype.forEach.call(document.body.children, function (el) {
      var off = skip[el.tagName] || el.hasAttribute('data-a11y-ui') || getComputedStyle(el).position === 'fixed';
      try { if (!off && cfg.zoomExclude && el.matches(cfg.zoomExclude)) off = true; } catch (e) { /* bad selector */ }
      if (off) el.removeAttribute('data-a11y-z'); else el.setAttribute('data-a11y-z', '');
    });
  }

  var api = window.A11yWidget = { refresh: function () { markZoom(); place(); }, close: function () {} };
  function start() { build(); }
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
})();
