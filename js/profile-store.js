/** Researcher interest areas, remembered per browser. Concept only: the real profile lives server-side. Storage may be blocked. */
const KEY = 'rp-interests';
export const DEFAULT_INTERESTS = ['חקלאות ופודטק', 'טכנולוגיות מים'];

export function getInterests() {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) ? parsed : [...DEFAULT_INTERESTS];
  } catch { return [...DEFAULT_INTERESTS]; }
}

export function setInterests(list) {
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* ignore */ }
}
