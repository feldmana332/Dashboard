# Dashboard

This repository holds two unrelated projects that are kept cleanly separated:

- **`word_of_the_day.py`** (repo root) — a GRE "word of the day" emailer that
  runs on a GitHub Actions cron. Config lives in `config.json`.

- **`signups/`** — a public Next.js site where students reserve seats at
  **dinners** and book **office-hour** time slots, with a password-protected
  admin page. Deploys to Vercel (set its **Root Directory** to `signups`).
  See [`signups/README.md`](signups/README.md) for setup and deploy steps.

The two share no code, data, or runtime — changing or deploying one never
affects the other.
