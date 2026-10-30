# Galaxiora.com — AWS EC2 same-day deployment (Ubuntu 24.04, x86_64)

Prepared 30 October 2026; git branch `fix/jqa3-windows-and-llm-recovery`.

**Scope:** deploy a single-instance preview with verified HTTPS, then explicitly open search indexing after release checks. This guide does not imply EC2 setup, DNS, TLS, recovery tests or any money-spending Azure/AWS action was executed by GitHub edits. User executes commands in their own AWS session; never send private keys, birth data or `.env` into a chat.

## Existing resources and safety boundaries

- Domain: `galaxiora.com` (Cloudflare DNS, DNSSEC enabled).
- Existing AWS EC2 according to owner-provided logs: Ubuntu 24.04.5 LTS x86_64, ~3.7 GiB RAM, 38 GiB disk, public IPv4 previously `51.20.116.168`. **Check EC2 console for current IP before DNS**; public IP can change when the instance stops.
- Prior SSH private key on Windows: `$env:USERPROFILE\.ssh\galaxiora-aws-key.pem`, login `ubuntu`. SSH must be restricted to the owner's IP.
- Never open ports 3000, 4000, 5100 or 5433 in AWS Security Group. Open TCP 80/443 to public; TCP 22 ONLY to the owner's current IP. [AWS official security group rules](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/security-group-rules-reference.html).
- This is NOT the development `docker-compose.yml`: its password `jyotish_dev` is intentionally excluded. Always use `deploy/aws/docker-compose.production.yml` and a new random `GALAXIORA_DB_PASSWORD`.
- Use a **strong unique** `AUTH_SECRET` and enable secure session cookies. Keep all server credentials out of Git. Keep registration/monetization off until privacy/licensing checks are complete.
- Resource use / public IPv4 / outbound transfers might incur AWS fees even on an eligible free-trial account; inspect AWS billing and budget before launch.

## 1. On Windows: validate before deploying

Stop `npm run dev:full`; in Windows PowerShell:
```powershell
cd "C:\Users\Note\jyotish-studio-git"
git status --short
git pull --ff-only origin fix/jqa3-windows-and-llm-recovery
npm ci --no-audit --no-fund
docker compose up -d db
npm run db:migrate
npm run db:generate
npm run test:news
npm run test:r2-r3
npm run build
npm run news:translate:headlines
```

The Azure F0 **headlines-only** mode requires successful manual editorial review and these PRIVATE env entries; do not enable full summaries:
```dotenv
NEWS_TRANSLATION_PROVIDER=azure
NEWS_TRANSLATION_ENABLED=1
NEWS_TRANSLATION_CONTENT_SCOPE=headlines
NEWS_TRANSLATION_HEADLINES_APPROVED=1
NEWS_TRANSLATION_QUALITY_APPROVED=0
NEWS_AZURE_MONTHLY_CHAR_LIMIT=100000
AZURE_TRANSLATOR_REGION=eastus
```
`AZURE_TRANSLATOR_KEY` must be entered **privately** in the server's `.env`, never into GitHub. A network test may consume a small number of Azure F0 characters; see Azure Portal Metrics.

## 2. AWS security group and DNS

AWS EC2 console: verify instance Running, current IPv4, inbound TCP 22 from your trusted IP/32; 80 and 443 from `0.0.0.0/0`; never add public PostgreSQL/API ports. Ensure outbound HTTPS allowed (Azure Translator, RSS, geocoding). If UFW is enabled, open 22 from trusted address and 80/443; verify SSH works before changing its firewall policy.

Cloudflare DNS: set A record `@` to **current** EC2 IPv4 and `www` CNAME `galaxiora.com`; initially set **DNS only** (grey cloud) so the Caddy certificate challenge reaches the origin directly. Remove stale conflicting A/AAAA records (particularly unmatched IPv6), keep existing DNSSEC intact. Never delete nameserver/DNSSEC settings. Cloudflare proxy may be configured only after origin HTTPS is working, with SSL/TLS mode **Full (strict)**; do not use Flexible.

