Smoodify 🎧✨

Music → Mood Analytics Dashboard (Laravel + Inertia + Vite + shadcn/ui + R3F)

Smoodify is a full-stack web app that analyzes listening behavior (valence/energy + play events) and turns it into a cinematic dashboard + insights feed. It includes a scroll-driven 3D landing scene (React Three Fiber) and a modern dashboard UI (shadcn/ui + Recharts).

⸻

Table of Contents
	•	Features￼
	•	Tech Stack￼
	•	Screenshots￼
	•	Project Structure￼
	•	Prerequisites￼
	•	Local Setup (Recommended)￼
	•	Environment Variables￼
	•	Database Setup￼
	•	Queues / Background Jobs￼
	•	Building Assets (Vite)￼
	•	Testing (Optional)￼
	•	Docker￼
	•	Deploying to AWS (ECR + ECS)￼
	•	Force HTTPS / Fix Mixed Content￼
	•	Troubleshooting￼
	•	Performance Tips￼
	•	Contributing￼
	•	License￼

⸻

Features
	•	Cinematic landing page with scroll-driven 3D scene (React Three Fiber)
	•	Mood dashboard
	•	Daily valence/energy trend
	•	Play volume trend
	•	Highlights: best day, toughest day, most plays, weekday insights
	•	Patterns: explainable insights across weekday/time buckets
	•	Demo pipeline: generate demo data + queue analysis jobs
	•	Live refresh support while jobs run
	•	Dark-mode-first UI (Tailwind + shadcn/ui)
	•	Optimized production build with Vite

⸻

Tech Stack

Backend
	•	Laravel
	•	Queues: Redis recommended (database queue supported)
	•	Database: MySQL/Postgres

Frontend
	•	Inertia.js + React
	•	Vite
	•	TailwindCSS + shadcn/ui
	•	Recharts
	•	Framer Motion
	•	React Three Fiber + drei

⸻

Screenshots

Add screenshots/GIFs here (recommended):
	•	Landing (scroll scene)
	•	Dashboard (charts + patterns)

Example:

![Dashboard](docs/screens/dashboard.png)


⸻

Project Structure

Common paths you’ll touch:
	•	resources/js/Pages/ → Inertia pages (Home, Dashboard, etc.)
	•	resources/js/components/ → UI + 3D scene components
	•	resources/css/ → Tailwind entry
	•	routes/web.php → web routes
	•	app/Jobs/ → background analysis jobs
	•	app/Http/Controllers/ → endpoints (demo generation, dashboard data, etc.)

⸻

Prerequisites

Install these before you start.

Required
	•	PHP 8.2+ (8.3 recommended)
	•	Composer
	•	Node.js 18+ (Node 20 recommended)
	•	npm (or pnpm/yarn)
	•	Database: MySQL/Postgres
	•	Git

Recommended
	•	Redis (queue + cache)
	•	Docker Desktop (container workflow)

⸻

Local Setup (Recommended)

1) Clone the repo

git clone https://github.com/<YOUR_ORG_OR_USER>/smoodify.git
cd smoodify

2) Install backend dependencies

composer install

3) Install frontend dependencies

npm install

4) Create .env

cp .env.example .env
php artisan key:generate

5) Configure .env

Update DB/Redis settings (see Environment Variables￼).

6) Run migrations

php artisan migrate

7) Start dev servers (two terminals)

Terminal A (Laravel):

php artisan serve

Terminal B (Vite):

npm run dev

Open:
	•	http://127.0.0.1:8000

⸻

Environment Variables

Minimum typical local config:

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

Redis (recommended)

CACHE_STORE=redis
SESSION_DRIVER=redis
QUEUE_CONNECTION=redis

REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

Production (important)

APP_ENV=production
APP_DEBUG=false
APP_URL=https://smoodify.site
ASSET_URL=https://smoodify.site
SESSION_SECURE_COOKIE=true


⸻

Database Setup

MySQL quick start

CREATE DATABASE smoodify CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

Then:

php artisan migrate


⸻

Queues / Background Jobs

Option A — Database queue
	1.	Set:

QUEUE_CONNECTION=database

	2.	Create queue tables:

php artisan queue:table
php artisan migrate

	3.	Run worker:

php artisan queue:work

Option B — Redis queue (recommended)

Set:

QUEUE_CONNECTION=redis

Run worker:

php artisan queue:work --sleep=1 --tries=3

Tip: Keep the worker running while generating demo data or importing datasets.

⸻

Building Assets (Vite)

