"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Gamepad2, Loader2, ShieldCheck, UserPlus, Users } from 'lucide-react';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { auth, firebaseReady } from '../firebase/client';
import OnlineArena from './OnlineArena';

export default function RegisteredOnlineExperience() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(firebaseReady);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!firebaseReady || !auth) return undefined;
    let cancelled = false;
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      if (cancelled) return;
      if (nextUser) {
        setUser(nextUser);
        setLoading(false);
        return;
      }
      try {
        await signInAnonymously(auth);
      } catch (error) {
        setMessage(error?.message || 'Firebase sign-in is unavailable.');
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  if (!firebaseReady) return <OnlineArena />;

  if (loading) {
    return <main className="grid min-h-[calc(100svh-56px)] place-items-center bg-[#080706] text-amber-300"><Loader2 className="animate-spin" size={44} /></main>;
  }

  if (!user || user.isAnonymous) {
    return (
      <main className="grid min-h-[calc(100svh-56px)] place-items-center bg-[#100e0c] p-6 text-stone-100">
        <section className="w-full max-w-lg text-center">
          <Users className="mx-auto text-amber-200" size={56} strokeWidth={1.3}/>
          <h1 className="mt-6 text-4xl sm:text-5xl">Play together.</h1>
          <p className="mt-3 text-stone-300">Sign in to join online matches.</p>
          {message && <p role="status" className="mt-4 text-sm text-amber-200">{message}</p>}
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/account?next=%2Fonline&source=online-gate" className="kani-action">Sign in <ArrowRight size={18}/></Link>
            <Link href="/?hub=1" className="kani-link text-sm">Play locally</Link>
          </div>
        </section>
      </main>
    );
  }

  return <OnlineArena />;
}
