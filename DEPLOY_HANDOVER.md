# Deploy handover — qasaskids.com on a Hostinger VPS

For Codex to pick up and finish. Everything needed is in this file.

The site is the **Qasas companion** — audio, vocabulary, word families and
practice exercises for the printed book *Who Broke the Idols*.
Repo: `Senaptix/arabicthroughstories`, branch `master`.

---

## 0. STATE — what is already done

**Verified live on the box 2026-08-19 22:32 UTC. Do not redo these.**

### The server

| | |
|---|---|
| IP | **191.215.35.21** |
| OS | Ubuntu 24.04.4 LTS, clean, no control panel |
| Plan | Hostinger KVM 1 — 1 vCPU, 4 GB RAM, 48 GB disk (47 GB free), 4 TB bandwidth |
| Access | `ssh root@191.215.35.21` — **key auth works** |

### Done and verified

- ✅ **SSH key auth working.** An ed25519 key was added at provision time.
  Comment `qasaskids-vps`, fingerprint
  `SHA256:xM5flUI6Zxxz61R8ggg+r7W+aNC0mwlJIZCJVvHdNdw`. The private key is
  passphrase-protected and held in the Windows `ssh-agent` service on the
  owner's machine (service set to Automatic and started).
- ✅ **DNS done and propagated.** Confirmed against `8.8.8.8`:
  - `qasaskids.com` → `191.215.35.21`
  - `www.qasaskids.com` → `191.215.35.21`
  - Nameservers: `apollo.dns-parking.com`, `athena.dns-parking.com`
    (Hostinger). Records are managed in the Hostinger domain panel.
  - The old parking A record (`2.57.91.91`) is gone.
- ✅ `apt update && apt upgrade` completed.
- ✅ Installed: **nginx 1.24.0**, **git 2.43.0**, `ufw`, `curl`.
- ✅ **Firewall active** and enabled at boot:
  ```
  [1] OpenSSH       ALLOW IN  Anywhere
  [2] Nginx Full    ALLOW IN  Anywhere
  [3] OpenSSH (v6)  ALLOW IN  Anywhere (v6)
  [4] Nginx Full (v6) ALLOW IN Anywhere (v6)
  ```

### Not done — this is the remaining work

- ❌ Node not installed
- ❌ `qasas` service user not created; `/srv` is empty
- ❌ Repo not cloned, never built on this box
- ❌ `output: "standalone"` not yet set in `next.config.ts` (§2)
- ❌ nanoid advisory not cleared (§3)
- ❌ No systemd unit; nginx still serving only the default site
- ❌ No TLS — certbot not installed
- ❌ **SSH still accepts passwords** (§7)

### One finding to act on

`sshd` has two conflicting drop-ins, and OpenSSH takes the **first** value it
reads, so password login is currently **enabled**:

```
/etc/ssh/sshd_config.d/50-cloud-init.conf:        PasswordAuthentication yes   ← wins
/etc/ssh/sshd_config.d/60-cloudimg-settings.conf: PasswordAuthentication no
```

Hardening in §7 must edit **`50-cloud-init.conf`**. Editing the 60- file or
`sshd_config` itself will appear to work and change nothing.

---

## 1. Remaining work, in order

1. Node 22 LTS (§4.1)
2. `qasas` user, clone, build (§4.2)
3. `standalone` config change (§2) and the nanoid fix (§3) — **commit these
   to the repo, not just on the server**
4. systemd unit (§4.4)
5. nginx site (§4.5)
6. TLS (§4.6)
7. SSH hardening (§7)
8. Verification (§6) — all of it

Accounts, sign-in and student progress are a **later phase** and out of scope
here. That plan is [ACCOUNTS_PLAN.md](ACCOUNTS_PLAN.md); do not start it
until the static site is live and verified.

---

## 2. Build mode — `standalone`, not `export`

The site is **100% static today**: 109 routes, all `○`/`●`, no API routes, no
server actions, no middleware, no env vars, no database.

So a VPS is more than this site currently needs, and that is recorded here
deliberately — a free static host would serve today's site faster. **The VPS
is justified by the planned sign-in work** ([ACCOUNTS_PLAN.md](ACCOUNTS_PLAN.md)),
whose routes must read a session cookie and therefore cannot be static. The
owner has chosen this path; the note exists so the tradeoff is not
rediscovered later.

