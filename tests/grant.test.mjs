import test from 'node:test';
import assert from 'node:assert/strict';
import { grantStrategy } from '../js/grant.js';
import { mockRepository as repo } from '../js/repository.js';

test('grant summary keeps currency and flags overspend', () => {
  const r = grantStrategy.summarize({ budget: 250000, used: 240000, committed: 30000, currency: 'ILS' });
  assert.equal(r.balance, -20000);
  assert.equal(r.isDeficit, true);
});

test('a researcher can belong to several researches', async () => {
  const a = await repo.listResearches({ researcherId: 'a' });
  assert.deepEqual(a.map(r => r.id).sort(), ['r1', 'r3']);
});

test('every research has exactly one principal investigator', async () => {
  for (const r of await repo.listResearches()) {
    assert.equal(r.participants.filter(p => p.role === 'pi').length, 1, r.id);
  }
});
