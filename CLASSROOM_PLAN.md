# Classes, teachers and homework — plan

**Status: proposal, nothing built.** Written 7 September 2026 after a teacher
(Thamina) asked for a teacher account with pupils linked to it, so she can set
homework and see it was done. She builds homework on Wordwall today, and
mentions Quizlet for older pupils because its algorithm retests what they got
wrong last time.

**Revised the same day, after she clarified how those platforms actually work:**

> There is a teacher account and students can just put their name in and access
> the material / submit homework.

That one sentence removed most of this plan. The first draft designed classes,
memberships, join codes and a parent-consent linking flow — an apparatus whose
only purpose was to give each pupil an identity inside our system. **Pupils do
not need an identity in our system.** The superseded design is summarised at the
bottom for decision history; do not build it.

## What already exists

Do not rebuild any of this. From `ACCOUNTS_PLAN.md` and the migrations:

| Thing | Where | Note |
|---|---|---|
| Adult accounts | Supabase Auth | email/password, confirmed email |
| Child profiles | `child_profiles` | max 5 per adult, nickname + icon only. **No email, DOB, photo or password** |
| Furthest page | `book_progress` | drives Continue Reading |
| Exact per-page record | `page_progress` | `read_completed_at`, `practice_completed_at`, `best_correct`, `graded_total` |
| Access | `entitlements` | one row per **(parent, book)**, time-limited, admin-approved from an Amazon order |
| Practice | `content/data/<book>.exercises.yaml` | five types: `match`, `choose`, `order`, `question`, `pattern` |

## The model: teacher accounts, anonymous pupils

- The **teacher** has a real account. She signs in, creates assignments, reads
  results. Gate teacher status behind admin approval, reusing the `activations`
  review pattern rather than inventing a second queue.
- The **pupil** has nothing. She sends a link. The pupil opens it, types a name,
  does the activity, and the result is recorded against that typed name.
- Family accounts are untouched. This runs alongside them, sharing no tables.

### The decision this forces: what does an assignment link expose?

Wordwall can hand out its activities freely because the teacher made them. Ours
are derived from a book we sell. If an assignment link lets anyone type a name
and read pages 3–5, the link leaks and the book is free.

**Recommendation: an assignment link opens practice only — never the reading
pages, the page images or the audio.**

An exercise over twelve vocabulary words is not the book. This is precisely what
Wordwall does: activities, not textbooks. The reading pages, artwork and
narration stay behind `entitlements`, so a school still buys its copies, while
the homework flow stays as frictionless as the platforms Thamina already uses.

If we ever relax this, relax it deliberately — it is the wall between a
companion and a free substitute for the product.

### Schema sketch

```sql
create table assignments (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users(id) on delete cascade,
  title text not null,                 -- "Yusuf pages 3-5, due Friday"
  book_slug text not null,
  page_from integer not null,
  page_to integer not null,
  token text not null unique,          -- the shareable link, rotatable
  opens_at timestamptz,
  closes_at timestamptz,               -- homework window; expired links stop working
  archived_at timestamptz,
  created_at timestamptz not null default now()
);

create table assignment_attempts (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references assignments(id) on delete cascade,
  pupil_name text not null check (char_length(pupil_name) between 1 and 40),
  page_number integer not null,
  correct integer not null check (correct >= 0),
  total integer not null check (total >= 0),
  completed_at timestamptz not null default now(),
  check (correct <= total)
);

create index assignment_attempts_lookup
  on assignment_attempts(assignment_id, pupil_name);
```

No `classes`. No `class_members`. No join codes. No changes to
`child_profiles`, `page_progress` or their RLS policies.

`assignment_attempts` is written by an unauthenticated route, so it must be
written **server-side only** with the service-role key, never exposed to `anon`
through PostgREST. The route validates the token, checks the window, and clamps
the page to the assignment's range.

### What the teacher sees

One table per assignment: pupil name, which pages they completed, score, when.
Nothing cleverer for v1. She asked to see that homework was done, not for a
gradebook.

## Two honest weaknesses of this model

**A typed name proves nothing.** Any pupil can type any name, or two can type
the same one. Wordwall lives with this and so can we — the stakes on a
vocabulary drill are low. Do not build anti-spoofing; do surface duplicates in
the results table so the teacher spots them.

**Typed names are the first personal data we hold about a child.** Today
`child_profiles` deliberately holds nickname and icon only. A real first name
typed by a pupil is more identifying than that, so it needs handling:

- Ask for first name and initial in the placeholder, not a full name.
- Set a retention rule — delete attempts a fixed period after the assignment
  closes, and say so on the page.
- Names live only under the teacher who created the assignment.

This is proportionate and standard for the sector, but it is a change of posture
and should be recorded in `ACCOUNTS_PLAN.md` when built, not slipped in.

## Optional bridge to family accounts

If a pupil happens to be signed in on a family account when they open an
assignment link, also write the result to their own `page_progress` so it counts
toward Continue Reading and My Words. Nice to have. Not v1, and never required —
the link must work for a signed-out child on a borrowed device.

