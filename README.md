# Smoodify 🎧✨  
**Music → Mood Analytics Dashboard (Laravel + Inertia + Vite + shadcn + R3F)**

Smoodify is a full-stack web app that analyzes listening behavior (valence/energy + events) and turns it into a cinematic dashboard + insights feed. It includes a scroll-driven 3D landing scene (React Three Fiber) and a modern dashboard UI (shadcn/ui + recharts).

---

## Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Local Setup (Recommended)](#local-setup-recommended)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Queues / Background Jobs](#queues--background-jobs)
- [Building Assets (Vite)](#building-assets-vite)
- [Running in Production Locally](#running-in-production-locally)
- [Docker](#docker)
- [Deploying to AWS (ECR + ECS)](#deploying-to-aws-ecr--ecs)
- [Force HTTPS / Fix Mixed Content](#force-https--fix-mixed-content)
- [Troubleshooting](#troubleshooting)
- [Performance Tips](#performance-tips)
- [Contributing](#contributing)
- [License](#license)

---

## Features
- **Cinematic landing page** with scroll-driven 3D scene (React Three Fiber)
- **Mood dashboard**: daily valence/energy trends + play volume + highlights
- **Patterns**: explainable insights across weekday/time buckets
- **Demo pipeline**: generate demo data + queue analysis jobs
- **Live refresh** support while jobs run
- **Dark-mode first UI** (with shadcn + Tailwind)
- **Optimized production build** with Vite

---

## Tech Stack
### Backend
- **Laravel** (API + job orchestration)
- **Queues** (Redis recommended)
- **Database** (MySQL/Postgres supported)

### Frontend
- **Inertia.js** + **React**
- **Vite** (build tooling)
- **TailwindCSS** + **shadcn/ui**
- **Recharts** (charts)
- **Framer Motion** (animations)
- **React Three Fiber** + **drei** (3D scenes)

---

## Project Structure
Common paths you’ll touch:
- `resources/js/Pages/` → Inertia pages (Home, Dashboard, etc.)
- `resources/js/components/` → UI + 3D scene components  
- `resources/css/` → Tailwind entry
- `routes/web.php` → app routes
- `app/Jobs/` → analysis jobs (queued)
- `app/Http/Controllers/` → endpoints (demo generation, dashboard data, etc.)

---

## Prerequisites
Install these before you start:

### Required
- **PHP 8.2+** (8.3 recommended)
- **Composer**
- **Node.js 18+** (Node 20 recommended)
- **npm** (or pnpm/yarn)
- **Database**: MySQL/Postgres
- **Git**

### Recommended
- **Redis** (for queue + cache)
- **Docker Desktop** (optional local container workflow)

---

## Local Setup (Recommended)

### 1) Clone the repo
```bash
git clone https://github.com/<your-org-or-user>/smoodify.git
cd smoodify
