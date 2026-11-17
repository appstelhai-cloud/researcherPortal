import test from 'node:test';
import assert from 'node:assert/strict';
import { loadNotifications, GROUPS } from '../js/notifications.js';

test('action center: every item has a stable id, a known group and an action', async () => {
  const all = await loadNotifications();
  assert.ok(all.length > 0);
  assert.equal(new Set(all.map(n => n.id)).size, all.length);
  for (const n of all) {
    assert.ok(n.group in GROUPS, n.id);
    assert.ok(n.title && n.text && n.action?.[1], n.id);
  }
});

test('action center: covers researcher, authority and donor-relations work', async () => {
  const all = await loadNotifications();
  for (const g of Object.keys(GROUPS)) assert.ok(all.some(n => n.group === g), g);
  assert.ok(all.some(n => n.id === 'mine:kkm:unused'));
  assert.ok(all.some(n => n.id === 'don:r4:overdue'));
});
