import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isBlankComment, isHtml, toHtml, toPlainText } from './richText.js';

test('plain-text comments from before rich text still read the same', () => {
  const old = 'Waiting on DWH access\n[Nov 12, 10:00] pinged <ops> & data';
  assert.equal(isHtml(old), false);
  assert.equal(toPlainText(old), old);
  assert.equal(toHtml(old), '<p>Waiting on DWH access</p><p>[Nov 12, 10:00] pinged &lt;ops&gt; &amp; data</p>');
  assert.equal(toPlainText(toHtml(old)), old);
});

test('rich comments turn into readable plain text for search and exports', () => {
  const html = '<p><strong>Blocked</strong> on <a href="https://x.io">ticket</a></p><ul><li><p>one</p></li><li><p>two &amp; three</p></li></ul>';
  assert.equal(isHtml(html), true);
  assert.equal(toPlainText(html), 'Blocked on ticket\n• one\n• two & three');
  assert.equal(toHtml(html), html);
});

test('an emptied editor counts as no comment', () => {
  assert.equal(isBlankComment('<p></p>'), true);
  assert.equal(isBlankComment('   '), true);
  assert.equal(isBlankComment(''), true);
  assert.equal(isBlankComment('<p>x</p>'), false);
});
