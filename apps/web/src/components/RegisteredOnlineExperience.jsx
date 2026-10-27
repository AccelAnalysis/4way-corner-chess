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
      <main className="grid min-h-[calc(100svh-56px)] place-items-center bg-[radial-gradient(circle_at_top,#31251d,#080706_70%)] p-5 text-stone-100">
        <section className="w-full max-w-4xl rounded-[2rem] border border-blue-400/25 bg-stone-950/85 p-7 shadow-2xl sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr]">
            <div className="grid min-h-64 place-items-center rounded-3xl border border-blue-400/20 bg-blue-950/20">
              <div className="text-center"><Users className="mx-auto text-blue-300" size={64} /><p className="mt-4 text-sm font-black uppercase tracking-[0.25em] text-blue-200">Online unlocked</p></div>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-300">Persistent identity required</p>
              <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Create a free account before entering online rooms.</h1>
              <p className="mt-5 text-lg leading-8 text-stone-300">Online play needs a stable identity for seat ownership, reconnects, moderation, match records, and protected server state. Local Kani remains available without an account.</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"><ShieldCheck className="text-emerald-300" /><h2 className="mt-3 font-black">Server-validated moves</h2><p className="mt-1 text-sm leading-6 text-stone-400">No browser can freely overwrite the board.</p></div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"><Gamepad2 className="text-amber-300" /><h2 className="mt-3 font-black">Guest play remains</h2><p className="mt-1 text-sm leading-6 text-stone-400">Keep playing local matches without registering.</p></div>
              </div>
              {message && <p className="mt-5 rounded-xl border border-red-400/30 bg-red-950/40 p-3 text-red-100">{message}</p>}
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link href="/account?next=%2Fonline&source=online-gate" className="flex min-h-14 flex-1 items-center justify-center gap-2 rounded-xl bg-blue-500 px-5 font-black text-white"><UserPlus /> Create free account</Link>
                <Link href="/?hub=1" className="flex min-h-14 flex-1 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 font-black text-white">Play locally <ArrowRight /></Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return <OnlineArena />;
}
