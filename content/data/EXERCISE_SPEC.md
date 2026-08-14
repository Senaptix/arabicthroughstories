# How to write exercises for a page

Spec for extending `ibrahim.exercises.yaml`. Pages 3–12 already follow it —
**read page 12 in that file before starting; it is the reference.**

## The four types

| Type | What it drills | Content needed |
|---|---|---|
| `match` | word → meaning | none — built at render time from that page's vocabulary |
| `choose` | the word that completes a sentence | a real sentence, one word blanked, 2+ distractors |
| `order` | word order | one real line of that page |
| `pattern` | producing a new sentence on a model | a stem + swappable options. UNGRADED |

## Hard rules — the build fails if these are broken

`lib/parse.check.ts` enforces all of these. Run `npm run check` after every
page; do not batch up twenty pages and hope.

1. **Every Arabic word must already exist** in `ibrahim.pages.md` or
   `ibrahim.vocabulary.md`. Never invent, inflect or "fix" a word. Copy it
   character-for-character from the source — a single changed vowel is a
   different word, and this is a book that teaches those vowels.
2. **`order.answer` joined by single spaces must EXACTLY equal a real line
   of that page.** Not a paraphrase, not a re-ordering, not a trimmed
   version. Copy the line and split it on spaces.
3. **`choose`**: `sentence[gap]` with trailing punctuation stripped must
   equal `answer`; `options` must contain `answer`; options must be unique.
4. **`pattern`**: option `ar` values must be unique.
5. Every page you add must have text in `ibrahim.pages.md`.

## Rules of judgement — not enforced, but they matter

6. **Never build `order` or `choose` from a line containing `﴿ ﴾`.** Those
   are Qur'anic quotations carrying a `[سورة: رقم]` citation. Asking a child
   to reassemble a verse like a word puzzle is not appropriate, and the
   bracket/citation tokens would end up as draggable pieces. Bracketed lines
   are on pages 12, 14, 15, 17, 21, 28, 30, 31, 32, 33, 34, 50 — check the
   line before using it.
7. **Skip `match` if the page has fewer than 3 vocabulary words.** A
   two-item matching exercise is not an exercise. Affected: pages 20, 27,
   36, 48, 51.
8. **Skip a type rather than force it.** A page with three words and one
   short line should have two good exercises, not four padded ones. Pages
   3, 5 and 6 have only three exercises for exactly this reason.
9. **`choose` distractors must be plausible but clearly wrong** — same part
   of speech where possible, and drawn from words the child has already met.
   A distractor that is also arguably correct makes the exercise unfair.
10. **`pattern` options must all produce a sentence that is actually true
    and grammatical.** This is the one type the corpus guard cannot check —
    it proves each word is real, not that the new combination is correct.

## Shape

```yaml
  - page: 13
    exercises:
      - type: match
      - type: choose
        gap: 2                    # 0-based index into `sentence`
        answer: "الْفَأْسَ"
        sentence:                 # the real sentence, word by word
          - "وَأَخَذَ"
          - "إِبْرَاهِيمُ"
          - "الْفَأْسَ،"
        options:                  # must include the answer
          - "الْفَأْسَ"
          - "الْبَيْتَ"
      - type: order
        answer:                   # EXACTLY a line of page 13
          - "وَأَخَذَ"
          - "إِبْرَاهِيمُ"
          - "الْفَأْسَ،"
      - type: pattern
        stem:
          - "وَأَخَذَ"
        options:
          - ar: "الْفَأْسَ"
            en: "the axe"
          - ar: "الطَّعَامَ"
            en: "the food"
```

Note `answer` has no trailing comma but `sentence[gap]` keeps the comma as
it appears in the line — the guard strips trailing punctuation before
comparing, and that is deliberate.

## Order of work

Pages ascend. Keep the file sorted by page number.
