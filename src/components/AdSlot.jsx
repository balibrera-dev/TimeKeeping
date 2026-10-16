import { useEffect, useRef } from 'react';
import { ADSENSE_CLIENT, ADSENSE_SLOT } from '../config.js';

/**
 * One responsive AdSense unit. Renders nothing unless ads are configured and
 * allowed, so the layout is unchanged while ads are off.
 */
export function AdSlot({ allowed, className = '' }) {
  const ref = useRef(null);

  useEffect(() => {
    const ins = ref.current;
    // StrictMode runs effects twice; AdSense throws if a slot is filled twice.
    if (!allowed || !ins || ins.dataset.adsbygoogleStatus) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.warn('Ad could not be loaded.', err);
    }
  }, [allowed]);

  if (!allowed) return null;
  return (
    <aside className={`mx-auto max-w-7xl px-4 sm:px-6 ${className}`} aria-label="Advertisement">
      <div className="mb-1 text-[10px] font-medium uppercase tracking-widest text-slate-400">Advertisement</div>
      <ins
        ref={ref}
        className="adsbygoogle block min-h-[90px]"
        style={{ display: 'block' }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={ADSENSE_SLOT}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
}
