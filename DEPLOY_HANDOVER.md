# Deploy handover — qasaskids.com on a Hostinger VPS

Written 2026-08-19 for Codex to execute. Everything needed is in this file;
you should not need the conversation that produced it.

The site is the **Qasas companion** — audio, vocabulary, word families and
practice exercises for the printed book *Who Broke the Idols*. Repo:
`Senaptix/arabicthroughstories`, branch `master`.

---

## 0. Read this before provisioning anything

**The site is 100% static today.** Every route prerenders — 109 pages, all
`○` or `●` in the build output. There are no API routes, no server actions,
no middleware, no environment variables and no database. Confirmed
2026-08-19:

```
Route (app)
┌ ○ /
├ ○ /_not-found
├   /books/[book]              └ ● /books/ibrahim
├   /books/[book]/[pageSlug]   ├ ● /books/ibrahim/p1  └ ● [+51 more]
└   /books/[book]/[pageSlug]/practice  ├ ● …/p3/practice  └ ● [+47 more]
```

**So a VPS is more than this site currently needs**, and that is worth
saying plainly before money is spent. A static host (Cloudflare Pages,
Netlify) would serve this for free, from a global CDN, with automatic SSL
and zero maintenance — strictly faster and cheaper than one VPS in one
datacentre, for exactly the site that exists today.

**The VPS is nevertheless a defensible call, for one reason:** the planned
student-accounts feature (see the plan in
`~/.claude/plans/student-accounts-and-vocab-progress.md`) adds sign-in,
per-student progress and a "My Words" page. Those routes must read a
session cookie, so they cannot be static. When that lands, this site needs
a Node server. Provisioning the VPS now avoids migrating later.

**The owner has chosen the VPS. Proceed with it.** This section exists so
the tradeoff is on record, not to reopen the decision.

> If the owner would rather defer the cost: deploy to Cloudflare Pages
> today (free, ~15 minutes), and revisit the VPS when accounts are actually
> being built. Nothing in this repo would need to change either way.

---

## 1. What the owner must do first (Codex cannot)

These need account access and a payment method. Codex should stop and ask
for the results rather than attempt them.

1. **Buy the VPS.** Hostinger → VPS (*not* shared hosting — the "How do you
   want to build your website?" wizard with AI Builder / WordPress / Node.js
   / PHP options is the **shared hosting** onboarding and does not apply.
   A VPS gives a bare Ubuntu box and no wizard).
   - **OS: Ubuntu 24.04 LTS**, clean, no control panel.
   - Smallest plan is ample (1–2 vCPU / 4GB). This site is 22MB of assets
     and a small Node process.
2. **Provide the VPS public IPv4 address.**
3. **Confirm where `qasaskids.com`'s DNS is managed** — Hostinger's own
   nameservers, or elsewhere. Codex needs to know which panel holds the
   records, and the owner must make the DNS change (§4) themselves or grant
   access.
4. **Create an SSH key pair and add the public key to the VPS.** Do not
   deploy with password authentication.

**Do not ask the owner to paste passwords, private keys, or API tokens into
chat.** SSH access should be arranged by the owner adding a public key.

---

## 2. The build-mode decision — use `standalone`, not `export`

Two options exist. Pick **`standalone`**.

| | `output: "export"` | `output: "standalone"` ← use this |
|---|---|---|
| Runtime | None. nginx serves files | Node process behind nginx |
| `next/image` | Breaks unless `unoptimized: true` | Works as-is |
| Accounts later | Needs a rebuild to add | Already correct |
| Complexity | Lower | Slightly higher |

**Why `standalone` wins here:** `next/image` is used in
[app/page.tsx](app/page.tsx) and [components/BookReader.tsx](components/BookReader.tsx).
A static export would force `images: { unoptimized: true }`, shipping the
full-size `public/art` (5.8MB) and `public/book` (1.2MB) to every visitor —
a real regression on mobile, which is the primary device for this audience.
`standalone` also matches the intent already recorded in
[next.config.ts](next.config.ts) and does not need redoing when accounts land.

