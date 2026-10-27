"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Loader2, ShieldAlert } from 'lucide-react';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { auth, firebaseReady } from '../firebase/client';

export default function CheckoutStatus() {
  const [status, setStatus] = useState('checking');
  const [message, setMessage] = useState('Checking your purchase…');

  useEffect(() => {
    if (!firebaseReady || !auth) { setStatus('unavailable'); setMessage('Purchases are unavailable.'); return undefined; }
    const sessionId = new URL(window.location.href).searchParams.get('session_id');
    if (!sessionId) { setStatus('error'); setMessage('We could not find that purchase.'); return undefined; }

    let attempts = 0;
    let timer = null;
    let cancelled = false;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) { await signInAnonymously(auth); return; }
      const check = async () => {
        if (cancelled) return;
        attempts += 1;
        try {
          const token = await user.getIdToken();
          const response = await fetch(`/api/stripe/session?session_id=${encodeURIComponent(sessionId)}`, { headers: { authorization: `Bearer ${token}` }, cache: 'no-store' });
          const payload = await response.json();
          if (!response.ok) throw new Error(payload.error?.message || 'Unable to verify checkout.');
          if (payload.session.status === 'fulfilled') {
            setStatus('fulfilled'); setMessage(`${payload.session.coins.toLocaleString()} coins added to your account.`); return;
          }
          if (['failed', 'expired'].includes(payload.session.status)) { setStatus('error'); setMessage(`The purchase didn't complete.`); return; }
          if (attempts < 15) timer = window.setTimeout(check, 1500);
          else { setStatus('pending'); setMessage('Your coins are still being added. Please check again shortly.'); }
        } catch (error) { setStatus('error'); setMessage('Could not confirm your purchase. Please try again.'); }
      };
      check();
    });
    return () => { cancelled = true; unsubscribe(); if (timer) window.clearTimeout(timer); };
  }, []);

  return <main className="grid min-h-[calc(100svh-56px)] place-items-center bg-[#f7f0e5] p-6 text-[#32281f]"><section className="w-full max-w-xl border-t border-[#d4c3a7] px-5 py-8 text-center">{status === 'checking' ? <Loader2 className="mx-auto mb-5 animate-spin text-[#95631c]" size={48} /> : status === 'fulfilled' ? <CheckCircle2 className="mx-auto mb-5 text-emerald-700" size={52} /> : <ShieldAlert className="mx-auto mb-5 text-amber-300" size={52} />}<h1 className="text-3xl font-black">{status === 'fulfilled' ? 'Coins credited' : 'Checkout status'}</h1><p className="my-5 leading-7 text-stone-700">{message}</p><Link href="/shop" className="kani-action">Return to shop</Link></section></main>;
}
