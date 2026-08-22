# Launch reels — scripts and shot notes

For the 25 August listing. Written to be spoken by the author, not narrated
by an AI voice: this is a Muslim parent recommending a book to other Muslim
parents, and whose voice it is carries part of the argument.

**Suno is music generation, not speech.** For a synthetic voice you would want
ElevenLabs or similar — but see above. The Arabic in these should be the
book's own narrator, which already exists as 50 recorded clips.

Timings are for a spoken pace of roughly 2.5 words per second. Read them
aloud before shooting; anything that trips the tongue is written wrong.

---

## Reel 1 — "The same three letters" (30s)

**The strongest one. Lead with this.** It is the moment the method proves
itself, and it needs no claims — the viewer works it out a beat before you
say it, which is why it lands.

| Time | Voiceover | On screen |
|---|---|---|
| 0–4s | "On page four of this book, a child meets this word." | Page 4 fills frame. Push in on **يَسْجُدُ**. Hold. |
| 4–8s | "Yasjudu. He prostrates. They learn it, and they carry on reading." | The word isolated, large, tashkeel clearly visible. |
| 8–14s | "Forty-eight pages later — a different story, a different page —" | Fast flick through pages. Motion blur is fine here. |
| 14–20s | "— they meet this one." | Page 52. Push in on **الْمَسْجِدُ**. Hold longer than feels comfortable. |
| 20–26s | "And nobody has to explain it. They just see it." | Both words side by side. The shared root س ج د lights up in each. |
| 26–30s | "Qasas Kids. The Arabic book your child can actually finish." | Logo animation. |

**Why it works:** it demonstrates rather than asserts. A parent who has tried
Arabic apps knows the difference between memorising a word and *seeing* a
pattern — this shows the second one happening.

**Assets:** pages 4 and 52 from the print PDF. The root highlight is the one
piece of motion graphics needed; everything else is a push-in on a still.

---

## Reel 2 — "Every vowel is there" (20s)

For parents who have been burned by books that were too hard.

| Time | Voiceover | On screen |
|---|---|---|
| 0–5s | "If your child has learned the letters but still can't read Arabic, this is usually why." | A line of **unvowelled** Arabic. Let it sit. Uncomfortable. |
| 5–9s | "No vowels. Nothing to hold on to." | Same line, still bare. |
| 9–14s | "Every page of this book looks like this instead." | The same line **fully vowelled**. Marks appear one by one. |
| 14–18s | "Every word. Every page. All fifty." | Quick fan of pages, tashkeel visible throughout. |
| 18–20s | "Qasas Kids." | Logo. |

**The whole reel is one visual idea:** bare text, then marked text. Do not
add anything else to it.

**Careful:** the unvowelled line must be real Arabic from the book, not
invented. Take a line from `ibrahim.pages.md` and strip the marks
mechanically — do not hand-type it.

---

## Reel 3 — "Press play" (15s)

Shows the companion. Almost no voiceover; the product makes the sound.

| Time | Voiceover | On screen |
|---|---|---|
| 0–3s | "Every page is read aloud." | Finger presses play on a phone. |
| 3–11s | *(silence — the narration plays)* | Screen recording of the read-along, line highlighting as it goes. |
| 11–15s | "Included with the book. Nothing to install." | Logo. |

**Do not talk over the Arabic.** The recitation is the product; a voiceover
competing with it is the one mistake this reel can make.

**Asset:** a real screen recording of `/books/ibrahim/p3` on a phone. Page 3
or 4 — both have measured line cues, so the highlight is accurate.

---

## Reel 4 — "Why I made this" (30s, optional)

Founder piece. Only worth doing if you are comfortable on camera — a
half-hearted one is worse than none.

| Time | Voiceover | On screen |
|---|---|---|
| 0–6s | "I wanted my children to read the stories of the Prophets in Arabic. Not a translation." | You, talking. Plain background. |
| 6–14s | "Everything I found was either too easy to be real Arabic, or real Arabic they couldn't get through." | Hold on you. |
| 14–24s | "So we built the one I wanted. Fully vowelled, read aloud, with every new word on the page it appears." | Cut to book in hands, turning a page. |
| 24–30s | "Qasas an-Nabiyyin, for children. Out now." | Logo. |

**Unscripted is better than word-perfect here.** Learn the beats, not the
sentences.

---

## Production notes

**Format.** 1080×1920, H.264, 30fps. Under 60s. Reels, TikTok and Shorts all
accept this; export once.

**Captions are not optional.** Most of this plays on mute. Every word of
voiceover needs burned-in text — not the platform's auto-captions, which
mangle "Yasjudu" and every other Arabic word in these scripts.

**Arabic on a phone.** Fully vowelled Arabic gets illegible fast at reel
sizes. Anything with tashkeel needs to fill much more of the frame than
feels right on a desktop preview. **Test one on an actual phone at arm's
length before making the rest.**

**The first second decides it.** Reels 1 and 2 both open on a word rather
than a face or a logo, deliberately — a viewer scrolling past sees Arabic
and either stops or does not, and the ones who stop are the audience.

**No music.** Decided. If a bed is wanted later, it goes under Reels 1 and 4
only — never under 3, where the narration is the point.

---

## What I can assemble

Given the raw clips, ffmpeg handles: reframing to 9:16, cutting and
sequencing, crossfades, burned-in captions timed to the frame, audio mixing
and levelling, and platform-spec export.

What it cannot do is judge whether a cut lands. Send a rough version back and
I will adjust timings, but the call on feel is yours.

Page artwork and the 50 narration clips can be pulled straight from this repo
at full quality — no need to re-export from Canva.
