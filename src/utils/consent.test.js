import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONSENT_KEY, CONSENT_VERSION, adsConsentStatus, gpcEnabled, readConsent, writeConsent } from './consent.js';

function memoryStorage(initial = {}) {
  const data = { ...initial };
  return {
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => {
      data[k] = String(v);
    },
  };
}

test('no stored choice reads as null', () => {
  assert.equal(readConsent(memoryStorage()), null);
});

test('a written choice reads back', () => {
  const s = memoryStorage();
  writeConsent(true, s, 123);
  assert.deepEqual(readConsent(s), { ads: 'granted', decidedAt: 123, version: CONSENT_VERSION });
  writeConsent(false, s, 456);
  assert.equal(readConsent(s).ads, 'denied');
});

test('outdated or corrupt choices ask again', () => {
  assert.equal(readConsent(memoryStorage({ [CONSENT_KEY]: JSON.stringify({ ads: 'granted', version: 0 }) })), null);
  assert.equal(readConsent(memoryStorage({ [CONSENT_KEY]: '{not json' })), null);
  assert.equal(readConsent(memoryStorage({ [CONSENT_KEY]: JSON.stringify({ ads: 'maybe', version: CONSENT_VERSION }) })), null);
});

test('storage that throws never breaks the app', () => {
  const broken = {
    getItem() {
      throw new Error('blocked');
    },
    setItem() {
      throw new Error('blocked');
    },
  };
  assert.equal(readConsent(broken), null);
  assert.equal(writeConsent(true, broken, 1).ads, 'granted');
});

test('Global Privacy Control counts as a "no" until the visitor chooses', () => {
  assert.equal(gpcEnabled({ globalPrivacyControl: true }), true);
  assert.equal(gpcEnabled({}), false);
  assert.equal(adsConsentStatus(null, true), 'denied');
  assert.equal(adsConsentStatus(null, false), null);
  assert.equal(adsConsentStatus({ ads: 'granted' }, true), 'granted');
});
