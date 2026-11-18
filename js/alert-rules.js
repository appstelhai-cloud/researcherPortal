/**
 * Which alerts the action center shows (CIO round 17.11: "צריך להגדיר אילו התראות מוצגות").
 * The catalog is configuration; the per-user on/off choice is stored per browser here, a real adapter stores it per user.
 * Pure module: no repository, no DOM.
 */
export const ALERT_GROUPS = { mine: 'אצלי כחוקר/ת', authority: 'רשות המחקר', donors: 'קשרי חוץ וגיוס תורמים' };

/** `defaultOn`: shown until the user turns it off. `kind`: money out, money in, or a deadline with its next action. */
export const ALERT_RULES = [
  { key: 'funds-in', group: 'mine', kind: 'כסף נכנס', label: 'כסף שנכנס מקרן', desc: 'הגיע תשלום מהקרן או מהמממן לפרויקט שלי.', defaultOn: true },
  { key: 'request-due', group: 'mine', kind: 'מועד הגשה', label: 'מועדי הגשה, עם הפעולה הבאה', desc: 'דוח, הצעה או בקשה שהמועד שלהם קרוב או חלף. ההתראה כוללת מה צריך לעשות עכשיו.', defaultOn: true },
  { key: 'mine-deficit', group: 'mine', kind: 'הוצאה', label: 'גירעון במקור או בפרויקט', desc: 'ההוצאות והחיובים עברו את התקציב.', defaultOn: true },
  { key: 'kkm-unused', group: 'mine', kind: 'הוצאה', label: 'יתרה בקק״מ שעומדת לפוג', desc: 'יש יתרה לניצול לפני סוף שנת התקציב.', defaultOn: true },
  { key: 'allocation-ending', group: 'mine', kind: 'מועד הגשה', label: 'הקצאה או פרויקט שמסתיימים', desc: 'תקופת ההסכם מסתיימת בחצי השנה הקרובה.', defaultOn: true },
  { key: 'open-commitments', group: 'mine', kind: 'הוצאה', label: 'התחייבויות פתוחות', desc: 'הזמנות שאושרו ועוד לא שולמו.', defaultOn: false },
  { key: 'auth-request-due', group: 'authority', kind: 'מועד הגשה', label: 'בקשות שממתינות לרשות המחקר', desc: 'בקשה שהמועד שלה קרוב או חלף, והיא אצל רשות המחקר.', defaultOn: true },
  { key: 'auth-deficit', group: 'authority', kind: 'הוצאה', label: 'חוקרים בגירעון', desc: 'לפי סוג מקור.', defaultOn: true },
  { key: 'auth-over', group: 'authority', kind: 'הוצאה', label: 'מוציאים מהר מהזמן', desc: 'קצב הוצאה גבוה מהזמן שחלף.', defaultOn: true },
  { key: 'auth-under', group: 'authority', kind: 'הוצאה', label: 'מוציאים לאט מהזמן', desc: 'יתרה שעלולה לא להיות מנוצלת.', defaultOn: false },
  { key: 'donor-tasks', group: 'donors', kind: 'מועד הגשה', label: 'משימות תרומות: דוחות ותשלומים', desc: 'דוח לתורם באיחור, תרומה שטרם התקבלה ועוד.', defaultOn: true }
];

const KEY = 'rp-alert-rules';

/** Saved choices ({ ruleKey: boolean }). Storage may be blocked: then defaults apply. */
export function readRules() {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '{}') ?? {}; } catch { return {}; }
}
export function writeRules(choices) {
  try { localStorage.setItem(KEY, JSON.stringify(choices)); } catch { /* storage blocked: choice lives for this page only */ }
}

/** Is this rule on, given saved choices? Unknown rule keys are on, so a new alert is never silently hidden. */
export function isOn(key, choices = {}) {
  if (key in choices) return choices[key] !== false;
  return ALERT_RULES.find(r => r.key === key)?.defaultOn ?? true;
}
