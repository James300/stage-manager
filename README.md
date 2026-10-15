# Into the Woods Rehearsal Scheduler

Rehearsal planning for the Into the Woods community theatre production.

## Getting Started

Requires Node.js 20.9 or later and npm.

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and set `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, and any configured email credentials.
3. Start the development server with `npm run dev`.

The app is available at [http://localhost:3000](http://localhost:3000).

## Useful Commands

- `npm run lint` checks code style and Next.js rules.
- `npm run typecheck` runs the TypeScript checker.
- `npm run build` creates a production build.
- `npm run db:generate` creates a Drizzle migration from schema changes.
- `npm run db:migrate` applies migrations.
- `npm run db:studio` opens Drizzle Studio.

See [system-design.md](system-design.md) for the system architecture, [todo.readme](todo.readme) for planned work, and [agents.md](agents.md) for project-specific agent rules.