# Paddle checkout: direct digital sales (scaffold, hidden)

**Status (2026-10-04): built on branch `paddle-checkout`. Not merged, not deployed, not linked from anywhere.**
Every selling route 404s unless `PADDLE_CHECKOUT_ENABLED=true` and the book has a price id.

Sales go through the limited company. Paddle is the **merchant of record**: legally
the seller to the customer. It charges and pays VAT for each customer's country
and pays the company. The site does no tax handling. Background:
`../Who Broke the Idols/DIGITAL_SALES_PLAN.md`.

## What a buyer gets

One book's full companion for **12 months**: every page, audio, words and
practice, with per-child progress. It's the same `direct_sale` entitlement a stall
code gives, so `lib/access.ts` needs no change.

## Flow

```
/buy/<slug>  (hidden)
  signed in  -> Paddle overlay checkout, custom_data.parent_id = their account
  signed out -> "Create an account or sign in to buy" (sign-up / sign-in, ?next= back here)
                    |
Paddle  --transaction.completed-->  /api/paddle/webhook
  verify Paddle-Signature (HMAC, 5-minute window)
  book  = from the PRICE id (never from custom_data)
  record_paddle_purchase (idempotent on txn id):
     parent known   -> entitlement, immediately
     no parent      -> recorded 'unmatched' (annual and monthly), nothing granted,
                       200 returned and logged for manual follow-up
  non-2xx makes Paddle retry; a retry never double-grants
                    |
/buy/<slug>/thanks  ("Your book is on your account")
```

Online purchases always require an account (sign-up is open; the order number /
QK code is optional there). The guest QK- code branch still exists in
`record_paddle_purchase` for safety, but the app no longer sends a code, so it
is unreachable from the UI or webhook (migration `202610180001_open_signup.sql`).

## Files

| File | What |
|---|---|
| `supabase/migrations/202610040001_paddle_purchases.sql`, `202610170002_paddle_bundle_purchases.sql` | `paddle_transactions` table; `record_paddle_purchase`, `mark_paddle_code_emailed` (issuer-secret gated, callable by the anon webhook, supports multi-book/bundle transactions) |
| `lib/paddle.ts` | env, price↔book mapping (including bundle), signature check, customer email lookup, transaction fulfillment |
| `lib/paddle.check.ts` | self-check, runs in `npm run check` (so before every build) |
| `app/api/paddle/webhook/route.ts` | the notification destination |
| `app/buy/[book]/page.tsx`, `thanks/page.tsx`, `app/buy/both/page.tsx`, `thanks/page.tsx` | hidden buy and thank-you pages (`noindex`) |
| `components/PaddleCheckoutButton.tsx` | loads Paddle.js v2, opens the overlay |
| `lib/activation-email.ts` | now says "online" or "in person" |
| `proxy.ts` | `/buy` added (it reads the session) |

## Setup, in order

1. **Paddle account in the company's name.** Sign up as the Ltd (company number,
   director ID, bank account). Paddle reviews the business and **the website**: they
   check qasaskids.com has pricing, terms, a refund policy and a privacy policy. **We
   still need to write terms and refund pages**, and Paddle won't approve live
   payments without them.
2. **Sandbox first** (sandbox-vendors.paddle.com), a separate account with no real money:
   - Catalog: one **product** per book, each with one **price** (one-time, e.g. £7.99).
     Copy the `pri_...` ids.
   - Developer tools > Authentication: a **client-side token** (`test_...`) and an
     **API key** (needs permission to read customers).
   - Developer tools > Notifications: a destination
     `https://<host>/api/paddle/webhook`, event **transaction.completed** only.
     Copy its **secret key**.
   - Checkout settings: add the site domain to the approved domains.
3. **Database:** apply the migration to Supabase (SQL editor or `supabase db push`).
   It only adds things: one new table and two new functions.
4. **Env** on the server (see `.env.example`): `PADDLE_ENV`, `PADDLE_CLIENT_TOKEN`,
   `PADDLE_API_KEY`, `PADDLE_WEBHOOK_SECRET`, `PADDLE_PRICE_IBRAHIM`, `PADDLE_PRICE_YUSUF`,
   `PADDLE_PRICE_BUNDLE`.
   Leave `PADDLE_CHECKOUT_ENABLED=false` until testing.
5. **Test in sandbox** with Paddle's test card `4242 4242 4242 4242`, any future
   expiry, CVC `100`:
   - signed in → book opens on that account within seconds
   - guest → code email arrives → sign up with it → book opens
   - "Resend" the event from the Paddle dashboard → no second code, no error
6. **Go live:** switch to production keys and prices, set `PADDLE_ENV=production`, and
   only then add Buy-digital links next to the Amazon buttons.

## Built

- **Both-parts bundle (/buy/both).** A single price (`PADDLE_PRICE_BUNDLE`) grants both
  Ibrahim and Yusuf (two entitlements, or two QK- codes for a guest), idempotent on
  the transaction id.

## Not built (decide before launch)

- **Refunds and chargebacks.** Paddle refunds the money, but access stays until the 12
  months end. To revoke, subscribe to `adjustment.created` and delete the entitlement or
  code, or do it by hand while numbers are small.
- **Teacher and class licences.** Invoice those directly for now (`CLASSROOM_PLAN.md`).
- **Price display.** Paddle shows each buyer the local price including VAT. Decide whether
  £7.99 includes UK VAT (you receive less) or VAT is added on top.
