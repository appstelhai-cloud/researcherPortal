/** Fictitious demo data (handoff appendix). No real researchers or figures. */

export const FUNDING_SOURCES = [
  {
    id: 'kkm',
    type: 'institutional_personal',
    name: 'קק״מ',
    fullName: 'קרן קשרי מדע',
    managementUnit: 'researcher',
    periodModel: 'budget_year',
    currency: 'ILS',
    rules: {
      carryOver: 'surplus_and_deficit',
      allowedCategories: ['conferences', 'assistants', 'translation', 'literature', 'equipment'],
      categoryCaps: { equipment: 3000 }
    }
  }
];

export const CATEGORIES = {
  conferences: 'כנסים ונסיעות מחקר',
  assistants: 'עוזרי מחקר',
  translation: 'תרגום ועריכה',
  literature: 'ספרות ומנויים',
  equipment: 'ציוד וחומרים'
};

export const BUDGET_YEAR = { label: 'תשפ״ז', range: '2026-27', start: '2026-10-01', end: '2027-09-30' };
export const AS_OF = '2026-11-02T08:00:00';

export const RESEARCHERS = [
  { id: 'a', name: 'חוקר/ת א׳', dept: 'ביוטכנולוגיה', fundingSourceId: 'kkm', allocation: 10000, accrued: 6000, used: 5200, committed: 1800 },
  { id: 'b', name: 'חוקר/ת ב׳', dept: 'ביוטכנולוגיה', fundingSourceId: 'kkm', allocation: 10000, accrued: 10000, used: 2100, committed: 0 },
  { id: 'c', name: 'חוקר/ת ג׳', dept: 'פודטק', fundingSourceId: 'kkm', allocation: 5000, accrued: 2500, used: 3400, committed: 900 },
  { id: 'd', name: 'חוקר/ת ד׳', dept: 'פודטק', fundingSourceId: 'kkm', allocation: 10000, accrued: 0, used: 9300, committed: 1500 },
  { id: 'e', name: 'חוקר/ת ה׳', dept: 'אגריטק', fundingSourceId: 'kkm', allocation: 10000, accrued: 6000, used: 800, committed: 0 },
  { id: 'f', name: 'חוקר/ת ו׳', dept: 'אגריטק', fundingSourceId: 'kkm', allocation: 7500, accrued: 3000, used: 4600, committed: 1200 }
];

/** Used-by-category for the demo researcher (A). */
export const CATEGORY_USED_A = { conferences: 2300, assistants: 1500, translation: 700, literature: 400, equipment: 300 };

/** Aggregate spend by category across all researchers (Research Authority view). */
export const CATEGORY_USED_ALL = { conferences: 10300, assistants: 7400, translation: 3300, equipment: 2500, literature: 1900 };

/** status: 'paid' (source Priority) | 'approved_unpaid' (source Quotes) */
export const TRANSACTIONS_A = [
  { date: '2026-11-02', description: 'שכר עוזר/ת מחקר – אוקטובר', category: 'assistants', source: 'Priority', status: 'paid', amount: 750 },
  { date: '2026-10-28', description: 'דמי רישום לכנס', category: 'conferences', source: 'Priority', status: 'paid', amount: 1100 },
  { date: '2026-10-21', description: 'תרגום ועריכת מאמר', category: 'translation', source: 'Priority', status: 'paid', amount: 700 },
  { date: '2026-10-14', description: 'רכישת ציוד מחקר', category: 'equipment', source: 'Quotes', status: 'approved_unpaid', amount: 1200 },
  { date: '2026-10-09', description: 'הצעת מחיר לתרגום ועריכה', category: 'translation', source: 'Quotes', status: 'approved_unpaid', amount: 600 }
];
