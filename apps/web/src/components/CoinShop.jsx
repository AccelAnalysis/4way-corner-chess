"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BadgeCheck,
  CheckCircle2,
  Coins,
  CreditCard,
  Eye,
  Loader2,
  LockKeyhole,
  Palette,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  UserPlus,
  WifiOff,
  X,
} from 'lucide-react';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { auth, firebaseReady } from '../firebase/client';
import { COIN_PACKS, SHOP_ITEMS, formatUsd } from '../shop/catalog';

function statusMessage(user, profile) {
  if (!firebaseReady) return 'Secure commerce is not activated on this deployment. The fixed cosmetic catalog remains visible for review.';
  if (!user) return 'Checking your Kani account…';
  if (user.isAnonymous) return 'Browse freely. Create a free account only when you want to save cosmetics or start a test checkout.';
  if (!profile) return 'Loading your protected Kani balance and inventory…';
  return `Signed in as ${user.displayName || user.email}. Purchases are recorded in your server ledger.`;
}

export default function CoinShop() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!firebaseReady || !auth) return undefined;
    return onAuthStateChanged(auth, async (nextUser) => {
      if (!nextUser) {
        try {
          await signInAnonymously(auth);
        } catch (error) {
          setMessage(error?.message || 'Firebase sign-in is unavailable.');
        }
        return;
      }

      setUser(nextUser);
      if (nextUser.isAnonymous) {
        setProfile(null);
        return;
      }

      try {
        const token = await nextUser.getIdToken();
        const response = await fetch('/api/profile', {
          headers: { authorization: `Bearer ${token}` },
          cache: 'no-store',
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error?.message || 'Profile request failed.');
        setProfile(payload.profile);
      } catch (error) {
        setMessage(error.message);
      }
    });
  }, []);

  async function post(path, body) {
    if (!user || user.isAnonymous) throw new Error('Create a free account before using the secure shop.');
    const token = await user.getIdToken();
    const response = await fetch(path, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.ok === false) throw new Error(payload.error?.message || 'The request failed.');
    return payload;
  }

  async function buyPack(packId) {
    setBusy(`pack:${packId}`);
    setMessage('');
    try {
      const payload = await post('/api/stripe/checkout', { packId, checkoutId: crypto.randomUUID() });
      window.location.assign(payload.checkoutUrl);
    } catch (error) {
      setMessage(error.message);
      setBusy('');
    }
  }

  async function equipItem(itemId) {
    setBusy(`equip:${itemId}`);
    setMessage('');
    try {
      const payload = await post('/api/shop/equip', { itemId });
      setProfile(payload.profile);
      setMessage(`${payload.item.name} is equipped across your Kani profile.`);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy('');
    }
  }

  async function buyItem(itemId) {
    setBusy(itemId);
    setMessage('');
    try {
      const payload = await post('/api/shop/purchase', { itemId, purchaseId: crypto.randomUUID() });
      setProfile(payload.profile);
      setMessage(`${payload.item.name} is now in your inventory.`);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy('');
    }
  }

  const registered = Boolean(user && !user.isAnonymous);
  const inventory = profile?.inventory || [];
  const commerceReady = firebaseReady && registered && profile;

  return (
    <main className="min-h-[calc(100svh-56px)] bg-[radial-gradient(circle_at_top,#3e2723,#120a05_65%)] p-5 text-stone-100">
      <section className="mx-auto max-w-6xl py-8">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-[0.25em] text-amber-300">Cosmetics only · Fixed prices · No loot boxes</p>
            <h1 className="text-4xl font-black sm:text-5xl">Kani Coin Shop</h1>
            <p className="mt-3 max-w-3xl text-lg leading-8 text-stone-300">Browse before creating an account. Kani Coins unlock visual expression only: themes, piece skins, capture animations, board skins, victory banners, profile frames, and sound packs.</p>
          </div>
          <div className="rounded-2xl border border-amber-400/30 bg-stone-950/80 px-5 py-4 text-right">
            <p className="text-xs font-black uppercase tracking-widest text-stone-400">Server balance</p>
            <p className="flex items-center gap-2 text-3xl font-black text-amber-300"><Coins /> {profile?.coinBalance ?? '—'}</p>
          </div>
        </div>

        <div className={`mb-6 flex flex-col gap-4 rounded-2xl border p-5 sm:flex-row sm:items-center sm:justify-between ${registered ? 'border-emerald-400/25 bg-emerald-950/20' : 'border-blue-400/25 bg-blue-950/20'}`}>
          <div className="flex gap-3">
            {firebaseReady ? registered ? <BadgeCheck className="shrink-0 text-emerald-300" /> : <Eye className="shrink-0 text-blue-300" /> : <WifiOff className="shrink-0 text-amber-300" />}
            <div><h2 className="font-black">{firebaseReady ? registered ? 'Protected account shop' : 'Browse mode' : 'Catalog preview'}</h2><p className="mt-1 text-sm leading-6 text-stone-300">{statusMessage(user, profile)}</p></div>
          </div>
          {firebaseReady && !registered && <Link href="/account?next=%2Fshop&source=shop-gate" className="flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-500 px-4 font-black text-white"><UserPlus size={18} /> Create free account</Link>}
        </div>

        {message && <div className="mb-5 rounded-xl border border-blue-400/30 bg-blue-950/50 p-4 text-blue-100" aria-live="polite">{message}</div>}

        <div className="mb-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Object.values(COIN_PACKS).map((pack) => (
            <article key={pack.id} className="relative flex flex-col rounded-3xl border border-amber-400/25 bg-stone-950/80 p-5 shadow-2xl">
              {pack.badge && <span className="absolute right-3 top-3 rounded-full border border-amber-300/40 bg-amber-300/10 px-2 py-1 text-[10px] font-black uppercase text-amber-200">{pack.badge}</span>}
              <CreditCard className="mb-5 text-amber-300" size={30} />
              <h2 className="text-xl font-black">{pack.name}</h2>
              <p className="mt-1 text-3xl font-black text-amber-300">{pack.coins.toLocaleString()} <span className="text-sm">coins</span></p>
              <p className="my-4 flex-1 text-sm leading-6 text-stone-400">{pack.description}</p>
              {!firebaseReady ? (
                <button disabled className="flex items-center justify-center gap-2 rounded-xl border border-stone-700 px-4 py-3 font-black text-stone-500"><LockKeyhole size={18} /> {formatUsd(pack.priceCents)} preview</button>
              ) : !registered ? (
                <Link href="/account?next=%2Fshop&source=coin-pack" className="flex items-center justify-center gap-2 rounded-xl bg-amber-300 px-4 py-3 font-black text-stone-950"><UserPlus size={18} /> Account to buy · {formatUsd(pack.priceCents)}</Link>
              ) : (
                <button onClick={() => buyPack(pack.id)} disabled={!commerceReady || Boolean(busy)} className="flex items-center justify-center gap-2 rounded-xl bg-amber-300 px-4 py-3 font-black text-stone-950 disabled:opacity-40">{busy === `pack:${pack.id}` ? <Loader2 className="animate-spin" /> : <LockKeyhole size={18} />} {formatUsd(pack.priceCents)} test checkout</button>
              )}
            </article>
          ))}
        </div>

        <div className="rounded-3xl border border-stone-700 bg-stone-950/75 p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h2 className="flex items-center gap-2 text-2xl font-black"><ShoppingBag className="text-emerald-300" /> Cosmetic collection</h2><span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-black uppercase tracking-widest text-emerald-200">No gameplay stats</span></div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Object.values(SHOP_ITEMS).map((item) => {
              const owned = inventory.includes(item.id);
              const equipped = profile?.equippedTheme === item.id;
              return (
                <article key={item.id} className="flex items-center justify-between gap-4 rounded-2xl border border-stone-700 bg-white/5 p-4">
                  <div className="flex items-center gap-3"><Palette className="text-stone-400" size={20} /><div><h3 className="font-black">{item.name}</h3><p className="text-xs uppercase tracking-widest text-stone-400">{item.kind.replaceAll('_', ' ')}</p></div></div>
                  {!registered || !firebaseReady ? <span className="text-xs font-black text-stone-400">{item.priceCoins === 0 ? 'Included' : `${item.priceCoins} coins`}</span> : owned ? equipped ? <span className="flex items-center gap-1 text-xs font-black text-amber-300"><CheckCircle2 size={16} /> Equipped</span> : <button onClick={() => equipItem(item.id)} disabled={!commerceReady || Boolean(busy)} className="rounded-lg border border-amber-300/50 px-3 py-2 text-sm font-black text-amber-200 disabled:opacity-40">{busy === `equip:${item.id}` ? 'Equipping…' : 'Equip'}</button> : <button onClick={() => buyItem(item.id)} disabled={!commerceReady || Boolean(busy)} className="rounded-lg bg-emerald-400 px-3 py-2 text-sm font-black text-stone-950 disabled:opacity-40">{busy === item.id ? 'Buying…' : `${item.priceCoins} coins`}</button>}
                </article>
              );
            })}
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <article className="rounded-3xl border border-emerald-400/25 bg-emerald-950/20 p-6"><ShieldCheck className="text-emerald-300" size={30} /><h2 className="mt-4 text-xl font-black">What purchases can change</h2><p className="mt-3 leading-7 text-stone-300">Appearance, animation, sound, profile presentation, celebration, and other noncompetitive expression.</p></article>
          <article className="rounded-3xl border border-red-400/20 bg-red-950/15 p-6"><X className="text-red-300" size={30} /><h2 className="mt-4 text-xl font-black">What purchases can never change</h2><p className="mt-3 leading-7 text-stone-300">Legal moves, piece strength, turn order, clock duration, matchmaking priority, rating outcomes, undo rights, or chances of winning.</p></article>
        </div>

        <p className="mt-7 text-center text-xs leading-6 text-stone-500"><Sparkles className="mr-1 inline" size={14} /> Pack contents and prices are shown before checkout. The alpha uses Stripe test mode and stores no card details in Kani.</p>
      </section>
    </main>
  );
}
