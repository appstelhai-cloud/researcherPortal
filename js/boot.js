/**
 * Builds the page chrome (banner, sidebar) synchronously. Loaded in <head> with blocking="render",
 * so the browser never paints a page without its sidebar: no flash or layout shift between screens.
 * Pages declare their section with <body data-nav="...">.
 */
import { buildShell } from './shell.js';
import { isStatic } from './config.js';

const params = new URLSearchParams(location.search);
const section = document.body.dataset.nav;
const key = {
  home: 'home',
  authority: 'authority',
  research: params.get('mine') === '1' || params.get('from') === 'mine' ? 'mine' : 'all',
  calls: `calls-${params.get('kind') === 'external' ? 'external' : 'internal'}`
}[section];

buildShell(key);

/**
 * Joseph chat bubble (same embed as flip/Quotes). Dev endpoint for the demo; switch to
 * https://joseph.telhai.ac.il/embed.js when Joseph moves to production.
 * Skipped in static mockup mode so screenshots make no network calls and show no widget.
 */
const JOSEPH_SRC = 'https://josephdev.telhai.ac.il/embed.js';
if (!isStatic) {
  const s = document.createElement('script');
  s.src = JOSEPH_SRC;
  s.async = true;
  s.dataset.dept = 'general';
  s.dataset.theme = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
  document.body.append(s);
}
