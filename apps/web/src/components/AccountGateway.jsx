"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  BadgeCheck,
  Check,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Users,
  WifiOff,
} from 'lucide-react';
import {
  EmailAuthProvider,
  createUserWithEmailAndPassword,
  linkWithCredential,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInAnonymously,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { auth, firebaseReady } from '../firebase/client';
import {
  FIRST_RUN_STORAGE_KEY,
  mergeFirstRunState,
  parseFirstRunState,
  safeInternalNextPath,
} from '../experience/first-run.mjs';

function authMessage(error) {
  const code = error?.code || '';
  if (code === 'auth/email-already-in-use' || code === 'auth/credential-already-in-use') {
    return 'That email already has a Kani account. Choose Sign in instead.';
  }
  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
    return 'The email or password is incorrect.';
  }
  if (code === 'auth/invalid-email') return 'Enter a valid email address.';
  if (code === 'auth/weak-password') return 'Use at least eight characters with a letter and a number.';
  if (code === 'auth/too-many-requests') return 'Too many attempts. Try again later.';
  return error?.message || 'Kani could not complete that account request.';
}

function markAccountCreated() {
  try {
    const current = parseFirstRunState(window.localStorage.getItem(FIRST_RUN_STORAGE_KEY));
    const next = mergeFirstRunState(current, { completed: true, accountCreated: true });
    window.localStorage.setItem(FIRST_RUN_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Local progress is optional; Firebase remains the account authority.
  }
}

export default function AccountGateway() {
  const searchParams = useSearchParams();
  const nextPath = useMemo(() => safeInternalNextPath(searchParams.get('next'), '/?hub=1'), [searchParams]);
  const [mode, setMode] = useState('create');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(firebaseReady);
  const [busy, setBusy] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
        setMessage(authMessage(error));
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const passwordChecks = {
    length: password.length >= 8,
    letter: /[A-Za-z]/.test(password),
    number: /\d/.test(password),
  };
  const passwordReady = Object.values(passwordChecks).every(Boolean);
  const isRegistered = Boolean(user && !user.isAnonymous);

  async function createAccount(event) {
    event.preventDefault();
    setMessage('');
    if (displayName.trim().length < 2) {
      setMessage('Enter a display name with at least two characters.');
      return;
    }
    if (!passwordReady) {
      setMessage('Use at least eight characters with a letter and a number.');
      return;
    }

    setBusy(true);
    try {
      const credential = EmailAuthProvider.credential(email.trim(), password);
      const result = auth.currentUser?.isAnonymous
        ? await linkWithCredential(auth.currentUser, credential)
        : await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(result.user, { displayName: displayName.trim() });
      markAccountCreated();
      window.location.assign(nextPath);
    } catch (error) {
      setMessage(authMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function signIn(event) {
    event.preventDefault();
    setMessage('');
    setBusy(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      markAccountCreated();
      window.location.assign(nextPath);
    } catch (error) {
      setMessage(authMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function resetPassword() {
    if (!email.trim()) {
      setMessage('Enter your email first, then request a reset.');
      return;
    }
    setBusy(true);
    setMessage('');
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setMessage('Password-reset instructions were sent if that address has an account.');
    } catch (error) {
      setMessage(authMessage(error));
    } finally {
      setBusy(false);
    }
  }

  if (!firebaseReady) {
    return (
      <main className="grid min-h-[calc(100svh-56px)] place-items-center bg-[radial-gradient(circle_at_top,#3d2818,#080706_70%)] p-5 text-stone-100">
        <section className="w-full max-w-3xl rounded-[2rem] border border-amber-400/30 bg-stone-950/85 p-8 shadow-2xl">
          <WifiOff className="text-amber-300" size={42} />
          <h1 className="mt-5 text-4xl font-black">Account services are staged, not exposed.</h1>
          <p className="mt-4 leading-7 text-stone-300">The account-creation and anonymous-to-registered upgrade flow is implemented, but this deployment has no Kani Firebase credentials. Local guest play remains available without an account.</p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link href={nextPath} className="flex min-h-[52px] flex-1 items-center justify-center rounded-xl bg-amber-300 px-5 font-black text-stone-950">Continue as guest</Link>
            <Link href="/" className="flex min-h-[52px] flex-1 items-center justify-center rounded-xl border border-white/15 px-5 font-black">Return to introduction</Link>
          </div>
        </section>
      </main>
    );
  }

  if (loading) {
    return <main className="grid min-h-[calc(100svh-56px)] place-items-center bg-[#080706] text-amber-300"><Loader2 className="animate-spin" size={44} /></main>;
  }

  if (isRegistered) {
    return (
      <main className="grid min-h-[calc(100svh-56px)] place-items-center bg-[radial-gradient(circle_at_top,#3d2818,#080706_70%)] p-5 text-stone-100">
        <section className="w-full max-w-xl rounded-[2rem] border border-emerald-400/30 bg-stone-950/85 p-8 text-center shadow-2xl">
          <BadgeCheck className="mx-auto text-emerald-300" size={52} />
          <h1 className="mt-5 text-4xl font-black">Your progress is protected.</h1>
          <p className="mt-4 text-stone-300">Signed in as <strong className="text-white">{user.displayName || user.email}</strong>.</p>
          <Link href={nextPath} className="mt-7 flex min-h-14 items-center justify-center gap-2 rounded-xl bg-amber-300 px-5 font-black text-stone-950">Continue to Kani <ArrowRight /></Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100svh-56px)] bg-[radial-gradient(circle_at_top,#3d2818,#080706_70%)] p-5 text-stone-100">
      <section className="mx-auto grid max-w-6xl gap-8 py-10 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="rounded-[2rem] border border-amber-400/25 bg-amber-300/[0.06] p-7 sm:p-9">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-amber-300">Free Kani account</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">Create it when the value is clear.</h1>
          <p className="mt-5 text-lg leading-8 text-stone-300">Local play stays free without an account. Create one for features that need persistent identity and secure server records.</p>
          <div className="mt-8 space-y-4">
            {[
              [Users, 'Online multiplayer', 'Create and join private rooms with a stable player identity.'],
              [Sparkles, 'Cross-device cosmetics', 'Keep owned themes and future capture animations with your profile.'],
              [ShieldCheck, 'Protected Kani Coins', 'Balances and purchases live in a server ledger—not browser storage.'],
              [LockKeyhole, 'No gameplay advantage', 'Accounts and purchases never change legal moves or piece strength.'],
            ].map(([Icon, title, copy]) => (
              <div key={title} className="flex gap-4 rounded-2xl border border-white/10 bg-black/20 p-4"><Icon className="mt-1 shrink-0 text-amber-300" size={21} /><div><h2 className="font-black">{title}</h2><p className="mt-1 text-sm leading-6 text-stone-400">{copy}</p></div></div>
            ))}
          </div>
          <Link href={nextPath} className="mt-7 inline-flex items-center gap-2 text-sm font-black text-stone-300 underline underline-offset-4 hover:text-white">Not now—continue as guest <ArrowRight size={16} /></Link>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-stone-950/90 p-6 shadow-2xl sm:p-9">
          <div className="grid grid-cols-2 rounded-xl bg-white/5 p-1">
            <button onClick={() => { setMode('create'); setMessage(''); }} className={`rounded-lg px-4 py-3 font-black ${mode === 'create' ? 'bg-amber-300 text-stone-950' : 'text-stone-300'}`}>Create account</button>
            <button onClick={() => { setMode('signin'); setMessage(''); }} className={`rounded-lg px-4 py-3 font-black ${mode === 'signin' ? 'bg-amber-300 text-stone-950' : 'text-stone-300'}`}>Sign in</button>
          </div>

          <form onSubmit={mode === 'create' ? createAccount : signIn} className="mt-7 space-y-5">
            {mode === 'create' && (
              <label className="block"><span className="mb-2 block text-sm font-black">Display name</span><input value={displayName} onChange={(event) => setDisplayName(event.target.value)} autoComplete="nickname" maxLength={40} required className="w-full rounded-xl border border-stone-700 bg-stone-900 px-4 py-3 text-white" placeholder="How players will know you" /></label>
            )}
            <label className="block"><span className="mb-2 block text-sm font-black">Email</span><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" size={18} /><input value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" type="email" required className="w-full rounded-xl border border-stone-700 bg-stone-900 py-3 pl-10 pr-4 text-white" placeholder="you@example.com" /></div></label>
            <label className="block"><span className="mb-2 block text-sm font-black">Password</span><div className="relative"><input value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === 'create' ? 'new-password' : 'current-password'} type={showPassword ? 'text' : 'password'} required className="w-full rounded-xl border border-stone-700 bg-stone-900 px-4 py-3 pr-12 text-white" /><button type="button" onClick={() => setShowPassword((visible) => !visible)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={19} /> : <Eye size={19} />}</button></div></label>

            {mode === 'create' && (
              <div className="grid gap-2 text-sm text-stone-400 sm:grid-cols-3">
                <span className={`flex items-center gap-2 ${passwordChecks.length ? 'text-emerald-300' : ''}`}><Check size={15} /> 8+ characters</span>
                <span className={`flex items-center gap-2 ${passwordChecks.letter ? 'text-emerald-300' : ''}`}><Check size={15} /> One letter</span>
                <span className={`flex items-center gap-2 ${passwordChecks.number ? 'text-emerald-300' : ''}`}><Check size={15} /> One number</span>
              </div>
            )}

            {message && <p className="rounded-xl border border-blue-400/30 bg-blue-950/40 p-3 text-sm leading-6 text-blue-100" aria-live="polite">{message}</p>}

            <button type="submit" disabled={busy || (mode === 'create' && !passwordReady)} className="flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-amber-300 px-5 font-black text-stone-950 disabled:cursor-not-allowed disabled:opacity-40">{busy ? <Loader2 className="animate-spin" /> : mode === 'create' ? <UserPlus /> : <LockKeyhole />} {mode === 'create' ? 'Create free account' : 'Sign in securely'}</button>
            {mode === 'signin' && <button type="button" onClick={resetPassword} disabled={busy} className="w-full text-sm font-bold text-stone-400 underline underline-offset-4 hover:text-white">Forgot password?</button>}
          </form>
          <p className="mt-6 text-xs leading-5 text-stone-500">Kani does not ask for payment information during account creation. Marketing consent is not bundled into this decision.</p>
        </div>
      </section>
    </main>
  );
}
