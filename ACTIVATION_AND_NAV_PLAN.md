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

### The flow — DECIDED 2026-08-21

Access is granted **immediately on signup**, not held until a human has
checked. The order number is collected at signup, and the receipt follows
by email.

```
buys book on Amazon
   -> signs up at qasaskids.com, ENTERING THE ORDER NUMBER on the form
   -> access starts at once  (provisional, 30 days)
   -> emails the receipt to receipts@qasaskids.com
   -> Asma matches order number to receipt
   -> approves in Supabase
   -> extended to 12 months
```

**Why immediate access:** a parent who has already paid should not be
locked out of the thing their book promised while waiting on a human. The
friction would cost more genuine buyers than it would stop freeloaders.

### The provisional window does the disabling

The owner's instinct was to disable non-compliant accounts by hand. That
works, but it depends on somebody **noticing an absence** — spotting that
a receipt never arrived, for an account created weeks ago. People are
reliably bad at that, and it silently stops happening the first busy week.

So the entitlement created at signup **already has an expiry**:

| | `expires_at` |
|---|---|
| On signup | `now() + 30 days` — provisional |
| On Asma approving | `now() + 12 months` |
| Receipt never sent | *lapses on its own* |

This inverts the work. Asma only ever takes a **positive** action —
approving something in front of her. Nobody has to remember to chase, and
nobody has to remember to switch anyone off. A freeloader simply stops
having access on day 31 while no one does anything at all.

Manual disable stays available for abuse, but it is no longer the
mechanism the model depends on.

**30 days is one number**, in the trigger below. Long enough that a book
bought as a gift and opened weeks later is not penalised; short enough
that an unverified account does not persist for a year.

### What the order number does and does not do

Collected at signup, it is **unverified text** — nobody can check it
against Amazon in real time, because KDP gives no per-order lookup
(ACCESS_MODEL.md). Someone can type anything and get their 30 days.

It still earns its place:

- It is what Asma **matches the emailed receipt against**.
- The partial unique index below means the same order cannot be approved
  for two different accounts — so a real order number shared around
  unlocks exactly one 12-month account, and the rest lapse at 30 days.
- Asking for it at signup sets the expectation that this is verified,
  which does more work than any check would.

### Why no file upload

The owner already plans for receipts to arrive by email. That is worth
keeping deliberately, not just accepting:

- **No Supabase Storage**, so nothing extra to migrate to the VPS later.
- **No receipt images in our database.** Amazon receipts carry name,
  address and other purchases. Holding them is a liability with no
  ongoing purpose; leaving them in the receipts@ inbox Asma controls is both
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

Two triggers. The first grants the provisional window the moment an
activation is claimed at signup:

```sql
-- signup -> 30 days, immediately
create or replace function public.grant_provisional()
returns trigger language plpgsql security definer as $$
begin
  insert into public.entitlements (parent_id, source, starts_at, expires_at)
  values (new.parent_id, 'provisional', now(), now() + interval '30 days')
  on conflict (parent_id) do update
    set expires_at = greatest(entitlements.expires_at, excluded.expires_at);
  return new;
end $$;

create trigger activations_provisional
  after insert on public.activations
  for each row execute function public.grant_provisional();
```

The second upgrades it to a full year when Asma approves:

```sql
create or replace function public.grant_on_approval()
returns trigger language plpgsql security definer as $$
begin
  if new.status = 'approved' and coalesce(old.status,'') <> 'approved' then
    insert into public.entitlements (parent_id, source, starts_at, expires_at)
    values (new.parent_id, 'book_activation', now(), now() + interval '12 months')
    on conflict (parent_id) do update
      set source     = 'book_activation',
          expires_at = greatest(entitlements.expires_at, excluded.expires_at);
    new.reviewed_at := now();
  end if;
  return new;
end $$;

create trigger activations_grant
  before update on public.activations
  for each row execute function public.grant_on_approval();
```

Asma changes one cell and the database does the rest — it cannot do half
of it, which is the point of putting it here rather than in a checklist.

`greatest(...)` in both means an approval always **extends** and never
shortens, so approving on day 29 does not accidentally cut someone from
30 days to a shorter window, and re-approving is harmless.

