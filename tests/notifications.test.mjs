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

test('action center: money coming in from a funder is an alert, not only spend', async () => {
  const all = await loadNotifications({});
  const funds = all.filter(n => n.rule === 'funds-in');
  assert.ok(funds.length > 0);
  assert.ok(funds.every(n => n.group === 'mine' && n.title.startsWith('נכנס כסף')));
});

test('action center: a late deadline states the late request type and the next action', async () => {
  const all = await loadNotifications({});
  const late = all.find(n => n.id === 'mine:req:q1');
  assert.ok(late.title.includes('דוח למממן') && late.title.includes('באיחור'));
  assert.ok(late.text.includes('הפעולה הבאה'));
});

test('action center: turning a rule off removes its alerts; defaults apply with no saved choice', async () => {
  const off = await loadNotifications({ 'funds-in': false, 'request-due': false });
  assert.ok(!off.some(n => n.rule === 'funds-in' || n.rule === 'request-due'));
  const dflt = await loadNotifications({});
  assert.ok(!dflt.some(n => n.rule === 'open-commitments'), 'open commitments are off by default');
  assert.ok(dflt.some(n => n.rule === 'funds-in'));
});
