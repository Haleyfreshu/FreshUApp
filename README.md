# FreshU

Performance nutrition ordering for college athletes — Fuel Score, Fuel Buddy,
macro tracking, a fueling schedule, a weekly menu with a 1–5 meal cart limit,
order history, and a staff dashboard (meal CRUD, athlete roster, orders, CSV
export for Well Fed). Built with Next.js (App Router), Supabase (auth,
Postgres, storage), and Stripe Checkout.

## Stack

- **Next.js 14** (App Router, JavaScript)
- **Supabase** — email/password auth, Postgres, Storage (meal photos)
- **Stripe Checkout** — weekly meal order payment
- **Vercel** — deployment target

## 1. Local setup

```bash
npm install
cp .env.example .env.local   # fill in the values described below
npm run dev
```

The app runs at `http://localhost:3000`.

## 2. Supabase project

1. Create a free project at [supabase.com](https://supabase.com).
2. In **Project Settings → API**, copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret — server-only, never expose to the browser)
3. Open the **SQL Editor** and run, in order:
   - `supabase/migrations/0001_init.sql` — tables, RLS policies, the `meal-photos` storage bucket
   - `supabase/migrations/0002_seed_meals.sql` — seeds the starter weekly menu
4. In **Authentication → Providers → Email**, decide whether to require email
   confirmation. Either is fine — if you leave "Confirm email" on, new
   signups will be told to check their inbox; the app's `/auth/callback`
   route handles the confirmation redirect either way.

### Making someone staff

There's no separate staff signup — a staff member creates a normal account
(`/signup`), then you promote it in the SQL Editor:

```sql
update public.profiles set role = 'staff', onboarded = true where email = 'staffmember@example.com';
```

They can then log in from the **Staff login** link (`/staff/login`) using
that same email and password.

## 3. Stripe account

1. Create an account at [dashboard.stripe.com/register](https://dashboard.stripe.com/register). You can build and test everything in **test mode** before ever activating live payments.
2. Go to **Developers → API keys** and copy:
   - `Publishable key` → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `Secret key` → `STRIPE_SECRET_KEY`
3. Set up the webhook that confirms payment and marks the order "This Week":
   - **Local dev:** install the [Stripe CLI](https://docs.stripe.com/stripe-cli), then run:
     ```bash
     stripe listen --forward-to localhost:3000/api/stripe/webhook
     ```
     It prints a `whsec_...` value — put that in `STRIPE_WEBHOOK_SECRET`.
   - **Production:** in the Stripe Dashboard, go to **Developers → Webhooks → Add endpoint**, set the URL to `https://<your-vercel-domain>/api/stripe/webhook`, and subscribe to `checkout.session.completed` and `checkout.session.expired`. Copy the endpoint's signing secret into `STRIPE_WEBHOOK_SECRET` on Vercel.
4. Test card number for checkout: `4242 4242 4242 4242`, any future expiry, any CVC.

## 4. Deploying to Vercel

1. Push this repo to GitHub (already done if you're reading this from the repo).
2. In [vercel.com](https://vercel.com), **Add New → Project**, import the repo.
3. Add the environment variables from `.env.example` in the Vercel project's
   **Settings → Environment Variables** (use your real Supabase/Stripe values;
   set `NEXT_PUBLIC_SITE_URL` to your Vercel URL, e.g. `https://freshu.vercel.app`).
4. Deploy. Then go back to Stripe and add/point the production webhook at
   `https://<your-vercel-domain>/api/stripe/webhook` (step 3 above) if you
   haven't already, and update `STRIPE_WEBHOOK_SECRET` on Vercel to match.

## Project structure

```
app/                    Next.js App Router pages & API routes
  (app)/                Authenticated athlete shell: dashboard, menu, orders, profile
  staff/                Staff login + admin dashboard
  api/checkout/         Creates the Stripe Checkout Session
  api/stripe/webhook/   Confirms payment, flips order status
  checkout/             Stripe success/cancel redirect targets
components/             Shared UI, ported 1:1 from the design prototype
lib/                    Supabase clients, Stripe client, constants, fuel-score math
supabase/migrations/    SQL schema, RLS policies, storage bucket, seed data
```

## Data model

- `profiles` — athlete/staff profile, one row per Supabase auth user (auto-created on signup via trigger)
- `meals` — the weekly menu, staff-writable, readable by any signed-in user
- `orders` / `order_items` — a weekly meal order and its meal snapshots; created as `pending_payment` before Stripe redirect, flipped to `This Week` by the webhook on successful payment
- `daily_logs` — the "I Ate This" quick-log entries behind the Fuel Score and macro bars
