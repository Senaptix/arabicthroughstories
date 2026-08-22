# Ulema preview — WhatsApp message

For the scholars' group. Sent before the 25 August listing, asking for an
assessment of the book and the companion site.

## How the access actually works

Checked against the code rather than assumed, because sending scholars into
a dead end would be worse than sending nothing.

- The sign-up form **requires** something in "Amazon order number or
  activation code" — it cannot be skipped. So they have to be told what to
  type.
- Anything that is not a `QK-` code is recorded as a claim, and
  `grant_provisional()` fires on insert: **30 days of full access
  immediately**, no approval, no waiting for Asma.
- Without a claim they would see only the free preview — pages 1–10 — which
  is not enough to judge the thing.
- They will then be told to email a receipt to `receipts@qasaskids.com`.
  That copy is written for retail buyers and does not apply here, so the
  message warns them to ignore it.

**One shared word is fine for this.** The unique index on approved
activations is partial (`where status = 'approved'`), so any number of
people can hold the same *pending* claim. It only bites if you later approve
more than one of them — don't. Their 30 days needs no approval, and if a
scholar should keep access afterwards, issue them a real `QK-` code instead.

Their claims will appear in the admin pending queue. **Leave them there** —
they are not purchases, and approving one would grant twelve months and lock
the word against everyone else.

## The message

> السلام عليكم ورحمة الله وبركاته
>
> Respected scholars,
>
> I have adapted Shaykh Abul Hasan Ali an-Nadwi's *Qasas an-Nabiyyin* — the
> story of Ibrahim عليه السلام — into an illustrated bilingual reader for
> children, *Who Broke the Idols*, with a companion website carrying the
> narration, vocabulary and word families for every page.
>
> Before it goes any further I would value your assessment.
>
> *The site:* qasaskids.com
>
> *For full access:* create an account, and where it asks for an *Amazon
> order number or activation code*, enter *ULEMA-REVIEW*. That opens the
> whole companion to you for 30 days. It will then suggest emailing a
> receipt — please ignore that, it is meant for retail buyers.
>
> *What would help most:*
> • The Arabic — the vowelling, and its faithfulness to the Shaykh's text
> • The recitation
> • The English rendering
> • Whether the treatment is fitting for children of 7 and above
>
> *One matter you may wish to know at the outset:* no Prophet is depicted
> anywhere in the book — not faceless, not in silhouette, not from behind,
> and not by any stand-in. Nor are angels. This is deliberate and holds on
> every page.
>
> The first print run is now fixed, but the website and the audio I can
> correct immediately, and whatever you find will go into the next printing
> إن شاء الله.
>
> جزاكم الله خيرا. I would be grateful for your du'a.

## Notes on the wording

**It asks for judgement, not endorsement.** Scholars are being asked to
spend their time; the message says exactly what to look at so the request is
bounded and the feedback is usable.

**It is honest that the print is fixed.** Inviting comment on Arabic that
cannot change in this edition, without saying so, would waste their effort
and be noticed. Saying the site and audio *can* change immediately gives
their reading somewhere to land now.

**The depiction policy is stated up front** rather than left to be
discovered. It is the first thing this audience will look for, and finding
it addressed unprompted answers the question before it becomes a concern.

**No price, no launch date, no buy link.** The moment it reads as a sales
message to this group, it stops being a request for assessment.
