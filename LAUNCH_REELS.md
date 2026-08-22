# Launch reels — scripts and shot notes

For the 25 August listing. Written to be spoken by the author, not narrated
by an AI voice: this is a Muslim parent recommending a book to other Muslim
parents, and whose voice it is carries part of the argument.

**Suno generates music, not speech.** For a synthetic voice you would want
ElevenLabs — but see above. The Arabic in these should be the book's own
narrator, which already exists as 50 recorded clips.

---

## The position

**A text that has taught Arabic for decades, rebuilt so a child can actually
get through it.**

Three things carry the pitch, in this order:

1. **Story, not drill.** Children acquire a language by understanding things
   said in it — not by memorising lists or parsing grammar tables. A story a
   child can follow, slightly above what they can already read, is how the
   language goes in. Everything the book does exists to keep the Arabic
   *understandable* while it stays real: full vowelling, English underneath,
   new words glossed where they appear, audio for every page.
2. **The heritage is the credibility.** Al-Nadwi's *Qasas an-Nabiyyin* has
   been used to teach Arabic for generations. This is not a new method being
   tried on someone's children — it is a proven text with the obstacles
   removed.
3. **Two things at once.** They are learning Arabic, and they are learning
   the stories of the Prophets from the Qur'an. A parent is not choosing
   between Arabic time and Islamic studies time.

**Do not say "comprehensible input" or name any language-learning app or
platform in the marketing.** Say what it means in plain words: *children
learn a language by understanding stories in it.* The parents who know the
theory will recognise it; the rest will simply agree.

**The root-family thread is a detail, not the headline.** It delights people
who already own the book. It does not sell it. Keep it for a later reel or
the website, where it rewards attention rather than carrying the argument.

Timings assume roughly 2.5 words per second. Read every line aloud before
shooting — anything that trips the tongue is written wrong.

---

## Reel 1 — "The mouse" (20s) — BUILT

The lead, and the only one already cut: `qasas-mouse-reel.mp4`, 1080×1920,
24fps, no audio track.

This is the position argued by demonstration rather than assertion. It does
not claim the book teaches through story — it just tells the story, and the
viewer discovers at the end that it was Arabic all along.

The on-screen text is **page 7 of the book** — the Arabic verbatim from the
corpus, with the English beneath it, laid out the way the printed page is:

> He would see the fly sit on the idols, and they would not push it away.
> He would see the mouse eat the idols' food, and they would not stop it.
> And Ibrahim would say to himself: why do people prostrate to the idols?

| Time | On screen | Text |
|---|---|---|
| 0.6–4.2s | Mouse at the offering bowls, fly resting on the great idol | Page 7 line 1 + "A fly sat on the idols. / They did not push it away." |
| 4.7–7.9s | Mouse eating, closer | Page 7 line 2 + "A mouse ate their food. / They did not stop it." |
| 8.7–15.9s | Cut to the crowd prostrating in the idol house | Page 7 line 3 + "So Ibrahim asked himself / why do people bow to them?" |
| 16–20.4s | Logo animation, then the closing card | "The stories of the Prophets / in Arabic your child can read" / **qasaskids.com** |

**Why the last shot works:** the question lands over an image that answers
it — a room full of people bowing to stones that could not chase off a fly.
The reel never argues; it lets the question do the work, which is exactly
what al-Nadwi's text does.

### How it was built, for re-cutting

- Source `Initial_Scene_-_2026-08-22_202608221918.mp4` is letterboxed: the
  picture is **720×1012 at y=134**, which is the book's own page ratio
  (688×968). Crop to that before scaling or you inherit black bars.
- Art is framed as a book page — 896×1260 inset at (92, 400) on flat cream
  **#DBCAB5**, sampled from the logo animation's background so the tail
  matches. The text band occupies the top 400px: Arabic in Scheherazade New
  Bold 60 over English in Georgia Bold 40, mirroring the printed page.
