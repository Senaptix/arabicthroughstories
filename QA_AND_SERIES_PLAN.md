# Full QA report, and how the series continues — 2026-08-22

Read-only audit, three days before the Amazon listing. **Nothing in this
document has been fixed — it is findings and a plan.** Every claim below was
verified against the live site, the migrations as written, or the code as
deployed, not assumed.

The second half answers the series question: what happens to an existing
member when Book 2 ships, and how a family's journey continues across books.

---

## Part 1 — findings, ranked

### F1. Audio for gated pages is fully public — HIGH, decision needed

Verified live, signed out:

```
https://qasaskids.com/audio/ibrahim/p30.mp3  -> 200, 351KB
https://qasaskids.com/audio/ibrahim/p52.mp3  -> 200, 245KB
```

The gate withholds a page's Arabic text, but every one of the 50 clips sits
in `public/audio/` behind a guessable URL (`p11.mp3` … `p52.mp3`), served by
nginx with a 30-day cache header. Anyone can download the entire narration
without an account.

Options, honestly weighed:

- **Accept and document.** The text is the product ACCESS_MODEL.md set out to
  protect; audio without the vowelled text on screen is a much weaker
  substitute (WEBSITE_DESIGN.md's own argument). Zero work.
- **Gate it.** Means moving audio out of `public/` behind an authenticated
  route — losing nginx caching and needing careful Range-request handling
  (seeking breaks without it) — or nginx `auth_request`. Real work, real
  performance cost, days before launch.

**Recommendation: accept for launch, write the decision down, revisit if
scraping is ever observed.** But it should be a decision, not an oversight.

### F2. No way to activate, renew, or add a book AFTER signup — HIGH

The order-number/code box exists in exactly one place: the signup form.
Verified: `redeem_activation_code(p_code)` is granted to `authenticated` in
the database and **nothing in the app calls it**. The RLS insert policy
"Parents create pending activation claims" exists and **no UI uses it**.

Everyone below is dead-ended, with support email as the only path:

| Who | Situation |
|---|---|
| Rejected receipt | Asma sets `rejected`; parent cannot submit a corrected order number |
| Lapsed provisional | Day 31; their receipt never arrived; no way to try again |
| Pre-Part-B accounts | Signed up before the field existed; no entitlement, no way to claim one |
| Event buyer with an account | Already registered; the code has nowhere to go |
| **Every future Book 2 buyer who is an existing member** | The order number for the new book has nowhere to go |

The last row makes this the single most important build item: **it is the
mechanism by which the series sells.** The database already anticipates it —
only the form is missing. See Part 2.

### F3. No Supabase backups — HIGH, operational

Deferred earlier on the reasoning "the box holds nothing that is not in
git." **That stopped being true when accounts shipped.** Parents, children's
profiles, reading progress, activations, entitlements and activation codes
now exist only in Supabase. On the free tier there are no backups; a
mistake in the table editor (where Asma works daily) is unrecoverable.

Also: the VPS env file (`/srv/qasas/qasas.env`) is the single copy of the
issuer secret and SMTP password. Losing the box means re-keying, not
restoring.

### F4. The free-tier pause can take the whole gated site down — HIGH

Supabase free tier pauses a project after 7 days without **database**
activity. The sharp part, verified in `lib/access.ts`: **anonymous page
renders never touch the database** — `getMembershipState` returns
`signed-out` before any query. So a quiet-but-visited site still counts as
inactive. If no one *signs in* for a week, the project pauses, and every
signed-in request and every gated page then fails until it wakes (~30s,
after the first victim's request).

Mitigation is cheap: a daily cron on the VPS making one authenticated-path
query, or Supabase Pro. Doing nothing is the only wrong option.

### F5. The progress API skips the access seam — MEDIUM

`requireProgressContext()` checks signed-in + active profile, not
membership. A signed-in account with **no entitlement or a lapsed one** can
still POST progress against gated pages and read progress back. No content
leaks, but writes land where the gate says the user cannot be — the one
place `canViewPage()` is not consulted. The fix is one call inside the
context helper; the design question is only whether free-page progress
should work without an entitlement (recommend: yes, use `canViewPage`
per-page, which answers exactly that).

### F6. GateNotice tells signed-in users to "create the parent account" — MEDIUM

The `not-activated` branch says *"Enter the Amazon order number when you
create the parent account."* A signed-in user without an entitlement (F2's
population) already has an account. The copy sends them to re-register; the
right destination is the F2 form once it exists.

### F7. Email deliverability is half-verified — MEDIUM

SPF is in place. DKIM: only one Hostinger selector resolved
(`hostingermail-a`); the full set was not confirmed, and no delivery test
has checked where a Gmail or Hotmail recipient's confirmation actually
lands, or that Asma's code email *arrived* (the UI said sent; arrival was
never confirmed). Every buyer on the 25th gets a confirmation email —
spam-foldering it is a conversion cliff. Ten-minute check in the Hostinger
panel plus one test send to Gmail, reading the `Authentication-Results`
header.

### F8. Deploys are still manual — MEDIUM, already bitten twice

