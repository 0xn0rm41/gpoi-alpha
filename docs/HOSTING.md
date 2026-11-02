# Hosting Hub Studenti

Hub Studenti is **a single Node.js program** that serves the pages and talks to a **SQLite** database
(one file: `data/hub.sqlite`, plus `data/uploads/` for note photos). No Apache, PHP, MySQL or XAMPP: Node.js is enough.

```
Browsers ──HTTPS──▶ Caddy (reverse proxy) ──▶ Node.js (port 3000) ──▶ data/hub.sqlite + data/uploads/
```

> **Golden rule:** exactly one running copy of the program may use the database (SQLite is not meant for several
> servers at once). One VPS is more than enough for many schools.

**Test status of this guide.** Only the Linux path (Node.js on Linux, systemd, Caddy) matches how the project is developed. The **Docker, Windows and macOS** instructions below are **untested**: they are written from the code and the platforms' documentation. If something fails, report it and fall back to a plain Node.js install.

Contents: [1 Run it locally](#1-run-it-locally-5-minutes) · [2 Configuration notes](#2-configuration-notes) · [3 From test to production](#3-from-test-to-production) · [4 Windows](#4-windows-untested) · [5 macOS](#5-macos-untested) · [6 Docker](#6-docker-untested) · [7 Checklist](#7-security-checklist) · [8 Troubleshooting](#8-troubleshooting)

---

## 1. Run it locally (5 minutes)

1. Install **Node.js LTS** (20 or newer) from <https://nodejs.org> (Windows and macOS: installer; Linux: distribution package, NodeSource or `nvm`). Check with `node -v`.
2. In the project folder:

   | | Linux / macOS | Windows (PowerShell) |
   |---|---|---|
   | Install | `npm install` | `npm install` |
   | Configure | `cp .env.example .env` | `copy .env.example .env` |
   | Start | `npm start` | `npm start` |

3. Create a school and get its invite code (a fresh database has **no school**, so nobody can register yet):

   ```bash
   npm run admin -- school-create "My School"            # optional: add @school.edu to restrict sign-ups to that email domain
   ```

   It prints an invite code such as `K7M2Q-9XWPA`.
4. Open <http://localhost:3000>, register with that code. **Until SMTP is configured the confirmation link is printed in the server console**: copy it into the browser.
5. Become admin of your school: `npm run admin -- promote your@email` (same on Windows).

Demo data: `npm run demo` (testing only; it creates a "Demo School" if none exists).

If `npm install` fails on `better-sqlite3`: use an LTS Node.js (prebuilt binaries exist for LTS versions on Windows, macOS and Linux). On Linux without prebuilt binaries you need `python3`, `make` and `g++`.

## 2. Configuration notes

Settings live in `.env` (copy of `.env.example`) or in real environment variables (those win over `.env`; systemd and Docker use them). `.env.example` may be out of date: **`src/backend/config.js` is the reference.**

Changes from older versions of this project:

- **`NOME_SCUOLA` and `DOMINIO_SCUOLA` were removed.** Schools are now rows in the database, created with `npm run admin -- school-create "Name" [@domain]`. (`NOME_SCUOLA` is still read once, only to name the school created automatically when an old single-school database is migrated; see [DATABASE.md](DATABASE.md).) Delete both from your `.env`.
- **`SOURCE_URL` was added** (default `https://github.com/0xn0rm41/hub-studenti`). Because the project is AGPL-3.0-or-later, users of a network service must be offered the **source code of the version actually running**, including your modifications (AGPL section 13). Point `SOURCE_URL` at your fork or at the tag you deploy. The URL is exposed through `/api/config` as `source_url`.

Variables you will normally set in production: `NODE_ENV=production`, `BASE_URL=https://hub.example.org` (no trailing slash; used in email links and decides whether the session cookie is `Secure`), `TRUST_PROXY=true`, `HOST=127.0.0.1`, `SOURCE_URL`, `TITOLARE_NOME`, `TITOLARE_CONTATTO` (data controller shown in the privacy page), the `SMTP_*` group and `MAIL_FROM`.

---

## 3. From test to production

Follow the stages in order. Do not spend money before stage 2 is done.

### Stage 1: testing phase (free, no domain)

Goal: let a few real students and one representative try it, and find problems.

- **Same machine:** `http://localhost:3000` (section 1).
- **Same Wi-Fi or LAN:** set `HOST=0.0.0.0` (the default), find your LAN IP, and share `http://192.168.x.y:3000`. Set `BASE_URL` to that address so email links work. No HTTPS here, so the session cookie is not marked `Secure`: use only fake or consenting test data.
- **From outside, without opening router ports:** a tunnel (Cloudflare Tunnel, Tailscale Funnel, ngrok and similar). Set `TRUST_PROXY=true` and `BASE_URL` to the tunnel's `https://` address. The tunnel provider sees traffic in clear while forwarding it, so it is a **processor under GDPR Art. 28**: fine for a pilot with test data, and the reason to move to your own VPS for real use.
- Use `npm run demo` and `npm run admin -- verify <email>` to skip email while SMTP is not set up.
- Do **not** let real minors sign up on a test setup that you will throw away: deletions and re-installs make GDPR promises hard to keep.

Exit criteria: registration, email links, posting content, admin functions and `npm run backup` all work for you and for your pilot users.

### Stage 2: buy the domain (after the tests)

- Register a domain at a registrar with a good DNS panel (any EU registrar is fine). The domain is held by an adult or a legal entity, not by a minor.
- Pick one hostname for the app, for example `hub.example.org`. Do not use a school's domain without the school's written permission.
- If you will send email from the domain (stage 5), also check that the registrar lets you add **TXT** records (SPF, DKIM, DMARC).
- Enable registrar account two-factor authentication and auto-renew: losing the domain also loses your email links and trust.

### Stage 3: an EU VPS

- A VPS in an EU datacenter (any provider; 1 vCPU, 1 to 2 GB RAM, 20 GB SSD is plenty to start). Sign the provider's **data processing agreement (GDPR Art. 28)**. Template: [eu/gdpr/DPA-TEMPLATE.md](eu/gdpr/DPA-TEMPLATE.md).
- Debian or Ubuntu LTS, key-based SSH only, automatic security updates (`unattended-upgrades`), firewall:

  ```bash
  sudo ufw allow OpenSSH && sudo ufw allow 80/tcp && sudo ufw allow 443/tcp && sudo ufw enable
  ```

- Point the DNS **A** (and **AAAA** if you have IPv6) record of `hub.example.org` to the server.
- Install the app:

  ```bash
  sudo useradd --system --create-home --home-dir /opt/hub-studenti --shell /usr/sbin/nologin hub
  sudo -u hub git clone <your-repository-url> /opt/hub-studenti/app      # or copy the files
  cd /opt/hub-studenti/app && sudo -u hub npm ci --omit=dev
  sudo -u hub cp .env.example .env && sudo chmod 600 .env && sudo nano .env
  ```

  `.env` minimum: `NODE_ENV=production`, `BASE_URL=https://hub.example.org`, `TRUST_PROXY=true`, `HOST=127.0.0.1`, `SOURCE_URL`, `TITOLARE_*`, SMTP.

### Stage 4: Caddy and HTTPS, then systemd

**systemd** keeps the app running and restarts it. `/etc/systemd/system/hub-studenti.service`:

```ini
[Unit]
Description=Hub Studenti
After=network-online.target
Wants=network-online.target

[Service]
User=hub
WorkingDirectory=/opt/hub-studenti/app
Environment=NODE_ENV=production
ExecStart=/usr/bin/node src/backend/index.js
Restart=always
RestartSec=5
# Hardening
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/hub-studenti/app/data

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload && sudo systemctl enable --now hub-studenti
sudo systemctl status hub-studenti        # must say "active (running)"
journalctl -u hub-studenti -f             # live logs
```

(`which node` gives the right path if it is not `/usr/bin/node`.)

**Caddy** obtains and renews HTTPS certificates automatically. Install it from <https://caddyserver.com/docs/install>, then `/etc/caddy/Caddyfile`:

```
hub.example.org {
    encode gzip
    reverse_proxy 127.0.0.1:3000
}
```

`sudo systemctl reload caddy`. Needs: DNS pointing at the server, ports **80 and 443** open. The app listens only on `127.0.0.1` with `HOST=127.0.0.1`, so port 3000 is not reachable from outside.

To publish `/.well-known/security.txt` (the app itself does not serve dotfile paths), add a `handle` block as shown in [eu/cra/VULNERABILITY-POLICY.md](eu/cra/VULNERABILITY-POLICY.md#securitytxt).

> **Important:** behind a proxy, set `TRUST_PROXY=true` and `BASE_URL=https://...`. Without `TRUST_PROXY` the server sees every student with the proxy's IP address, and the login rate limit would lock out everybody at once; without `https://` in `BASE_URL` the session cookie is not marked `Secure` and no HSTS header is sent.

The proxy is also the right place for a global request rate limit (the app's own limiters are in-memory, per process, and cover only login, sign-up, email and write endpoints).

### Stage 5: email with SPF, DKIM and DMARC

Students may sign up with **addresses at any provider** (Gmail, Outlook, iCloud, school domains...) unless you restrict a school to its own domain. Those providers drop or spam-folder mail from unauthenticated senders, and without mail nobody can confirm an account or reset a password. So deliverability is part of "working".

1. **Use a real sending service or mail server** with EU servers, not the VPS's own port 25 (many VPS providers block it and a fresh IP has no reputation). Configure `SMTP_HOST`, `SMTP_PORT` (587 with `SMTP_SECURE=false`, or 465 with `SMTP_SECURE=true`), `SMTP_USER`, `SMTP_PASS` and `MAIL_FROM` (for example `"Hub Studenti <no-reply@example.org>"`). The sender service becomes a **processor** (DPA, privacy notice, processing register).
2. **SPF** (TXT on the sending domain): authorises the provider's servers. The provider gives you the exact value, typically like `v=spf1 include:_spf.provider.example ~all`. Only one SPF record per domain.
3. **DKIM** (TXT or CNAME records the provider gives you): a cryptographic signature on each message. Enable it in the provider panel and publish the records.
4. **DMARC** (TXT on `_dmarc.example.org`): start in monitoring mode, then tighten:

   ```
   v=DMARC1; p=none; rua=mailto:dmarc@example.org; adkim=s; aspf=s
   ```

   After a few weeks of clean reports move to `p=quarantine`, later `p=reject`.
5. The `From:` domain must match the SPF/DKIM domain (DMARC alignment).
6. **Test:** register a test account at Gmail, Outlook and one more provider; check inbox and spam; view the message source for `spf=pass`, `dkim=pass`, `dmarc=pass`. A tool such as mail-tester.com gives a quick score.
7. Mail-sending is synchronous in the request (no queue): choose a provider with fast, reliable SMTP.

### Stage 6: backups, and a restore test

```bash
npm run backup            # creates data/backups/hub-YYYYMMDD-hhmmss/ (consistent database copy + photos)
```

- **Schedule it every night.** Linux: `crontab -e` as user `hub`, then `30 3 * * * cd /opt/hub-studenti/app && /usr/bin/npm run backup >> /var/log/hub-backup.log 2>&1` (make the log file writable by `hub`, or log under `data/`).
- Backups older than `RITENZIONE_BACKUP_GIORNI` (default 30) are deleted by the script itself. This matters for GDPR: data that users deleted must not live forever in backups.
- Copy backups **off the server**, **encrypted** (`age`, `gpg`, or an encrypted object store), and apply the same expiry. The VPS provider's snapshots are not a substitute.
- **Restore:** stop the service; replace `data/hub.sqlite` and `data/uploads/` with the backup's copies and **delete** `data/hub.sqlite-wal` and `data/hub.sqlite-shm`; start the service. The schema migrates itself forward if the code is newer than the backup.
- After a restore, **re-delete** the accounts and schools whose erasure was requested after that backup was taken. Keep a log of such requests: see [eu/gdpr/PROCEDURES.md](eu/gdpr/PROCEDURES.md).
- **Do a restore test before launch and then periodically**, on a scratch machine: restore into an empty folder, start the app with `DATA_DIR` pointing to it, log in, and check `npm run admin -- stats` and `school-list`. A backup that was never restored is not a backup.

### Stage 7: staging versus production

- Run a **second instance** for testing upgrades: separate folder (or machine), own `.env`, own `DATA_DIR`, own port (for example 3001), own hostname such as `staging.example.org` with its own Caddy block and `BASE_URL`.
- Never copy production data into staging (it contains minors' personal data). Use `npm run demo` or synthetic data. If you must test a restore with real data, do it on an access-controlled machine and delete it afterwards.
- Staging should send mail only to test addresses (separate SMTP credentials or none: without `SMTP_HOST` links are printed to the log).
- Upgrade flow: backup production, deploy the new version to staging, run `npm test`, click through, then deploy to production (section "Updates" below).
- Staging and production must **not** share the same `data/` directory.

### Stage 8: create the schools and hand out invite codes

```bash
npm run admin -- school-create "Liceo Example" @liceoexample.edu.it   # domain is optional
npm run admin -- school-create "Istituto Other"                        # no restriction: any email provider
npm run admin -- school-list                                           # codes and member counts
```

1. Each school gets a 10-character **invite code** (shown as `XXXXX-XXXXX`, no ambiguous characters). Students enter it when they register; the code decides which school (community) they join. Anyone with the code can join, so give it to the school's representative, not publicly.
2. With the optional `@domain`, only email addresses ending in that domain can register for that school. Without it, any address works (that is why SPF/DKIM/DMARC matter).
3. The first member registers, confirms the email, and you promote them: `npm run admin -- promote rep@email`. Create **at least two** admins per school. Note: `promote` works on any user and the admin role is not tied to a school in the CLI, so check the email you type.
4. `school-code <school>` issues a new code if one leaks (existing members are not affected); `school-suspend <school>` blocks sign-in and sign-up and closes sessions; `school-activate` reverses it; `school-delete <school> --yes` **permanently** deletes the school with all users, content and photos (see [DATABASE.md](DATABASE.md)). `<school>` can be the name, the id or the invite code.
5. Before onboarding a school, make sure the privacy notice shows the right data controller and that the contractual and GDPR roles between you and the school are settled (see [eu/gdpr/](eu/gdpr/)).

### Stage 9: monitoring and updates

**Monitoring**

- `systemctl status hub-studenti` and `journalctl -u hub-studenti`; Docker: `docker compose logs`.
- An external uptime check (any uptime monitor) on `https://hub.example.org/api/config`, which is also the Docker healthcheck endpoint.
- Disk space (`data/` grows with photos and backups), certificate expiry (Caddy renews on its own: watch for errors in its log), and SMTP errors in the app log.
- There is **no structured security event log** yet (see [eu/cra/CRA.md](eu/cra/CRA.md)): review Caddy access logs after incidents.
- Subscribe to security advisories of the repository, Node.js and Caddy.

**Updates**

```bash
npm run backup && git pull && npm ci --omit=dev && sudo systemctl restart hub-studenti
npm audit --omit=dev            # known vulnerabilities in dependencies
```

Also keep Node.js (a supported LTS) and the OS up to date. **Database migrations run automatically at start-up**, inside a transaction, and are not reversible: always take a backup first. Regenerate the SBOM at each release ([eu/cra/CRA.md](eu/cra/CRA.md#6-sbom)).

---

## 4. Windows (untested)

1. Install Node.js LTS, download the project, `npm ci --omit=dev`, copy `.env.example` to `.env` and edit it. Create a school with `npm run admin -- school-create "Name"`.
2. **Start automatically** (choose one):
   - **NSSM** (<https://nssm.cc>): `nssm install HubStudenti "C:\Program Files\nodejs\node.exe" src\backend\index.js`, set the working directory to the project folder, start the service from `services.msc`.
   - **Task Scheduler**: new task "At startup", action `node.exe` with argument `src\backend\index.js` and "Start in" the project folder, "Run whether user is logged on or not".
3. HTTPS: Caddy for Windows with the same `Caddyfile` as above, or a tunnel.
4. Backups: nightly scheduled task running `npm run backup` in the project folder.

## 5. macOS (untested)

Install and `.env` as on Linux. Start automatically with `launchd`: `~/Library/LaunchAgents/org.example.hub-studenti.plist` with `ProgramArguments` = `[/usr/local/bin/node, src/backend/index.js]` (Apple Silicon Homebrew: `/opt/homebrew/bin/node`), `WorkingDirectory` = project folder, `RunAtLoad` and `KeepAlive` = `true`; then `launchctl load ...`. A Mac is fine for tests or a small pilot; for the real service use Linux.

## 6. Docker (untested)

The `Dockerfile` (`node:22-bookworm-slim`, non-root user, health check) and `docker-compose.yml` have **not been built or run** in the environment where this document was written.

```bash
cp .env.example .env     # fill it in
docker compose up -d     # builds and starts; data lives in the "hub-data" volume
docker compose exec hub node src/backend/scripts/admin.js school-create "My School"
docker compose exec hub node src/backend/scripts/admin.js promote your@email
docker compose exec hub node src/backend/scripts/backup.js
```

The container is published on `127.0.0.1:3000` only: always put Caddy or nginx in front for HTTPS. The volume `/app/data` holds the database, photos and backups: back it up from outside the container too (for example copy the output of `backup.js`), and note `docker-compose.yml` reads `.env` through `env_file` (it forces `HOST=0.0.0.0` inside the container, which is what you want there). `node_modules` is built inside the image (`npm ci --omit=dev`). If something fails, use the plain Node.js install.

---

## 7. Security checklist

- [ ] HTTPS active, `BASE_URL` starts with `https://`, `TRUST_PROXY=true` behind a proxy
- [ ] `NODE_ENV=production`; the program runs as a **non-administrator** user
- [ ] `.env` readable only by the service user (`chmod 600`) and **never** in Git
- [ ] Port 3000 not reachable from the internet; only 80/443 (and SSH, key-only)
- [ ] SMTP configured and tested; SPF, DKIM and DMARC pass
- [ ] Nightly encrypted backups copied off-site; restore tested
- [ ] `SOURCE_URL` points to the source of the running version (AGPL section 13)
- [ ] Regular updates (Node.js, OS, `npm audit --omit=dev`)
- [ ] At least 2 admins per school
- [ ] GDPR checklist completed: [eu/gdpr/GDPR.md](eu/gdpr/GDPR.md)
- [ ] Security contact and `security.txt` published: [eu/cra/VULNERABILITY-POLICY.md](eu/cra/VULNERABILITY-POLICY.md)

## 8. Troubleshooting

| Symptom | Likely cause |
|---|---|
| "Too many attempts" for everyone | `TRUST_PROXY=true` missing behind a proxy |
| Nobody can register: "invalid school code" | No school yet (`school-create`), the school is suspended, or the code was rotated |
| "This school only accepts emails ending with ..." | The school has an email domain restriction (`school-list` shows it) |
| After login you are sent back to the sign-in page | Cookie not stored: `BASE_URL` does not match the address you use (http/https, hostname) |
| No email | SMTP not configured (links are in the server console/log), wrong credentials, or the message is in spam (check SPF/DKIM/DMARC) |
| `EADDRINUSE` | Port 3000 is already used: change `PORT` |
| `database is locked` | Two copies of the program use the same database: run only one |
| Photos not shown | `data/uploads` not writable by the service user |
| Old `NOME_SCUOLA` / `DOMINIO_SCUOLA` in `.env` have no effect | They were removed; use `school-create` |