- The logo animation is landscape on a cream *gradient*. Padding it into a
  portrait frame always seams, and blurring the fill did not fix it. It is
  inset as a card with margin on all four sides instead, which reads as
  deliberate. If a transparent-background logo ever exists, use that —
  `public/brand/qasas-kids-mark.png` is RGBA but its alpha is opaque white.
- Bottom ~240px is left empty on purpose — that is where the Instagram UI
  sits.

### The Arabic — do not render it with ffmpeg

**ffmpeg's `drawtext` cannot be trusted with this text, and the failure is
silent.** Everything needed is in `reels/`.

- The Arabic is read out of `content/data/ibrahim.pages.md` by script and
  written to `reels/ar*.txt`. It is never retyped. Only the Latin full stop
  and colon are dropped, because the web font subset has no glyph for them.
- Every font on this machine failed in a different way. The site's
  Scheherazade New subset renders as tofu under harfbuzz shaping; Dubai is
  missing glyphs; **Segoe UI silently drops most of the tashkeel**; Arial
  and Tahoma shape correctly but set the marks badly. A missing vowel is a
  different word, so "it looked fine" is not a check that passes here.
- What works: `reels/band.html` rendered by headless Chrome at 2× and
  downscaled. The browser shapes the subset correctly, and the text is in
  the same face the site uses.

```
chrome --headless=new --force-device-scale-factor=2 \
  --window-size=1080,1410 --screenshot=band_raw.png http://localhost:PORT/band.html
```

Each 1080×470 section becomes one text band; crop the top 400px of each and
overlay it with an alpha fade. `reels/filterA.txt` and `filterB.txt` are the
filter graphs as shipped.

### Before posting

- The closing card carries **qasaskids.com** but no date. Add "Out 25
  August" if you want urgency — that is a decision, not an oversight.
- The mouse in this clip has a visible eye; the book's own page 7 art was
  deliberately selected without one. Fine for marketing, worth knowing.
- **Check the Arabic on a phone before this goes out.** It is set at 60px in
  a 1080-wide frame, which is large on a desktop preview and merely adequate
  in the hand.

---

## Reel 2 — "Fifty years of teaching, one problem" (30s)

Heritage plus the fix, which is the whole proposition.

| Time | Voiceover | On screen |
|---|---|---|
| 0–5s | "This book has been used to teach children Arabic for decades." | The green Majlis edition of *Qasas an-Nabiyyin*, held up to camera. |
| 5–11s | "Madrasas use it. Teachers swear by it. And most children still can't get through it on their own." | Hold on the cover. Then a page of dense unvowelled Arabic. |
| 11–17s | "So we didn't change the stories. We changed everything that made them hard." | Cut to your book. Same story, open on a page. |
| 17–25s | "Every vowel marked. The English underneath. Every new word explained right there. And every page read aloud." | Slow pan down a page: Arabic, gloss box, English panel. |
| 25–30s | "Qasas Kids. The Arabic book your child can actually finish." | Logo. |

**The copy does not need to be worn.** An earlier draft called for a battered
old one; that was wrong. What carries the heritage claim is *recognition*,
not age — the green Majlis cover is the one anyone who sat in a madrasa
knows on sight, and a clean copy of it says "this book" just as well. A
suspiciously distressed prop would say less.

**The strongest version of this shot is two books, not one:** the green
original and your edition side by side, held in the same hands. Same stories,
made readable — stated in one frame, with nothing to age or fake.

**Why it works:** it does not ask the parent to believe in a new method. It
says a thing they may already trust has been made usable — which is a much
smaller thing to accept.

---

## Reel 3 — "Nobody learns a language from a list" (25s)

The method, said plainly. No jargon.

| Time | Voiceover | On screen |
|---|---|---|
| 0–5s | "Your child can probably recite the alphabet. Maybe a hundred words." | Flashcards, or a vocabulary list on a screen. Static. Dull on purpose. |
| 5–10s | "But nobody ever learned a language from a list." | Hold. Let it be flat. |
| 10–17s | "They learn it the way they learned English. By understanding stories, one page at a time." | Cut to the book. A child's hands turning a page. Warm light. |
| 17–22s | "Real Arabic. A real story. And enough help on the page that they never get stuck." | Page in full: Arabic, glossed words, English. |
| 22–25s | "Qasas Kids." | Logo. |