Work sat invisible in GitHub twice this week while the VPS served old code.
With launch-day changes coming (`buy_url`), the risk repeats at the worst
time. A GitHub webhook or a cron `git pull && deploy` closes it.

### F9. Three paths have never been exercised end to end — MEDIUM

1. **Code redemption**: `QK-ZPPK-G8AE` is issued, emailed, unredeemed. The
   path an event buyer takes has never run. Expect `direct_sale`, ~Aug 2027,
   and **no receipt banner**.
2. **The lapse**: nobody has ever seen day 31 (set a test account's
   `expires_at` to yesterday; expect the "has ended" notice, not "ends
   today").
3. **The full Amazon loop**: signup → confirm → Asma flips one cell →
   12 months, banner disappears.

All three are user-runnable in minutes; the owner has them queued.

### F10. Smaller items — LOW

- **Doc drift:** ACCESS_MODEL.md still argues "no expiry on a purchased
  book, ever" — the implemented model is a 12-month expiring membership,
  consciously chosen later. Add a supersession note so the next reader
  doesn't build to the old doctrine.
- **Stacking policy undecided:** `greatest()` means buying another book
  mid-membership gives `max(remaining, 12 months)` — not `remaining + 12`.
  Defensible, but it is a pricing decision currently made by an SQL
  function. (See Part 2.)
- **Rejected receipts notify no one.** Asma sets `rejected`; the parent
  learns nothing until lapse. Manual email is fine at launch volume; note it.
- **Landing page hardcodes `SLUG = "ibrahim"`.** Correct today; at Book 2
  the homepage becomes a storefront question (BookCard/getAllBooks already
  exist for it).
- Dead `vowelling` enum in the schema (graded-vowelling plan scrapped);
  remove on next schema touch.
- My Words is per-book via `?book=` — works for Book 2 unchanged, though a
  cross-book "passport" view is the natural upgrade (roots.md already calls
  vocabulary a series-level asset).

### What was checked and found sound

The gate itself (pages and practice, zero Arabic in gated HTML, `no-store`
on gated responses); both redirect guards now shared and bypass-tested; the
signup trigger correctly branches QK codes (atomic redemption inside the
signup transaction) from Amazon numbers (activation row → provisional
trigger); RLS on all tables with the code tables locked to
security-definer-only; admin double-gated (ADMIN_EMAILS + issuer secret) and
re-checked inside components; rate limiting on redemption; `randomBytes`
with modulo-bias rejection; SMTP working end to end; the receipt countdown
banner; the pending-activations queue.

---

## Part 2 — the series: what happens at Book 2

### What the code does today, stated plainly

`entitlements` is keyed on `parent_id` alone, and `canViewPage(slug, page)`
checks membership **without looking at the slug**. Membership is
**account-wide**.

**So yes: the day Book 2's content ships, every member with time remaining
gets its full companion automatically.** No schema change, no code change,
no re-purchase. A child's journey continues because nothing ever ended:
same login, same profiles, `page_progress` and `book_progress` are already
keyed by `book_slug`, My Words already takes `?book=`.

### Is that the right model? Yes — and it should be made explicit

This matches the strategy already chosen (the Noor Kids analysis): **one
Qasas Kids membership, which a book purchase enters you into for 12
months.** The book is the acquisition channel; the membership is the
product; future books are part of what the membership includes and part of
why year-2 renewal is worth paying for.

The alternative — per-book entitlements (`parent_id, book_slug`) — sells
each companion separately. More revenue per family on paper, but it
fragments the "journey" the brand is built on, adds a purchase decision at
every book, and contradicts the membership pitch already implied by the
receipt banner and activation copy.

**The decision that must be made now, not at Book 2:** whichever model, in
writing. Members who join under all-books-included terms cannot have Book 2
taken back out of their membership later without exactly the reviews
ACCESS_MODEL.md warns about. Switching from account-wide to per-book after
launch is expensive and reputationally worse than either choice made
up-front. Recommendation: **commit to account-wide membership** and update
ACCESS_MODEL.md to say so.

### How buying Book 2 works for each person

| Buyer | Path | Builds on |
|---|---|---|
| New family, Book 2 first | Signup with Book 2's order number — works today | Nothing new |
| **Existing member, active** | Enters new order number in the **add-a-book form (F2)** → activation row → Asma approves → `greatest()` extends | F2 form |
| **Existing member, lapsed** | Same form; approval restores 12 months | F2 form |
| Event buyer, existing account | Same form, QK code path → `redeem_activation_code` (already granted, uncalled) | F2 form |

One form closes every row. That is why F2 is the series mechanism and not
just a support convenience.

### The stacking decision

`greatest(existing_expiry, now + 12 months)`: a member with 8 months left
who buys Book 2 ends up with 12 months — they gain 4, not 12. Simple, never
shortens anyone, slightly stingy. The generous alternative (`expiry + 12
months`) rewards loyal buyers but needs a small trigger change and a cap
policy (a family buying five books at once = 5 years?). **Either is
defensible; pick one deliberately and put it in the plan doc.** Default if
undecided: keep `greatest()`.

### What Book 2 actually requires when the time comes

1. **Content only, for access:** `content/books/<slug>.yaml` + pages,
   vocabulary, roots, exercises, timings, audio, preview images. Every
   guard, gate and progress table is already slug-aware. (Per the scrapped
   SERIES_PLAN ladder, Book 2 stays fully vowelled.)
2. The **F2 form**, ideally shipped long before.
3. A **storefront decision**: today `/` *is* the Book 1 funnel. Book 2 needs
   either a books index above it or per-book landing sections.
4. `buy_url` per book — already a per-book field.
5. Cross-book My Words / "reading passport" — optional polish, the data
   model already supports it.

---

## Part 3 — the plan, sequenced

**P0 — before the 25th** (hours, mostly not code):

1. Run the three untested paths (F9) — user-runnable, already queued.
2. Backups (F3): nightly `pg_dump` via cron on the VPS to offsite storage;
   copy `qasas.env` values into the password manager.
3. Keep-alive (F4): daily authenticated-path query from a VPS cron — or
   budget Supabase Pro.
4. DKIM + spam-placement test (F7).
5. Write down the audio decision (F1) — recommend: accepted for launch.
6. Launch day itself: paste `buy_url`, push, deploy, click the button live.

**P1 — first week after launch:**

7. **The add-a-book / activation form (F2)** — small build, biggest gap:
   one server action (order number → `activations` insert via the existing
   RLS policy; `QK-` → `redeem_activation_code`), one form on the account
   page, and GateNotice copy (F6) repointed at it.
8. Progress API membership check (F5) — route writes through `canViewPage`.
9. Deploy webhook (F8).
10. Supersession note in ACCESS_MODEL.md + the written series-model
    decision (Part 2).

**P2 — before Book 2 enters production:**

11. Stacking policy, decided and encoded.
12. Storefront shape for a two-book site.
13. Rejected-receipt notification (even a manual template for Asma).
14. Cross-book My Words / passport, schema cleanup (`vowelling`).

---

*Compiled read-only. No fixes were applied while auditing.*

---

## Progress log — 2026-08-22

### Built

- **F2 — add-a-book form.** `claimBook` action + `BookClaimer` on the account
  page at `#add-a-book`. QK codes redeem via `redeem_activation_code`;
  anything else inserts an activation through the existing RLS policy. An
  identical pending claim is reported rather than duplicated.
- **F6 — GateNotice** no longer tells a signed-in visitor to create the
  account they already have; it links to the new form.
- **Banner correctness (found while building F2).** ReceiptNotice keyed off
  entitlement `source`, but `grant_provisional` only updates `expires_at` on
  conflict — so an existing member claiming another book stays
  `book_activation` while owing a receipt, and would never have been asked.
  Now keys off a pending activation row.
- **F5 — progress writes** route through `requireProgressAccess`, checked per
  page so free-preview progress still saves without an entitlement. `status`
  keeps the plain context: it returns progress rows, not content.
- **F3 groundwork** — `postgresql-client` installed, `/srv/qasas/backup.sh`
  written, cron at 03:17 UTC, 14-day retention, partial-file and
  suspiciously-small-dump guards. **Blocked on one credential** (below).

### F1 — audio access: DECIDED, accept for launch

The 50 narration clips stay publicly downloadable at guessable URLs.

The gate protects the **vowelled Arabic text**, which is what
ACCESS_MODEL.md set out to keep in print, and what WEBSITE_DESIGN.md argues
the audio is worthless without — *"audio alone is a different, worse
product"*. Gating it would mean moving audio out of `public/` behind an
authenticated route, losing nginx caching and hand-rolling HTTP Range
support (without which seeking breaks mid-clip for a child), or nginx
`auth_request`. Days before a listing, that trade is wrong.

**Revisit if** scraping is observed, or if audio ever becomes the primary
product (an app, a podcast feed). Recorded here so it reads as a decision
rather than an oversight.

### F10 — ACCESS_MODEL.md supersession

That document still argues **"No expiry on a purchased book"** and calls
re-charging "the kind of thing that lands in reviews". The implemented model
is a **12-month membership** that lapses. This was a later, deliberate
choice — the book buys a year of the companion, and renewal funds the series
— but the two documents now disagree and the older one is in CLAUDE.md's
reading order. It needs a supersession note in the book repo.

### Still blocked on the owner

1. **`SUPABASE_DB_URL`** — pooler connection string from Supabase → Project
   Settings → Database. Contains a password, so it cannot be pasted into a
   transcript. Once set, backups AND the F4 keep-alive both start working:

   ```
   read -rsp 'Supabase DB URL: ' V; echo
   printf '\nSUPABASE_DB_URL=%s\n' "$V" >> /srv/qasas/qasas.env
   unset V
   /srv/qasas/backup.sh          # expect: ok /srv/qasas/backups/... (NNNKB)
   ```

   If the password contains `$`, `#` or a quote, single-quote the value —
   same systemd/`EnvironmentFile` trap as `SMTP_PASSWORD`.

2. **F7 — DKIM and a spam-placement test.** Dashboard work.
3. **F9 — the three untested paths.** Redemption, the lapse, the approve loop.
4. **Launch:** paste `buy_url`, push, deploy, click the live button.