## 3. SSH to existing Ubuntu EC2

From Windows:
```powershell
ssh -i "$env:USERPROFILE\.ssh\galaxiora-aws-key.pem" ubuntu@51.20.116.168
```
Replace the sample IP if the EC2 console now shows a different one.

Inside the Ubuntu SSH terminal:
```bash
set -e
node -v
npm -v
docker --version
docker compose version
git --version
df -h /
free -h
```
Ensure Node 24.x, npm, Docker Compose v2, Git and Python3 are installed, and Docker is runnable as user `ubuntu`. If `docker info` reports permission denied, arrange group permission per official Docker instructions and reconnect. Do not run the whole app as root.

Optional on 4 GiB RAM before `npm ci`/`npm run build`: if already under memory pressure, configure 2 GiB swap via Ubuntu procedures; monitor `free -h`, SSD usage and EC2 CPU credits.

## 4. Clone and configure production

Inside EC2:
```bash
sudo mkdir -p /opt/galaxiora
sudo chown ubuntu:ubuntu /opt/galaxiora
git clone --branch fix/jqa3-windows-and-llm-recovery --single-branch \
  https://github.com/OverlorDDD/jyotish-studio.git /opt/galaxiora/app
cd /opt/galaxiora/app
npm ci --no-audit --no-fund
cp .env.example .env
chmod 600 .env
openssl rand -hex 32
openssl rand -hex 48
nano .env
```

Store the **first** random string as `GALAXIORA_DB_PASSWORD`, the **second** as `AUTH_SECRET`. (Use separate unique secrets.) Configure:
```dotenv
GALAXIORA_DB_PASSWORD=<your-new-64-hex-password>
DATABASE_URL=postgresql://jyotish:<same-64-hex-password>@127.0.0.1:5433/jyotish?schema=public
AUTH_SECRET=<your-new-96-hex-secret>
NODE_ENV=production
PORT=4000
WEB_PORT=3000
INTERNAL_API_ORIGIN=http://127.0.0.1:4000
NEXT_PUBLIC_SITE_URL=https://galaxiora.com
SESSION_COOKIE_SECURE=1
SITE_NOINDEX=1
NEWS_INGESTION_ENABLED=1
NEWS_TRANSLATION_PROVIDER=azure
NEWS_TRANSLATION_ENABLED=1
NEWS_TRANSLATION_CONTENT_SCOPE=headlines
NEWS_TRANSLATION_HEADLINES_APPROVED=1
NEWS_TRANSLATION_QUALITY_APPROVED=0
NEWS_AZURE_MONTHLY_CHAR_LIMIT=100000
AZURE_TRANSLATOR_REGION=eastus
AZURE_TRANSLATOR_KEY=<private-key-from-Azure-Keys-and-Endpoint>
```
Do not blindly copy Windows `.env`: its DB dev password, loopback URL, session security and demo secrets are not production-safe. Supply any other required AI provider keys only under their applicable terms; Natal Reader v6 still works locally without providers. If genuine users will register or submit inquiries, publish truthful privacy, contact, retention and deletion policies before inviting data.

## 5. Start protected production database and migrate

On EC2, from `/opt/galaxiora/app`:
```bash
docker compose --env-file .env -f deploy/aws/docker-compose.production.yml config --quiet
docker compose --env-file .env -f deploy/aws/docker-compose.production.yml up -d db
docker compose --env-file .env -f deploy/aws/docker-compose.production.yml ps
npm run db:generate
npm run db:migrate
npm run build
```

Verify migration includes `NewsTranslationUsage`; do not run `prisma migrate reset` or `docker compose down -v`. If migrating existing 133-article archive from Windows, use an encrypted PostgreSQL `pg_dump -Fc` plus deliberate `pg_restore` **into the empty production DB before admitting visitors**, preserving original users/news/history; do not restore over live-user writes. The supplied `tools/backup-db.ps1` makes a private dump on Windows. If not migrating, the brand-new database starts without its older news archive; let ingestion run and verify articles are published.

