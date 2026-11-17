/**
 * The settings "file" (CIO meeting 16.11): mappings are configuration, never hard-coded in the UI.
 * The settings screen renders this object; a real version would load it from a config file and an admin screen.
 * All codes and names are fictitious.
 */
export const MAPPING = {
  /** The 4 fields Priority already has. */
  priorityFields: ['מעבדה', 'קרן', 'סעיף תקציבי', 'מחקר'],

  /** Source type -> how it appears in those fields. */
  sourceTypes: [
    { type: 'intake', label: 'תקציב קליטה', lab: 'לפי חוקר', fund: 'קרן קליטה (דמו)', budgetItems: 'INT-*', research: 'לא בשימוש' },
    { type: 'kkm', label: 'קרן קשרי מדע (קק״מ)', lab: 'לפי חוקר', fund: 'קק״מ', budgetItems: 'KKM-*', research: 'לא בשימוש' },
    { type: 'external', label: 'קרנות מחקר חיצוניות', lab: 'מעבדת המחקר', fund: 'לפי מממן (ISF, Horizon ועוד)', budgetItems: 'EXT-*', research: 'קוד מחקר' },
    { type: 'donation', label: 'תרומות', lab: 'מעבדת המחקר', fund: 'קרן תרומות לפי תורם', budgetItems: 'DON-*', research: 'קוד מחקר' }
  ],

  /** "סוג הוצאה": a new field. Today the "פיננסי" field is used for classification; both are shown until they are separated. */
  expenseTypes: [
    { label: 'שכר ותשלומים לאנשים', legacyFinancial: 'שכר' },
    { label: 'רכישת ציוד', legacyFinancial: 'רכש' },
    { label: 'חומרים מתכלים', legacyFinancial: 'רכש' },
    { label: 'שירותים חיצוניים', legacyFinancial: 'שירותים' },
    { label: 'נסיעות וכנסים', legacyFinancial: 'נסיעות' },
    { label: 'פרסום ותרגום', legacyFinancial: 'שירותים' }
  ],

  /** monday mandatory columns. Column names are placeholders: the Research Authority decides the real ones. */
  mondayRequired: [
    { key: 'due', label: 'מועד הגשה', column: 'Due date' },
    { key: 'used', label: 'סכום ניצול', column: 'Utilized' },
    { key: 'budget', label: 'תקציב', column: 'Budget' },
    { key: 'title', label: 'כותרת', column: 'Name' }
  ],

  /** External users (partners outside the university, donors). Access is scoped to what they are party to. */
  externalUsers: [
    { name: 'חוקר/ת חיצוני/ת א׳ (דמו)', kind: 'שותף/ה במחקר', scope: 'ניטור חכם של לחץ מים בכרם', status: 'פעיל' },
    { name: 'חוקר/ת חיצוני/ת ב׳ (דמו)', kind: 'שותף/ה במחקר', scope: 'חלבונים חלופיים מאצות', status: 'ממתין לאישור' },
    { name: 'תורם/ת א׳ (דמו)', kind: 'תורם', scope: 'אריזות חכמות להארכת חיי מדף', status: 'טרם הוחלט: דוח או כניסה' }
  ]
};

/** A snapshot of one monday board's columns (fixture). "Utilized" was deleted: the monitor should raise an alert. */
export const MONDAY_BOARD = { name: 'מעקב מענקים (דמו)', columns: ['Name', 'Due date', 'Budget', 'Notes', 'Owner'], checkedAt: '2026-11-02T08:00:00' };
