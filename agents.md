# Agent Rules

Add project-specific guidance here as the team makes decisions. Keep these rules concrete and current.

- Follow the requirements and architecture in `system-design.md`; track unfinished work in `todo.readme`.
- Keep production data isolated by production identifier, including queries, authorization, and database constraints.
- Keep database access, secrets, token validation, and authorization on the server.
- Treat cast names, contact details, and availability as private data; return only what the current role needs.
- Validate untrusted input at server boundaries and enforce authorization in server actions and route handlers, not only in the UI.
- Add or update focused tests when changing security, scheduling, availability, or data-integrity behavior.
- Use Drizzle migrations for schema changes; do not edit generated migrations to hide schema drift.
- Preserve the existing Next.js, TypeScript, Tailwind, and shadcn/ui conventions; avoid unrelated refactors.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