**To revoke**, delete the `entitlements` row or set `expires_at` to the
past. `hasMembership()` reads that one field, so it takes effect on the
next request.

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

**Two mailboxes, both live** on Hostinger's Free Business Email plan
(100 available, renews 2027-03-24):

| Mailbox | Carries | Who reads it |
|---|---|---|
| **receipts@qasaskids.com** | Amazon receipts for activation, and nothing else | Asma |
| **accounts@qasaskids.com** | General account enquiries, sign-in trouble | Whoever handles support |

Keeping receipts separate is worth the second mailbox: Asma's inbox
becomes a work queue where everything in it needs the same action, and an
unread message means an unactivated parent waiting. Mixed in with general
enquiries that signal disappears.

The address printed on `/activate` must be **receipts@**, and it should be
the only place it appears, so nothing else drifts into that queue.

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

1. ~~Grace period~~ — **decided 2026-08-21**: immediate provisional access
   on signup, order number captured on the signup form, 30-day window,
   extended to 12 months on approval.
2. **The signup form now needs an order-number field**, and a line saying
   where to send the receipt. That is a real change to `AuthForm` and the
   `signUp` action, which currently take email and password only. Simplest
   route: pass it as `options.data.order_number` on `supabase.auth.signUp`
   so it lands in the user's metadata, then create the `activations` row
   from there.
3. **What a Kindle buyer submits.** Kindle orders have order numbers too,
   but the earlier reasoning was that Kindle buyers may not need the gate
   at all — they already have the text.
4. **What happens at day 31.** The account keeps working, the companion
   locks, and the page they land on should say what to do rather than just
   refusing. `GateNotice` currently assumes "you have not activated"; it
   needs a second case for "your access has lapsed".
5. **Nobody is told their window is closing.** No email goes out at day
   25. Worth adding once volume justifies it — until then a parent's first
   sign that anything was wrong is the companion locking.

---

# Part C — buyers who did not buy on Amazon

Added 2026-08-21. The owner is buying author copies to sell in person at
Islamic events. Those buyers have no Amazon order number, so the Part B
flow cannot serve them.

**Decided: no printed cards or stickers.** At the stall the owner takes
the buyer's email, and the system generates a single-use code and sends
it to them.

## Why emailing beats printing, beyond convenience

A printed card gives you a customer you can never contact again.

`ACCESS_MODEL.md` is emphatic that the mailing list is the real prize —
*"registration is the only mechanism that captures an email from a KDP
sale"*, and worth building *"even if it never earns a penny directly"*.
An event sale is the one moment the buyer is standing in front of you.
Taking their email there captures for free the thing Amazon will never
give you.

So this is not a workaround for not wanting to print. It is the better
mechanism.

## The flow

```
buys a copy at the stall
   -> owner opens the admin page, types their email
   -> code generated, emailed, AND shown on screen
   -> buyer signs up at qasaskids.com and enters the code
   -> 12 months, immediately
```

### The code must appear on screen too

Not a nicety — the failure mode. Email addresses taken by ear at a busy
stall get misheard and mistyped, and a code sent to `gmial.com` is gone
with no way to tell. Showing it on screen means the owner can read it out
on the spot, and the buyer leaves with it either way.

The screen is the delivery mechanism that cannot fail. The email is the
convenience, and the reason to ask for the address at all.

## The code path is BETTER than the Amazon path, deliberately

| | Amazon buyer | Event buyer |
|---|---|---|
| Enters | order number | activation code |
| Access | 30 days provisional | **12 months, immediately** |
| Receipt needed | yes | **no** |
| Human review | yes, Asma | **none** |

That asymmetry is correct, not a loophole. **The code IS the proof of
purchase** — the owner generated it at the moment they took the money.
There is nothing left to verify. The Amazon flow only needs a receipt
because KDP gives no way to check an order number.

It also rewards buying direct, where the margin is better.

## One field, two paths

Do **not** add a second box to the signup form. The existing order-number
field accepts either, and the shape tells them apart:

```
starts "QK-"  ->  activation code  ->  redeem, 12 months, done
otherwise     ->  Amazon order no. ->  activation row, 30 days, await receipt
```

A second field asks every buyer to work out which one they are.

## Code format

