import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { randomUUID } from 'node:crypto';
import { ApiError } from './http';
import {
  DEFAULT_INVENTORY,
  WELCOME_COIN_GRANT,
  getCoinPack,
  getShopItem,
} from '../shop/catalog';

function profileSnapshot(uid, data) {
  return {
    uid,
    displayName: data.displayName || 'Kani Guest',
    coinBalance: Number(data.coinBalance || 0),
    inventory: Array.isArray(data.inventory) ? data.inventory : [...DEFAULT_INVENTORY],
    equippedTheme: data.equippedTheme || 'theme:medieval',
    elo: data.elo || { ffa: 1200, teams: 1200, blitz: 1200 },
    accountType: data.accountType || 'anonymous',
    createdAt: data.createdAt?.toMillis?.() || null,
    updatedAt: data.updatedAt?.toMillis?.() || null,
  };
}

export async function ensureUserProfile(db, claims) {
  const userRef = db.collection('users').doc(claims.uid);
  const welcomeLedgerRef = userRef.collection('coinLedger').doc('welcome');

  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(userRef);
    if (snapshot.exists) return;

    const now = Timestamp.now();
    transaction.create(userRef, {
      displayName: claims.name || claims.email?.split('@')[0] || `Guest ${claims.uid.slice(0, 6)}`,
      coinBalance: WELCOME_COIN_GRANT,
      inventory: [...DEFAULT_INVENTORY],
      equippedTheme: 'theme:medieval',
      elo: { ffa: 1200, teams: 1200, blitz: 1200 },
      accountType: claims.isAnonymous ? 'anonymous' : 'registered',
      createdAt: now,
      updatedAt: now,
    });
    transaction.create(welcomeLedgerRef, {
      delta: WELCOME_COIN_GRANT,
      balanceAfter: WELCOME_COIN_GRANT,
      reason: 'welcome_grant',
      source: 'system',
      createdAt: now,
    });
  });

  const snapshot = await userRef.get();
  return profileSnapshot(claims.uid, snapshot.data());
}

export async function getUserProfile(db, claims) {
  return ensureUserProfile(db, claims);
}

export async function purchaseShopItem(db, claims, itemId, purchaseId) {
  const item = getShopItem(itemId);
  if (!item) throw new ApiError(404, 'ITEM_NOT_FOUND', 'That shop item does not exist.');
  const normalizedPurchaseId = String(purchaseId || randomUUID()).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80);
  if (!normalizedPurchaseId) throw new ApiError(400, 'INVALID_PURCHASE_ID', 'A valid purchase identifier is required.');

  const userRef = db.collection('users').doc(claims.uid);
  const ledgerRef = userRef.collection('coinLedger').doc(`shop_${normalizedPurchaseId}`);
  let result = null;

  await db.runTransaction(async (transaction) => {
    const [userSnapshot, ledgerSnapshot] = await Promise.all([
      transaction.get(userRef),
      transaction.get(ledgerRef),
    ]);

    if (!userSnapshot.exists) {
      throw new ApiError(409, 'PROFILE_NOT_READY', 'Create the Kani profile before making a shop purchase.');
    }
    if (ledgerSnapshot.exists) {
      result = profileSnapshot(claims.uid, userSnapshot.data());
      return;
    }

    const data = userSnapshot.data();
    const inventory = Array.isArray(data.inventory) ? data.inventory : [];
    if (inventory.includes(item.id)) {
      result = profileSnapshot(claims.uid, data);
      return;
    }

    const balance = Number(data.coinBalance || 0);
    if (balance < item.priceCoins) {
      throw new ApiError(409, 'INSUFFICIENT_COINS', 'Not enough Kani Coins for this item.');
    }

    const balanceAfter = balance - item.priceCoins;
    const updatedInventory = [...inventory, item.id];
    const now = Timestamp.now();
    transaction.update(userRef, {
      coinBalance: balanceAfter,
      inventory: updatedInventory,
      updatedAt: now,
    });
    transaction.create(ledgerRef, {
      delta: -item.priceCoins,
      balanceAfter,
      reason: 'shop_purchase',
      source: 'kani_shop',
      itemId: item.id,
      purchaseId: normalizedPurchaseId,
      createdAt: now,
    });
    result = profileSnapshot(claims.uid, { ...data, coinBalance: balanceAfter, inventory: updatedInventory, updatedAt: now });
  });

  return { item, profile: result };
}

