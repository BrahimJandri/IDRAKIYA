# Hosting Guide — IDRAKIYA

This guide covers how to deploy IDRAKIYA (FastAPI + PostgreSQL + Redis backend, React/Vite frontend) to production using your own domain.

Two options are covered:

- **Option A — Hostinger VPS (KVM) + Docker Compose** (recommended): one server, full control, persistent storage for uploaded videos. Matches the `docker-compose.yml` already in this repo.
- **Option B — Managed platforms (Render + Vercel)**: less server maintenance, higher monthly cost, requires moving video storage off local disk.

---

## Option A — Hostinger VPS (KVM) + Docker Compose

### Why this option

- `docker-compose.yml` already runs Postgres, Redis, and the API together.
- Course videos are uploaded to a local `media/` folder and served as static files (`app/main.py`, `app/routers/upload.py`). This needs a **persistent disk** — a VPS gives you that natively, no extra add-ons.
- One server can host both the API and the built frontend behind a single domain.

### Platform

- **Provider**: Hostinger VPS.
- **Plan**: **KVM 2** (2 vCPU / 8 GB RAM / 100 GB NVMe / 8 TB bandwidth, ~$8.99/mo promo). Enough headroom for Postgres + Redis + API + Caddy + frontend, with room for a solid course video library. Upgrade to KVM 4 later if storage or traffic grows.
- **OS**: Ubuntu 24.04 — pick the **"Ubuntu 24.04 with Docker"** application template in hPanel so Docker + Compose are pre-installed.

### 1. Create the server (hPanel)

