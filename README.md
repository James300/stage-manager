# Into the Woods Rehearsal Scheduler

Rehearsal planning for the Into the Woods community theatre production.

## Getting Started

Requires Node.js 20.9 or later and npm.

1. Install dependencies with `npm install`.
2. Create a Neon development branch from the production branch, then copy `.env.example` to `.env.local`. Set `DATABASE_URL` to the development branch connection string, along with `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `ADMIN_EMAILS` (comma-separated administrator email addresses), and the email credentials used for sign-in links and password resets. Local and production use the same self-hosted Better Auth integration; the branch supplies the user and credential records.
3. Start the development server with `npm run dev`.

The app is available at [http://localhost:3000](http://localhost:3000).

## Useful Commands

- `npm run lint` checks code style and Next.js rules.
- `npm run typecheck` runs the TypeScript checker.
- `npm run build` applies Drizzle migrations and then creates the production build. Configure `DATABASE_URL` before running it.
- `npm run build:local` creates a production build without applying migrations, for local build verification.
- `npm run db:generate` creates a Drizzle migration from schema changes.
- `npm run db:migrate` applies migrations using the PostgreSQL driver. The build-time migration requires a PostgreSQL connection available to the Vercel build environment.
- `npm run db:studio` opens Drizzle Studio.

Only addresses in `ADMIN_EMAILS` or matching an email on a performer profile can create an account. Users register through an emailed magic link, which verifies their email address; they can set a password after their first sign-in or continue using magic links. Password reset links are available from the sign-in page. Administrators can manage the cast and performers, while other users can view rehearsals, the script, and scenes.

See [system-design.md](system-design.md) for the system architecture, [todo.readme](todo.readme) for planned work, and [agents.md](agents.md) for project-specific agent rules.