export async function equipShopItem(db, claims, itemId) {
  const item = getShopItem(itemId);
  if (!item) throw new ApiError(404, 'ITEM_NOT_FOUND', 'That shop item does not exist.');
  if (item.kind !== 'theme') throw new ApiError(400, 'ITEM_NOT_EQUIPPABLE', 'That item cannot be equipped as a theme.');

  const userRef = db.collection('users').doc(claims.uid);
  let result = null;
  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(userRef);
    if (!snapshot.exists) throw new ApiError(409, 'PROFILE_NOT_READY', 'Create the Kani profile before equipping an item.');
    const data = snapshot.data();
    const inventory = Array.isArray(data.inventory) ? data.inventory : [];
    if (!inventory.includes(item.id)) throw new ApiError(403, 'ITEM_NOT_OWNED', 'Purchase this item before equipping it.');
    const now = Timestamp.now();
    transaction.update(userRef, { equippedTheme: item.id, updatedAt: now });
    result = profileSnapshot(claims.uid, { ...data, equippedTheme: item.id, updatedAt: now });
  });
  return { item, profile: result };
}

export async function recordPendingCheckout(db, claims, session, pack) {
  const checkoutRef = db.collection('stripeCheckoutSessions').doc(session.id);
  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(checkoutRef);
    if (snapshot.exists && snapshot.data().status === 'fulfilled') return;
    transaction.set(checkoutRef, {
      uid: claims.uid,
      packId: pack.id,
      coins: pack.coins,
      expectedAmount: pack.priceCents,
      currency: 'usd',
      status: 'pending',
      stripeSessionId: session.id,
      createdAt: snapshot.exists ? snapshot.data().createdAt : FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
  });
}

export async function fulfillStripeCheckout(db, session) {
  const pack = getCoinPack(session.metadata?.packId);
  const uid = session.metadata?.uid || session.client_reference_id;
  if (!pack || !uid) throw new Error('Stripe session metadata is incomplete.');
  if (session.currency !== 'usd' || Number(session.amount_total) !== pack.priceCents) {
    throw new Error('Stripe session amount does not match the Kani pack catalog.');
  }

  const checkoutRef = db.collection('stripeCheckoutSessions').doc(session.id);
  const userRef = db.collection('users').doc(uid);
  const ledgerRef = userRef.collection('coinLedger').doc(`stripe_${session.id}`);

  await db.runTransaction(async (transaction) => {
    const [checkoutSnapshot, userSnapshot, ledgerSnapshot] = await Promise.all([
      transaction.get(checkoutRef),
      transaction.get(userRef),
      transaction.get(ledgerRef),
    ]);

    if (checkoutSnapshot.exists && checkoutSnapshot.data().status === 'fulfilled') return;
    if (ledgerSnapshot.exists) {
      transaction.set(checkoutRef, {
        status: 'fulfilled',
        fulfilledAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      return;
    }
    if (!userSnapshot.exists) throw new Error('Kani user profile does not exist for checkout fulfillment.');

    const user = userSnapshot.data();
    const balanceAfter = Number(user.coinBalance || 0) + pack.coins;
    const now = Timestamp.now();
    transaction.update(userRef, { coinBalance: balanceAfter, updatedAt: now });
    transaction.create(ledgerRef, {
      delta: pack.coins,
      balanceAfter,
      reason: 'stripe_credit_pack',
      source: 'stripe',
      packId: pack.id,
      stripeSessionId: session.id,
      paymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id || null,
      amountPaid: session.amount_total,
      currency: session.currency,
      createdAt: now,
    });
    transaction.set(checkoutRef, {
      uid,
      packId: pack.id,
      coins: pack.coins,
      expectedAmount: pack.priceCents,
      amountPaid: session.amount_total,
      currency: session.currency,
      status: 'fulfilled',
      paymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id || null,
      fulfilledAt: now,
      updatedAt: now,
    }, { merge: true });
  });
}
