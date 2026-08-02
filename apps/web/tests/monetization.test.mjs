import test from 'node:test';
import assert from 'node:assert/strict';
import {
  COIN_PACKS,
  COSMETIC_ITEM_KINDS,
  DEFAULT_INVENTORY,
  FORBIDDEN_GAMEPLAY_FIELDS,
  SHOP_ITEMS,
  validateCosmeticOnlyCatalog,
} from '../src/shop/catalog.js';

test('shop catalog is cosmetic-only', () => {
  assert.equal(validateCosmeticOnlyCatalog(), true);
  assert.equal(COSMETIC_ITEM_KINDS.includes('puzzle_pack'), false);
  for (const item of Object.values(SHOP_ITEMS)) {
    assert.ok(COSMETIC_ITEM_KINDS.includes(item.kind));
    for (const field of FORBIDDEN_GAMEPLAY_FIELDS) assert.equal(field in item, false);
  }
});

test('included inventory never carries a conflicting purchase price', () => {
  for (const itemId of DEFAULT_INVENTORY) {
    assert.ok(SHOP_ITEMS[itemId]);
    assert.equal(SHOP_ITEMS[itemId].priceCoins, 0);
  }
});

test('coin packs are fixed positive offers without random rewards', () => {
  for (const pack of Object.values(COIN_PACKS)) {
    assert.ok(pack.coins > 0);
    assert.ok(pack.priceCents > 0);
    assert.equal('randomCoins' in pack, false);
    assert.equal('odds' in pack, false);
  }
});
