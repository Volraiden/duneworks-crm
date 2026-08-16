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

## Scripts

- `npm run dev` — start the app
- `npm run build` — production build
- `npx prisma migrate dev` — apply database migrations
- `npx prisma studio` — inspect the database
