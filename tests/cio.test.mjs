import test from 'node:test';
import assert from 'node:assert/strict';
import { mockRepository as repo } from '../js/repository.js';
import { groupSources } from '../js/sources.js';
import { visibleCalls, matchesInterests, alertCalls } from '../js/calls-logic.js';
import { checkMondayColumns, missing, suggestMapping } from '../js/monday-monitor.js';
import { MAPPING, MONDAY_BOARD } from '../js/config-mapping.js';
import { routeOf } from '../js/request-model.js';
import { SOURCE_TYPES, BUDGET_ITEMS } from '../js/fixtures.js';
import { CALLS } from '../js/calls-fixtures.js';

test('researcher A sees only relevant source types, in order, and no donations', async () => {
  const groups = await repo.listSourcesForResearcher('a');
  assert.deepEqual(groups.map(g => g.type), ['intake', 'kkm', 'external']);
});

test('researcher F sees donations because they take part in a donation-funded research', async () => {
  const groups = await repo.listSourcesForResearcher('f');
  assert.ok(groups.some(g => g.type === 'donation'));
  assert.ok(!groups.some(g => g.type === 'intake'));
});

test('projects sit inside their source group and no group exposes a total', async () => {
  const groups = await repo.listSourcesForResearcher('a');
  const ext = groups.find(g => g.type === 'external');
  assert.deepEqual(ext.items.map(i => i.id).sort(), ['r1', 'r3']);
  for (const g of groups) assert.ok(!('total' in g) && !('balance' in g));
});

test('groupSources drops empty types', () => {
  assert.deepEqual(groupSources([{ type: 'kkm', id: 'x' }], SOURCE_TYPES).map(g => g.type), ['kkm']);
});

test('every source type has budget items', () => {
  for (const t of Object.keys(SOURCE_TYPES)) assert.ok(BUDGET_ITEMS[t].length > 0, t);
});

test('startup package balance uses its own agreement budget', async () => {
  const d = await repo.getSourceDetail('a', 'intake');
  assert.equal(d.summary.balance, 150000 - 48000 - 12000);
  assert.ok(d.transactions.every(t => t.budgetItem.code.startsWith('INT-') && t.expenseType));
});

test('KKM transactions carry budget item and expense type', async () => {
  const d = await repo.getSourceDetail('a', 'kkm');
  assert.ok(d.transactions.every(t => t.budgetItem.code.startsWith('KKM-') && t.expenseType));
});

test('calls: routed calls reach only matching interests; all-exposed calls reach everyone', () => {
  const none = visibleCalls(CALLS, []);
  assert.ok(none.length > 0 && none.every(c => c.exposure === 'all'));
  const agri = visibleCalls(CALLS, ['חקלאות ופודטק']);
  assert.ok(agri.some(c => c.id === 'c7'));
  assert.ok(!visibleCalls(CALLS, ['מדעי החברה']).some(c => c.id === 'c7'));
  assert.ok(alertCalls(CALLS, ['חקלאות ופודטק']).every(c => matchesInterests(c, ['חקלאות ופודטק'])));
});

test('monday monitor flags the deleted key column', () => {
  const res = checkMondayColumns(MAPPING.mondayRequired, MONDAY_BOARD.columns);
  assert.deepEqual(missing(res).map(r => r.key), ['used']);
  assert.deepEqual(missing(checkMondayColumns(MAPPING.mondayRequired, ['Name', 'Due date', 'Budget', 'Utilized'])), []);
});

test('purchase goes through procurement, reimbursement does not', () => {
  assert.equal(routeOf('purchase'), 'דרך מערכת הרכש');
  assert.equal(routeOf('reimbursement'), 'ללא מערכת רכש');
  assert.equal(routeOf('report'), null);
});

test('donor report shows actual spend only and only that donor\'s donations', async () => {
  const rep = await repo.getDonorReport('d1');
  assert.deepEqual(rep.donations.map(d => d.researchId), ['r4']);
  const d = rep.donations[0];
  assert.equal(d.actualSpent, 20000);
  assert.ok(d.paid.every(t => t.status === 'paid'));
  assert.ok(!('committed' in d) && !('balance' in d));
});

test('monday import: mapping is suggested by column name, unmatched fields stay null', () => {
  const hit = suggestMapping(MAPPING.mondayRequired, ['name', 'DUE DATE', 'Budget', 'Utilized']);
  assert.deepEqual(hit, { due: 'DUE DATE', used: 'Utilized', budget: 'Budget', title: 'name' });
  const partial = suggestMapping(MAPPING.mondayRequired, ['Item', 'Deadline', 'Amount', 'Spent', 'Status']);
  assert.ok(Object.values(partial).every(v => v === null));
});

test('monday hub: new boards need mapping, templates already satisfy every mandatory column', async () => {
  const hub = await repo.getMondayHub();
  assert.ok(hub.boards.some(b => b.state === 'new') && hub.boards.some(b => b.state === 'imported'));
  for (const t of hub.templates) assert.deepEqual(missing(checkMondayColumns(hub.required, t.columns)), [], t.key);
  assert.ok(hub.rules.every(r => r.owner === 'monday' || r.owner === 'portal'));
});
