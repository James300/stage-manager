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