| | `output: "export"` | `output: "standalone"` ← use |
|---|---|---|
| Runtime | none, nginx serves files | Node behind nginx |
| `next/image` | breaks without `unoptimized: true` | works |
| Accounts later | needs redoing | already right |

**Why:** `next/image` is used in [app/page.tsx](app/page.tsx) and
[components/BookReader.tsx](components/BookReader.tsx). A static export would
force `unoptimized: true`, shipping full-size `public/art` (5.8 MB) and
`public/book` (1.2 MB) to every visitor — a real regression on the phones
this audience reads on.

```ts
// next.config.ts
const nextConfig: NextConfig = {
  output: "standalone",
};
```

**Build it and confirm before deploying.** The existing comment in that file
claims standalone is "verified to build" — treat that as unverified.

---

## 3. Clear the vulnerability first

```
nanoid <3.3.18   high   GHSA-2v37-7h3g-55p8
custom generators can loop indefinitely when size is zero
```

Transitive. Run `npm audit fix` (not `--force`), commit the lockfile change
**on its own** so it can be reverted independently, then re-verify. If the
clean fix does not resolve it, report back rather than escalating.

---

## 4. Server setup

### 4.1 Node 22 LTS

Local dev is on Node 24; pin the server to LTS.

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
apt-get install -y nodejs
node --version
```

### 4.2 App user and first build

```bash
adduser --system --group --home /srv/qasas qasas
sudo -u qasas git clone https://github.com/Senaptix/arabicthroughstories.git /srv/qasas/app
cd /srv/qasas/app
sudo -u qasas npm ci
sudo -u qasas npm run build
```

`npm run build` runs `prebuild` → `npm run check` → `lib/parse.check.ts`, the
content guard. **A failing guard means the content is wrong, not that the
guard should be skipped.** Never use `--ignore-scripts` or bypass `prebuild`.

On 1 vCPU expect roughly 3–5 minutes.

### 4.3 The standalone copy step

`output: "standalone"` does **not** copy `public/` or `.next/static/`. This
is the usual way one of these deploys ends up live with working HTML and no
CSS, images or audio:

```bash
cp -r public .next/standalone/public
cp -r .next/static .next/standalone/.next/static
```

Put these in the deploy script (§5) so they cannot be forgotten.

### 4.4 systemd

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

`HOSTNAME=127.0.0.1` binds to localhost, so Node is reachable only through
nginx. Port 3000 is closed at the firewall anyway.

```bash
systemctl daemon-reload
systemctl enable --now qasas
systemctl status qasas
```

**Use systemd, not PM2** — already present, survives reboot without extra
setup, one less thing to patch.

### 4.5 nginx

Remove the default site. `/etc/nginx/sites-available/qasaskids.com`:

```nginx
server {
    listen 80;
    server_name qasaskids.com www.qasaskids.com;

    # Audio is the bulk of this site: 14MB across 50 clips, replayed often
    # by children. Long-cache immutable build output and media; let HTML
    # revalidate.
    # proxy_hide_header is REQUIRED, not decoration. add_header APPENDS to
    # what the upstream sent, and Next.js serves public/ files with
    # "Cache-Control: public, max-age=0". Without hiding that first, the
    # response carries BOTH headers, clients act on the max-age=0, and the
    # audio re-downloads every visit — the opposite of the intent here.
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_hide_header Cache-Control;
        add_header Cache-Control "public, max-age=31536000, immutable" always;
    }

    location /audio/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_hide_header Cache-Control;
        add_header Cache-Control "public, max-age=2592000" always;
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
ln -s /etc/nginx/sites-available/qasaskids.com /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
```

### 4.6 TLS

DNS is already live (§0), so this can run immediately.

```bash
apt-get install -y certbot python3-certbot-nginx
certbot --nginx -d qasaskids.com -d www.qasaskids.com
```

Choose redirect-HTTP-to-HTTPS. Then confirm renewal actually works:

```bash
systemctl list-timers | grep certbot
certbot renew --dry-run
```

**Canonical host is the apex**, `qasaskids.com`, with `www` redirecting to
it. This is what will be printed beside the book's QR code, so it should not
change afterwards.

---

## 5. Deploy script

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

`set -euo pipefail` matters — without it a failed build still restarts the
service and can put a broken tree live.

There is a brief drop during restart. Acceptable here; do not build
blue/green deployment for a children's book companion.

---

## 6. Verification — all of it

1. `npm run build` shows **109 routes, all `○`/`●`**. Any route turning `ƒ`
   is a regression: nothing in this deploy should change rendering.
2. `npm run lint` and `npx tsc --noEmit` clean.
3. `npm audit` — nanoid advisory gone.
4. `https://qasaskids.com` loads with a valid certificate.
5. `http://` redirects to `https://`; `www` redirects to the apex.
6. **Arabic renders with full diacritics** in Scheherazade New. `next/font`
   self-hosts at build time, so this proves the font shipped. Garbled or
   unvowelled Arabic is a **blocking failure** — the vowel marks are the
   thing being taught.
