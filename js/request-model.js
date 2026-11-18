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

/** Approval route: purchases go through the procurement system, reimbursements do not (CIO meeting 16.11). */
export function routeOf(type) {
  if (type === 'purchase') return 'דרך מערכת הרכש';
  if (type === 'reimbursement') return 'ללא מערכת רכש';
  if (type === 'proposal') return `סבב אישורים: ${APPROVAL_ROUND.map(s => s.label).join(' ← ')}`;
  return null;
}

/** Approval round of a research proposal (illustrative order: the Research Authority owns the real one). */
export const APPROVAL_ROUND = [
  { role: 'dept_head', label: 'ראש/ת החוג' },
  { role: 'dean', label: 'דיקן/ית' },
  { role: 'authority', label: 'רשות המחקר' },
  { role: 'finance', label: 'יחידת הכספים' }
];

/** Only a proposal still in the researcher's hands can start a round. */
export function canOpenRound(req) {
  return req.type === 'proposal' && req.status === 'waiting_researcher';
}

/** Pure: the request after the researcher opens the round. It goes to the first approver; history keeps the step. */
export function openApprovalRound(req, asOf, by = 'חוקר/ת א׳') {
  if (!canOpenRound(req)) throw new Error('approval round cannot be opened for this request');
  const first = APPROVAL_ROUND[0];
  return {
    ...req, status: 'waiting_approval', assignee: { role: first.role }, next: `להמתין לאישור ${first.label}`,
    history: [...req.history, { at: asOf.slice(0, 10), by, from: STATUSES[req.status].label, to: STATUSES.waiting_approval.label, note: 'נפתח סבב אישורים' }]
  };
}

/** Filter by who holds the request or lateness, from the viewer's side. key: '' | 'late' | 'mine' | 'other'. */
export function matchesState(req, asOf, viewerRole, key) {
  if (!key) return true;
  if (!STATUSES[req.status]?.open) return false;
  const late = daysLate(req, asOf) > 0;
  if (key === 'late') return late;
  if (late) return false;
  return key === 'mine' ? req.assignee.role === viewerRole : req.assignee.role !== viewerRole;
}
