/**
 * Builds the page chrome (banner, sidebar) synchronously. Loaded in <head> with blocking="render",
 * so the browser never paints a page without its sidebar: no flash or layout shift between screens.
 * Pages declare their section with <body data-nav="...">.
 */
import { buildShell } from './shell.js';

const params = new URLSearchParams(location.search);
const section = document.body.dataset.nav;
const key = {
  home: 'home',
  authority: 'authority',
  research: params.get('mine') === '1' || params.get('from') === 'mine' ? 'mine' : 'all',
  calls: `calls-${params.get('kind') === 'external' ? 'external' : 'internal'}`
}[section];

buildShell(key);
