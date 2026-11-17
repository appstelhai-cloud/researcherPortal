/**
 * monday integration sketch (concept only, fictitious). The real version would call the monday API with a key kept on the
 * server. Nothing here is persisted and no key is ever entered in or stored by the browser.
 */
export const MONDAY_CONNECTION = {
  status: 'connected',
  workspace: 'רשות המחקר (דמו)',
  keyHint: '••••••••a1b2',
  scopes: ['boards:read', 'boards:write', 'updates:write'],
  testedAt: '2026-11-02T08:00:00'
};

/** Boards visible to the key. `imported` = already mapped to the portal; `columns` feed the mapping step. */
export const MONDAY_BOARDS = [
  { id: 'b1', name: 'מעקב מענקים (דמו)', items: 42, state: 'imported', syncedAt: '2026-11-02T07:45:00',
    columns: ['Name', 'Due date', 'Budget', 'Notes', 'Owner'] },
  { id: 'b2', name: 'קולות קוראים פנימיים (דמו)', items: 17, state: 'new', syncedAt: null,
    columns: ['Item', 'Deadline', 'Amount', 'Spent', 'Status'] },
  { id: 'b3', name: 'דיווחים לקרנות (דמו)', items: 9, state: 'new', syncedAt: null,
    columns: ['Name', 'Due date', 'Budget', 'Utilized', 'Fund'] }
];

/** New boards the portal can create, one template per source type. */
export const BOARD_TEMPLATES = [
  { key: 'external', label: 'מחקר במימון חיצוני', columns: ['Name', 'Due date', 'Budget', 'Utilized', 'Fund', 'Owner'] },
  { key: 'donation', label: 'מחקר במימון תרומה', columns: ['Name', 'Due date', 'Budget', 'Utilized', 'Donor', 'Owner'] },
  { key: 'requests', label: 'בקשות חוקרים', columns: ['Name', 'Due date', 'Budget', 'Utilized', 'Request type', 'Status'] }
];

/** One owner per field avoids two-way overwrite: whoever owns a field is the only side that writes it. */
export const SYNC_RULES = [
  { field: 'כותרת, מועד הגשה, תקציב', owner: 'monday', direction: 'monday ← פורטל קורא', trigger: 'בכל רענון (דינמי)' },
  { field: 'סכום ניצול', owner: 'portal', direction: 'פורטל ← monday מעדכן', trigger: 'אחרי אישור הוצאה' },
  { field: 'סטטוס בקשה', owner: 'portal', direction: 'פורטל ← monday מעדכן', trigger: 'בכל מעבר שלב' },
  { field: 'הערות ועמודות חופשיות', owner: 'monday', direction: 'לא נקראות ולא נכתבות', trigger: '—' }
];

export const SYNC_LOG = [
  { at: '2026-11-02T07:45:00', what: 'קריאת בורד "מעקב מענקים (דמו)"', result: 'ok', note: '42 פריטים' },
  { at: '2026-11-02T07:40:00', what: 'עדכון סטטוס בקשה: רכש ציוד', result: 'ok', note: 'פריט 1042' },
  { at: '2026-11-02T07:30:00', what: 'עדכון סכום ניצול: אריזות חכמות', result: 'failed', note: 'העמודה "Utilized" חסרה בבורד' },
  { at: '2026-11-01T16:10:00', what: 'יצירת בורד "בקשות חוקרים"', result: 'ok', note: 'תבנית: בקשות חוקרים' }
];
