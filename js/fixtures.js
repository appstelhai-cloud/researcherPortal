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
  },
  {
    id: 'intake',
    type: 'institutional_startup',
    name: 'תקציב קליטה',
    managementUnit: 'researcher',
    periodModel: 'custom_period',
    currency: 'ILS',
    rules: { carryOver: 'by_agreement' }
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

/**
 * Funding source types (CIO meeting 16.11). Money is earmarked per source and fund, so the UI never sums across types.
 * `order` is the display order on the researcher's main screen.
 */
export const SOURCE_TYPES = {
  intake: { label: 'תקציב קליטה', order: 1 },
  kkm: { label: 'קרן קשרי מדע (קק״מ)', order: 2 },
  external: { label: 'קרנות מחקר חיצוניות', order: 3 },
  donation: { label: 'תרומות', order: 4 }
};

/** Budget items (סעיף תקציבי) per source type. Codes are fictitious. In Priority this is one of the 4 existing fields. */
export const BUDGET_ITEMS = {
  kkm: [
    { code: 'KKM-10', label: 'כנסים ונסיעות מחקר' }, { code: 'KKM-20', label: 'עוזרי מחקר' }, { code: 'KKM-30', label: 'תרגום ועריכה' },
    { code: 'KKM-40', label: 'ספרות ומנויים' }, { code: 'KKM-50', label: 'ציוד וחומרים' }
  ],
  intake: [
    { code: 'INT-10', label: 'ציוד מעבדה' }, { code: 'INT-20', label: 'כוח אדם' }, { code: 'INT-30', label: 'נסיעות וכנסים' }, { code: 'INT-40', label: 'שירותים חיצוניים' }
  ],
  external: [
    { code: 'EXT-10', label: 'כוח אדם' }, { code: 'EXT-20', label: 'ציוד' }, { code: 'EXT-30', label: 'חומרים' }, { code: 'EXT-40', label: 'נסיעות' }, { code: 'EXT-50', label: 'תקורה' }
  ],
  donation: [
    { code: 'DON-10', label: 'מלגות' }, { code: 'DON-20', label: 'חומרים וציוד' }, { code: 'DON-30', label: 'שירותים' }
  ]
};

/** "סוג הוצאה": the field Priority lacks today. Proposal only; the legacy "פיננסי" field is used for this now. */
export const EXPENSE_TYPES = [
  { key: 'people', label: 'שכר ותשלומים לאנשים' },
  { key: 'equipment', label: 'רכישת ציוד' },
  { key: 'supplies', label: 'חומרים מתכלים' },
  { key: 'services', label: 'שירותים חיצוניים' },
  { key: 'travel', label: 'נסיעות וכנסים' },
  { key: 'publishing', label: 'פרסום ותרגום' }
];
const bi = (type, code) => BUDGET_ITEMS[type].find(x => x.code === code);
const et = (key) => EXPENSE_TYPES.find(x => x.key === key).label;

/** Startup package (תקציב קליטה): a personal budget per researcher with its own agreement dates. Fictitious. */
export const STARTUP_PACKAGES = [
  { id: 'intake-a', researcherId: 'a', budget: 150000, used: 48000, committed: 12000, currency: 'ILS', start: '2025-10-01', end: '2028-09-30' },
  { id: 'intake-b', researcherId: 'b', budget: 120000, used: 20000, committed: 0, currency: 'ILS', start: '2026-02-01', end: '2029-01-31' }
];

export const TRANSACTIONS_INTAKE_A = [
  { date: '2026-10-26', description: 'מיקרוסקופ – מקדמה', budgetItem: bi('intake', 'INT-10'), expenseType: et('equipment'), source: 'Priority', status: 'paid', amount: 30000 },
  { date: '2026-10-03', description: 'שכר טכנאי/ת מעבדה – ספטמבר', budgetItem: bi('intake', 'INT-20'), expenseType: et('people'), source: 'Priority', status: 'paid', amount: 18000 },
  { date: '2026-10-22', description: 'הסכם שירות למכשור', budgetItem: bi('intake', 'INT-40'), expenseType: et('services'), source: 'Quotes', status: 'approved_unpaid', amount: 12000 }
];

/** status: 'paid' (source Priority) | 'approved_unpaid' (source Quotes) */
export const TRANSACTIONS_A = [
  { date: '2026-11-02', description: 'שכר עוזר/ת מחקר – אוקטובר', category: 'assistants', budgetItem: bi('kkm', 'KKM-20'), expenseType: et('people'), source: 'Priority', status: 'paid', amount: 750 },
  { date: '2026-10-28', description: 'דמי רישום לכנס', category: 'conferences', budgetItem: bi('kkm', 'KKM-10'), expenseType: et('travel'), source: 'Priority', status: 'paid', amount: 1100 },
  { date: '2026-10-21', description: 'תרגום ועריכת מאמר', category: 'translation', budgetItem: bi('kkm', 'KKM-30'), expenseType: et('publishing'), source: 'Priority', status: 'paid', amount: 700 },
  { date: '2026-10-14', description: 'רכישת ציוד מחקר', category: 'equipment', budgetItem: bi('kkm', 'KKM-50'), expenseType: et('equipment'), source: 'Quotes', status: 'approved_unpaid', amount: 1200 },
  { date: '2026-10-09', description: 'הצעת מחיר לתרגום ועריכה', category: 'translation', budgetItem: bi('kkm', 'KKM-30'), expenseType: et('publishing'), source: 'Quotes', status: 'approved_unpaid', amount: 600 }
];
