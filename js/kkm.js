/**
 * KKM balance strategy (handoff section 4). Pure functions, no DOM.
 * Strategy interface so other funding sources can plug in their own logic later:
 *   summarize({ allocation, accrued, used, committed }) -> Summary
 */

/** Budget year runs 1 Oct - 30 Sep (procedure 412-5, sec. 3.4). Never use calendar year. */
export function budgetYearOf(date) {
  const d = typeof date === 'string' ? new Date(date + 'T00:00:00Z') : date;
  const y = d.getUTCFullYear();
  const startYear = d.getUTCMonth() >= 9 ? y : y - 1; // month index 9 = October
  return {
    startYear,
    label: `${startYear}-${String((startYear + 1) % 100).padStart(2, '0')}`,
    start: `${startYear}-10-01`,
    end: `${startYear + 1}-09-30`
  };
}

export const kkmStrategy = {
  sourceId: 'kkm',
  summarize({ allocation, accrued, used, committed }) {
    const available = allocation + accrued;
    const balance = available - used - committed;
    const spent = used + committed;
    const utilization = available > 0 ? spent / available : (spent > 0 ? Infinity : 0);
    return {
      available,
      used,
      committed,
      balance,
      utilization,           // may exceed 1
      isDeficit: balance < 0 // legitimate state: show, never block; carries over to next year
    };
  }
};

/** Sum summaries across researchers (for the Research Authority view). */
export function aggregate(summaries) {
  const t = summaries.reduce(
    (a, s) => ({ available: a.available + s.available, used: a.used + s.used, committed: a.committed + s.committed }),
    { available: 0, used: 0, committed: 0 }
  );
  t.balance = t.available - t.used - t.committed;
  t.utilization = t.available > 0 ? (t.used + t.committed) / t.available : 0;
  return t;
}
