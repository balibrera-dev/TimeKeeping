import { useCallback, useEffect, useState } from 'react';
import { LEGAL_DOCS } from '../legal/documents.jsx';

const PREFIX = '#/legal/';

function current() {
  const hash = window.location.hash;
  if (!hash.startsWith(PREFIX)) return null;
  const id = hash.slice(PREFIX.length);
  return LEGAL_DOCS.some((d) => d.id === id) ? id : null;
}

export const legalHref = (id) => `${PREFIX}${id}`;

/**
 * Legal pages live at #/legal/<id> so each one has a shareable URL (ad
 * networks ask for a privacy policy link) without a router or server rewrites.
 */
export function useLegalRoute() {
  const [doc, setDoc] = useState(current);
  useEffect(() => {
    const onHash = () => {
      setDoc(current());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  const closeLegal = useCallback(() => {
    if (!window.location.hash) return;
    history.pushState(null, '', window.location.pathname + window.location.search);
    setDoc(null);
  }, []);
  return { legalDoc: doc, closeLegal };
}
