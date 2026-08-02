export const COIN_PACKS = Object.freeze({
  starter: Object.freeze({
    id: 'starter',
    name: 'Starter Pack',
    coins: 500,
    priceCents: 499,
    description: '500 Kani Coins for cosmetic themes and effects.',
  }),
  warrior: Object.freeze({
    id: 'warrior',
    name: 'Warrior Pack',
    coins: 1200,
    priceCents: 999,
    description: '1,200 Kani Coins, including a 20% bonus.',
    badge: 'Most popular',
  }),
  royal: Object.freeze({
    id: 'royal',
    name: 'Royal Pack',
    coins: 2600,
    priceCents: 1999,
    description: '2,600 Kani Coins, including a 30% bonus.',
  }),
  legendary: Object.freeze({
    id: 'legendary',
    name: 'Legendary Pack',
    coins: 7000,
    priceCents: 4999,
    description: '7,000 Kani Coins, including a 40% bonus.',
    badge: 'Best value',
  }),
});

export const SHOP_ITEMS = Object.freeze({
  'theme:classic': Object.freeze({ id: 'theme:classic', name: 'Classic Skirmish', kind: 'theme', priceCoins: 0 }),
  'theme:medieval': Object.freeze({ id: 'theme:medieval', name: 'Medieval', kind: 'theme', priceCoins: 0 }),
  'theme:tribal': Object.freeze({ id: 'theme:tribal', name: 'African Tribal', kind: 'theme', priceCoins: 400 }),
  'theme:minimal': Object.freeze({ id: 'theme:minimal', name: 'Minimal Flat', kind: 'theme', priceCoins: 100 }),
  'theme:neon': Object.freeze({ id: 'theme:neon', name: 'Neon Grid', kind: 'theme', priceCoins: 500 }),
});

export const DEFAULT_INVENTORY = Object.freeze([
  'theme:classic',
  'theme:medieval',
  'theme:tribal',
]);

export const WELCOME_COIN_GRANT = 200;

export function getCoinPack(packId) {
  return COIN_PACKS[String(packId || '').toLowerCase()] || null;
}

export function getShopItem(itemId) {
  return SHOP_ITEMS[String(itemId || '')] || null;
}

export function formatUsd(priceCents) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(priceCents / 100);
}
