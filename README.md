# Duneworks Productions CRM

Studio CRM for Duneworks Productions — clients, projects, finance, and calendar.

## Stack

- Next.js (App Router) + TypeScript
- Prisma + SQLite (free local database)
- Tailwind CSS + shadcn/ui

## Setup

```bash
npm install
cp .env.example .env
npx prisma migrate dev
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and create the first studio account. All CRM data is stored in `prisma/dev.db`.

## Netlify

Connect the GitHub repo and deploy. The build no longer requires `DATABASE_URL` to be set before `npm install`.

Set these in **Site configuration → Environment variables**:

- `SESSION_SECRET` — a long random string (used to sign login cookies)
- Optional `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` — a free [Turso](https://turso.tech) database so clients, projects, and logins persist across deploys

Without Turso, Netlify uses a temporary SQLite file. That works for a live demo, but data can reset when functions restart.

## Scripts

- `npm run dev` — start the app
- `npm run build` — production build
- `npx prisma migrate dev` — apply database migrations
- `npx prisma studio` — inspect the database
