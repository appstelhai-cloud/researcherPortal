/** Calls visibility (pure). The Research Authority decides exposure per call; researchers' interests route the rest. */

export function matchesInterests(call, interests) {
  return call.areas.some(a => interests.includes(a));
}

/** What a researcher may see: everything exposed to all, plus routed calls that match their interests. */
export function visibleCalls(calls, interests) {
  return calls.filter(c => c.exposure === 'all' || matchesInterests(c, interests));
}

/** Calls that should trigger an alert for this researcher (interest match, any exposure that reaches them). */
export function alertCalls(calls, interests) {
  return visibleCalls(calls, interests).filter(c => matchesInterests(c, interests));
}
