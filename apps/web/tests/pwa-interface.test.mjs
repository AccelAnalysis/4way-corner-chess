import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');

test('the PWA is scoped to KANI and opens without browser chrome', () => {
  const manifest = read('../app/manifest.js');
  assert.match(manifest, /display: 'standalone'/);
  assert.match(manifest, /start_url: '\/'/);
  assert.match(manifest, /scope: '\/'/);
  assert.match(manifest, /192x192/);
  assert.match(manifest, /512x512/);
  assert.match(manifest, /purpose: 'maskable'/);
  const layout = read('../app/layout.js');
  assert.match(layout, /PwaRegistration/);
  assert.match(layout, /appleWebApp/);
});

test('service worker excludes identity, multiplayer and commerce from caching', () => {
  const worker = read('../public/sw.js');
  for (const term of ['api', 'account', 'online', 'shop']) assert.ok(worker.includes(term), term);
  assert.match(worker, /request\.method !== 'GET'/);
  assert.match(worker, /request\.mode === 'navigate'/);
  assert.match(worker, /_next\/static/);
  assert.match(worker, /'\/offline'/);
});

test('font hierarchy is Aharoni and Al Bayan with Aptos fallback', () => {
  const css = read('../app/globals.css');
  assert.match(css, /Aharoni, Aptos/);
  assert.match(css, /"Al Bayan", Aptos/);
});

test('player-facing screens never explain internal commerce and gameplay policy', () => {
  const ui = [
    '../src/components/FirstRunExperience.jsx',
    '../src/components/CoinShop.jsx',
    '../src/components/AccountGateway.jsx',
    '../src/components/RegisteredOnlineExperience.jsx',
    '../src/components/OnlineArena.part01.jsxpart',
  ].map(read).join('\n');
  const banned = [
    'Always cosmetic',
    'Never for sale',
    'What purchases can change',
    'What purchases can never change',
    'Four armies · One crown',
    'Server-validated moves',
    'test checkout',
    'Secure commerce is not activated',
    'Online runtime is ready for credentials',
  ];
  for (const phrase of banned) assert.equal(ui.includes(phrase), false, phrase);
});
