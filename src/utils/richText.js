/**
 * Comments are stored as HTML from the rich text editor. Older comments are
 * plain text; these helpers read both, so nothing saved before is lost.
 * They use no DOM, so exports and tests work outside the browser too.
 */

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'", apos: "'", nbsp: ' ' };

/** True when the comment was written by the rich text editor (starts with a tag). */
export function isHtml(text) {
  return /^\s*<[a-z][\s\S]*>/i.test(text ?? '');
}

function escapeHtml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Editor HTML for a comment: HTML stays as is, plain text becomes one paragraph per line. */
export function toHtml(text) {
  if (!text) return '';
  if (isHtml(text)) return text;
  return text
    .split('\n')
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join('');
}

/** Plain text of a comment, for search, previews and CSV/JSON exports. */
export function toPlainText(text) {
  if (!text) return '';
  if (!isHtml(text)) return text;
  return text
    .replace(/<li[^>]*>\s*<p[^>]*>/gi, '<li>')
    .replace(/<\/p>\s*<\/li>/gi, '</li>')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|li|blockquote|pre)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&(#?\w+);/g, (m, name) => ENTITIES[name] ?? (name.startsWith('#') ? String.fromCodePoint(Number(name.slice(1))) : m))
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\n+|\s+$/g, '');
}

/** True when a comment has no visible text (e.g. an emptied editor's "<p></p>"). */
export function isBlankComment(text) {
  return toPlainText(text).trim() === '';
}
