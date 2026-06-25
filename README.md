# Numble

Numble is a Next.js number-guessing game with:

- Random mode at `/`
- Seeded daily challenge mode at `/daily-challenge`

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Configure environment variables:

   ```bash
   cp .env.example .env.local
   ```

3. Set `DAILY_SEED` in `.env.local`.

   - Use a long random value.
   - Set it once per environment (development/staging/production).
   - Do not expose it to the browser.

   Example generation command:

   ```bash
   openssl rand -hex 32
   ```

4. Start the app:

   ```bash
   npm run dev
   ```

## Daily Challenge Notes

- Daily challenge puzzle ID is based on UTC date (`YYYY-MM-DD`).
- The answer is derived server-side from `DAILY_SEED + puzzleId`.
- All users receive the same puzzle for a UTC day.
- Completion is currently enforced once-per-day per browser via local storage.
