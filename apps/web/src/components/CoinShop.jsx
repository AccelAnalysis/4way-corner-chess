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

  // Do not advertise virtual currency packs while the store is still test-only.
  // Operational details and fairness rules are enforced by the server, not marketed in the UI.
  const showCoinPacks = process.env.NEXT_PUBLIC_KANI_COIN_PACKS_LIVE === 'true';

  return (
    <main className="min-h-[calc(100svh-56px)] bg-[#f7f0e5] px-5 py-10 text-[#32281f]">
      <section className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between gap-5 border-b border-[#cdb99a] pb-6">
          <h1 className="text-4xl sm:text-5xl">Shop</h1>
          <div className="flex items-center gap-2 text-xl text-[#845121]" aria-label="Kani Coin balance">
            <Coins size={21} aria-hidden="true" /> {registered ? profile?.coinBalance ?? '—' : '—'}
          </div>
        </div>
        {message && <p className="mt-5 text-sm text-[#845121]" role="status">{message}</p>}
        {firebaseReady && !registered && (
          <div className="mt-5 text-sm">
            <Link href="/account?next=%2Fshop&source=shop-gate" className="kani-link">Sign in to save your collection</Link>
          </div>
        )}
        <section className="mt-9">
          <h2 className="text-2xl">Boards</h2>
          <div className="mt-5 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-5">
            {Object.values(SHOP_ITEMS).map((item) => {
              const owned = inventory.includes(item.id);
              const equipped = profile?.equippedTheme === item.id;
              const boardStyle = item.id === 'theme:neon'
                ? 'linear-gradient(45deg,#17132a 25%,#3c2558 25%,#3c2558 50%,#17132a 50%,#17132a 75%,#3c2558 75%)'
                : item.id === 'theme:minimal'
                ? 'linear-gradient(45deg,#e1e0d9 25%,#f4f1e8 25%,#f4f1e8 50%,#e1e0d9 50%,#e1e0d9 75%,#f4f1e8 75%)'
                : item.id === 'theme:tribal'
                ? 'linear-gradient(45deg,#704128 25%,#d9b382 25%,#d9b382 50%,#704128 50%,#704128 75%,#d9b382 75%)'
                : item.id === 'theme:medieval'
                ? 'linear-gradient(45deg,#634328 25%,#d2b48c 25%,#d2b48c 50%,#634328 50%,#634328 75%,#d2b48c 75%)'
                : 'linear-gradient(45deg,#8c9caf 25%,#e5eaf1 25%,#e5eaf1 50%,#8c9caf 50%,#8c9caf 75%,#e5eaf1 75%)';
              return (
                <article key={item.id} className="min-w-0">
                  <div className="relative aspect-square overflow-hidden rounded-md border border-[#cdb99a] bg-[#fffbf3]">
                    <div className="absolute inset-3 shadow-inner" style={{ background: boardStyle, backgroundSize: '42% 42%' }} aria-hidden="true"/>
                    <span className="absolute inset-0 grid place-items-center text-6xl text-amber-100 drop-shadow-xl" aria-hidden="true">♚</span>
                  </div>
                  <div className="mt-3 flex items-start justify-between gap-2">
                    <h3 className="text-base">{item.name}</h3>
                    {equipped && <CheckCircle2 size={19} className="shrink-0 text-[#845121]" aria-label="Equipped"/>}
                  </div>
                  <div className="mt-2 text-sm">
                    {!firebaseReady ? (
                      <span className="text-stone-600">Coming soon</span>
                    ) : !registered ? (
                      <Link href="/account?next=%2Fshop" className="kani-link text-[#845121]">{item.priceCoins ? item.priceCoins + ' coins' : 'Free'}</Link>
                    ) : equipped ? (
                      <span className="text-stone-600">In use</span>
                    ) : owned ? (
                      <button onClick={() => equipItem(item.id)} disabled={!commerceReady || Boolean(busy)} className="kani-link text-[#845121]">
                        {busy === `equip:${item.id}` ? 'Equipping…' : 'Equip'}
                      </button>
                    ) : (
                      <button onClick={() => buyItem(item.id)} disabled={!commerceReady || Boolean(busy)} className="kani-link text-[#845121]">
                        {busy === item.id ? 'Adding…' : `${item.priceCoins} coins`}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {showCoinPacks && (
          <section className="mt-12 border-t border-[#cdb99a] pt-8">
            <h2 className="text-2xl">Kani Coins</h2>
            <div className="mt-5 divide-y divide-white/10">
              {Object.values(COIN_PACKS).map((pack) => (
                <div key={pack.id} className="flex items-center justify-between gap-4 py-4">
                  <div><h3 className="text-base">{pack.name}</h3>
                    <span className="text-sm text-stone-600">{pack.coins.toLocaleString()} coins</span>
                  </div>
                  {commerceReady ? (
                    <button onClick={() => buyPack(pack.id)} disabled={Boolean(busy)} className="kani-action">
                      {formatUsd(pack.priceCents)}
                    </button>
                  ) : (
                    <span className="text-stone-600">{formatUsd(pack.priceCents)}</span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
