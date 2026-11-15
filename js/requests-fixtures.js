/**
 * Fictitious request-tracking demo data. Concept only: types, statuses and deadlines are illustrative.
 * Shape follows handoff section 4b (`Request`). Amounts match the KKM commitments in fixtures.js.
 * assignee.role: 'researcher' | 'authority' | 'procurement' | 'ethics' | 'advisor'
 */
export const REQUEST_TYPES = {
  purchase: 'בקשת רכש',
  report: 'דוח למממן',
  proposal: 'הצעת מחקר',
  ethics: 'אישור אתיקה',
  reimbursement: 'בקשת החזר'
};

export const ROLE_LABELS = {
  researcher: 'חוקר/ת',
  authority: 'רשות המחקר',
  procurement: 'אחראי רכש',
  ethics: 'ועדת אתיקה',
  finance: 'יחידת הכספים'
};

const h = (at, by, from, to, note) => ({ at, by, from, to, note });

export const REQUESTS = [
  // Researcher A (the demo researcher)
  { id: 'q1', researcherId: 'a', type: 'report', title: 'דוח התקדמות שנתי למממן', source: 'מענק חיצוני (דמו)',
    status: 'waiting_researcher', assignee: { role: 'researcher' }, dueDate: '2026-10-26', next: 'להעלות את הדוח להגשה',
    history: [h('2026-10-01', 'רשות המחקר', null, 'ממתין לחוקר', 'נפתחה משימת דוח שנתי'), h('2026-10-20', 'מערכת', 'ממתין לחוקר', 'ממתין לחוקר', 'תזכורת נשלחה')] },
  { id: 'q2', researcherId: 'a', type: 'ethics', title: 'אישור ועדת אתיקה לניסוי בשדה', source: 'מחקר פנימי',
    status: 'in_review', assignee: { role: 'ethics' }, dueDate: '2026-11-12', next: 'להמתין להחלטת הוועדה',
    history: [h('2026-10-18', 'חוקר/ת א׳', null, 'בבדיקה', 'הוגשה בקשה עם נספחים'), h('2026-10-27', 'ועדת אתיקה', 'בבדיקה', 'בבדיקה', 'נתבקש מסמך הבהרה, הועלה')] },
  { id: 'q3', researcherId: 'a', type: 'purchase', title: 'רכישת ציוד מחקר', source: 'קק״מ', amount: 1200,
    status: 'approved', assignee: { role: 'procurement' }, next: 'ממתין להזמנה ולתשלום לספק',
    history: [h('2026-10-10', 'חוקר/ת א׳', null, 'ממתין לאישור'), h('2026-10-14', 'רשות המחקר', 'ממתין לאישור', 'אושר, ממתין לתשלום', 'חויב על קק״מ')] },
  { id: 'q4', researcherId: 'a', type: 'purchase', title: 'הצעת מחיר לתרגום ועריכה', source: 'קק״מ', amount: 600,
    status: 'approved', assignee: { role: 'finance' }, next: 'ממתין לחשבונית מהספק',
    history: [h('2026-10-08', 'חוקר/ת א׳', null, 'ממתין לאישור'), h('2026-10-09', 'רשות המחקר', 'ממתין לאישור', 'אושר, ממתין לתשלום', 'חויב על קק״מ')] },
  { id: 'q5', researcherId: 'a', type: 'proposal', title: 'הצעת מחקר: תוכנית שיתוף פעולה מדעי בין-לאומית (דמו)', source: 'קול קורא חיצוני',
    status: 'waiting_researcher', assignee: { role: 'researcher' }, dueDate: '2026-11-15', next: 'להשלים תקציב ולהגיש לרשות המחקר',
    history: [h('2026-10-25', 'חוקר/ת א׳', null, 'ממתין לחוקר', 'נפתחה טיוטה')] },

  // Other researchers (Research Authority view)
  { id: 'q6', researcherId: 'b', type: 'proposal', title: 'הצעת מחקר: חקלאות מדייקת וניטור שדה (דמו)', source: 'קול קורא חיצוני',
    status: 'in_review', assignee: { role: 'authority' }, dueDate: '2026-11-17', next: 'לבדוק תקציב ומסמכים',
    history: [h('2026-10-29', 'חוקר/ת ב׳', 'ממתין לחוקר', 'בבדיקה', 'הוגשה לרשות המחקר')] },
  { id: 'q7', researcherId: 'c', type: 'purchase', title: 'רכישת חומרי מעבדה', source: 'קק״מ', amount: 900,
    status: 'approved', assignee: { role: 'procurement' }, next: 'ממתין להזמנה',
    history: [h('2026-10-12', 'רשות המחקר', 'ממתין לאישור', 'אושר, ממתין לתשלום')] },
  { id: 'q8', researcherId: 'c', type: 'reimbursement', title: 'החזר הוצאות כנס', source: 'קק״מ', amount: 1850,
    status: 'waiting_approval', assignee: { role: 'authority' }, dueDate: '2026-11-09', next: 'לבדוק קבלות ולאשר',
    history: [h('2026-10-30', 'חוקר/ת ג׳', null, 'ממתין לאישור', 'הוגשו קבלות')] },
  { id: 'q9', researcherId: 'd', type: 'report', title: 'דוח התקדמות למשרד החקלאות (דמו)', source: 'מענק חיצוני (דמו)',
    status: 'waiting_researcher', assignee: { role: 'researcher' }, dueDate: '2026-10-30', next: 'להשלים ולהגיש דוח',
    history: [h('2026-10-02', 'רשות המחקר', null, 'ממתין לחוקר')] },
  { id: 'q13', researcherId: 'd', type: 'purchase', title: 'ציוד מעבדה למחקר פודטק', source: 'קק״מ', amount: 1500,
    status: 'approved', assignee: { role: 'procurement' }, next: 'ממתין להזמנה',
    history: [h('2026-10-05', 'רשות המחקר', 'ממתין לאישור', 'אושר, ממתין לתשלום')] },
  { id: 'q10', researcherId: 'd', type: 'purchase', title: 'רישיון תוכנה סטטיסטית', source: 'קק״מ', amount: 700,
    status: 'waiting_approval', assignee: { role: 'authority' }, dueDate: '2026-11-06', next: 'לבדוק יתרה: חוקר/ת ד׳ בגירעון',
    history: [h('2026-11-01', 'חוקר/ת ד׳', null, 'ממתין לאישור')] },
  { id: 'q11', researcherId: 'e', type: 'ethics', title: 'אישור אתיקה למחקר משתתפים', source: 'מחקר פנימי',
    status: 'in_review', assignee: { role: 'ethics' }, dueDate: '2026-11-20', next: 'להמתין להחלטת הוועדה',
    history: [h('2026-10-31', 'חוקר/ת ה׳', null, 'בבדיקה')] },
  { id: 'q12', researcherId: 'f', type: 'purchase', title: 'ציוד מדידה לשדה', source: 'קק״מ', amount: 1200,
    status: 'approved', assignee: { role: 'procurement' }, next: 'ממתין להזמנה',
    history: [h('2026-10-15', 'רשות המחקר', 'ממתין לאישור', 'אושר, ממתין לתשלום')] }
];
