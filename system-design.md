# Into the Woods Rehearsal Scheduler

## Project Overview

This application helps the director and stage manager plan rehearsals for a community theatre production of *Into the Woods*. Volunteer actors have jobs and varied schedules, so the system gathers availability, tracks scene readiness, and helps create rehearsals that fit the cast.

## Goals

- Collect cast availability through secure, passwordless links.
- Maintain scenes, character-to-actor assignments, and readiness status.
- Generate rehearsal options based on availability and scene priorities.
- Let administrators review and publish a final schedule.
- Protect cast contact details and keep the architecture reusable across productions.

## Technology

- **Application:** Next.js App Router, React Server Components, Server Actions, and SSR; use SSG/ISR for content that does not require live data.
- **Language:** TypeScript.
- **Database:** Neon serverless PostgreSQL with Drizzle ORM and Drizzle Kit migrations.
- **UI:** Tailwind CSS and shadcn/ui primitives, with Lucide icons.
- **Admin authentication:** Better Auth with role-aware authorization for Directors and Stage Managers.
- **Cast availability:** Opaque, cryptographically random, expiring tokens; cast members do not need accounts.
- **Email delivery:** Resend. SMS provider is not selected; evaluate Twilio or another transactional SMS provider when SMS is scheduled for implementation.
- **Hosting:** Vercel.

## Functional Requirements

### Scene Management

- Create and edit scenes with an act, title, description, and readiness status: Not Started, Early / Blocking, Mid / Working, or Polished / Show-Ready. Group scenes by act in the scene list.
- Associate scenes with characters and the actors assigned to those characters.
- Read script blocks by scene, follow selected characters, show or highlight a performer's own dialogue, and navigate between their lines.

### Cast Directory and Profiles

- Maintain a searchable master cast directory with actor names, characters, and contact details.
- Provide individual profiles with full name, character, email, phone number, recurring availability, and one-off blocked times.
- Restrict personally identifiable contact information to authorized administrators.

### Availability and Scheduling

- Allow an administrator to create a rehearsal week or scheduling block.
- Generate an individual secure link for each cast member and deliver it by the configured channel.
- Validate links on the server, reject expired or revoked tokens, and allow cast members to submit availability without an account.
- **Phase 1:** Generate possible rehearsal slots for selected scenes, strictly respecting cast availability.
- **Phase 2:** Generate up to three schedule options using configurable weights, including scene readiness and actor turnout.
- Allow administrators to review and select a final schedule option.
- Notify cast members when a schedule is finalized.
- Prevent an actor from being assigned to overlapping rehearsals within a schedule option.

### Views

- Schedule page: confirmed rehearsals, assigned scenes, and expected attendees.
- Master calendar: cast availability overlaid with proposed and published rehearsals.
- Admin views: scene management, cast directory, availability collection, and schedule generation.

## Architecture and Data Flow

### Rendering and Mutations

- Use Server Components and server-side data access for data-backed pages.
- Use Server Actions or Route Handlers for authenticated mutations, validating inputs and authorization on the server.
- Use SSR for dynamic calendars, schedule generation, and availability links.
- Use SSG/ISR only for static or informational content.
- Keep database access on the server; never expose database credentials or privileged provider keys to the browser.

### Availability Link Lifecycle

1. An administrator creates a rehearsal week with an availability deadline.
2. The server creates a unique, cryptographically random token per cast member and stores only a secure hash with its expiry and usage state.
3. The delivery service sends a URL such as `/availability/{token}` to the corresponding cast member.
4. The server validates the token and its expiry before rendering the mobile-friendly availability form.
5. The server validates and saves the submitted recurring or one-off availability; expired or revoked links cannot be used.

### Authorization

- Roles: Director, Stage Manager, and future Cast accounts.
- Protect `/admin/*` pages and all corresponding data operations with server-side authentication and role checks. Middleware/proxy routing is a convenience layer, not the only authorization boundary.
- Keep `/availability/[token]` public only when its token is valid and unexpired.
- Return only the minimum data needed by each page and role.

## Database Model

All production-owned records should be scoped to a production/show identifier to support multiple shows.

- **Productions:** id, name, production dates, and configuration.
- **Users / Admin memberships:** Better Auth identity plus production-scoped role assignments.
- **CastMembers:** id, production_id, name, email, phone, and other needed profile details.
- **Characters:** id, production_id, name; linked to assigned cast members.
- **Scenes:** id, production_id, scene number, act, title, description, and readiness status.
- **Scripts:** one row per scene, linked to its production and scene, with ordered script blocks stored as JSONB (`id`, `type`, optional `characterId`, and `text`).
- **SceneCharacters:** junction mapping scenes to characters.
- **RehearsalWeeks:** id, production_id, start_date, end_date, availability deadline.
- **AvailabilityTokens:** cast_member_id, week_id, token_hash, expires_at, revoked_at, and used_at/state.
- **CastAvailability:** id, cast_member_id, week_id, and normalized recurring or one-off availability ranges.
- **ScheduleOptions:** id, rehearsal week, generation parameters, and proposed/selected state.
- **Rehearsals:** id, schedule_option_id, start/end timestamps, and Proposed / Confirmed / Cancelled status.
- **RehearsalScenes:** junction mapping rehearsals to selected scenes.
- **RehearsalAttendance:** junction mapping rehearsals to cast members; enforce overlap constraints in generation and persistence.
- **Notifications:** delivery target, provider reference, status, and retry metadata where needed.

Prefer normalized timestamp ranges over JSON blobs for availability and enforce relevant production-scoped foreign keys and uniqueness constraints in PostgreSQL. Store timestamps consistently in UTC and apply the production's configured timezone for display and scheduling.

## Non-Functional Requirements

- **Usability:** Mobile-first availability entry; admin schedule and scene workflows work well on desktop and tablet; maintain accessible keyboard and screen-reader interactions.
- **Performance:** Return up to three schedule suggestions in 3–5 seconds; load core dashboards in under 2 seconds on standard connections. Measure these targets against representative production data.
- **Privacy:** Restrict email and phone access to Director and Stage Manager roles; minimize collection and exposure of personal data.
- **Security:** Hash availability tokens at rest, expire them at the scheduling deadline, rate-limit public token endpoints, validate all inputs, and keep secrets server-only.
- **Reliability:** Use a transactional email/SMS provider, track delivery outcomes, and make final-schedule notifications retryable and idempotent.
- **Conflict prevention:** Reject overlapping assignments for an actor inside one schedule option, with server-side checks and database-backed safeguards where practical.
- **Maintainability:** Keep show data isolated by production and use migrations for schema changes.

## Decisions to Revisit

- Whether SMS is required for the first release and which provider to use.
- Exact scene readiness score mapping and schedule optimization weights.
- Scheduling slot granularity, timezone ownership, and recurring availability rules.
- Data retention and deletion policies for cast contact details and expired availability submissions.
