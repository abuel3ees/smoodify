# Link to the live web app: [website][an_awesome_website_link]
[an_awesome_website_link]: https://smoodify.site
# Smoodify 🎧✨
**Music → Mood Analytics (Laravel + Inertia + Vite + shadcn/ui + R3F)**

Smoodify is a full-stack web app that analyzes listening behavior (valence/energy + play events) and turns it into a cinematic dashboard + explainable insights. It includes a scroll-driven 3D landing scene (React Three Fiber) and a modern dashboard UI (shadcn/ui + Recharts).

---

## Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Quick Start (Local Dev)](#quick-start-local-dev)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Queues / Background Jobs](#queues--background-jobs)
- [Vite / Assets](#vite--assets)
- [Production Mode (Local)](#production-mode-local)
- [Docker](#docker)
- [AWS Deployment (ECR + ECS + ALB)](#aws-deployment-ecr--ecs--alb)
- [Force HTTPS / Fix Mixed Content](#force-https--fix-mixed-content)
- [Troubleshooting](#troubleshooting)
- [Performance Tips](#performance-tips)
- [Contributing](#contributing)
- [License](#license)

---

## Features
- Scroll-driven **3D landing page** (React Three Fiber + shaders)
- **Dashboard**
  - Daily mood trend: **valence** + **energy**
  - Play volume trend
  - Highlights: best day, toughest day, most plays, weekday signals
- **Patterns**: explainable insights across weekday/time buckets
- **Demo mode**: generate demo data + queue analysis
- Optional **live refresh** while background jobs are running
- Dark-mode-first UI design (Tailwind + shadcn/ui)

---

## Tech Stack
### Backend
- Laravel
- Queues: Redis recommended (database queue supported)
- DB: MySQL or Postgres

### Frontend
- Inertia.js + React
- Vite
- TailwindCSS + shadcn/ui
- Recharts
- Framer Motion
- React Three Fiber + drei

---

## Project Structure
Common paths you’ll touch:
- `resources/js/Pages/` → Inertia pages (Home, Dashboard, etc.)
- `resources/js/components/` → UI + 3D scene components
- `resources/css/` → Tailwind entry
- `routes/web.php` → app routes
- `app/Jobs/` → background analysis jobs
- `app/Http/Controllers/` → demo generation + dashboard endpoints

---

## Prerequisites
Install these before you start.

### Required
- **PHP 8.2+** (8.3 recommended)
- **Composer**
- **Node.js 18+** (Node 20 recommended)
- **npm** (or pnpm/yarn)
- **Database**: MySQL or Postgres
- **Git**

### Recommended
- **Redis** (queue + cache)
- **Docker Desktop** (optional)
- macOS/Linux preferred (Windows works with WSL2)

---

## Quick Start (Local Dev)

### 1) Clone
```bash
git clone https://github.com/<YOUR_ORG_OR_USER>/smoodify.git
cd smoodify
```

### 2) Install backend deps
```bash
composer install
```

### 3) Install frontend deps
```bash
npm install
```

### 4) Create `.env` + app key
```bash
cp .env.example .env
php artisan key:generate
```

### 5) Configure `.env`
Update DB/Redis (see [Environment Variables](#environment-variables)).

### 6) Migrate DB
```bash
php artisan migrate
```

### 7) Run dev servers (two terminals)
**Terminal A (Laravel)**
```bash
php artisan serve
```

**Terminal B (Vite)**
```bash
npm run dev
```

Open:
- http://127.0.0.1:8000

---

## Environment Variables

### Minimum (local)
```env
APP_NAME=Smoodify
APP_ENV=local
APP_KEY=base64:...
APP_DEBUG=true
APP_URL=http://127.0.0.1:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=smoodify
DB_USERNAME=root
DB_PASSWORD=

CACHE_STORE=file
SESSION_DRIVER=file
QUEUE_CONNECTION=database
```

### Redis (recommended)
```env
CACHE_STORE=redis
SESSION_DRIVER=redis
QUEUE_CONNECTION=redis

REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379
```

### Production (important)
```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://smoodify.site
ASSET_URL=https://smoodify.site
SESSION_SECURE_COOKIE=true
```

> Tip: If your assets are behind a CDN (CloudFront), set `ASSET_URL` to the CDN origin.

---

## Database Setup

### MySQL quick start
```sql
CREATE DATABASE smoodify CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Then:
```bash
php artisan migrate
```

---

## Queues / Background Jobs

### Option A — Database queue (simple)
1) Set:
```env
QUEUE_CONNECTION=database
```

2) Create queue tables:
```bash
php artisan queue:table
php artisan migrate
```

3) Run worker:
```bash
php artisan queue:work
```

### Option B — Redis queue (recommended)
Set:
```env
QUEUE_CONNECTION=redis
```

Run worker:
```bash
php artisan queue:work --sleep=1 --tries=3
```

> Tip: Keep the worker running while generating demo data / analysis jobs.

---

## Vite / Assets

### Development
```bash
npm run dev
```

### Production build
```bash
npm run build
```

Output:
- `public/build/` (including `manifest.json`)

---

## Production Mode (Local)
This mimics production caching behavior:

```bash
php artisan optimize:clear
npm run build

APP_ENV=production APP_DEBUG=false php artisan config:cache
APP_ENV=production APP_DEBUG=false php artisan route:cache
APP_ENV=production APP_DEBUG=false php artisan view:cache

php artisan serve
```

---

## Docker

### Notes
- Production containers should include:
  - `vendor/` (Composer install)
  - `public/build/` (Vite build)
- Common setup is **Nginx + PHP-FPM** behind an AWS ALB.

### Build + run (example)
```bash
docker build -t smoodify:latest .
docker run -p 8080:8080 --env-file .env smoodify:latest
```

Open:
- http://localhost:8080

---

## AWS Deployment (ECR + ECS + ALB)

Target (provided):
- **Region:** `eu-central-1`
- **ECR Repo URI:** `987307484276.dkr.ecr.eu-central-1.amazonaws.com/smoodify`

### 1) Login to ECR
```bash
aws configure set region eu-central-1

aws ecr get-login-password --region eu-central-1 \
  | docker login --username AWS --password-stdin 987307484276.dkr.ecr.eu-central-1.amazonaws.com
```

### 2) Build + tag + push
```bash
docker build -t smoodify:latest .

docker tag smoodify:latest 987307484276.dkr.ecr.eu-central-1.amazonaws.com/smoodify:latest
docker push 987307484276.dkr.ecr.eu-central-1.amazonaws.com/smoodify:latest
```

### 3) Recommended: versioned tags
```bash
GIT_SHA=$(git rev-parse --short HEAD)
docker tag smoodify:latest 987307484276.dkr.ecr.eu-central-1.amazonaws.com/smoodify:$GIT_SHA
docker push 987307484276.dkr.ecr.eu-central-1.amazonaws.com/smoodify:$GIT_SHA
```

### 4) ECS/ALB essentials
- ALB Listener **80** → redirect to **443**
- ALB Listener **443** → forward to target group (container port, e.g. `8080`)
- Task env vars:
```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://smoodify.site
ASSET_URL=https://smoodify.site
SESSION_SECURE_COOKIE=true
```

---

## Force HTTPS / Fix Mixed Content

If you see browser warnings like:
> requested insecure content from `http://smoodify.site/build/assets/...`

### Fix checklist
1) Trust proxy headers so Laravel recognizes HTTPS behind an ALB:
`app/Http/Middleware/TrustProxies.php`
```php
protected $proxies = '*';
protected $headers = \Illuminate\Http\Request::HEADER_X_FORWARDED_ALL;
```

2) Force https URL generation in production:
`app/Providers/AppServiceProvider.php`
```php
if (app()->environment('production')) {
    \Illuminate\Support\Facades\URL::forceScheme('https');
}
```

3) Set env vars correctly:
```env
APP_URL=https://smoodify.site
ASSET_URL=https://smoodify.site
```

4) Clear + recache:
```bash
php artisan optimize:clear
php artisan config:cache
```

5) Recommended: make Vite output **relative URLs**:
`vite.config.js`
```js
export default defineConfig({
  base: "",
  // ...
})
```

Then rebuild:
```bash
npm run build
```

---

## Troubleshooting

### Assets not loading / blank page
- Dev: ensure `npm run dev` is running
- Prod: ensure `npm run build` ran and `public/build/manifest.json` exists
- Verify `APP_URL` / `ASSET_URL`
- Clear caches:
```bash
php artisan optimize:clear
```

### 419 Page Expired (CSRF)
- Ensure `APP_URL` matches domain
- In production behind HTTPS:
```env
SESSION_SECURE_COOKIE=true
```

### Jobs not running
- Start queue worker:
```bash
php artisan queue:work
```
- If Redis: confirm host/port + network access

---

## Performance Tips
- R3F (Three.js):
  - lower DPR: `dpr={[1, 1.5]}`
  - reduce particle counts / geometry segments
  - respect `prefers-reduced-motion`
- Framer Motion:
  - gate heavy animations behind `useReducedMotion()`
  - use `whileInView` with `once: true`
- Laravel:
  - `config:cache`, `route:cache`, `view:cache` in production
  - Redis for cache/queue
- CDN:
  - CloudFront for `public/build` assets is a big win

---

## Contributing
1) Fork the repo
2) Create a branch: `feat/my-feature`
3) Run `npm run build` and any tests
4) Open a PR

---

## License
Add your license here (MIT recommended) or keep private.
