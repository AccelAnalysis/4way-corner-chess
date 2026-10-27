# Vercel deployment

The Kani product app is deployed from product code revision
`3f7c02a444cc71bd69b8839dff1a5af2c269f4bc`.

- Project: `kani-4way-corner-chess`
- Team: Jonathan's projects
- Production URL: `https://kani-4way-corner-chess.vercel.app`
- Production deployment: `dpl_gnKBaCu6e9UGxtcyU3EGBWhTUvzs`
- Framework: Next.js 15.5.21

The application is intentionally deployed without Firebase credentials in this
foundation phase, so local play, AI play, puzzles, themes, rewards, chat UI, and
replays can be reviewed without exposing service credentials. Online rooms will
remain unavailable until the documented Firebase environment variables are
configured in Vercel and Anonymous Authentication plus Firestore are enabled.

The current public legacy game on the repository's `main` branch was not
replaced or modified by this deployment.
