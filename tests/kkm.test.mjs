import test from 'node:test';
import assert from 'node:assert/strict';
import { kkmStrategy, aggregate, budgetYearOf } from '../js/kkm.js';
import { RESEARCHERS } from '../js/fixtures.js';

const s = (r) => kkmStrategy.summarize(r);

test('researcher A matches the mockup', () => {
  const r = s({ allocation: 10000, accrued: 6000, used: 5200, committed: 1800 });
  assert.equal(r.available, 16000);
  assert.equal(r.balance, 9000);
  assert.equal(r.isDeficit, false);
  assert.equal(r.utilization, 7000 / 16000);
});

test('negative balance is a legitimate deficit state', () => {
  const r = s({ allocation: 10000, accrued: 0, used: 9300, committed: 1500 });
  assert.equal(r.balance, -800);
  assert.equal(r.isDeficit, true);
});

test('utilization can exceed 100%', () => {
  assert.ok(s({ allocation: 10000, accrued: 0, used: 9300, committed: 1500 }).utilization > 1);
});

test('zero available: no division by zero', () => {
  assert.equal(s({ allocation: 0, accrued: 0, used: 0, committed: 0 }).utilization, 0);
  assert.equal(s({ allocation: 0, accrued: 0, used: 100, committed: 0 }).utilization, Infinity);
});

test('fixture totals match the handoff appendix', () => {
  const t = aggregate(RESEARCHERS.map(s));
  assert.deepEqual(
    { available: t.available, used: t.used, committed: t.committed, balance: t.balance },
    { available: 80000, used: 25400, committed: 5400, balance: 49200 });
});

test('budget year runs 1 Oct - 30 Sep, not calendar year', () => {
  assert.equal(budgetYearOf('2026-09-30').label, '2025-26');
  assert.equal(budgetYearOf('2026-10-01').label, '2026-27');
  assert.equal(budgetYearOf('2027-01-15').start, '2026-10-01');
  assert.equal(budgetYearOf('2027-01-15').end, '2027-09-30');
});
