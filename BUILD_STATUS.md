# Build status — qisas-web

Resume point for the next session. Written 2026-08-05.

**Repo:** `C:\ClaudeProjects\qisas-web` (separate from the book repo at
`C:\ClaudeProjects\Who Broke the Idols`, per `WEBSITE_BUILD.md`).

The authoritative specs live in the **book repo**, not here:

| For | Read |
|---|---|
| Visual language — colour, type, components | `../Who Broke the Idols/WEBSITE_DESIGN.md` |
| Architecture, URL scheme, hosting, phases | `../Who Broke the Idols/WEBSITE_BUILD.md` |
| What goes on each page and why | `../Who Broke the Idols/WEBSITE_PLAN.md` |

---

## Stack as built

Next 16.3 · React 19.2 · Tailwind **v4** (CSS-first `@theme`, so
`app/globals.css` *is* the design system) · TypeScript · zod · js-yaml · tsx.

---

## Done and verified

### Data layer — `lib/` ✅ verified against source
- `lib/schema.ts` — zod schemas. Arabic strings are never normalised or
  stripped; a wrong vowel changes the word.
- `lib/parse.ts` — parses the book repo's markdown into typed objects.

**Verified output** (run against real data, not assumed):
- **285 vocabulary entries** — matches the source's own Counts section exactly.
- **32 root families**, spanning pages 3–52.
- Arabic byte-identical through the parse (spot-checked first, last, and the
  two-form `صَنَمٌ / أَصْنَامٌ` entry).
- Page 52 correctly surfaces the **س ج د** family — the masjid↔sujud payoff.

Two guards that fail the build loudly rather than shipping bad data:
1. **Vocabulary index continuity** — a gap or repeat in the numbered source
   table means a row was dropped or duplicated during editing.
2. **Family word/page length match** — words and pages are matched *by
   position*; a mismatch would silently misattribute every pairing after it.

⚠️ **`ROOTS.md` contains TWO tables.** The parser deliberately targets the
`## Full list` section (all 32 families), NOT `## The twelve for the printed
appendix` (curated subset, page numbers embedded inline in a different
format). Parsing the wrong one yields plausible-looking but wrong data.

### Content — `content/` ✅
- `content/books/ibrahim.yaml` — book metadata.
- `content/data/ibrahim.{vocabulary,roots}.md` — **copies** taken from the
  book repo at build time, per the copy-at-release rule. Re-copy when the
  book data changes; don't symlink.

### Routes — `app/` ✅ written, not yet built/verified
- `app/layout.tsx` — Scheherazade New (Arabic) + Lexend Deca (Latin) via
  `next/font/google`, self-hosted at build time.
- `app/page.tsx` — library home.
- `app/books/[book]/page.tsx` — book overview; the complete clickable
  word-family appendix.
- `app/books/[book]/[pageSlug]/page.tsx` — **the QR landing route**, with
  `generateStaticParams` over every book × page.

**URL shape is frozen: `/books/<slug>/p<NN>`** (e.g. `/books/ibrahim/p39`).
The folder is `[pageSlug]` and the `p` prefix is parsed inside, because a
nested `/p/[page]` would emit `/books/ibrahim/p/39` — wrong. This string gets
printed into physical books and can never change.

---

## Components — ✅ landed, typecheck clean, NOT yet reviewed by me

`app/globals.css` + `components/{WordList,RootFamily,BookCard,AudioPlayer}.tsx`
all written. `tsc --noEmit` and `eslint` both pass. Only `AudioPlayer` is
`'use client'`, as intended.

Tokens are defined **twice on purpose**: as Tailwind v4 `@theme` names
(`--color-brand-blue` → generates `bg-brand-blue` etc.) *and* as plain
`:root` custom properties (`--brand-blue`), because components need raw hex
in inline `style` for the `clamp()` Arabic sizing. Worth keeping in mind if a
colour ever needs changing — **change both**.

⚠️ **I have not visually reviewed these.** They typecheck; that says nothing
about whether the Arabic renders correctly. That's job #2 below.

## ⚠️ KNOWN BREAKAGE — `next build` currently fails

**Cause:** `lib/parse.ts` does `import yaml from "js-yaml"` — a default
import. js-yaml's ESM build doesn't provide a default export, so the build
fails when the route pulls it in.

**This is my bug, not the subagent's** — it wrote no part of `lib/`.

**Fix (first thing next session):** change the import in `lib/parse.ts` to a
namespace import:
```ts
import * as yaml from "js-yaml";
```
`tsc` passes either way, so this only shows up at build time. Nothing else is
known to be wrong.

## Not done

- **Nothing has been built or run successfully yet.** Expect more wiring
  fixes on first real run, beyond the js-yaml one above.
- No audio files. `public/audio/ibrahim/` exists but is empty — the page card
  is designed to degrade to a "being recorded" message, which is the current
  state for every page (`audio_status: none`).
- No cover images. `BookCard` uses a 0.711-ratio placeholder.

---

## Next session — do these in order

1. **Fix the js-yaml import** in `lib/parse.ts` (see breakage above). One line.
2. `npm run dev`, open `/books/ibrahim/p39`. **The first real test: does
   vowelled Arabic render with tashkeel intact, no collision, no dotted-circle
   fallback boxes?** If it looks wrong, suspect the font before the CSS.
   Test string covering the hard cases:
   `وَقَالَتْ هَاجَرُ: إِذًا لَا يُضَيِّعُنَا!  أَصْنَامٌ  يَا بُنَيَّ`
3. `npm run build` — confirm page-card routes show as **static (`○`)**, not
   dynamic (`ƒ`). If dynamic, `generateStaticParams` isn't taking.
4. Check JS payload on a page-card route is **under 100kb**
   (`WEBSITE_BUILD.md` budget). Only `AudioPlayer` should be client-side.
5. Review the components properly — they typecheck but have never been looked
   at. Particularly: is the page card usable by a 9-year-old holding a book?

## Known open decisions (from the book repo)

- **Domain not bought.** Needed before any QR code is generated.
- VPS on 1-month term to prove the setup; specs to be confirmed post-
  provisioning via `nproc` / `free -h` / `df -h`.
- Preview deploys can go to Vercel free tier meanwhile — nothing is for sale
  yet, so the non-commercial restriction doesn't bite.