## What Wordwall does that we do not

The mechanic worth stealing is not any single game. It is that **content is
separate from presentation**: enter a content set once and switch it between
templates — Match becomes Quiz becomes Crossword becomes Wordsearch — with one
click.

We are partway there. `match` already takes no arguments because it is derived
from the page's vocabulary. But `choose`, `order` and `pattern` are hand-authored
per page in the exercises YAML, so content and template are welded together.

The direction: treat each page's vocabulary and sentence bank as the content,
and make the exercise types renderers over it. Then new formats are cheap, and
an assignment could specify which formats it uses.

**Hard constraint.** `lib/parse.check.ts` re-checks every Arabic token against
the verified corpus at build time, and the exercises file warns that `pattern`
recombinations "still need a native read before they are final" — a case ending
correct in isolation can be wrong in a new position. We may generate new
*arrangements* of verified material; we must never let a teacher generate
arbitrary new Arabic.

## What Quizlet does that we do not — and the privacy question

"Retest what they got wrong" needs per-item memory. Today we store only the
aggregate (`best_correct`, `graded_total`), and `ACCOUNTS_PLAN.md` states that
**individual answers are never stored**.

That rule need not break. A scheduler consumes *how well the child knows each
word*, not *what they answered*:

```sql
create table word_review (
  child_id uuid not null references child_profiles(id) on delete cascade,
  book_slug text not null,
  word_key text not null,            -- the vocabulary entry, not an answer
  box smallint not null default 1,   -- Leitner box, or an SM-2 interval
  due_on date not null,
  last_result boolean,
  primary key (child_id, book_slug, word_key)
);
```

Note this keys on `child_id`, so it only works for **signed-in family
accounts** — an anonymous pupil typing a name has no continuity between
sessions, and spaced repetition needs continuity. Adaptive retesting is
therefore a family-account feature, not a homework-link one. That is a real
limit of the anonymous model and worth telling Thamina plainly.

## Commercial model

`ACCESS_MODEL.md` already ranks **bulk/classroom licensing** as lever 5, and
already decided the digital unlock is **free with the book**. Keep that. Selling
books and granting seats also avoids a UK VAT mixed-supply problem: printed
books are zero-rated, digital services are standard-rated at 20%.

The school route the owner proposed — sell the school ten author copies direct,
cheaper than Amazon, and include the companion — fits this exactly.

**Open number:** the margin table in `ACCESS_MODEL.md` is for the $9.99 **ebook**
(~$6.85 KDP vs ~$8.50–9.00 direct). Paperback author-copy economics are not in
the repo. Book 1 is 54pp and Book 2 projected ~66pp, both **full-colour
interiors**, where premium colour print cost dominates. Get the real figure from
KDP's calculator before quoting a school.

Operational notes for a direct school sale: ship author copies to the school
address rather than via the owner; expect to raise an invoice for bank transfer
rather than take a card; confirm KDP's current author-copy resale terms.

## Phasing

| Phase | Scope | Notes |
|---|---|---|
| 0 | Confirm practice-only links; agree teacher approval and retention rule | No code |
| 1 | `assignments`, `assignment_attempts`, link route, teacher results table | Answers the request |
| 2 | Assignment picks which exercise formats to use | Needs the content/template split |
| 3 | `word_review` spaced repetition, family accounts only | Needs the `ACCOUNTS_PLAN.md` amendment |

Phase 1 no longer touches the accounts system at all, which makes it markedly
smaller and lower-risk than the superseded design.

## Risks

- **Link leakage.** Practice-only containment is the mitigation. Also give links
  a close date and make the token rotatable.
- **Supabase free-plan pausing.** `ACCOUNTS_PLAN.md` records that a free project
  pauses after a week of inactivity and resumes by hand. A class arriving Monday
  to a paused project is worse than one family hitting it. Pro is **$25/month**
  (checked 7 September 2026, first project included, $10 compute credit covers
  the Micro instance). If teachers depend on this, budget it with the feature.
- **Scope creep into a VLE.** Wordwall and Quizlet are whole products. This site
  is a companion to a printed book. The results table is the feature; a
  gradebook is not.

## Open questions

1. Practice-only links confirmed, or does homework need the reading pages too?
2. Retention period for typed pupil names?
3. Does this move the project to Supabase Pro now, or at first real class use?
4. Will Thamina pilot Phase 1 with one real assignment before Phase 2?

## Superseded: the account-linked design (do not build)

The first draft proposed `classes`, `class_members` with join codes, a
parent-enters-the-code consent flow, `teacher_label` for roster mapping, and an
RLS policy letting a teacher read `page_progress` for assigned pages. It also
weighed school-owned pupil profiles, which hit the five-profile cap trigger in
`child_profiles`.

All of it existed to give pupils an identity in our system. Thamina's
clarification showed the platforms teachers already use do not do this, so the
complexity bought nothing. Recorded here so the reasoning is not rediscovered.
