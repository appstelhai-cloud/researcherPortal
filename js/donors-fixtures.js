/**
 * Fictitious donors. Each donation funds one research (research-fixtures.js, sourceType 'donation').
 * Fundraising facts (received, report cycle, contacts) live here, not in the research: they belong to the External Relations unit.
 *  received: money the donor actually transferred so far (may be less than pledged).
 *  cycleMonths / lastReport: stewardship reporting promised to the donor. lastReport null = never reported.
 */
export const COORDINATORS = ['רכז/ת א׳ (דמו)', 'רכז/ת ב׳ (דמו)'];

export const DONORS = [
  {
    id: 'd1', name: 'תורם/ת א׳ (דמו)', contact: 'מנהל/ת היחידה (דמו)',
    donations: [{
      researchId: 'r4', pledged: 120000, received: 60000, since: '2026-04-01', cycleMonths: 6, lastReport: null,
      coordinator: COORDINATORS[0], lastContact: '2026-06-20',
      purpose: 'פיתוח אריזות חכמות שמאריכות את חיי המדף של מזון טרי.',
      outputs: ['אב-טיפוס ראשון הושלם', 'שני סטודנטים משתתפים במחקר'],
      updates: [{ date: '2026-09-30', text: 'הושלמו בדיקות המעבדה הראשונות של האריזה. החיים על המדף התארכו בכ-40% במדגם הראשוני.' }]
    }]
  },
  {
    id: 'd2', name: 'קרן תורמים ב׳ (דמו)', contact: 'רכז/ת ב׳ (דמו)',
    donations: [{
      researchId: 'r5', pledged: 200000, received: 100000, since: '2026-06-01', cycleMonths: 12, lastReport: null,
      coordinator: COORDINATORS[1], lastContact: '2026-09-15',
      purpose: 'מלגות לדוקטורנטים צעירים בחקלאות מתקדמת.',
      outputs: ['שני דוקטורנטים קיבלו מלגה', 'שני מאמרים בהכנה'],
      updates: [{ date: '2026-10-05', text: 'שני הדוקטורנטים החלו בעבודת שדה בכרמים ובמטעים של המכללה.' }]
    }]
  },
  {
    id: 'd3', name: 'משפחת תורמים ג׳ (דמו)', contact: 'מנהל/ת היחידה (דמו)',
    donations: [{
      researchId: 'r6', pledged: 80000, received: 80000, since: '2025-02-01', cycleMonths: 6, lastReport: '2026-05-10',
      coordinator: COORDINATORS[0], lastContact: '2026-05-10',
      purpose: 'שיקום קרקעות מלוחות באזורי חקלאות בצפון.',
      outputs: ['מאמר התקבל לפרסום', 'דוקטורנט/ית אחד/ת סיים/ה שנה שנייה', 'אתר ניסוי הורחב לשני דונם'],
      updates: [{ date: '2026-10-25', text: 'מדידות הקרקע הראו ירידה של כרבע ברמת המליחות באתר הניסוי.' }]
    }]
  }
];
