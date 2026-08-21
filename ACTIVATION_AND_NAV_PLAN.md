# Plan — navigation, and proving the book was bought

Written 2026-08-21. Two problems that turn out to be one: what the buttons
promise, and what actually lies behind them.

---

## Part A — the buttons

### What is wrong now

| Button | Goes to | Problem |
|---|---|---|
| **Look inside** | `#inside` → *"What every page holds"* | That section explains page **anatomy**. It is a diagram, not the book. |
| **Hear a page** | `/books/ibrahim` | This is where the real 10-page flip-through sample lives — the actual "look inside". |

The two are crossed over: the genuine sample sits behind the button that
does not name it, and the button that does name it goes to an explainer.

There is a second, structural problem. `/books/ibrahim` currently does two
unrelated jobs:

1. **Sell** — the 10-page sample, for someone deciding whether to buy.
2. **Serve owners** — the index of all 52 pages, progress, the companion.

Those want different pages for different people.

### The fix

**Landing page `/` = the whole sales funnel.** Everything a
not-yet-a-customer needs, including the sample. Nothing requires leaving.

**`/books/ibrahim` = the companion home.** For people who own the book.

| Where | Button | Goes to | For |
|---|---|---|---|
| Landing header | **Book companion** | `/account` | Owners — done |
| Landing hero | **Get the book** | `book_url` (Amazon) | Buyers. Hidden while the URL is empty |
| Landing hero | **Look inside** | `#inside` | Buyers — must land on the SAMPLE |
| `#inside` | *(the 10-page reader itself)* | — | Move `BookReader` here from `/books/ibrahim` |
| Below `#inside` | **Get the book** | `buy_url` | Convert at the moment of interest |
| Companion home | **Continue reading** | last page read | Owners |
| Companion home | **Every page** | `#every-page` | Owners |
| Page card nav | **Book companion** | `/account` | Owners — done |

**Renames:** the current `#inside` section ("What every page holds") is an
explainer, so it takes a different anchor — `#every-page-holds`. The
`#inside` anchor moves to the sample, because that is what the words
promise.

**Signed-out `/books/ibrahim`** keeps a short sample and a route to
`/account`, rather than 404ing — printed URLs must never dead-end
(ACCESS_MODEL.md).

---

## Part B — proving the book was bought

### The gap, stated plainly

The gate is on, but `hasMembership()` returns true for **any signed-in
account**. Anyone can register free and read all 52 pages. Until Part B
ships, the gate stops casual browsing and nothing else.

### The flow

```
buys book on Amazon
   -> signs up at qasaskids.com
   -> /activate: enters the Amazon order number
   -> emails the receipt to accounts@qasaskids.com
   -> Asma matches order number to receipt
   -> approves in Supabase
   -> 12 months, on the account
```

### Why no file upload

The owner already plans for receipts to arrive by email. That is worth
keeping deliberately, not just accepting:

- **No Supabase Storage**, so nothing extra to migrate to the VPS later.
- **No receipt images in our database.** Amazon receipts carry name,
  address and other purchases. Holding them is a liability with no
  ongoing purpose; leaving them in an inbox Asma already controls is both
  simpler and less exposure.
- Less to build before the 25th.

The site therefore takes **only the order number**. The receipt is proof
Asma checks by eye, in email.

### Tables

```sql
-- one row per attempt, kept for audit
create table public.activations (
  id           uuid primary key default gen_random_uuid(),
  parent_id    uuid not null references auth.users(id) on delete cascade,
  order_number text not null,
  status       text not null default 'pending'
               check (status in ('pending','approved','rejected')),
  note         text,
  created_at   timestamptz not null default now(),
  reviewed_at  timestamptz
);

-- THE anti-reuse key: one approved claim per Amazon order, ever.
create unique index activations_one_approval_per_order
  on public.activations (lower(order_number))
  where status = 'approved';

-- what hasMembership() actually reads
create table public.entitlements (
  parent_id  uuid primary key references auth.users(id) on delete cascade,
  source     text not null,          -- book_activation | subscription
  starts_at  timestamptz not null default now(),
  expires_at timestamptz not null
);
```

The partial unique index is the important line. It is what stops one
receipt unlocking fifty accounts, and it is enforced by the database
rather than by remembering to check.

