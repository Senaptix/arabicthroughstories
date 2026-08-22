# Launch reels — scripts and shot notes

For the 25 August listing. Written to be spoken by the author, not narrated
by an AI voice: this is a Muslim parent recommending a book to other Muslim
parents, and whose voice it is carries part of the argument.

**Suno generates music, not speech.** For a synthetic voice you would want
ElevenLabs — but see above. The Arabic in these should be the book's own
narrator, which already exists as 50 recorded clips.

Reel 1 went further and needs no voiceover at all: it runs on the page 7
narration alone. Where the recording can carry a reel, let it.

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
2. **The heritage is the credibility.** Shaykh Abul Hasan's *Qasas an-Nabiyyin* has
   been used to teach Arabic for generations. This is not a new method being
   tried on someone's children — it is a proven text with the obstacles
   removed.
3. **Two things at once.** They are learning Arabic, and they are learning
   the stories of the Prophets from the Qur'an. A parent is not choosing
   between Arabic time and Islamic studies time.

**Who this is for, stated once so every reel can assume it:** children being
raised outside the Arabic-speaking world, who do not have the language at
home and do not have a teacher to hand.

Be accurate about the original, because this audience knows it. **Shaykh Abul Hasan
wrote *Qasas an-Nabiyyin* for non-native learners** — it is a graded reader,
the vocabulary and structures build deliberately, and it has been used to
teach Arabic as a second language to children and adults for decades, in
Syria, in India, in British madrasas and summer schools. Anyone we are
selling to may well have studied from it themselves.

So the gap is **not** that it was written for Arabic speakers, and it is not
vowelling — the Dar Ibn Kathir children's edition is fully vowelled. The gap
is that **it was written for a classroom.** It assumes an ustadh beside you
translating each new word, which is exactly how it is taught and exactly
what most families at home do not have.

**We put the teacher on the page.** That is the product in six words, and
Reel 2 is built on it.

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

## Reel 1 — "The mouse" (21s) — BUILT

The lead, and the only one already cut: `reels/out/qasas-mouse-reel.mp4`,
1080×1920, 24fps, carrying **the book's own page 7 narration**. There is no
scripted voiceover and none is wanted — the narrator reads, the text
follows, and nothing is said over it.

`qasas-mouse-reel-silent.mp4` is the same cut without audio, kept in case a
voiceover version is ever needed. `reels/out/` is gitignored; rebuild from
the sources beside it.

This is the position argued by demonstration rather than assertion. It never
claims the book teaches through story; it just tells the story.

And it does something better than describing the method — it performs it. A
parent who cannot read a word of Arabic hears Arabic, sees Arabic, and
follows the story anyway, because the English is right there and the picture
is doing half the work. That is the whole argument of the book, happening to
the viewer in twenty seconds, with nobody explaining it.

The on-screen text is **page 7 of the book** — the Arabic verbatim from the
corpus, with the English beneath it, laid out the way the printed page is:

> He would see the fly sit on the idols, and they would not push it away.
> He would see the mouse eat the idols' food, and they would not stop it.
> And Ibrahim would say to himself: why do people prostrate to the idols?

| Narration | On screen | Text band |
|---|---|---|
| 0–4.32s | Mouse at the offering bowls, fly resting on the great idol | Page 7 line 1 + "A fly sat on the idols. / They did not push it away." |
| 4.73–9.59s | Mouse eating, closer | Page 7 line 2 + "A mouse ate their food. / They did not stop it." |
| 9.98–16.01s | Cut to the crowd prostrating in the idol house | Page 7 line 3 + "So Ibrahim asked himself / why do people bow to them?" |
| silent | Logo animation, then the closing card | "The stories of the Prophets / in Arabic your child can read" / **qasaskids.com** |

**Page 7 has four lines; the reel uses three.** The fourth is the parallel
"why do people *ask* the idols?", and the audio is trimmed before it at
16.45s. Including it would need another six seconds of picture that does not
exist.

**Why the last shot works:** the question lands over an image that answers
it — a room full of people bowing to stones that could not chase off a fly.
The reel never argues; it lets the question do the work, which is exactly
what Shaykh Abul Hasan's text does.

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

### Cutting picture to narration, not the other way round

The narration is fixed, so the picture was retimed to fit it. **The audio
was never stretched** — altering recorded Arabic to fit a video would change
how the words sound, which is the one thing this project cannot do.

- Line boundaries came from `silencedetect` on `public/audio/ibrahim/p7.mp3`,
  the same method used for the p3/p4 cues. Lines 3 and 4 confirm the reading:
  they are near-identical sentences and their two halves measure 2.62/2.69s
  and 2.35/2.59s, which is too close to be coincidence. **These cues have not
  been confirmed by ear** — that standard applies to the read-along, not to a
  reel, but treat them as measured rather than verified.
- The source cuts from mouse to crowd at exactly 8.0s, while the mouse line
  runs to 9.59s. The mouse half is therefore slowed by 1.196× with
  `minterpolate=mi_mode=mci:mc_mode=aobmc:vsbmc=1`, which generates real
  intermediate frames instead of duplicating them — checked for artifacts on
  the whiskers and tail, none. Plain `setpts` would judder on a moving
  subject.
- That puts the scene change at 9.50s, inside the pause between lines. The
  cut lands on silence, which is why it does not read as a cut.
