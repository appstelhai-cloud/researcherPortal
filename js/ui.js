import { el, ltr, formatILS, formatMoney, formatPercent } from './format.js';

export function kpi(label, amount, { variant = '', note = '', currency = 'ILS' } = {}) {
  return el('div', { class: `kpi ${variant}` },
    el('div', { class: 'label', text: label }),
    el('div', { class: 'value' }, ltr(formatMoney(amount, currency))),
    note ? el('div', { class: 'note', text: note }) : null);
}

/** Stacked utilization bar. Segments are scaled to max(available, spent) so overspend stays visible. */
export function utilizationBar(summary, { small = false } = {}) {
  const spent = summary.used + summary.committed;
  const base = Math.max(summary.available, spent) || 1;
  const usedPct = (summary.used / base) * 100;
  const commPct = (summary.committed / base) * 100;
  const bar = el('div', {
    class: `bar${small ? ' small' : ''}${summary.isDeficit ? ' over' : ''}`,
    role: 'img',
    'aria-label': `ניצול ${formatPercent(summary.utilization)}: שולם ${formatMoney(summary.used, summary.currency)}, התחייבויות ${formatMoney(summary.committed, summary.currency)} מתוך ${formatMoney(summary.available, summary.currency)}`
  });
  const u = el('div', { class: 'used' }); u.style.width = `${usedPct}%`;
  const c = el('div', { class: 'committed' }); c.style.width = `${commPct}%`;
  bar.append(u, c);
  return bar;
}

/** Utilization bar with a tick at the share of the period already elapsed (plan vs actual). */
export function paceBar(summary, elapsed) {
  const tick = el('i', { class: 'pace-mark', 'aria-hidden': 'true' });
  tick.style.left = `${Math.round(elapsed * 100)}%`;
  return el('div', {},
    el('div', { class: 'pace' }, utilizationBar(summary, { small: true }), tick),
    el('span', { class: 'muted small', text: `ניצול ${formatPercent(summary.utilization)} · זמן ${formatPercent(elapsed)}` }));
}

export function legend() {
  return el('div', { class: 'legend' },
    el('span', {}, el('i', { class: 'u' }), 'שולם'),
    el('span', {}, el('i', { class: 'c' }), 'התחייבויות פתוחות'));
}

export function deficitChip() {
  return el('span', { class: 'chip deficit', text: 'גירעון, עובר לשנה הבאה' });
}

/** Spend-by-category list with optional per-category caps. */
export function categoryList(totals, labels, caps = {}) {
  const max = Math.max(...Object.values(totals), 1);
  const wrap = el('div');
  const entries = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  for (const [key, amount] of entries) {
    const fill = el('div', { class: 'fill' });
    fill.style.width = `${(amount / max) * 100}%`;
    const row = el('div', { class: 'cat' },
      el('div', { class: 'row' }, el('span', { text: labels[key] ?? key }), ltr(formatILS(amount))),
      el('div', { class: 'track' }, fill));
    if (caps[key]) row.append(el('div', { class: 'cap muted' }, `תקרה שנתית: `, ltr(formatILS(caps[key]))));
    wrap.append(row);
  }
  return wrap;
}

/**
 * Actions that start from a funding source or project (CIO round 17.11): "רכש חדש" and "פתח פרויקט".
 * The request opens on THIS source automatically (`source` param), so the researcher never picks the budget by hand.
 * "פתח פרויקט" is a sketch: no monday call in the demo.
 */
export function sourceActions(sourceId) {
  const note = el('p', { class: 'muted small', role: 'status' });
  const open = el('button', { class: 'btn', type: 'button', text: 'פתח פרויקט' });
  open.addEventListener('click', () => { note.textContent = 'בהדגמה אין חיבור: כאן ייפתח פרויקט ב-Monday, מתבנית של סוג המקור הזה.'; });
  return el('div', { class: 'source-actions' },
    el('nav', { class: 'action-bar', 'aria-label': 'פעולות במקור הזה' },
      el('a', { class: 'btn primary', href: `actions.html?type=purchase&source=${encodeURIComponent(sourceId)}`, text: 'רכש חדש' }),
      open,
      el('a', { class: 'btn', href: `actions.html?type=reimbursement&source=${encodeURIComponent(sourceId)}`, text: 'בקשת החזר' })),
    note);
}
