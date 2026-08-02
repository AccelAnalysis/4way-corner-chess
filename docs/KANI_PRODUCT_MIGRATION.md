# Kani product migration

## Preserved baseline

The legacy game remains intact on `main` and is snapshotted on the branch
`legacy/4way-corner-chess-v1` at commit `56294604a3645b568bc5b585227564360783a820`.

## Product branch

The product-grade web migration is developed on `product/kani-web`.
The Next.js application lives in `apps/web` and is deployed independently from
the legacy static/Pygame implementation.

## Phase 1 scope

- Next.js and React application scaffold
- Tailwind and Lucide integration
- Kani prototype migrated as a client component
- Firebase configuration moved to environment variables
- Anonymous-auth/Firestore room scaffold retained
- Local profile persistence retained temporarily for unpaid prototype data
- Vercel deployment configuration
- GitHub build workflow

## Known boundaries before paid launch

Kani Coins, inventory, rewards, and purchases are still client-owned in this
phase. They must move to server-owned documents and an append-only ledger before
Stripe live mode is enabled. Multiplayer currently synchronizes a room document
and is not yet server-authoritative.
