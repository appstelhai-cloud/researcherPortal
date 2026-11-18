import test from 'node:test';
import assert from 'node:assert/strict';
import { mockRepository as repo } from '../js/repository.js';
import { filterRows, totalsBy, totalsByCurrency } from '../js/analysis-logic.js';

test('analysis: transactions from every source carry an expense type and currency', async () => {
  const rows = await repo.listAllTransactions('a');
  const types = await repo.getExpenseTypes();
  assert.ok(new Set(rows.map(r => r.sourceId)).size >= 4);
  assert.ok(rows.every(r => types.includes(r.expenseType) && r.currency));
});

test('analysis: filter by expense type spans sources; totals split by currency, never mixed', async () => {
  const rows = await repo.listAllTransactions('a');
  const equip = filterRows(rows, { expenseTypes: ['רכישת ציוד'] });
  assert.ok(equip.every(r => r.expenseType === 'רכישת ציוד'));
  assert.ok(new Set(equip.map(r => r.sourceId)).size > 1);
  const all = totalsByCurrency(rows);
  assert.equal(new Set(all.map(t => t.currency)).size, all.length);
  for (const g of totalsBy(rows)) assert.ok(g.currency);
});

test('analysis: date range and source filters', async () => {
  const rows = await repo.listAllTransactions('a');
  assert.ok(filterRows(rows, { from: '2026-10-25' }).every(r => r.date >= '2026-10-25'));
  assert.deepEqual([...new Set(filterRows(rows, { sourceIds: ['kkm'] }).map(r => r.sourceId))], ['kkm']);
});
