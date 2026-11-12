/** Fictitious research projects (מחקרים). Demo only: titles, funders and figures are invented. */

export const GRANT_SOURCE = {
  id: 'grant',
  type: 'external_grant',
  name: 'מענק מחקר',
  managementUnit: 'grant',      // a grant is a project, shared by several researchers
  periodModel: 'custom_period', // runs on the agreement dates, not 1 Oct - 30 Sep
  currency: 'ILS',
  rules: { carryOver: 'by_agreement', reportingRequiredToFunder: true }
};

export const ROLES = { pi: 'חוקר/ת ראשי/ת', member: 'חוקר/ת משתתף/ת' };

/** participants reference researcher ids from fixtures.js (a researcher can sit in several researches). */
export const RESEARCHES = [
  {
    id: 'r1', title: 'ניטור חכם של לחץ מים בכרם', center: 'אגריטק', funder: 'רשות החדשנות (דמו)',
    currency: 'ILS', budget: 600000, used: 210000, committed: 45000, start: '2025-01-01', end: '2027-12-31',
    participants: [{ id: 'a', role: 'pi' }, { id: 'b', role: 'member' }, { id: 'e', role: 'member' }],
    transactions: [
      { date: '2026-10-30', description: 'חיישני קרקע – אצווה ב׳', status: 'approved_unpaid', amount: 32000 },
      { date: '2026-10-12', description: 'שכר עוזרי מחקר – ספטמבר', status: 'paid', amount: 18500 },
      { date: '2026-09-20', description: 'ניסוי שדה: שירותי מעבדה', status: 'paid', amount: 9200 }
    ]
  },
  {
    id: 'r2', title: 'חלבונים חלופיים מאצות', center: 'פודטק', funder: 'תוכנית אירופית (דמו)',
    currency: 'EUR', budget: 400000, used: 150000, committed: 60000, start: '2025-06-01', end: '2028-05-31',
    participants: [{ id: 'c', role: 'pi' }, { id: 'd', role: 'member' }, { id: 'f', role: 'member' }],
    transactions: [
      { date: '2026-10-25', description: 'ציוד תסיסה', status: 'approved_unpaid', amount: 41000 },
      { date: '2026-10-05', description: 'נסיעה לפגישת קונסורציום', status: 'paid', amount: 2300 }
    ]
  },
  {
    id: 'r3', title: 'זיהוי מוקדם של מחלות בעלי חיים', center: 'ביוטכנולוגיה', funder: 'קרן מחקר לאומית (דמו)',
    currency: 'ILS', budget: 250000, used: 240000, committed: 30000, start: '2024-03-01', end: '2027-02-28',
    participants: [{ id: 'd', role: 'pi' }, { id: 'a', role: 'member' }],
    transactions: [
      { date: '2026-10-18', description: 'כימיקלים וריאגנטים', status: 'approved_unpaid', amount: 30000 },
      { date: '2026-10-02', description: 'שכר דוקטורנט/ית – ספטמבר', status: 'paid', amount: 7800 }
    ]
  },
  {
    id: 'r4', title: 'אריזות חכמות להארכת חיי מדף', center: 'פודטק', funder: 'תרומה (דמו)',
    currency: 'ILS', budget: 120000, used: 20000, committed: 0, start: '2026-04-01', end: '2027-09-30',
    participants: [{ id: 'f', role: 'pi' }, { id: 'c', role: 'member' }],
    transactions: [
      { date: '2026-09-15', description: 'חומרי גלם לאב-טיפוס', status: 'paid', amount: 11000 }
    ]
  }
];
