"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Loader2, ShieldAlert } from 'lucide-react';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { auth, firebaseReady } from '../firebase/client';

export default function CheckoutStatus() {
  const [status, setStatus] = useState('checking');
  const [message, setMessage] = useState('Waiting for verified webhook fulfillment…');

  useEffect(() => {
    if (!firebaseReady || !auth) { setStatus('unavailable'); setMessage('Firebase is not configured on this deployment.'); return undefined; }
    const sessionId = new URL(window.location.href).searchParams.get('session_id');
    if (!sessionId) { setStatus('error'); setMessage('The Checkout Session ID is missing.'); return undefined; }

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
            setStatus('fulfilled'); setMessage(`${payload.session.coins.toLocaleString()} Kani Coins were credited exactly once.`); return;
          }
          if (['failed', 'expired'].includes(payload.session.status)) { setStatus('error'); setMessage(`Checkout status: ${payload.session.status}.`); return; }
          if (attempts < 15) timer = window.setTimeout(check, 1500);
          else { setStatus('pending'); setMessage('Payment is recorded, but webhook fulfillment is still pending.'); }
        } catch (error) { setStatus('error'); setMessage(error.message); }
      };
      check();
    });
    return () => { cancelled = true; unsubscribe(); if (timer) window.clearTimeout(timer); };
  }, []);

  return <main className="grid min-h-[calc(100svh-56px)] place-items-center bg-[#120a05] p-6 text-stone-100"><section className="w-full max-w-xl rounded-3xl border border-amber-400/30 bg-stone-950/80 p-8 text-center shadow-2xl">{status === 'checking' ? <Loader2 className="mx-auto mb-5 animate-spin text-amber-300" size={48} /> : status === 'fulfilled' ? <CheckCircle2 className="mx-auto mb-5 text-emerald-300" size={52} /> : <ShieldAlert className="mx-auto mb-5 text-amber-300" size={52} />}<h1 className="text-3xl font-black">{status === 'fulfilled' ? 'Coins credited' : 'Checkout status'}</h1><p className="my-5 leading-7 text-stone-300">{message}</p><Link href="/shop" className="inline-block rounded-xl bg-amber-300 px-5 py-3 font-black text-stone-950">Return to Coin Shop</Link></section></main>;
}
