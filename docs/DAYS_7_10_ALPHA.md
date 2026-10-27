# Days 7–10: Multiplayer and payment alpha

## Implemented

### Multiplayer

- Firebase anonymous authentication bootstrap.
- Six-character private room codes.
- Transactional seat assignment and reconnect by Firebase UID.
- Lobby ready checks and host-only start.
- Two-to-four human players; empty seats are filled by server AI.
- Firestore real-time room, player, and quick-chat listeners.
- Server-authoritative move validation and version checks.
- Flat, Firestore-safe 64-square board representation.
- King-capture assimilation, teams, promotion, clocks, timeout claims, resignation, move log, and winner resolution.
- Quick-chat allowlist; arbitrary text is not accepted.
- Firestore rules make clients read-only for authoritative state.

### Kani Coins and Stripe

- Server-owned user profile, coin balance, inventory, ELO shell, and append-only ledger.
- Fixed Starter, Warrior, Royal, and Legendary pack catalog.
- Authenticated Stripe Checkout Session creation using server-resolved amounts.
- Hard test-mode lock: `sk_live_` keys are refused by default.
- Signed webhook verification.
- Exact pack/amount/currency verification before fulfillment.
- Idempotent Checkout Session and ledger fulfillment.
- Server-controlled cosmetic purchase and cross-device equip transactions.
- Success, cancel, and fulfillment-status pages.

## Activation boundary

The implementation builds without secrets and fails closed when credentials are absent. To activate it:

1. Create a dedicated Firebase project for Kani. Do not reuse RFxchange.
2. Register a Firebase web app and add its public values to Vercel.
3. Enable Anonymous Authentication and Firestore.
4. Create a restricted Firebase service account and add one documented Admin credential representation to Vercel.
5. Deploy `firestore.rules` and `firestore.indexes.json` to the Kani Firebase project.
6. Add a Stripe **test-mode** secret key to Vercel.
7. Register `/api/stripe/webhook` as a Stripe test webhook and subscribe to:
   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded`
   - `checkout.session.async_payment_failed`
   - `checkout.session.expired`
8. Add the test webhook signing secret to Vercel and redeploy.

No live Stripe products or prices are required because Checkout uses a server-owned inline price catalog. No live payment objects were created during this implementation.