**The change is one line.** In [next.config.ts](next.config.ts):

```ts
const nextConfig: NextConfig = {
  output: "standalone",
};
```

The existing comment in that file says this is "verified to build" — **do
not take that on trust, build it and confirm** before deploying.

---

## 3. Fix the known vulnerability first

`npm audit` reports one high-severity advisory, a transitive dependency:

```
nanoid  <3.3.18   high
nanoid: custom generators can loop indefinitely when size is zero
GHSA-2v37-7h3g-55p8
```

Run `npm audit fix`, then re-run the full verification in §7. Commit the
lockfile change separately from the deploy work so it is easy to revert on
its own. Do not use `--force`; if the clean fix does not resolve it, report
back rather than escalating.

---

## 4. DNS for qasaskids.com

Point the apex and `www` at the VPS:

| Type | Name | Value | TTL |
|---|---|---|---|
| A | `@` | *VPS IPv4* | 3600 |
| A | `www` | *VPS IPv4* | 3600 |

Propagation is usually minutes but allow up to a few hours. **Verify before
attempting SSL** — Let's Encrypt validates over HTTP against the live
record, so certbot fails confusingly if DNS has not landed:

```bash
dig +short qasaskids.com
```

Decide and stick to one canonical host. **Recommend apex** (`qasaskids.com`)
with `www` permanently redirecting to it — shorter, and it is what will be
printed alongside the book's QR code.

---

## 5. Server setup

All commands as a **non-root sudo user**. Do not run the app as root.

### 5.1 Base

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y nginx git ufw
```

### 5.2 Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

Port 3000 stays closed to the world — nginx reaches it over localhost.

### 5.3 Node

Use **Node 22 LTS**. (Local development is on Node 24; pin the server to LTS
rather than matching it.)

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node --version
```

### 5.4 Application user and checkout

```bash
sudo adduser --system --group --home /srv/qasas qasas
sudo -u qasas git clone https://github.com/Senaptix/arabicthroughstories.git /srv/qasas/app
cd /srv/qasas/app
sudo -u qasas npm ci
sudo -u qasas npm run build
```

`npm run build` runs `prebuild` → `npm run check` → `lib/parse.check.ts`,
the content guard. **A failing guard means the content is wrong, not that
the guard should be bypassed.** Never deploy with `--ignore-scripts` or by
skipping `prebuild`.

### 5.5 The standalone output

`output: "standalone"` emits a self-contained server at
`.next/standalone/`, but **it does not copy `public/` or `.next/static/`** —
this is the single most common way a standalone deploy ends up with a
working page and no CSS, images or audio:

```bash
sudo -u qasas cp -r public .next/standalone/public
sudo -u qasas cp -r .next/static .next/standalone/.next/static
```

Fold these two lines into the deploy script (§6) so they cannot be
forgotten.

### 5.6 systemd service

`/etc/systemd/system/qasas.service`:

```ini
[Unit]
Description=Qasas companion site
After=network.target

[Service]
Type=simple
User=qasas
WorkingDirectory=/srv/qasas/app/.next/standalone
ExecStart=/usr/bin/node server.js
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=HOSTNAME=127.0.0.1
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

`HOSTNAME=127.0.0.1` binds to localhost only, so the Node process is not
reachable except through nginx.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now qasas
sudo systemctl status qasas
```

**Use systemd, not PM2.** It is already on the box, it survives reboot
without extra setup, and it is one less dependency to keep patched.

### 5.7 nginx

`/etc/nginx/sites-available/qasaskids.com`:

```nginx
server {
    listen 80;
    server_name qasaskids.com www.qasaskids.com;

    # Audio is the bulk of this site: 14MB across 50 clips, served to
    # children who may replay a page many times. Long-cache the immutable
    # build output and the media; let HTML revalidate.
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_cache_valid 200 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    location /audio/ {
        proxy_pass http://127.0.0.1:3000;
        add_header Cache-Control "public, max-age=2592000";
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/qasaskids.com /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

### 5.8 SSL

Only after §4 verifies:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d qasaskids.com -d www.qasaskids.com
```

