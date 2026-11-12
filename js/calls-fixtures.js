/**
 * Calls for proposals (קולות קוראים) as budget sources. Fictitious demo entries.
 * kind: 'internal' -> funding source type 'internal_call' (university funds)
 *       'external' -> funding source type 'external_call' (outside funders)
 * A call that is won becomes a research (grant) with its own budget; the link is `callId` on the research (later).
 */
export const CALL_KINDS = {
  internal: { label: 'קולות קוראים פנימיים', sourceType: 'internal_call' },
  external: { label: 'קולות קוראים חיצוניים', sourceType: 'external_call' }
};

export const CALLS = [
  { id: 'c1', kind: 'internal', title: 'קול קורא לסיוע בפרסום מאמרים', funder: 'האוניברסיטה', deadline: '2026-12-31', info: 'סיוע במימון עריכה ודמי פרסום. הגשה דרך רשות המחקר.' },
  { id: 'c2', kind: 'internal', title: 'קול קורא לתמיכה בהגשת הצעות מחקר חיצוניות', funder: 'האוניברסיטה', deadline: '2026-12-31', info: 'מימון הכנה להגשה לקרנות חיצוניות: שיתופי פעולה, תרגום ועריכה.' },
  { id: 'c3', kind: 'internal', title: 'מענקים לתמיכה בפרסום ספרים', funder: 'האוניברסיטה', deadline: '2026-12-31', info: 'מענק חד-פעמי לפרסום ספר אקדמי.' },
  { id: 'c4', kind: 'internal', title: 'תמיכה במחקר של חברי סגל במעמד אמריטוס', funder: 'האוניברסיטה', deadline: '2026-12-31', info: 'תמיכה בפעילות מחקר מתמשכת של סגל בכיר בגמלאות.' },

  { id: 'c5', kind: 'external', title: 'תוכנית שיתוף פעולה מדעי בין-לאומית (דמו)', funder: 'קרן מחקר לאומית (דמו)', deadline: '2026-11-15', info: 'מימון שיתופי פעולה בין חוקרים בישראל ובחו״ל.' },
  { id: 'c6', kind: 'external', title: 'חקלאות מדייקת וניטור שדה (דמו)', funder: 'רשות החדשנות (דמו)', deadline: '2026-11-17', info: 'פיתוח וניסוי טכנולוגיות בשדה, בשיתוף גורמי תעשייה.' },
  { id: 'c7', kind: 'external', title: 'מזון בר-קיימא וחלבונים חלופיים (דמו)', funder: 'משרד החקלאות (דמו)', deadline: '2026-11-18', info: 'מחקר יישומי בתחום הפודטק.' },
  { id: 'c8', kind: 'external', title: 'חוסן אקלימי בגידולי קיץ (דמו)', funder: 'תוכנית אירופית (דמו)', deadline: '2026-12-01', info: 'קונסורציום בין-לאומי. התקציב במטבע זר.' }
];
