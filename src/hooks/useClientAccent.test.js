import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runningClientColor } from './useClientAccent.js';

const clients = [{ id: 'c1', name: 'Acme', color: '#f43f5e' }];

test('running task with a client gives its color', () => {
  assert.equal(runningClientColor({ clientId: 'c1' }, clients), '#f43f5e');
});

test('no timer, no client, or a deleted client keeps the default accent', () => {
  assert.equal(runningClientColor(null, clients), null);
  assert.equal(runningClientColor({ clientId: null }, clients), null);
  assert.equal(runningClientColor({ clientId: 'gone' }, clients), null);
  assert.equal(runningClientColor({ clientId: 'c1' }, [{ id: 'c1', color: 'red;}' }]), null);
});