Alphabet `23456789ABCDEFGHJKMNPQRSTVWXYZ` — no `0/O`, `1/I/L` or `U`.
Those are the pairs people misread, and every misread is a support email.
It matters more here than on a card: someone may be copying this off a
phone screen the owner is holding.

```
QK-7X9K-4PL2
```

Generate with `crypto.randomBytes`, never `Math.random`. Match
case-insensitively and ignore dashes, so however it is typed, it works.

## Table

```sql
create table public.activation_codes (
  code         text primary key,
  issued_to    text,                       -- email given at the stall
  note         text,                       -- 'Birmingham, 6 Sep'
  created_at   timestamptz not null default now(),
  emailed_at   timestamptz,                -- null = send failed or skipped
  redeemed_by  uuid references auth.users(id) on delete set null,
  redeemed_at  timestamptz
);
create index activation_codes_issued_to on public.activation_codes (lower(issued_to));
```

`redeemed_by is null` means available. No status column — the field
recording who used it is the same field marking it used, so the two can
never disagree.

`issued_to` is the mailing list, accumulating one sale at a time.
`emailed_at` being null is the queue of people to chase.

## Sending the email

**Use the Hostinger mailbox already set up.** `accounts@qasaskids.com`
comes with SMTP, the SPF record is already correct for Hostinger, and it
costs nothing. No new provider, no new dependency, no DNS change — all of
which matter with the listing four days out.

Send from `accounts@`, not `receipts@`. The receipts inbox is Asma's work
queue (Part B) and replies to a code email would pollute it.

If the send fails, **do not fail the request** — the code is already
generated and on screen, which is what the buyer actually needs. Record
`emailed_at` as null and move on.

## Redemption must be atomic

Two people entering the same code at once must not both get a year. The
conditional `UPDATE` guarantees that; a read-then-write does not:

```sql
create or replace function public.redeem_activation_code(p_code text)
returns text language plpgsql security definer as $$
declare
  v_parent uuid := auth.uid();
  v_norm   text := upper(replace(p_code, '-', ''));
  v_found  text;
begin
  if v_parent is null then return 'not_signed_in'; end if;

  update public.activation_codes
     set redeemed_by = v_parent, redeemed_at = now()
   where upper(replace(code, '-', '')) = v_norm
     and redeemed_by is null
  returning code into v_found;

  if v_found is null then
    if exists (select 1 from public.activation_codes
                where upper(replace(code, '-', '')) = v_norm)
      then return 'already_used';
      else return 'not_found';
    end if;
  end if;

  insert into public.entitlements (parent_id, source, starts_at, expires_at)
  values (v_parent, 'direct_sale', now(), now() + interval '12 months')
  on conflict (parent_id) do update
    set source     = 'direct_sale',
        expires_at = greatest(entitlements.expires_at, excluded.expires_at);

  return 'ok';
end $$;
```

`already_used` and `not_found` are distinguished deliberately. It
slightly confirms a code exists, which barely matters at this scale — and
a buyer holding a code that says "already used" needs telling, not
leaving to guess.

## Security

**The table takes no RLS policy at all:**

```sql
alter table public.activation_codes enable row level security;
revoke all on public.activation_codes from anon, authenticated;
```

Nobody selects from it. The `security definer` function is the only way
in, which makes enumerating unused codes impossible rather than merely
hard.

**The admin page needs a real check.** An unprotected code generator is
an unlimited free-access machine. Gate it on an allowlist of admin emails
held in the server environment — not a client check, not a secret URL.

**Rate-limit redemption.** 30^8 makes guessing hopeless, but the cost of
the limit is a few lines and the cost of omitting it is unbounded.

## What the buyer is told at the stall

They need one sentence and a URL, spoken or in the email:

> Go to qasaskids.com, create a parent account, and enter this code where
> it asks for your order number.

## Open

1. **Wrong email typed at the stall.** The code is on screen, so nothing
   is lost — but the mailing-list entry is wrong and nobody will notice.
   Worth showing the address back for confirmation before sending.
2. **Codes generated but never redeemed.** `issued_to` plus
   `redeemed_by is null` is exactly the list of people to nudge. No
   mechanism yet; worth one email after the first event.
3. **Refunds.** Nothing revokes a redeemed code. Delete the entitlement
   row by hand if it ever matters.
