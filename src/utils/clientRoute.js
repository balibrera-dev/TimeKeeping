/**
 * Client dashboards live at /<slug>, e.g. /acme-corp, built from the client's
 * name. Names are unique (the Clients form checks), and a name that only
 * differs in punctuation gets -2, -3 … in list order.
 */
export function slugify(name) {
  return (
    (name ?? '')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'client'
  );
}

/** Map of client id to slug, unique across the list. */
export function clientSlugs(clients) {
  const used = new Map();
  const out = new Map();
  for (const c of clients ?? []) {
    const base = slugify(c.name);
    const n = (used.get(base) ?? 0) + 1;
    used.set(base, n);
    out.set(c.id, n === 1 ? base : `${base}-${n}`);
  }
  return out;
}

export function clientPath(client, clients) {
  return `/${clientSlugs(clients).get(client.id) ?? slugify(client.name)}`;
}

/** The slug in a pathname like "/acme-corp" or "/acme-corp/", or null for "/". */
export function slugFromPath(pathname) {
  const slug = decodeURIComponent((pathname ?? '/').replace(/^\/+|\/+$/g, '')).toLowerCase();
  // "/index.html" and other file-like paths are the app itself, not a client.
  return slug && !slug.includes('.') ? slug : null;
}

/** The client a slug points at, or null. */
export function clientForSlug(slug, clients) {
  if (!slug) return null;
  for (const [id, s] of clientSlugs(clients)) if (s === slug) return clients.find((c) => c.id === id) ?? null;
  return null;
}
