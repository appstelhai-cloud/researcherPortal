/**
 * monday option 3 (CIO meeting 16.11): only MANDATORY columns are mapped in settings; everything else on a board is free.
 * The monitor reports which mapped columns are missing from a board snapshot, so a deleted key column raises an alert.
 * Pure function. Concept only: no monday call, the snapshot is a fixture.
 */
export function checkMondayColumns(required, boardColumns) {
  const present = new Set(boardColumns);
  return required.map(r => ({ ...r, ok: present.has(r.column) }));
}

/**
 * Import step: propose, for each mandatory field, the board column with the same name (case-insensitive).
 * Returns { key: columnName | null }; a null means the researcher/authority must pick one by hand.
 */
export function suggestMapping(required, boardColumns) {
  const byLower = new Map(boardColumns.map(c => [c.toLowerCase(), c]));
  return Object.fromEntries(required.map(r => [r.key, byLower.get(r.column.toLowerCase()) ?? null]));
}

export function missing(results) {
  return results.filter(r => !r.ok);
}
