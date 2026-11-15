import test from 'node:test';
import assert from 'node:assert/strict';
import { daysLate, displayState, bucketize } from '../js/request-model.js';
import { mockRepository as repo } from '../js/repository.js';

const ASOF = '2026-11-02T08:00:00';

test('open request past its due date is late by whole days', () => {
  assert.equal(daysLate({ status: 'waiting_researcher', dueDate: '2026-10-26' }, ASOF), 7);
  assert.equal(displayState({ status: 'waiting_researcher', dueDate: '2026-10-26' }, ASOF).label, 'באיחור של 7 ימים');
});

test('closed or approved requests are never late', () => {
  assert.equal(daysLate({ status: 'approved', dueDate: '2026-10-01' }, ASOF), 0);
  assert.equal(daysLate({ status: 'done', dueDate: '2026-10-01' }, ASOF), 0);
});

test('due today is not late', () => {
  assert.equal(daysLate({ status: 'in_review', dueDate: '2026-11-02' }, ASOF), 0);
});

test('demo researcher sees 1 late, 1 waiting for them, 1 with others', async () => {
  const mine = await repo.listRequests({ researcherId: 'a' });
  assert.deepEqual(bucketize(mine, ASOF, 'researcher'), { late: 1, mine: 1, other: 1 });
});

test('researcher filter returns only their own requests', async () => {
  const mine = await repo.listRequests({ researcherId: 'a' });
  assert.ok(mine.length > 0 && mine.every(r => r.researcherId === 'a'));
});

test('approved purchases match KKM commitments per researcher', async () => {
  const all = await repo.listRequests();
  const researchers = await repo.listResearcherSummaries();
  for (const r of researchers) {
    const sum = all.filter(x => x.researcherId === r.id && x.type === 'purchase' && x.status === 'approved')
      .reduce((s, x) => s + x.amount, 0);
    assert.equal(sum, r.committed, `researcher ${r.id}`);
  }
});