**The contrast is the whole reel** — sterile list, then a child reading. Do
not narrate the difference; show it and let the line land.

---

## Reel 4 — "Press play" (15s)

Almost no voiceover. The product makes the sound.

| Time | Voiceover | On screen |
|---|---|---|
| 0–3s | "Every page is read aloud, by a native reader." | Finger presses play on a phone. |
| 3–11s | *(silence — the narration plays)* | Screen recording of the read-along, the line highlighting as it goes. |
| 11–15s | "Included with the book. Nothing to install." | Logo. |

**Do not talk over the Arabic.** The recitation is the product; a voiceover
competing with it is the one mistake this reel can make.

**Asset:** a real screen recording of `/books/ibrahim/p3` or `p4` on a phone
— both have measured line cues, so the highlight is accurate.

---

## Reel 5 — "Two things at once" (25s)

For the parent weighing how much is in the week already.

| Time | Voiceover | On screen |
|---|---|---|
| 0–6s | "Most weeks there isn't time for Arabic and Islamic studies both." | A busy kitchen table. Books, homework. |
| 6–12s | "This is the same hour." | The book, open. |
| 12–20s | "They're reading the story of Ibrahim, alayhi salam, in the Arabic it was written in. Learning the language, and learning the deen." | Pages turning — the idols, the fire, the stars. |
| 20–25s | "Qasas Kids. Out now." | Logo. |

**Careful with the artwork:** no Prophet is depicted anywhere in this book,
and the reel must not imply otherwise. Use the scenes he is not in — the
idol house, the night sky, the market stall.

---

## Reel 6 — "Why I made this" (30s, optional)

Only worth doing if you are comfortable on camera. A half-hearted one is
worse than none.

| Time | Voiceover | On screen |
|---|---|---|
| 0–7s | "I wanted my children to read the stories of the Prophets in Arabic. Not in translation." | You, talking. Plain background. |
| 7–15s | "Everything I found was either too easy to be real Arabic, or real Arabic they couldn't get through." | Hold on you. |
| 15–25s | "So we took the book the madrasas have used for fifty years, and made it something a child could read on their own." | Cut to book in hands, turning a page. |
| 25–30s | "Qasas an-Nabiyyin, for children. Out now." | Logo. |

**Learn the beats, not the sentences.** Unscripted is better than
word-perfect here.

---

## Production notes

**Format.** 1080×1920, H.264, under 60s. Reel 1 is 24fps, matching its
source — do not convert it to 30, the duplicated frames judder on the slow
push. Instagram, TikTok and YouTube all accept 24.

**Captions are not optional.** Most of this plays on mute. Every word needs
burned-in text — not platform auto-captions, which will mangle "Qasas",
"an-Nabiyyin" and "alayhi salam".

**Arabic on a phone.** Fully vowelled Arabic goes illegible fast at reel
size. Anything showing tashkeel must fill far more of the frame than looks
right on a desktop preview. **Test one on an actual phone at arm's length
before making the rest.** Reel 1 does not dodge this — the Arabic leads
every beat with the English under it — so it is the one to test first.

**Openings.** Reels 2 and 3 both open on the problem rather than the product,
deliberately. A parent scrolling recognises their own situation before they
know they are being sold to. Reel 1 opens on neither — it opens on a mouse,
which is the best hook available precisely because it is not selling
anything.

**No music.** Decided. If a bed is ever added it goes under 2, 5 and 6 only —
never 4, where the narration is the point.

---

## What I can assemble

Given the raw clips: reframing to 9:16, cutting and sequencing, crossfades,
burned-in captions timed to the frame, audio mixing and levelling, and
platform-spec export. Reel 1 is the worked example.

What ffmpeg cannot do is judge whether a cut lands. Send a rough back and I
will adjust timings; the call on feel is yours.

Page artwork and the 50 narration clips come straight from this repo at full
quality — no re-exporting from Canva.
