/**
 * Request tracking (concept only). Pure functions, no DOM, no data source.
 * Status sets and deadline rules here are ILLUSTRATIVE: the Research Authority must own the real
 * state machines per request type (handoff section 4b).
 */

/** Who currently holds the request. `done` and `approved` do not run a deadline. */
export const STATUSES = {
  waiting_researcher: { label: 'ממתין לחוקר', open: true },
  in_review: { label: 'בבדיקה', open: true },
  waiting_approval: { label: 'ממתין לאישור', open: true },
  approved: { label: 'אושר, ממתין לתשלום', open: false },
  done: { label: 'הושלם', open: false }
};

/** Whole days between two ISO dates (a - b). Compares dates only, never clock time. */
function dayDiff(a, b) {
  return Math.round((Date.parse(a.slice(0, 10)) - Date.parse(b.slice(0, 10))) / 86400000);
}

/** Days past the due date, or 0. Only open requests with a due date can be late. */
export function daysLate(req, asOf) {
  if (!req.dueDate || !STATUSES[req.status]?.open) return 0;
  return Math.max(0, dayDiff(asOf, req.dueDate));
}

/** Days left until the due date for an open request (0 if none, late, or closed). */
export function daysLeft(req, asOf) {
  if (!req.dueDate || !STATUSES[req.status]?.open) return 0;
  return Math.max(0, dayDiff(req.dueDate, asOf));
}

/** Display state used for the chip: late wins over the plain status. */
export function displayState(req, asOf) {
  const late = daysLate(req, asOf);
  if (late > 0) return { key: 'late', label: `באיחור של ${late} ימים` };
  if (req.status === 'done') return { key: 'done', label: STATUSES.done.label };
  if (req.status === 'approved') return { key: 'done', label: STATUSES.approved.label };
  if (req.status === 'waiting_researcher') return { key: 'wait', label: STATUSES.waiting_researcher.label };
  return { key: 'progress', label: STATUSES[req.status].label };
}

/**
 * Three buckets for the KPI row, from the viewer's side:
 * late (any holder), mine (open, held by the viewer's role, not late), other (open, held by someone else, not late).
 */
export function bucketize(requests, asOf, viewerRole) {
  const out = { late: 0, mine: 0, other: 0 };
  for (const r of requests) {
    if (!STATUSES[r.status]?.open) continue;
    if (daysLate(r, asOf) > 0) out.late++;
    else if (r.assignee.role === viewerRole) out.mine++;
    else out.other++;
  }
  return out;
}