Choose redirect-HTTP-to-HTTPS when prompted. Confirm auto-renewal:

```bash
sudo systemctl list-timers | grep certbot
sudo certbot renew --dry-run
```

---

## 6. Deploying updates

`/srv/qasas/deploy.sh`, owned by `qasas`, `chmod +x`:

```bash
#!/usr/bin/env bash
set -euo pipefail

cd /srv/qasas/app
git pull --ff-only
npm ci
npm run build                      # prebuild runs the content guard

# standalone does not copy these itself
cp -r public .next/standalone/public
cp -r .next/static .next/standalone/.next/static

sudo systemctl restart qasas
```

`set -euo pipefail` matters: without it a failed build still restarts the
service and can put a broken tree live.

There is a brief drop while the service restarts. That is acceptable for
this site; do not build blue/green deployment for a children's book
companion unless downtime actually becomes a problem.

---

## 7. Verification — all of it, before reporting done

1. `npm run build` completes and the route table still shows **109 pages**,
   all `○`/`●`. Any route turning dynamic (`ƒ`) is a regression — nothing in
   this deploy should change rendering.
2. `npm run lint` and `npx tsc --noEmit` clean.
3. `npm audit` — the nanoid advisory is gone (§3).
4. `https://qasaskids.com` loads over TLS with a valid certificate.
5. `http://qasaskids.com` redirects to HTTPS.
6. `www.qasaskids.com` redirects to the apex.
7. **Arabic renders with full diacritics** in the Scheherazade New face.
   `next/font` self-hosts at build time, so this proves the font shipped.
   Garbled or unvowelled Arabic is a blocking failure — the vowel marks are
   the thing being taught.
8. **Audio plays and the read-along highlights.** Open
   `/books/ibrahim/p3` and `/books/ibrahim/p4`; press play; confirm the
   highlighted line advances with the narration. These two pages are the
   only configured read-alongs.
9. **Audio serves with HTTP range support** — seek to the middle of a clip
   and confirm it plays. A missing `Accept-Ranges` breaks scrubbing.
10. A practice screen works end to end: `/books/ibrahim/p3/practice`,
    answer all four exercises, confirm the results list and the per-exercise
    "Try again".
11. `sudo reboot`, then confirm the site returns **without manual
    intervention** — this is what proves the systemd unit is enabled, and it
    is the check most often skipped.
12. Mobile width (375px): no horizontal scroll, tap targets usable.

---

## 8. Do not do these

- **Do not run `npm run dev` on the server.** Production is the built
  output behind systemd.
- **Do not bypass the content guard.** `prebuild` → `lib/parse.check.ts`
  exists because a wrong Arabic vowel changes the word. A red guard is a
  content bug to fix, never a check to disable.
- **Do not edit content on the server.** `content/data/` is source, edited
  in the repo and deployed. A server-side edit will be silently destroyed by
  the next `git pull --ff-only`.
- **Do not add analytics, cookie banners, chat widgets or ad scripts.**
  This site is used by children; anything of that kind is the owner's
  decision, not a deploy-time addition.
- **Do not install a control panel** (cPanel/Plesk/CloudPanel) on top of
  this setup. It will fight the hand-written nginx config.
- **Do not commit secrets.** The site needs none today. When accounts land,
  Supabase keys belong in an environment file readable only by the `qasas`
  user, never in the repo.
- **Do not force-push or rewrite `master`.**

---

## 9. Open items for the owner

1. **Canonical host** — apex recommended (§4). Confirm, because it is what
   gets printed next to the book's QR code and should not change afterwards.
2. **Backups.** A VPS is not backed up by default. The site rebuilds from
   git, so the code is safe, but take Hostinger's snapshot option if the
   box will ever hold anything that is not in the repo — which it will, the
   moment accounts exist.
3. **Where the single book QR points.** `ACCESS_MODEL.md` in the book repo
   specifies one QR per book rather than per page. That URL should be
   settled before anything goes to print.
4. **Email for the domain** — not covered here. If `hello@qasaskids.com` is
   wanted, it needs MX records, which are independent of this deploy.
