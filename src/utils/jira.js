/** Issue keys look like CLA-30533: a project key, a dash and a number. */
const KEY_RE = /\b([A-Z][A-Z0-9_]+-\d+)\b/;

/**
 * Turn what the user typed into a Jira base URL: adds https:// when missing,
 * drops anything after the host's path and trailing slashes. '' when empty.
 * e.g. "business.atlassian.net/" -> "https://business.atlassian.net"
 */
export function normalizeJiraDomain(input) {
  const raw = (input ?? '').trim();
  if (!raw) return '';
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(withScheme);
    return `${url.protocol}//${url.host}`;
  } catch {
    return '';
  }
}

/**
 * Pull an issue key out of what the user typed or pasted: "cla-30533",
 * "CLA-30533" or a full Jira link all give "CLA-30533". '' when none.
 */
export function parseIssueKey(input) {
  const raw = (input ?? '').trim().toUpperCase();
  return raw.match(KEY_RE)?.[1] ?? '';
}

/** Link that opens the issue, or null when the domain or key is missing. */
export function jiraIssueUrl(domain, key) {
  const base = normalizeJiraDomain(domain);
  const k = parseIssueKey(key);
  return base && k ? `${base}/issues?selectedIssue=${encodeURIComponent(k)}` : null;
}