1. In [hPanel](https://hpanel.hostinger.com) → **VPS** → **Get a VPS**, choose the **KVM 2** plan and your preferred data center location (pick one close to your students).
2. At setup, select the **OS template "Ubuntu 24.04 with Docker"** (under the "Applications" tab) — this saves you from installing Docker manually.
3. Add your SSH public key in the setup wizard (or use the one Hostinger generates and download the private key).
4. Once the VPS is running, note its **public IP** from the hPanel dashboard.
5. SSH in and create a non-root user with sudo:
   ```bash
   ssh root@72.62.158.112
   adduser deploy && usermod -aG sudo,docker deploy
   ```
6. Enable a firewall — either via **hPanel → VPS → Firewall** (add rules for SSH 22, HTTP 80, HTTPS 443, then activate) or with `ufw` on the server:
   ```bash
   ufw allow OpenSSH
   ufw allow 80/tcp
   ufw allow 443/tcp
   ufw enable
   ```
7. If the OS template didn't include Docker, install it manually:
   ```bash
   curl -fsSL https://get.docker.com | sh
   apt install -y docker-compose-plugin
   ```

### 2. Point your domain (Namecheap) at the server

Your VPS public IP is **72.62.158.112**.

In Namecheap, go to **Domain List → idrakiya.com → Advanced DNS** tab and add these records:

| Type | Host | Value |
|---|---|---|
| A | `@` | `72.62.158.112` |
| A | `www` | `72.62.158.112` |
| A | `api` | `72.62.158.112` |

This gives you `idrakiya.com` (frontend) and `api.idrakiya.com` (backend).

> **Important**: on the **Domain** tab, delete the existing "Redirect Domain" rule (`idrakiya.com → http://www.idrakiya.com/`). That's a Namecheap-side forwarding rule that will override the A records above and send visitors to a redirect page instead of your server.

> Optional: put the domain behind Cloudflare (free plan) for CDN caching of video files and DDoS protection. If you do, set Cloudflare records to "DNS only" until SSL certs are issued, then switch to "Proxied".

### 3. Clone the repo and configure environment

```bash
git clone <your-repo-url> idrakiya && cd idrakiya
cp .env.example .env
```

Edit `.env`:

| Variable | Production value |
|---|---|
| `DEBUG` | `false` |
| `SECRET_KEY` | generate with `make secret` |
| `DATABASE_URL` | `postgresql+asyncpg://idrakiya:<strong-password>@db:5432/idrakiya` |
| `ALLOWED_ORIGINS` | `["https://idrakiya.com"]` |
| `REDIS_URL` | `redis://redis:6379` (default, leave as is) |
| `GOOGLE_CLIENT_ID` | your production OAuth client ID |
| `STRIPE_SECRET_KEY` | live key (`sk_live_...`) |
| `STRIPE_WEBHOOK_SECRET` | set after step 6 |

Also update the Postgres password in `docker-compose.yml` (`POSTGRES_PASSWORD`) to match `DATABASE_URL`, and remove the `ports: 5432/6379` mappings for `db`/`redis` so they aren't exposed to the internet.

### 4. Build the frontend

```bash
cd frontend
cp .env.production.example .env.production
```

Edit `frontend/.env.production`:
```
VITE_API_URL=https://api.idrakiya.com/api/v1
VITE_GOOGLE_CLIENT_ID=<your client id>
```

```bash
npm install
npm run build   # outputs frontend/dist
cd ..
```

### 5. Reverse proxy with automatic HTTPS (Caddy)

Create `Caddyfile` in the project root:

```caddyfile
idrakiya.com, www.idrakiya.com {
    root * /srv/frontend
    encode gzip
    try_files {path} /index.html
    file_server
}

api.idrakiya.com {
    reverse_proxy api:8000
}
```

Add a `caddy` service to `docker-compose.yml`, remove the public `ports:` mapping from `api` (Caddy reaches it over the internal Docker network on port 8000), and add volumes for Caddy's cert storage:

```yaml
  api:
    build: .
    restart: unless-stopped
    env_file: .env
    volumes:
      - ./media:/app/media
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    command: >
      sh -c "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000"

  caddy:
    image: caddy:2-alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - ./frontend/dist:/srv/frontend
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      - api

volumes:
  postgres_data:
  caddy_data:
  caddy_config:
```

Caddy automatically requests and renews Let's Encrypt certificates for all three domains on first start, as long as DNS points to the server and ports 80/443 are reachable.

### 6. Deploy

```bash
docker compose up -d --build
```

The `api` service's command already runs `alembic upgrade head` before starting Uvicorn, so the DB schema is created/updated automatically.

Verify:
- `https://api.idrakiya.com/api/health` → `{"status": "ok"}`
- `https://api.idrakiya.com/api/docs` → Swagger UI
- `https://idrakiya.com` → frontend loads

### 7. Configure the Stripe webhook

In the Stripe dashboard, add an endpoint:
```
https://api.idrakiya.com/api/v1/payments/webhook
```
Copy the generated signing secret into `STRIPE_WEBHOOK_SECRET` in `.env`, then restart the `api` container.

### 8. Backups

Set up cron jobs on the server:

- **Database**: nightly `docker compose exec db pg_dump -U idrakiya idrakiya > backup.sql`, then push off-server (e.g., `rclone` to Backblaze B2 or DigitalOcean Spaces).
- **Media**: sync the `media/` directory (uploaded course videos) to the same off-site storage — it's the only copy of your video content.

### 9. Ongoing maintenance

- `docker compose logs -f` to tail logs.
- `git pull && docker compose up -d --build` to deploy updates.
- `make migration m="..."` + redeploy for schema changes.

**Estimated cost**: ~$8.99/month (Hostinger KVM 2, promo rate — renews higher at ~$14.99/mo after the first term) + ~$1–5/month (off-site backups). Domain already owned. Hostinger's free weekly backups cover disaster recovery for the VPS itself, but a separate off-site copy of the database and `media/` videos is still recommended.

---

## Option B — Managed platforms (Render + Vercel)

This repo already includes `render.yaml` (backend) and `frontend/vercel.json` (frontend), originally set up for free tiers. To make this production-grade ("professional"), upgrade to paid plans:

### 1. Backend — Render

- Create a new Web Service from this repo; Render reads `render.yaml` automatically.
- Choose a **paid instance type** (Starter or higher) so the service doesn't sleep.
- Add a **persistent disk** (Render add-on) mounted at `/app/media` — required because uploaded videos are written to local disk (`app/routers/upload.py`). Without this, videos are lost on every redeploy.
- Add a managed **Postgres** instance (paid tier, e.g. Render Postgres Standard) and set `DATABASE_URL`.
- Add a managed **Redis** instance and set `REDIS_URL`.
- Fill in the remaining env vars from `render.yaml` (`ALLOWED_ORIGINS`, Stripe keys, etc.) — set `ALLOWED_ORIGINS` to your Vercel domain.
- Render gives you a `*.onrender.com` URL — add a custom domain (`api.idrakiya.com`) in the service settings and create a `CNAME` record at Namecheap pointing to it.

### 2. Frontend — Vercel

- Import the `frontend/` directory as a Vercel project (Pro plan for production usage/SLAs).
- `frontend/vercel.json` already configures the build command, output directory, and SPA rewrites.
- Set environment variables (from `frontend/.env.production.example`):
  - `VITE_API_URL=https://api.idrakiya.com/api/v1`
  - `VITE_GOOGLE_CLIENT_ID=<your client id>`
- Add your custom domain (`idrakiya.com`, `www.idrakiya.com`) in Vercel project settings, then update DNS at Namecheap per Vercel's instructions (typically an `A`/`CNAME` to Vercel's edge).

### 3. Stripe webhook

Point the Stripe webhook to `https://api.idrakiya.com/api/v1/payments/webhook` and set `STRIPE_WEBHOOK_SECRET` in Render's environment variables.

**Estimated cost**: ~$70–100+/month (Render web service + persistent disk + Postgres + Redis, Vercel Pro). Higher than Option A, but no server to patch or maintain.

---

## DNS quick reference (Namecheap)

| Record | For | Points to |
|---|---|---|
| `A @` | frontend root domain | VPS IP (Option A) or per Vercel docs (Option B) |
| `A/CNAME www` | www subdomain | same as above |
| `A/CNAME api` | backend API | VPS IP (Option A) or Render custom domain (Option B) |

---

## Pre-launch checklist

- [x] `DEBUG=false`
- [x] Fresh `SECRET_KEY` (not the example value)
- [x] `ALLOWED_ORIGINS` restricted to your real frontend domain(s)
- [x] Postgres password changed from the `docker-compose.yml` default
- [ ] Stripe live keys + webhook secret configured
- [x] HTTPS working on both `idrakiya.com` and `api.idrakiya.com`
- [ ] Database and media backups scheduled
