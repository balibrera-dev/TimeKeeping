import { useCallback, useEffect, useState } from 'react';
import { ADSENSE_CLIENT, ADS_CONSENT_MODE, ADS_ENABLED } from '../config.js';
import { CONSENT_KEY, adsConsentStatus, gpcEnabled, readConsent, writeConsent } from '../utils/consent.js';
import { loadAdSense, showGoogleConsentMessage } from '../utils/ads.js';

/**
 * Ad consent state. With ads off nothing is ever loaded or asked. With the
 * built-in banner, AdSense loads only after the visitor accepts; with Google's
 * consent messages, AdSense loads right away and Google asks the visitor.
 */
export function useAdsConsent() {
  const [consent, setConsent] = useState(() => readConsent());
  const [bannerOpen, setBannerOpen] = useState(false);
  const builtin = ADS_CONSENT_MODE === 'builtin';
  const status = adsConsentStatus(consent, gpcEnabled());
  const adsAllowed = ADS_ENABLED && (!builtin || status === 'granted');

  useEffect(() => {
    if (ADS_ENABLED && builtin && status === null) setBannerOpen(true);
  }, [builtin, status]);

  useEffect(() => {
    if (adsAllowed) loadAdSense(ADSENSE_CLIENT);
  }, [adsAllowed]);

  // A choice made in another tab applies here too.
  useEffect(() => {
    const onStorage = (e) => e.key === CONSENT_KEY && setConsent(readConsent());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const choose = useCallback((granted) => {
    const previous = readConsent()?.ads;
    setConsent(writeConsent(granted));
    setBannerOpen(false);
    // Ad scripts can't be unloaded from a running page; a reload drops them.
    if (previous === 'granted' && !granted) window.location.reload();
  }, []);

  const openChoices = useCallback(() => {
    if (ADS_ENABLED && !builtin) showGoogleConsentMessage();
    else setBannerOpen(true);
  }, [builtin]);

  return {
    adsEnabled: ADS_ENABLED,
    adsAllowed,
    status,
    bannerOpen,
    accept: () => choose(true),
    reject: () => choose(false),
    close: () => setBannerOpen(false),
    openChoices,
  };
}
