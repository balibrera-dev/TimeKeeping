import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clientForSlug, clientPath, slugFromPath, slugify } from './clientRoute.js';

const clients = [
  { id: 'a', name: 'Acme Corp' },
  { id: 'b', name: 'Café Niño' },
  { id: 'c', name: 'Acme corp!' },
];

test('slugs are readable and unique', () => {
  assert.equal(slugify('  Acme Corp '), 'acme-corp');
  assert.equal(clientPath(clients[1], clients), '/cafe-nino');
  assert.equal(clientPath(clients[2], clients), '/acme-corp-2');
  assert.equal(slugify('!!!'), 'client');
});

test('paths resolve back to the client', () => {
  assert.equal(slugFromPath('/'), null);
  assert.equal(slugFromPath('/Acme-Corp/'), 'acme-corp');
  assert.equal(clientForSlug(slugFromPath('/acme-corp'), clients)?.id, 'a');
  assert.equal(clientForSlug('acme-corp-2', clients)?.id, 'c');
  assert.equal(clientForSlug('nobody', clients), null);
});