- Audio is trimmed to 16.45s, faded across the crossfade, and run through
  `loudnorm=I=-14` — social platforms normalise to about −14 LUFS and the
  source sits at −18.5.

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
| 0–8s | "Seventy years ago a scholar in India looked at what his young nephew was reading." | The Dar Ibn Kathir cover, still. |
| 8–17s | "Cats and dogs. Lions and wolves. And he wrote: *the fault is ours — that is what we put in print.*" | The book opening. Then the page. |
| 17–26s | "So he wrote him the stories of the Prophets, in Arabic simple enough for a child. Seminaries have taught Arabic from it ever since." | Slow push into the vowelled text. |
| 26–35s | "But he wrote it for a classroom, where a teacher explains every new word. Most of our children don't have that teacher — so we put him on the page." | Cut to ours at the same passage. Pan down: Arabic, gloss, English. |
| 35–39s | "Qasas Kids." | Logo, then qasaskids.com. |

### The gap is the teacher, not the text

Researched rather than assumed — see
`RESEARCH_QASAS_USAGE.md` in the book repo for sources.

Three earlier drafts got this wrong three different ways: a battered old
volume, then the green Majlis cover, then a plain unvowelled page — each
arguing the original is somehow *hard*. Then a fourth error, mine: that
Shaykh Abul Hasan wrote for children who already spoke Arabic.

**That was false.** He wrote expressly for non-native learners, to help them
*acquire* Arabic — Shaykh Akram's word is اكتساب — and it is used as an
Arabic primer in seminaries worldwide. Nor is vowelling the gap; the Dar Ibn
Kathir edition is fully vowelled. Say either in a reel and the first ustadh
who sees it will know.

**What the sources do show is how it is taught:** students memorise the
vocabulary, read aloud, identify the i'rab, summarise each chapter from
memory — and meet Arabic vocabulary *and its translation* for the first
time, the translation being supplied in the room by the teacher.

So the book was built for a classroom with an ustadh in it, and every
support a learner needs comes from a person who is not in the book. Ours
puts him on the page.

### Why the reel opens on Shaykh Abul Hasan's own preface

Because it is the same story as this project, seventy years apart, and it is
not about us.

He wrote volume 1 for his nephew Muhammad ibn Abd al-Ali, having looked at
what the boy had to read and found only animal tales — and having concluded
**"the fault is ours, for that is what you find in print."** A Muslim adult
looks at what is available to a child, finds it thin, and blames the
publishers rather than the child. That is exactly why this edition exists.

An earlier draft opened on the author's own history with the book —
Damascus, 1996. True, and moving, but weaker here: it makes the argument
about us. Shaykh Abul Hasan's preface makes it about the work, and it can be cited.
Keep the personal version for Reel 6, where it belongs.

⚠️ **Check the quotation against a physical volume 1 before filming.** It is
a major scholar's words going into a marketing video. One word is uncertain
in the source text — see the research note — so either verify the full list
of animals or quote only "cats and dogs, lions and wolves", which is secure.

### Shaykh Abul Hasan also stated the method, so we never have to

His four self-imposed conditions include: **the barest minimum of
vocabulary, engraved by abundant repetition**, and stories simplified so the
child never feels the weight of being taught.

That is graded-reader design in the author's own words. Reel 3's argument —
nobody learns a language from a list — can be made on his authority and on
Shaykh Akram's advice to students to *avoid vocabulary and grammar books and
read stories instead*. **Neither requires naming a modern theory or a
language app.**

### The shots

The passage in the photo is **lesson 5, «مَنْ فَعَلَ هٰذَا؟»** on page 26 —
the idols broken, the axe hung on the great one's neck. That is **pages
13–15 of ours**, and the wording is near-identical, so both books can be
opened at the same words. It also lines up with the Reel 2 Flow prompts in
the book repo.

**Stills are enough — no video camera needed.** Slow push moves across good
photographs read as deliberate. Five frames:

1. The Dar Ibn Kathir cover, flat, straight on
2. The book open at page 26, shot straight down, filling the frame
3. Closer still, on the vowelled text alone — no page furniture
4. Ours open at pages 13–15, the same passage
5. **Both open side by side.** This is the shot; the rest support it

Plain surface, daylight, no flash, no hands in frame. Shoot at the highest
resolution the phone offers — a slow push crops in, so anything soft in the
original is worse on screen.

The photos already taken are close but shot at an angle and in mixed light.
Reshoot 2 and 4 square-on with the page flat, or the push will read as a
snapshot rather than a held frame.

**Why it works:** it does not ask the parent to believe in a new method. It
asks them to accept a smaller thing — that a book they already respect was
written for a child who grew up speaking Arabic, and theirs did not.

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
| 0–8s | "I learned Arabic from this book. Damascus, 1996. I was a young man." | You, holding the Dar Ibn Kathir copy. Plain background. |
| 8–16s | "I had a teacher then. Sitting next to me, explaining every word I didn't know." | Hold on you. |
| 16–24s | "My children don't have that. Most of our children don't." | Hold. |
| 24–32s | "So I spent two years putting that teacher onto the page." | Cut to your book in hands, turning a page. |
| 32–36s | "Qasas Kids. Out now." | Logo, then qasaskids.com. |

**This is where the personal history belongs** — not in Reel 2. A founder
reel is *supposed* to be about the founder; a positioning reel is not. Reel
2 now makes the same argument from Shaykh Abul Hasan's own preface, which is sourced
and about the work rather than about us. Here, the biography is the point.

It also cannot be borrowed. Any publisher can say "nothing I found was right
for my children". Only one person can trace the line from the teacher he had
in Damascus to the teacher his children do not.

**Check the facts before shooting**, since they are checkable: the city, the
year, and whether it was this Dar Ibn Kathir edition or another printing.
Getting the year wrong in a reel that leans on the year is worse than not
mentioning it.

**Learn the beats, not the sentences.** Unscripted is better than
word-perfect here — and the pause before "most of our children don't" is
worth leaving in.

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
