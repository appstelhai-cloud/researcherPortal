import { addMonths, daysBetween, elapsedShare } from './pace.js';
import { formatMoney, formatPercent } from './format.js';

/** Next stewardship report due date: last report (or the gift start) plus the promised cycle. */
export function nextReportDue(don) { return addMonths(don.lastReport ?? don.since, don.cycleMonths); }

/**
 * Flags the External Relations unit acts on. Pure.
 *  report_overdue / report_soon: stewardship report to the donor
 *  slow: spend lags behind time (a donor who sees idle money may not renew)
 *  ending: gift ends within 180 days (renewal conversation)
 *  uncollected: pledged money not yet transferred
 */
export function donationFlags({ don, research, asOfIso }) {
  const flags = [];
  const due = nextReportDue(don);
  const toReport = daysBetween(asOfIso, due);
  if (toReport < 0) flags.push('report_overdue'); else if (toReport <= 30) flags.push('report_soon');
  const elapsed = elapsedShare({ start: research.start, end: research.end }, asOfIso);
  const spent = (research.used + research.committed) / research.budget;
  if (elapsed >= 0.25 && elapsed - spent > 0.2) flags.push('slow');
  const toEnd = daysBetween(asOfIso, research.end);
  if (toEnd >= 0 && toEnd <= 180) flags.push('ending');
  if (don.received < don.pledged) flags.push('uncollected');
  return { flags, nextReport: due, daysToReport: toReport, daysToEnd: toEnd, elapsed, spentShare: spent };
}

export const FLAG_LABELS = {
  report_overdue: 'דוח לתורם באיחור', report_soon: 'דוח בקרוב', slow: 'ניצול איטי',
  ending: 'התרומה מסתיימת, זמן לשיחת חידוש', uncollected: 'התחייבות שטרם התקבלה'
};

/** Work items for one donation row (from listDonationsOverview), most urgent first by rank. Shared by the donors page and the notification center. */
const days = (n) => `${Math.abs(n)} ימים`;
export function tasksOf(r) {
  const t = [];
  if (r.flags.includes('report_overdue')) t.push({ rank: r.daysToReport, kind: 'overdue', tone: 'bad', text: `דוח באיחור של ${days(r.daysToReport)}`, action: ['הכנת הדוח', `donors.html?view=reports&donor=${r.donorId}`] });
  if (r.flags.includes('report_soon')) t.push({ rank: r.daysToReport, kind: 'soon', tone: 'warn', text: `דוח נדרש בעוד ${days(r.daysToReport)}`, action: ['הכנת הדוח', `donors.html?view=reports&donor=${r.donorId}`] });
  if (r.flags.includes('ending')) t.push({ rank: 100 + r.daysToEnd, kind: 'ending', tone: 'info', text: `התרומה מסתיימת בעוד ${days(r.daysToEnd)}: לתאם שיחת חידוש` });
  if (r.flags.includes('slow')) t.push({ rank: 200, kind: 'slow', tone: 'warn', text: `בוצע ${formatPercent(r.spentShare)} כשעבר ${formatPercent(r.elapsed)} מהזמן: כדאי לברר עם ${r.pi} לפני שהתורם שם לב` });
  if (r.flags.includes('uncollected')) t.push({ rank: 300, kind: 'uncollected', tone: 'info', text: `טרם התקבלו ${formatMoney(r.pledged - r.received, r.currency)} מתוך ${formatMoney(r.pledged, r.currency)}` });
  return t.map(x => ({ ...x, row: r, id: `don:${r.researchId}:${x.kind}` }));
}