### Approval should be ONE action

Asma will work in the Supabase table editor at first — an admin screen is
not worth building before the 25th. But approving must not mean "flip a
status **and** hand-write an entitlement row with the right dates". That
is two steps, and the second one gets forgotten or mistyped.

So a trigger does it:

```sql
create or replace function public.grant_on_approval()
returns trigger language plpgsql security definer as $$
begin
  if new.status = 'approved' and coalesce(old.status,'') <> 'approved' then
    insert into public.entitlements (parent_id, source, starts_at, expires_at)
    values (new.parent_id, 'book_activation', now(), now() + interval '12 months')
    on conflict (parent_id) do update
      set expires_at = greatest(entitlements.expires_at, excluded.expires_at);
    new.reviewed_at := now();
  end if;
  return new;
end $$;

create trigger activations_grant
  before update on public.activations
  for each row execute function public.grant_on_approval();
```

Asma changes one cell. The database does the rest, and cannot do half of
it. `greatest(...)` means re-approving extends rather than shortens.

### RLS

Same shape as the existing tables:

- `activations` — a parent may INSERT their own and SELECT their own.
  They may **not** UPDATE (they cannot approve themselves).
- `entitlements` — SELECT own only. No client writes at all; the trigger
  runs `security definer`.

### `hasMembership()` becomes

```ts
export async function hasMembership(): Promise<boolean> {
  const parentId = await getParentId();
  if (!parentId) return false;
  return hasActiveEntitlement(parentId);   // expires_at > now()
}
```

One function, as designed. Nothing else in the app changes.

### Notifying Asma

Simplest first: a Supabase Database Webhook on insert into `activations`,
posting to an email service. If that is a step too far before the 25th,
Asma can watch the table directly — volume will be tiny at launch, and a
webhook can be added without touching the app.

**Receiving address: `accounts@qasaskids.com`** — live on Hostinger's Free
Business Email plan (100 mailboxes, renews 2027-03-24).

Verified 2026-08-21 after setup, because email wizards can overwrite DNS:

```
qasaskids.com      A   191.215.35.21     ✓ unchanged
www.qasaskids.com  A   191.215.35.21     ✓ unchanged
                   MX  mx1/mx2.hostinger.com
                   TXT v=spf1 include:_spf.mail.hostinger.com ~all
https://qasaskids.com -> 200
```

Mail and site records coexist correctly. **Re-run that check after any
future DNS change** — the A records are what keep the site reachable, and
an email wizard offering to "fix" your DNS is the likeliest thing to
break them.

Asma needs direct access to this mailbox, not a forward into someone
else's inbox — she is matching order numbers against receipts, and it has
to be obvious which have been dealt with.

If activation mail starts drowning in general enquiries, add a dedicated
`receipts@` later; 99 mailbox slots are free. Not worth splitting at
launch volume.

**Sending is a separate problem.** Supabase currently sends confirmation
and reset email from its own domain. Moving those to `@qasaskids.com`
means SMTP credentials plus SPF and DKIM, and is unrelated to receiving
receipts. Do not conflate the two.

**Privacy.** Those receipts carry names, addresses and other purchases.
Delete them once an activation is approved or rejected; keep only the
order number and the outcome, which is all the `activations` table holds.

---

## Sequence

1. **Part A** — buttons and the sample move. No database work, ship first.
2. **Tables + trigger + RLS.**
3. **`/activate` gains a form** (order number only).
4. **`hasMembership()` reads entitlements.** ← the moment the gate becomes
   a purchase gate.
5. Email plumbing for Asma.
6. Admin screen, after launch, if volume warrants it.

Steps 1–4 are what the 25th needs.

---

## Decisions still open

1. **Grace period.** Someone who has bought the book but not yet been
   approved — do they wait, or get provisional access? Recommend waiting,
   with a clear "usually within a day" message. Provisional access with no
   check is the same as no gate.
2. **Activation window.** ACCOUNTS_PLAN suggests 12 months from activation
   provided it is activated within 90 days of purchase. Not encoded above;
   add it to the trigger if wanted.
3. **What a Kindle buyer submits.** Kindle orders have order numbers too,
   but the earlier reasoning was that Kindle buyers may not need the gate
   at all.
