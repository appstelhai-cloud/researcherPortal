import test from 'node:test';
import assert from 'node:assert/strict';
import { mockRepository as repo } from '../js/repository.js';
import { paceFlag, elapsedShare, addMonths } from '../js/pace.js';
import { nextReportDue } from '../js/donors-logic.js';

test('pace: early periods are never flagged, big gaps are', () => {
  assert.equal(paceFlag(0.9, 0.1), 'ok');
  assert.equal(paceFlag(0.8, 0.4), 'over');
  assert.equal(paceFlag(0.1, 0.6), 'under');
  assert.equal(paceFlag(0.5, 0.45), 'ok');
  assert.equal(paceFlag(Infinity, 0.5), 'over');
});

test('elapsedShare is clamped and addMonths rolls the year', () => {
  assert.equal(elapsedShare({ start: '2026-01-01', end: '2026-12-31' }, '2030-01-01'), 1);
  assert.equal(elapsedShare({ start: '2026-01-01', end: '2026-12-31' }, '2025-01-01'), 0);
  assert.equal(addMonths('2026-10-01', 6), '2027-04-01');
});

test('authority: every funding item is listed per source, with a period and elapsed share', async () => {
  const items = await repo.listAllSources();
  assert.deepEqual([...new Set(items.map(i => i.type))].sort(), ['donation', 'external', 'intake', 'kkm']);
  assert.equal(items.filter(i => i.type === 'kkm').length, 6);
  for (const i of items) assert.ok(i.elapsed >= 0 && i.elapsed <= 1 && i.period.start < i.period.end, i.id);
});

test('authority: the EUR research is not mixed into shekel items', async () => {
  const items = await repo.listAllSources();
  assert.equal(items.find(i => i.id === 'r2').currency, 'EUR');
  assert.ok(items.filter(i => i.type === 'external').some(i => i.currency === 'ILS'));
});

test('donor unit: overdue report, slow spend and ending gift are flagged from the data', async () => {
  const rows = await repo.listDonationsOverview();
  const byId = Object.fromEntries(rows.map(r => [r.researchId, r]));
  assert.ok(byId.r4.flags.includes('report_overdue') && byId.r4.flags.includes('slow') && byId.r4.flags.includes('uncollected'));
  assert.ok(byId.r6.flags.includes('report_soon') && byId.r6.flags.includes('ending'));
  assert.deepEqual(byId.r5.flags, ['uncollected']);
});

test('next report is last report or gift start plus the promised cycle', () => {
  assert.equal(nextReportDue({ since: '2026-04-01', cycleMonths: 6, lastReport: null }), '2026-10-01');
  assert.equal(nextReportDue({ since: '2025-02-01', cycleMonths: 6, lastReport: '2026-05-10' }), '2026-11-10');
});

test('donor report adds category breakdown and next steps but still no commitments or balance', async () => {
  const d = (await repo.getDonorReport('d2')).donations[0];
  assert.deepEqual(d.byCategory, { 'מלגות': 35000 });
  assert.ok(d.outputs.length && d.nextReport && d.contact);
  assert.ok(!('committed' in d) && !('balance' in d) && !('received' in d));
});
