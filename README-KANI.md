# Kani: 4-Way Corner Chess

This branch introduces the product-grade Kani web application without replacing
the existing public game.

## Run locally

```bash
cp apps/web/.env.example apps/web/.env.local
npm install
npm run dev
```

Open `http://localhost:3000`.

The game runs in offline/local mode without Firebase values. To exercise the
room-code scaffold, create a Firebase web app, enable Anonymous Authentication,
create Firestore, add the public configuration to `apps/web/.env.local`, and
deploy `firestore.rules`.

## Build

```bash
npm run build
```

## Deployment

The repository-level `vercel.json` builds the `apps/web` workspace and publishes
its Next.js output. Add the same Firebase variables in the Vercel project before
testing online rooms.
