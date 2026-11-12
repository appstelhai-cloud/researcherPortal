/**
 * Display mode.
 *  - live (default): simulated loading latency, skeletons, entrance animations.
 *  - static: a true MOCKUP. No latency, no skeletons, no animations, no view transitions; every screen
 *    renders instantly and identically (for screenshots, demos, and design review).
 * Switch with ?static=1 (sticks for the browser session) and ?static=0 (back to live).
 */
const search = typeof location === 'undefined' ? '' : location.search;
const param = new URLSearchParams(search).get('static');

export const isStatic = (() => {
  try {
    if (param === '1') sessionStorage.setItem('rp-static', '1');
    if (param === '0') sessionStorage.removeItem('rp-static');
    return sessionStorage.getItem('rp-static') === '1';
  } catch {
    return param === '1';
  }
})();

/** Simulated network delay of the mock adapter (ms). Zero in static mode and in Node tests. */
export const LATENCY_MS = isStatic || typeof window === 'undefined' ? 0 : 180;
