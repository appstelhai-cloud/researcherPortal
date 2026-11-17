/**
 * Calls for proposals (קולות קוראים). External only (CIO meeting 16.11): they are not published on the university site.
 * An aggregator (Workato, later) collects them from several sources into this fixed table format; the Research Authority
 * curates it: expose to everyone, or route to researchers by area. Fictitious demo entries.
 * exposure: 'all' -> shown to every researcher | 'routed' -> shown only to researchers whose interests match `areas`
 */
export const AREAS = ['חקלאות ופודטק', 'ביוטכנולוגיה', 'אקלים וסביבה', 'טכנולוגיות מים', 'בריאות', 'מדעי החברה'];

export const CALLS = [
  { id: 'c5', title: 'תוכנית שיתוף פעולה מדעי בין-לאומית (דמו)', funder: 'קרן מחקר לאומית (דמו)', deadline: '2026-11-15', areas: ['ביוטכנולוגיה', 'בריאות'], exposure: 'all', origin: 'אגרגטור', info: 'מימון שיתופי פעולה בין חוקרים בישראל ובחו״ל.' },
  { id: 'c6', title: 'חקלאות מדייקת וניטור שדה (דמו)', funder: 'רשות החדשנות (דמו)', deadline: '2026-11-17', areas: ['חקלאות ופודטק', 'טכנולוגיות מים'], exposure: 'routed', origin: 'אגרגטור', info: 'פיתוח וניסוי טכנולוגיות בשדה, בשיתוף גורמי תעשייה.' },
  { id: 'c7', title: 'מזון בר-קיימא וחלבונים חלופיים (דמו)', funder: 'משרד החקלאות (דמו)', deadline: '2026-11-18', areas: ['חקלאות ופודטק'], exposure: 'routed', origin: 'אגרגטור', info: 'מחקר יישומי בתחום הפודטק.' },
  { id: 'c8', title: 'חוסן אקלימי בגידולי קיץ (דמו)', funder: 'תוכנית אירופית (דמו)', deadline: '2026-12-01', areas: ['אקלים וסביבה', 'חקלאות ופודטק'], exposure: 'all', origin: 'אגרגטור', info: 'קונסורציום בין-לאומי. התקציב במטבע זר.' },
  { id: 'c9', title: 'מענקי פוסט-דוקטורט בבריאות הציבור (דמו)', funder: 'קרן מחקר לאומית (דמו)', deadline: '2026-12-15', areas: ['בריאות', 'מדעי החברה'], exposure: 'routed', origin: 'אגרגטור', info: 'מלגות למחקר פוסט-דוקטורלי.' }
];