Development

npm run dev

Production build

npm run build

Vite outputs to:
	•	public/build/

⸻

Testing (Optional)

If your project includes tests:

php artisan test


⸻

Docker

Notes
	•	Production images should include:
	•	vendor/ (Composer install)
	•	public/build/ (Vite build)
	•	Serve Laravel via Nginx + PHP-FPM behind an AWS ALB.

Build and run (example)

docker build -t smoodify:latest .
docker run -p 8080:8080 --env-file .env smoodify:latest

Open:
	•	http://localhost:8080

⸻

Deploying to AWS (ECR + ECS)

Target (provided):
	•	Region: eu-central-1
	•	ECR Repo URI: 987307484276.dkr.ecr.eu-central-1.amazonaws.com/smoodify

1) Login to ECR

aws configure set region eu-central-1

aws ecr get-login-password --region eu-central-1 \
  | docker login --username AWS --password-stdin 987307484276.dkr.ecr.eu-central-1.amazonaws.com

2) Build + tag + push

docker build -t smoodify:latest .

docker tag smoodify:latest 987307484276.dkr.ecr.eu-central-1.amazonaws.com/smoodify:latest
docker push 987307484276.dkr.ecr.eu-central-1.amazonaws.com/smoodify:latest

3) Recommended: versioned tags

GIT_SHA=$(git rev-parse --short HEAD)
docker tag smoodify:latest 987307484276.dkr.ecr.eu-central-1.amazonaws.com/smoodify:$GIT_SHA
docker push 987307484276.dkr.ecr.eu-central-1.amazonaws.com/smoodify:$GIT_SHA

4) ECS/ALB requirements
	•	ALB Listener 80 → redirect to 443
	•	ALB Listener 443 → forward to target group (container port 8080)
	•	Task Definition env vars:

APP_ENV=production
APP_DEBUG=false
APP_URL=https://smoodify.site
ASSET_URL=https://smoodify.site
SESSION_SECURE_COOKIE=true


⸻

Force HTTPS / Fix Mixed Content

If you see browser warnings like:

requested insecure content from http://smoodify.site/build/assets/...

Checklist
	1.	Trust proxy headers (X-Forwarded-Proto) in Laravel:
app/Http/Middleware/TrustProxies.php

protected $proxies = '*';
protected $headers = \Illuminate\Http\Request::HEADER_X_FORWARDED_ALL;

	2.	Force HTTPS scheme in production:
app/Providers/AppServiceProvider.php

if (app()->environment('production')) {
    \Illuminate\Support\Facades\URL::forceScheme('https');
}

	3.	Set env vars:

APP_URL=https://smoodify.site
ASSET_URL=https://smoodify.site

	4.	Clear + recache config:

php artisan optimize:clear
php artisan config:cache

	5.	Recommended: make Vite output relative URLs to avoid scheme issues:
vite.config.js

export default defineConfig({
  base: "",
  // ...
})

Then rebuild:

npm run build


⸻

Troubleshooting

Blank page / missing JS/CSS
	•	Dev: ensure Vite is running (npm run dev)
	•	Prod: ensure npm run build was executed and public/build/manifest.json exists
	•	Check that APP_URL and ASSET_URL are correct

419 Page Expired (CSRF)
	•	Ensure session driver is configured correctly
	•	Make sure APP_URL matches the domain
	•	In production behind HTTPS:

SESSION_SECURE_COOKIE=true

Queue jobs not running
	•	Start worker:

php artisan queue:work

	•	If using Redis: confirm Redis host/port and network access

3D scene lag (low-end GPUs)
	•	Lower DPR (example: dpr={[1, 1.5]})
	•	Reduce particle counts / heavy shader effects
	•	Respect prefers-reduced-motion for users

⸻

Performance Tips
	•	React Three Fiber:
	•	reduce DPR: dpr={[1, 1.5]}
	•	reduce particles / geometry segments
	•	avoid expensive effects on mobile
	•	Framer Motion:
	•	gate animations behind useReducedMotion()
	•	prefer whileInView={{ once: true }} for heavy sections
	•	Laravel:
	•	config:cache, route:cache, view:cache in production
	•	Redis for cache/queue
	•	CDN:
	•	CloudFront for public/build assets is a big win

⸻

Contributing

PRs welcome.
	1.	Fork the repo
	2.	Create a branch: feat/my-feature
	3.	Run checks (build/tests)
	4.	Open a PR with screenshots for UI changes

⸻

License

Add your license here (MIT recommended) or keep private.
