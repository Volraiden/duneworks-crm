# Duneworks Productions CRM

Studio CRM for Duneworks Productions — client pipeline, productions, finance, and calendar.

## Sign in

Studio admin credentials live in `src/lib/seed-config.ts` (not in UI components):

- Email: `Duneworksstudios@gmail.com`
- Password: `Duneworks123`

## Stack

- Next.js (App Router) + TypeScript
- Prisma + SQLite
- Tailwind CSS + shadcn/ui
- dnd-kit pipeline board

## Setup

```bash
npm install
cp .env.example .env
npx prisma migrate deploy
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in. Pipeline companies, notes, and permissions persist in `prisma/dev.db`.

On Netlify, studio users and CRM records are saved to Netlify Blobs so they survive function restarts. Team members you add keep their email and password and can sign in. For a dedicated database, set `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`.
