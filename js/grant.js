/**
 * Grant / research balance strategy. A separate strategy from KKM, as the handoff requires:
 * no accrual, no yearly allocation; the budget is fixed by the funding agreement.
 * Rules (carry-over, eligible costs, reporting) are unconfirmed, see handoff section 10, questions 9-10.
 */
export const grantStrategy = {
  sourceId: 'grant',
  summarize({ budget, used, committed, currency = 'ILS' }) {
    const available = budget;
    const balance = available - used - committed;
    const spent = used + committed;
    return {
      available, used, committed, balance, currency,
      utilization: available > 0 ? spent / available : (spent > 0 ? Infinity : 0),
      isDeficit: balance < 0
    };
  }
};
