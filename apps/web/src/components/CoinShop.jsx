"use client";

import { useEffect, useState } from 'react';
import { CheckCircle2, Coins, CreditCard, Loader2, LockKeyhole, ShieldCheck, ShoppingBag, WifiOff } from 'lucide-react';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { auth, firebaseReady } from '../firebase/client';
import { COIN_PACKS, SHOP_ITEMS, formatUsd } from '../shop/catalog';

export default function CoinShop() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!firebaseReady || !auth) return undefined;
    return onAuthStateChanged(auth, async (nextUser) => {
      if (nextUser) {
        setUser(nextUser);
        try {
          const token = await nextUser.getIdToken();
          const response = await fetch('/api/profile', { headers: { authorization: `Bearer ${token}` } });
          const payload = await response.json();
          if (!response.ok) throw new Error(payload.error?.message || 'Profile request failed.');
          setProfile(payload.profile);
        } catch (error) {
          setMessage(error.message);
        }
      } else {
        signInAnonymously(auth).catch((error) => setMessage(error.message));
      }
    });
  }, []);

  async function post(path, body) {
    if (!user) throw new Error('Sign-in is still loading.');
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
    setBusy(`pack:${packId}`); setMessage('');
    try {
      const payload = await post('/api/stripe/checkout', { packId, checkoutId: crypto.randomUUID() });
      window.location.assign(payload.checkoutUrl);
    } catch (error) {
      setMessage(error.message);
      setBusy('');
    }
  }

  async function equipItem(itemId) {
    setBusy(`equip:${itemId}`); setMessage('');
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
    setBusy(itemId); setMessage('');
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

  if (!firebaseReady) {
    return (
      <main className="min-h-[calc(100svh-56px)] bg-[#120a05] p-6 text-stone-100">
        <section className="mx-auto max-w-3xl rounded-3xl border border-amber-400/30 bg-stone-950/80 p-8 shadow-2xl">
          <div className="mb-5 flex items-center gap-3 text-amber-300"><WifiOff size={30} /><h1 className="text-3xl font-black">Secure coin shop is staged</h1></div>
          <p className="leading-7 text-stone-300">The checkout route, test-key lock, webhook verification, idempotent fulfillment, Firestore balance, append-only ledger, and server-controlled cosmetic purchases are deployed. The current Vercel environment contains no Kani Firebase or Stripe test credentials, so checkout remains safely disabled.</p>
          <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-950/20 p-5 text-sm text-emerald-100"><ShieldCheck className="mb-2" /> A live Stripe secret key is explicitly rejected unless the safety lock is deliberately removed.</div>
        </section>
      </main>
    );
  }

  const inventory = profile?.inventory || [];
  return (
    <main className="min-h-[calc(100svh-56px)] bg-[radial-gradient(circle_at_top,#3e2723,#120a05_65%)] p-5 text-stone-100">
      <section className="mx-auto max-w-6xl py-8">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div><p className="mb-2 text-xs font-black uppercase tracking-[0.25em] text-amber-300">Cosmetics only · Test checkout</p><h1 className="text-4xl font-black">Kani Coin Shop</h1><p className="mt-2 max-w-2xl text-stone-300">Kani Coins unlock visual themes and effects. They never buy stronger pieces, extra moves, or competitive advantages.</p></div>
          <div className="rounded-2xl border border-amber-400/30 bg-stone-950/80 px-5 py-4 text-right"><p className="text-xs font-black uppercase tracking-widest text-stone-400">Server balance</p><p className="flex items-center gap-2 text-3xl font-black text-amber-300"><Coins /> {profile?.coinBalance ?? '—'}</p></div>
        </div>
        {message && <div className="mb-5 rounded-xl border border-blue-400/30 bg-blue-950/50 p-4 text-blue-100">{message}</div>}
        <div className="mb-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Object.values(COIN_PACKS).map((pack) => (
            <article key={pack.id} className="relative flex flex-col rounded-3xl border border-amber-400/25 bg-stone-950/80 p-5 shadow-2xl">
              {pack.badge && <span className="absolute right-3 top-3 rounded-full bg-amber-300 px-2 py-1 text-[10px] font-black uppercase text-stone-950">{pack.badge}</span>}
              <CreditCard className="mb-5 text-amber-300" size={30} /><h2 className="text-xl font-black">{pack.name}</h2><p className="mt-1 text-3xl font-black text-amber-300">{pack.coins.toLocaleString()} <span className="text-sm">coins</span></p><p className="my-4 flex-1 text-sm leading-6 text-stone-400">{pack.description}</p>
              <button onClick={() => buyPack(pack.id)} disabled={!profile || Boolean(busy)} className="flex items-center justify-center gap-2 rounded-xl bg-amber-300 px-4 py-3 font-black text-stone-950 disabled:opacity-40">{busy === `pack:${pack.id}` ? <Loader2 className="animate-spin" /> : <LockKeyhole size={18} />} {formatUsd(pack.priceCents)} test checkout</button>
            </article>
          ))}
        </div>
        <div className="rounded-3xl border border-stone-700 bg-stone-950/75 p-6">
          <h2 className="mb-5 flex items-center gap-2 text-2xl font-black"><ShoppingBag className="text-emerald-300" /> Cosmetic inventory</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Object.values(SHOP_ITEMS).map((item) => {
              const owned = inventory.includes(item.id);
              const equipped = profile?.equippedTheme === item.id;
              return <article key={item.id} className="flex items-center justify-between gap-4 rounded-2xl border border-stone-700 bg-white/5 p-4"><div><h3 className="font-black">{item.name}</h3><p className="text-xs uppercase tracking-widest text-stone-400">{item.kind}</p></div>{owned ? (equipped ? <span className="flex items-center gap-1 text-xs font-black text-amber-300"><CheckCircle2 size={16} /> Equipped</span> : <button onClick={() => equipItem(item.id)} disabled={!profile || Boolean(busy)} className="rounded-lg border border-amber-300/50 px-3 py-2 text-sm font-black text-amber-200 disabled:opacity-40">{busy === `equip:${item.id}` ? 'Equipping…' : 'Equip'}</button>) : <button onClick={() => buyItem(item.id)} disabled={!profile || Boolean(busy)} className="rounded-lg bg-emerald-400 px-3 py-2 text-sm font-black text-stone-950 disabled:opacity-40">{busy === item.id ? 'Buying…' : `${item.priceCoins} coins`}</button>}</article>;
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
