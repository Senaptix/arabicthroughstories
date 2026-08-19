# Student accounts, progress, and a cumulative vocabulary list

**Revised 2026-08-19** — rewritten for a self-hosted VPS. The earlier draft
assumed Supabase; §0.1 records why that changed and what it means.

## Decisions made by the owner

- **Real accounts with cross-device sync** — progress follows a student to
  any device, not local-browser-only.
- **Cumulative "My Words" page** — a searchable list of every vocab word
  from every chapter reached so far.
- **Email + password sign-in** for the parent/teacher. Students do not have
  logins; they are profiles under the adult's account.
- **Deploy the static site to qasaskids.com first**, then add accounts as a
  second phase. See [DEPLOY_HANDOVER.md](C:\ClaudeProjects\qisas-web\DEPLOY_HANDOVER.md).

---

## Phase 0 — Findings, and what changed since the first draft

### 0.1 Supabase is out; Postgres on the VPS is in

The first draft chose Supabase to avoid running a database. Owning a VPS
removes that benefit and one concrete fact reverses the decision:

**Supabase's free tier pauses a project after 7 days of inactivity**, with
roughly a 30-second wake-up. This site's traffic will be bursty — a family
uses it for a week, returns a month later — so the pause would land on real
visits, including a first-time visitor scanning the book's QR code after a
quiet stretch. Removing it costs **$25/mo ($300/yr)** on Supabase Pro.
Postgres on the already-paid-for VPS costs nothing extra and never pauses.
([Supabase free tier limits, 2026](https://automationatlas.io/answers/supabase-free-tier-limits-2026/))

**What does not change:** password-reset email still needs an external
provider. Sending mail directly from a VPS is a deliverability trap — the
messages land in spam and the IP gets blacklisted. This is true of any auth
system, so it is not a cost of self-hosting.

### 0.2 Better Auth, not Auth.js

**Auth.js (formerly NextAuth) is in maintenance.** Its team joined Better
Auth in September 2025; Auth.js now receives security patches only, and
Better Auth is the official successor recommended for new projects. Better
Auth joined Vercel in July 2026.
([official announcement](https://better-auth.com/blog/authjs-joins-better-auth),
[nextauthjs discussion #13252](https://github.com/nextauthjs/next-auth/discussions/13252))

It is also the better technical fit regardless of that: Better Auth has
first-class email+password with **database sessions**, while Auth.js's
Credentials provider is a manual flow that forces JWT sessions. Database
sessions mean a login can be revoked instantly — worth having on an account
that a parent may share with a school.

**Anti-pattern guard:** do not follow Auth.js/NextAuth tutorials for this
build, including the `@auth/pg-adapter` snippets. They are for the
predecessor library and their APIs do not carry over.

### 0.3 The security boundary moves, and this is the main thing to get right

Under Supabase, the browser talks to the database directly and **Row Level
Security** is what stops one account reading another's rows. Self-hosted,
only the Next.js server talks to Postgres and no browser ever holds a
database credential — which is safer by default, but it moves the boundary
into application code. **Every query must be scoped to the signed-in
account, and nothing in the database will catch it if one is not.**

So: route every read and write through a single helper that takes the
session and applies the scope. Do not hand-write `WHERE student_id = ...`
at call sites, where one forgotten clause is a cross-account data leak.

```ts
// lib/db/scoped.ts — the ONLY way app code reaches student data.
// Takes the session, never a raw id from the request.
async function studentsFor(session: Session): Promise<Student[]>
async function assertOwnsStudent(session: Session, studentId: string): Promise<void>
```

### 0.4 Keep the content pages static — fetch progress on the client

The site is currently **109 routes, all prerendered**, and that is the whole
performance budget (`WEBSITE_BUILD.md`). Server-rendering a "✓ completed"
badge onto the book landing page would make it dynamic, adding a database
round-trip to every visit **including every signed-out one**.

Instead: content pages stay static, and progress is fetched by a small
client component after hydration, from a JSON route. A checkmark appearing
a moment late is not a problem; making the whole site dynamic to render it
would be.

**This is a hard constraint, not a preference.** Only `/account`,
`/my-words` and the API routes may be dynamic. A content route turning `ƒ`
in the build output is a regression to fix, not to accept.

### 0.5 Verified APIs

Read these before writing code — do not reconstruct the config from
memory or from this file:

- **Better Auth install and email+password config** —
  https://better-auth.com/docs/installation and
  https://better-auth.com/docs/authentication/email-password
- **Next.js App Router integration** —
  https://better-auth.com/docs/integrations/next

Confirmed from the integration docs:

```ts
// app/api/auth/[...all]/route.ts
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
export const { GET, POST } = toNextJsHandler(auth);
```

```ts
// reading the session in a Server Component
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
const session = await auth.api.getSession({ headers: await headers() });
```

**Not yet verified, and to be copied from the docs at build time:** the
`lib/auth.ts` config object for email+password against Postgres, and the
password-reset hook. The integration page defers both. Do not invent option
names — if a needed option is not in the docs, stop and report it.

### 0.6 Reuse, do not rebuild

- `parseVocabulary(slug)` already returns `{ index, ar, en, page }` where
  `page` is first appearance — exactly what the glossary needs. **No vocab
  data goes in the database.** The database stores only which pages a
  student finished; the words are derived from content at build time.
- `components/Practice.tsx` already computes `done = step >= usable.length`
  ([Practice.tsx:81](C:\ClaudeProjects\qisas-web\components\Practice.tsx:81)).
  That is the existing "page finished" moment — hook it, do not invent a
  second one.
- Reuse `VocabCards` for the glossary rather than writing a new card.

### 0.7 Convergence with ACCESS_MODEL.md

[ACCESS_MODEL.md](C:\ClaudeProjects\Who Broke the Idols\ACCESS_MODEL.md)
already specs a sign-in phase for a different purpose — proving book
ownership to unlock all pages — and asks (open question 3) whether a
classroom is one teacher account or thirty independent ones.

Shaping this as **one login → many student profiles** answers that question
and leaves room for an entitlement table on the same `account` row later.
**This plan does not build the ownership gate**; that has open commercial
questions which are the owner's to answer. It only avoids a schema that
would need reworking.

Guards carried over and binding here: no account required to reach a
printed URL; no expiry logic; no subscription plumbing; the open tier
(preview, root families, vocabulary index) stays ungated.

---

## Phase 1 — Postgres and sign-in

**Prerequisite:** the static site is live on qasaskids.com and verified.

1. **Postgres on the VPS**, listening on localhost only:
   ```bash
   sudo apt install -y postgresql
   sudo -u postgres createuser --pwprompt qasas_app
   sudo -u postgres createdb --owner=qasas_app qasas
   ```
   Confirm `listen_addresses = 'localhost'` in `postgresql.conf`. The
   database must not be reachable from the internet; the firewall from
   DEPLOY_HANDOVER.md §5.2 already closes everything but 22/80/443.

2. **Secrets** in an env file readable only by the `qasas` user
   (`chmod 600`, owned `qasas:qasas`), never in the repo:
   `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, and the mail
   provider key. Add `.env*` to `.gitignore` if not already covered, and
   document the names in `.env.example` with empty values.

3. **Better Auth**, per the docs in §0.5: email+password enabled, database
   sessions, its own tables created by its migration tooling — do not
   hand-write Better Auth's schema.

4. **Password-reset email.** Use a transactional provider (Resend, Postmark
   or SES — Resend's free tier is ~3,000/month, far beyond need). Verify
   SPF/DKIM for qasaskids.com so resets do not land in spam. **Never send
   mail directly from the VPS.**

5. **`/account`**: sign up, sign in, sign out, request reset, set new
   password.

**Verification:** register a real address; receive and complete a reset;
confirm the session survives a restart of the Node service (it will only if
sessions are in the database, which is the point); confirm Postgres refuses
a connection from off-box; `npm run build` still shows every content route
static, with only `/account` and the auth API dynamic.

**Anti-pattern guard:** no password handling in application code beyond
handing it to Better Auth. Do not write a hash, comparison, or reset-token
generator by hand.

## Phase 2 — Student profiles

```sql
create table students (
  id          uuid primary key default gen_random_uuid(),
  account_id  text not null references "user"(id) on delete cascade,
  name        text not null,
  created_at  timestamptz not null default now()
);
create index on students (account_id);
```

`"user"` is Better Auth's table — confirm the actual name and id type
against the schema its migration produces before writing this, rather than
assuming.

- `/account` lists the signed-in account's students and adds one by **name
  only**. No child email, birthday, photo or other personal data: the
  account belongs to the adult, which keeps children's personal data out of
  the system entirely.
- Active student held in an **httpOnly cookie** (`active_student_id`) so
  server code reads it without a round-trip. **Validate it against the
  session on every use** via `assertOwnsStudent` — a cookie is user-editable
  and must never be trusted as an identity.

**Verification:** two students under one account; switching changes the
cookie; hand-editing the cookie to another account's student id is rejected,
not served.

## Phase 3 — Persist page completion

```sql
create table page_completions (
  student_id   uuid not null references students(id) on delete cascade,
  book_slug    text not null,
  page         int  not null,
  completed_at timestamptz not null default now(),
  primary key (student_id, book_slug, page)
);
```

The primary key makes re-completing a page idempotent — no duplicate rows,
no upsert logic to get wrong.

- Server Action `markPageComplete(bookSlug, page)`: resolves the active
  student **through the session**, then inserts. Ignores a conflict.
- `Practice.tsx` calls it once when `done` first becomes true, and only when
  a student is active. Signed-out behaviour is byte-for-byte today's.
- `GET /api/progress` returns the active student's completed pages as JSON,
  for the client-side badges described in §0.4.

**Anti-pattern guard:** do not persist per-exercise right/wrong here. That
is deferred (see below) and adding it now expands the schema for a feature
nobody asked for.

**Verification:** complete a page, see the row; complete it again, still one
row; the badge appears on the book landing page **without** that page
turning dynamic in the build output.

## Phase 4 — "My Words"

Route `/books/[book]/my-words` (dynamic — it reads the session).

```ts
const furthest = Math.max(0, ...completed.map((c) => c.page));
const known = parseVocabulary(slug).filter((w) => w.page <= furthest);
```

**ponytail: credits every word up to the furthest page reached**, rather
than only pages individually completed — right for a picture book read
front-to-back, and one `MAX()` instead of a join. Upgrade path if a teacher
ever assigns pages out of order: switch to exact membership in the
completed set.

Search is a client-side `.filter()` over the fetched list — a few hundred
words needs no search service. Each entry links to its first-seen page.
Link in from the book landing page and each page card's "Explore more"
block, beside the existing Practice link
([page.tsx:251](C:\ClaudeProjects\qisas-web\app\books\[book]\[pageSlug]\page.tsx:251)).

Signed-out, the route still resolves and explains what signing in gives —
never a 404 and never an unexplained empty list.

**Verification:** a student who finished pages 3–10 sees exactly the entries
with `page <= 10`, searchable in Arabic and English; a page-15 word is
absent; finishing page 11 adds page 11's words.

## Phase 5 — Verification

1. `npm run build`: content routes still static; only `/account`,
   `/my-words` and API routes dynamic.
2. Signed out, every existing route behaves exactly as before.
3. Two students under one account keep separate progress and glossaries.
4. **Cross-account isolation:** signed in as account A, attempt to read
   account B's student and completions by id — via the cookie, via any API
   route, via any URL parameter. All must be refused. This is the check that
   matters most; §0.3 explains why the database will not catch a mistake.
5. Session revocation: signing out invalidates the session server-side.
6. Reset flow works end to end and the mail is not spam-filtered.
7. `npm audit` clean.
8. Reboot the VPS; site and sign-in both return unattended.

## Deliberately deferred

- **Per-exercise history across sessions** ("what did I get wrong last
  time") — `Practice.tsx` already holds this live; persisting it is a
  `results jsonb` column away, but it was not asked for.
- **The ownership/entitlement gate** — ACCESS_MODEL.md's open commercial
  questions come first.
- **Teacher bulk invite** — one login with many profiles covers a family and
  works for a class by hand; optimise only if a school actually asks.
- **Automated backups** — out of scope here, but note that the moment this
  ships, the VPS holds data that is not in git. Raise it with the owner
  before Phase 3 goes live.
