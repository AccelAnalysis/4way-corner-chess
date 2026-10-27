# Kani first-run experience and fair monetization

## Player journey

1. **Cinematic introduction** — the public root explains the game with a moving four-corner board and a single `Play your first victory` action. No shop or account form interrupts the hero.
2. **Guided guest victory** — the player learns the defining rule by selecting an ivory rook and capturing the highlighted blue king. No identity, email, or payment information is requested.
3. **Immediate reward** — the first victory grants 25 local **Practice Coins** exactly once. Practice Coins remain separate from server-owned paid Kani Coins.
4. **Reversible account decision** — the post-match screen explains why an account becomes useful, offers `Create free account`, and preserves `Continue as guest` as a clear alternative.
5. **Hub and progressive discovery** — returning players can continue to the Kani hub. Online rooms and secure commerce explain their account requirement at the moment the requirement becomes relevant.

## Decision-guidance principles

- Show value before asking for commitment.
- State why an account is needed and what remains available without one.
- Keep `Continue as guest` visible and reversible.
- Do not bundle marketing consent into account creation.
- Show fixed pack contents and prices before checkout.
- Do not use loot boxes, randomized rewards, countdown pressure, or hidden pricing.
- Separate local Practice Coins from server-owned Kani Coins in language and storage.
- Require a registered account only for online identity, cross-device cosmetics, and payment records.

## Cosmetic-only boundary

The catalog accepts only these item families:

- Themes
- Piece skins
- Capture animations by piece type
- Board skins
- Victory banners
- Profile frames
- Quick-chat packs
- Sound packs

The following are explicitly forbidden from Kani Shop catalog records:

- Extra moves or turns
- Stronger pieces or piece-power modifiers
- Paid revives
- Paid competitive undos
- Extra clock time
- Matchmaking priority
- Rating boosts
- Guaranteed outcomes
- Paid game modes, puzzles, or other gameplay content presented as cosmetics

Every item included by default must have a zero purchase price. CI rejects contradictory catalog entries such as an item being both included and priced.

`tests/monetization.test.mjs` enforces these boundaries.

## Account activation

Before public account activation, enable both **Anonymous** and **Email/Password** providers in the dedicated Kani Firebase project. Anonymous identity lets a guest upgrade in place through Firebase credential linking, preserving the same Firebase UID.

Online-room APIs, secure cosmetic operations, and Stripe Checkout reject anonymous Firebase users. Local guest play remains available.

## Acceptance checklist

- [ ] First visit shows the introduction rather than the hub.
- [ ] Primary action starts the guided match without authentication.
- [ ] Capturing the highlighted king reaches the post-match decision screen.
- [ ] The 25 Practice Coin reward cannot be claimed twice.
- [ ] `Continue as guest` opens the local hub.
- [ ] `Create free account` links the anonymous Firebase user to email/password credentials.
- [ ] Returning registered users are not replaced by a new anonymous session.
- [ ] Anonymous users see an account explanation before online rooms.
- [ ] Anyone may browse the cosmetic catalog.
- [ ] Anonymous users cannot call room, secure shop, or Checkout mutation endpoints.
- [ ] No catalog item can contain a gameplay-power field.
- [ ] No included item can also display a purchase price.
