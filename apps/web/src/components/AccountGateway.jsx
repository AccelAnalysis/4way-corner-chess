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
      <main className="grid min-h-[calc(100svh-56px)] place-items-center bg-[#f7f0e5] px-5 text-[#32281f]">
        <section className="w-full max-w-md text-center">
          <h1 className="text-4xl">Accounts unavailable</h1>
          <Link href="/?hub=1" className="kani-action mt-7">Play locally <ArrowRight size={18}/></Link>
        </section>
      </main>
    );
  }

  if (loading) return <main className="grid min-h-[60svh] place-items-center"><Loader2 className="animate-spin text-amber-300" size={34}/></main>;

  if (isRegistered) {
    return (
      <main className="grid min-h-[calc(100svh-56px)] place-items-center bg-[#f7f0e5] px-5 text-[#32281f]">
        <section className="w-full max-w-md text-center">
          <BadgeCheck className="mx-auto text-amber-300" size={43}/>
          <h1 className="mt-5 text-4xl">Signed in</h1>
          <p className="mt-3 text-stone-700">{user.displayName || user.email}</p>
          <Link href={nextPath} className="kani-action mt-7">Play <ArrowRight size={19}/></Link>
        </section>
      </main>
    );
  }

  return (
    <main className="grid min-h-[calc(100svh-56px)] place-items-center bg-[#f7f0e5] px-5 py-12 text-[#32281f]">
      <section className="w-full max-w-md">
        <h1 className="mb-7 text-4xl sm:text-5xl">{mode === 'create' ? 'Join KANI' : 'Welcome back'}</h1>
        <div className="flex border-b border-[#cdb99a] text-sm">
          <button onClick={() => { setMode('create'); setMessage(''); }}
            aria-current={mode === 'create' ? 'page' : undefined}
            className={`flex-1 border-b-2 px-3 py-3 ${mode === 'create' ? 'border-amber-300 text-[#87501b]' : 'border-transparent text-stone-600'}`}>Create account</button>
          <button onClick={() => { setMode('signin'); setMessage(''); }}
            aria-current={mode === 'signin' ? 'page' : undefined}
            className={`flex-1 border-b-2 px-3 py-3 ${mode === 'signin' ? 'border-amber-300 text-[#87501b]' : 'border-transparent text-stone-600'}`}>Sign in</button>
        </div>
        <form onSubmit={mode === 'create' ? createAccount : signIn} className="mt-7 space-y-5">
          {mode === 'create' && (
            <label className="block text-sm">Display name
              <input value={displayName} onChange={(event) => setDisplayName(event.target.value)}
                autoComplete="nickname" maxLength={40} required placeholder="Your player name"
                className="mt-2 w-full rounded-md border border-[#cdb99a] bg-white px-4 py-3 text-[#2f251c]"/>
            </label>
          )}
          <label className="block text-sm">Email
            <input value={email} onChange={(event) => setEmail(event.target.value)}
              autoComplete="email" type="email" required placeholder="you@example.com"
              className="mt-2 w-full rounded-md border border-[#cdb99a] bg-white px-4 py-3 text-[#2f251c]"/>
          </label>
          <label className="block text-sm">Password
            <div className="relative mt-2">
              <input value={password} onChange={(event) => setPassword(event.target.value)}
                autoComplete={mode === 'create' ? 'new-password' : 'current-password'}
                type={showPassword ? 'text' : 'password'} required
                className="w-full rounded-md border border-[#cdb99a] bg-white px-4 py-3 pr-12 text-[#2f251c]"/>
              <button type="button" onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-700"
                aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <EyeOff size={20}/> : <Eye size={20}/>}
              </button>
            </div>
          </label>
          {mode === 'create' && <p className="text-sm text-stone-600" id="password-help">8+ characters, including a letter and number.</p>}
          {message && <p role="status" className="text-sm text-[#87501b]">{message}</p>}
          <button type="submit" disabled={busy || (mode === 'create' && !passwordReady)}
            className="kani-action w-full">{busy ? <Loader2 size={19} className="animate-spin"/> : null}{mode === 'create' ? 'Create account' : 'Sign in'}</button>
          {mode === 'signin' && <button type="button" onClick={resetPassword} disabled={busy}
            className="w-full text-sm text-stone-700 underline underline-offset-4 hover:text-[#2f251c]">Forgot password?</button>}
        </form>
        <Link href={nextPath} className="mt-7 inline-block text-sm text-[#58432e] underline underline-offset-4 hover:text-[#2f251c]">Continue as guest</Link>
      </section>
    </main>
  );
}
