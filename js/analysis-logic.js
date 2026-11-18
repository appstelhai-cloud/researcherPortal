/**
 * Cross-source spend analysis (pure, no DOM). Replaces "הפק דוח מ-Priority": one question across every source,
 * e.g. "how much did I spend on lab equipment or travel". Money stays earmarked, so amounts are never added
 * across currencies: every total is per (group, currency).
 * Row: { date, description, sourceId, sourceLabel, expenseType, currency, status: 'paid'|'approved_unpaid', amount }
 */

const inRange = (d, from, to) => (!from || d >= from) && (!to || d <= to);

/** Rows that pass the filters. Empty / missing filter = no restriction. */
export function filterRows(rows, { expenseTypes = [], sourceIds = [], from = '', to = '' } = {}) {
  return rows.filter(r =>
    (!expenseTypes.length || expenseTypes.includes(r.expenseType)) &&
    (!sourceIds.length || sourceIds.includes(r.sourceId)) &&
    inRange(r.date, from, to));
}

/** Totals per group and currency. groupBy: 'expenseType' | 'sourceLabel'. Sorted by paid amount, largest first. */
export function totalsBy(rows, groupBy = 'expenseType') {
  const map = new Map();
  for (const r of rows) {
    const key = `${r[groupBy]}|${r.currency}`;
    const g = map.get(key) ?? { group: r[groupBy], currency: r.currency, paid: 0, committed: 0, count: 0 };
    if (r.status === 'paid') g.paid += r.amount; else g.committed += r.amount;
    g.count++;
    map.set(key, g);
  }
  return [...map.values()].sort((a, b) => a.currency.localeCompare(b.currency) || b.paid - a.paid);
}

/** One summary line per currency for the filtered rows (never a cross-currency total). */
export function totalsByCurrency(rows) {
  const out = new Map();
  for (const r of rows) {
    const t = out.get(r.currency) ?? { currency: r.currency, paid: 0, committed: 0 };
    if (r.status === 'paid') t.paid += r.amount; else t.committed += r.amount;
    out.set(r.currency, t);
  }
  return [...out.values()];
}
