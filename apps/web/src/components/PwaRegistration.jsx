'use client';

import { useEffect } from 'react';

// Installability is native browser UI; do not interrupt the player with prompts.
export default function PwaRegistration() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') return;
    const register = () => navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .catch(() => { /* Play remains available without a service worker. */ });
    window.addEventListener('load', register);
    if (document.readyState === 'complete') register();
    return () => window.removeEventListener('load', register);
  }, []);
  return null;
}