## 6. Install durable Next/Nest services

The two service units run the application under `ubuntu` (not root), on local ports. Still inside EC2:
```bash
sudo cp deploy/aws/galaxiora-api.service /etc/systemd/system/
sudo cp deploy/aws/galaxiora-web.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now galaxiora-api.service galaxiora-web.service
sudo systemctl --no-pager --full status galaxiora-api galaxiora-web
curl --fail --silent http://127.0.0.1:4000/api/health
curl --fail --silent --output /dev/null --write-out "%{http_code}\n" http://127.0.0.1:3000/uk
```
Expected `200` and connected DB. If not, inspect `sudo journalctl -u galaxiora-api -u galaxiora-web -n 120 --no-pager`. The Next web process is only reverse-proxied via Caddy. The Nest API binds 127.0.0.1:4000 and Postgres binds 127.0.0.1:5433.

## 7. Caddy automatic HTTPS

Install the stable official Caddy package following [Caddy's Ubuntu instructions](https://caddyserver.com/docs/install). For convenience:
```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl gnupg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | \
  sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | \
  sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo chmod o+r /usr/share/keyrings/caddy-stable-archive-keyring.gpg
sudo apt update
sudo apt install -y caddy
sudo cp deploy/aws/Caddyfile /etc/caddy/Caddyfile
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl enable --now caddy
sudo systemctl reload caddy
```
Check from **Windows**, not just EC2:
```powershell
Resolve-DnsName galaxiora.com
curl.exe -I https://galaxiora.com/uk
curl.exe -I https://www.galaxiora.com/uk
curl.exe https://galaxiora.com/robots.txt
```
Expect HTTPS 200, www -> 301, preview robots **Disallow: /** while `SITE_NOINDEX=1`. Certificate can only issue after Cloudflare DNS and AWS 80/443 are correct.

## 8. Release gate, backup and index switch

From EC2:
```bash
cd /opt/galaxiora/app
npm run site:check
npm run launch:verify
npm run r2:audit
npm run r3:seo:check
npm run news:doctor
npm run news:quality
npm run news:azure:budget
```
These default to probing localhost and are read-only. `news:quality` may initially fail on an empty/new DB or on known missing source-backed teasers; never call it `CONTENT_READY` without an actual report. In approved `headlines` mode, new user-facing news cards with a title/source may be published while summary QA remains an explicit separate editorial gate.

Before public registration, complete a PostgreSQL backup/restore drill **on another database**, configure periodic encrypted private backups (including off-host retention), verify 401 private routes and 404 public Swagger, audit news photo rights and enable monitoring/CloudWatch. Protect personal birth data and user emails.

When AND ONLY when the live domain, HTTPS, privacy, news policy, sitemap and crawler access are confirmed, set `SITE_NOINDEX=0` in `.env`, then rebuild Next **because SEO metadata is compiled during production build**, restart both services and recheck `/robots.txt`, `/sitemap.xml`, canonical/hreflang, Search Console and Bing Webmaster. Do not confuse a reachable preview with an indexed production release.

For each later code update:
```bash
cd /opt/galaxiora/app
git pull --ff-only origin fix/jqa3-windows-and-llm-recovery
npm ci --no-audit --no-fund
npm run db:generate && npm run db:migrate && npm run build
sudo systemctl restart galaxiora-api galaxiora-web
```

### What cannot be completed by repository changes

No direct access is available to the user's AWS console/SSH key, private Azure key, local Windows DB, Cloudflare DNS or live EC2 instance. The user must operate those resources. A GitHub Actions PASS validates code, not whether a deployed website is live. No guarantee of forever-free AWS/EC2 public IPv4 or ranking in ChatGPT/Google.