7. **Audio plays and the read-along highlights.** Open `/books/ibrahim/p3`
   and `/books/ibrahim/p4`, press play, confirm the highlighted line advances
   with the narration. These are the only two configured read-alongs.
8. **Range requests work** — seek to the middle of a clip and confirm it
   plays. Missing `Accept-Ranges` breaks scrubbing.
8b. **Caching actually applies** — `curl -I` an audio file and a
   `/_next/static/` asset and confirm **exactly one** `Cache-Control`
   header on each. Two headers means `proxy_hide_header` is missing and
   the long cache is not in force. Passing check 8 does not imply this.
9. `/books/ibrahim/p3/practice` end to end: answer **every exercise the
   page actually has** — page 3 has **three** (match, choose, order), not
   four. `EXERCISE_SPEC.md` rule 8 skips a type rather than forcing it, and
   names pages 3, 5 and 6 as having three. Confirm the results list and
   per-exercise "Try again".
10. **`reboot`, then confirm the site returns unattended.** This is what
    proves the systemd unit is enabled, and it is the check most often
    skipped.
11. Mobile width 375px: no horizontal scroll, tap targets usable.

---

## 7. SSH hardening — do this last

Do it **after** §6 passes, so a mistake here cannot be tangled up with a
broken deploy. Keep the current session open while testing, so a new
terminal can verify before the old one is closed.

Per §0, edit **`/etc/ssh/sshd_config.d/50-cloud-init.conf`** — it is the file
that wins:

```
PasswordAuthentication no
```

```bash
sshd -t && systemctl restart ssh
```

**Then, in a NEW terminal**, confirm `ssh root@191.215.35.21` still works on
the key before closing the existing session. A public IP starts collecting
automated password-guessing within hours; key-only auth makes it pointless.

Consider also creating a non-root sudo user for day-to-day access and
disabling `PermitRootLogin`. Not required, and not to be done in the same
change as the above — verify one, then the other.

---

## 8. Do not

- **Do not run `npm run dev` on the server.**
- **Do not bypass the content guard.** `prebuild` → `lib/parse.check.ts`
  exists because a wrong Arabic vowel changes the word. A red guard is a
  content bug to fix, never a check to disable.
- **Do not edit content on the server.** `content/data/` is source, edited in
  the repo. A server-side edit is silently destroyed by the next
  `git pull --ff-only`.
- **Do not add analytics, cookie banners, chat widgets or ad scripts.** This
  site is used by children; that is the owner's decision, not a deploy-time
  addition.
- **Do not install a control panel** (cPanel/Plesk/CloudPanel). It will fight
  this nginx config.
- **Do not commit secrets.** None are needed today. When accounts land,
  keys go in an env file readable only by `qasas`, never in the repo.
- **Do not force-push or rewrite `master`.**
- **Do not start the accounts work** ([ACCOUNTS_PLAN.md](ACCOUNTS_PLAN.md))
  until the static site is live and §6 passes.

---

## 9. Open items for the owner

1. **Backups.** Hostinger's paid daily backup was declined at purchase, on
   the reasoning that the box holds nothing that is not in git. **That stops
   being true the moment accounts ship** — student progress will exist only
   here. Raise it before that phase goes live. A nightly `pg_dump` offsite is
   both cheaper and more reliable than a filesystem snapshot of a running
   database.
2. **Where the book's single QR points.** `ACCESS_MODEL.md` in the book repo
   specifies one QR per book, not per page. Settle the URL before print.
3. **Email for the domain.** Not covered here. `hello@qasaskids.com` would
   need MX records, independent of this deploy.
4. **Renewal.** VPS renews at **£11.99/mo** from August 2027 (paid £86.26 for
   the first 12 months).
