import { test } from 'node:test';
import assert from 'node:assert/strict';
import { jiraIssueUrl, normalizeJiraDomain, parseIssueKey } from './jira.js';

test('Jira domain is normalized from what people type', () => {
  assert.equal(normalizeJiraDomain('https://bussiness.atlassian.net/'), 'https://bussiness.atlassian.net');
  assert.equal(normalizeJiraDomain('bussiness.atlassian.net'), 'https://bussiness.atlassian.net');
  assert.equal(normalizeJiraDomain('https://bussiness.atlassian.net/jira/your-work'), 'https://bussiness.atlassian.net');
  assert.equal(normalizeJiraDomain('   '), '');
});

test('issue keys are read from keys or pasted links', () => {
  assert.equal(parseIssueKey('CLA-30533'), 'CLA-30533');
  assert.equal(parseIssueKey(' cla-30533 '), 'CLA-30533');
  assert.equal(parseIssueKey('https://bussiness.atlassian.net/browse/CLA-30533'), 'CLA-30533');
  assert.equal(parseIssueKey('not a key'), '');
});

test('issue link uses the selectedIssue path', () => {
  assert.equal(
    jiraIssueUrl('https://bussiness.atlassian.net/', 'CLA-30533'),
    'https://bussiness.atlassian.net/issues?selectedIssue=CLA-30533',
  );
  assert.equal(jiraIssueUrl('', 'CLA-30533'), null);
  assert.equal(jiraIssueUrl('bussiness.atlassian.net', ''), null);
});
