/** Plan-vs-actual helpers (pure). "Pace" compares spend share with the share of the period that has passed. */
const DAY = 86400000;
const t = (iso) => new Date(iso.slice(0, 10) + 'T00:00:00Z').getTime();

export function addMonths(iso, n) {
  const d = new Date(t(iso));
  d.setUTCMonth(d.getUTCMonth() + n);
  return d.toISOString().slice(0, 10);
}

export function daysBetween(fromIso, toIso) { return Math.round((t(toIso) - t(fromIso)) / DAY); }

/** Share of [start, end] already elapsed at asOf, clamped to 0..1. */
export function elapsedShare(period, asOfIso) {
  const a = t(period.start), b = t(period.end), n = t(asOfIso);
  return b > a ? Math.min(1, Math.max(0, (n - a) / (b - a))) : 1;
}

/**
 * over: spending ahead of time (risk of running out); under: well behind (risk of unspent money or a weak project).
 * Early periods (<15% elapsed) are never flagged: the signal would be noise.
 */
export function paceFlag(utilization, elapsed) {
  if (!Number.isFinite(utilization)) return 'over';
  if (elapsed < 0.15) return 'ok';
  if (utilization - elapsed > 0.15) return 'over';
  if (elapsed - utilization > 0.25) return 'under';
  return 'ok';
}
