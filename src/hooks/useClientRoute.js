import { useCallback, useEffect, useState } from 'react';
import { slugFromPath } from '../utils/clientRoute.js';

/**
 * The client dashboard slug in the address bar (/<slug>), kept in step with
 * back/forward. openClient and closeClient change the URL without a reload.
 */
export function useClientRoute() {
  const [slug, setSlug] = useState(() => slugFromPath(window.location.pathname));
  useEffect(() => {
    const onPop = () => setSlug(slugFromPath(window.location.pathname));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  const openClient = useCallback((path) => {
    history.pushState(null, '', path);
    setSlug(slugFromPath(path));
    window.scrollTo(0, 0);
  }, []);
  const closeClient = useCallback(() => {
    if (window.location.pathname === '/') return;
    history.pushState(null, '', '/' + window.location.hash);
    setSlug(null);
  }, []);
  return { clientSlug: slug, openClient, closeClient };
}
