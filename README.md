# Student Sign-Up Site — Dinners & Office Hours

A small public website where students reserve seats at planned **dinners** and
book **office-hour** time slots. You (and your TA) manage everything from a
password-protected admin page: create events, set the number of seats, generate
office-hour slots, close sign-ups, and export the lists.

Students don't need an account — they just enter their name and email, and get a
confirmation email with a one-click cancel link. All times are shown in
**Eastern (America/New_York)**.

> Note: the GRE "word of the day" emailer (`word_of_the_day.py`) is unrelated and
> still lives in this repo; it keeps working on its own GitHub Actions schedule.

---

## What it does

**Public page (`/`)**
- Tabs for **Dinners** and **Office Hours**.
- Each open event shows when it is, seats remaining, and a sign-up form.
- Full or closed events stay visible but greyed out.

**Admin page (`/admin`)** — behind one shared password
- Add a dinner: title, date/time, seats, location, notes.
- Generate office-hour slots from a window + slot length (e.g. 2–4pm in 20-min
  slots → 6 bookable slots), one student per slot.
- Close / reopen / delete any event.
- View sign-ups for each event and **export everything to CSV**.

The last seat can't be double-booked: capacity is enforced inside a database
transaction.

---

## Tech

- **Next.js** (App Router) — the website + API.
- **Postgres** (Neon free tier recommended) — stores events and reservations.
- **Nodemailer + Gmail app password** — confirmation emails (same approach the
  rest of this repo already uses).
- Deploys to **Vercel** free tier.

---

## Setup

### 1. Create a database (Neon — free)
1. Sign up at <https://neon.tech> and create a project.
2. Copy the connection string (looks like
   `postgres://user:pass@host/db?sslmode=require`).

### 2. Configure environment variables
Copy `.env.example` to `.env.local` and fill in:

| Variable | What it is |
| --- | --- |
| `DATABASE_URL` | The Neon connection string. |
| `ADMIN_PASSWORD` | The shared password you and your TA type to log in. |
| `SESSION_SECRET` | Any long random string (signs the login cookie). |
| `GMAIL_SENDER` | Gmail address that sends confirmations. |
| `GMAIL_APP_PASSWORD` | A Gmail **App Password** (not your normal password). |
| `NEXT_PUBLIC_SITE_URL` | Public URL of the site (for cancel links). |

### 3. Create the tables
```bash
npm install
npm run db:init      # creates the tables in your database
```

### 4. Run locally
```bash
npm run dev
# open http://localhost:3000  (admin at /admin)
```

---

## Deploy to Vercel
1. Push this repo to GitHub (already done if you're reading this on GitHub).
2. At <https://vercel.com> → **New Project** → import this repo.
3. Add the same environment variables from step 2 in the Vercel project settings.
   (`NEXT_PUBLIC_SITE_URL` should be your `https://...vercel.app` URL.)
4. Deploy. Then run the table setup once against your database — either
   `npm run db:init` locally with the production `DATABASE_URL`, or paste the
   contents of `db/schema.sql` into Neon's SQL editor.

Point your students at the deployed URL, keep the `/admin` password to yourself
and your TA, and you're set.

---

## Day-to-day
- **New dinner:** Admin → Dinners → fill the form → *Add dinner*.
- **Office hours:** Admin → Office Hours → pick a date, window, and slot length →
  *Generate slots*.
- **Stop sign-ups:** *Close* (keeps it visible) or *Delete* (removes it).
- **Get the list:** *View sign-ups* on a card, or *Export CSV* for the whole tab.
