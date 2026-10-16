import { asc, eq } from "drizzle-orm";
import Link from "next/link";
import { connection } from "next/server";
import { SignOutButton } from "@/app/sign-out-button";
import {
  assignCharacter,
  createCharacter,
  createPerformer,
  deleteCharacter,
  deletePerformer,
  unassignCharacter,
  updateCharacter,
  updatePerformer,
} from "@/app/cast/actions";
import { getDb } from "@/db";
import { characters, performerCharacters, performers } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";
import { getCurrentProduction } from "@/lib/production";

export default async function CastPage() {
  await connection();
  const admin = await requireAdmin();
  const production = await getCurrentProduction();
  const db = getDb();

  const cast = await db
    .select()
    .from(performers)
    .where(eq(performers.productionId, production.id))
    .orderBy(asc(performers.name));
  const castCharacters = await db
    .select({
      performerId: performerCharacters.performerId,
      id: characters.id,
      name: characters.name,
    })
    .from(performerCharacters)
    .innerJoin(characters, eq(performerCharacters.characterId, characters.id))
    .where(eq(characters.productionId, production.id))
    .orderBy(asc(characters.name));
  const characterList = await db
    .select()
    .from(characters)
    .where(eq(characters.productionId, production.id))
    .orderBy(asc(characters.name));

  const rolesByPerformer = new Map<string, typeof castCharacters>();
  for (const role of castCharacters) {
    const roles = rolesByPerformer.get(role.performerId) ?? [];
    roles.push(role);
    rolesByPerformer.set(role.performerId, roles);
  }

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-5 py-8 sm:px-8">
      <header className="mb-10 flex flex-wrap items-center justify-between gap-4 border-b border-black/10 pb-5">
        <Link className="text-sm font-semibold tracking-wide text-[var(--accent)]" href="/">
          INTO THE WOODS
        </Link>
        <div className="flex items-center gap-4 text-sm text-[var(--muted)]">
          <Link className="font-medium text-[var(--accent)]" href="/scenes">
            Scenes
          </Link>
          <span>{admin.name}</span>
          <SignOutButton />
        </div>
      </header>

      <section className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-3 text-sm font-medium uppercase tracking-widest text-[var(--accent)]">
            Production directory
          </p>
          <h1 className="text-4xl font-semibold sm:text-5xl">Cast</h1>
          <p className="mt-3 text-[var(--muted)]">{production.name}</p>
        </div>
        <div className="rounded-xl border border-black/10 bg-white/70 px-5 py-3 text-sm">
          <span className="font-semibold">{cast.length}</span> performers
          <span className="mx-2 text-black/25">·</span>
          <span className="font-semibold">{characterList.length}</span> characters
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section aria-labelledby="performers-heading">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 id="performers-heading" className="text-xl font-semibold">
              Performers
            </h2>
            <span className="text-sm text-[var(--muted)]">Edit contact details and character assignments</span>
          </div>

          {cast.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-black/20 bg-white/50 p-8 text-center text-[var(--muted)]">
              No performers added yet. Add the first performer using the form.
            </div>
          ) : (
            <ul className="space-y-4">
              {cast.map((performer) => {
                const assignedRoles = rolesByPerformer.get(performer.id) ?? [];
                const assignedCharacterIds = new Set(assignedRoles.map((role) => role.id));
                const availableCharacters = characterList.filter(
                  (character) => !assignedCharacterIds.has(character.id),
                );

                return (
                  <li key={performer.id} className="rounded-2xl border border-black/10 bg-white/80 p-5 shadow-sm">
                    <form action={updatePerformer} className="grid gap-3 sm:grid-cols-2">
                      <input type="hidden" name="id" value={performer.id} />
                      <label className="grid gap-1 text-sm font-medium">
                        Performer name
                        <input
                          className="field"
                          name="name"
                          defaultValue={performer.name}
                          required
                          maxLength={160}
                        />
                      </label>
                      <label className="grid gap-1 text-sm font-medium">
                        Email
                        <input
                          className="field"
                          type="email"
                          name="email"
                          defaultValue={performer.email ?? ""}
                          maxLength={320}
                        />
                      </label>
                      <label className="grid gap-1 text-sm font-medium">
                        Phone
                        <input className="field" name="phone" defaultValue={performer.phone ?? ""} maxLength={40} />
                      </label>
                      <label className="grid gap-1 text-sm font-medium sm:col-span-2">
                        Notes
                        <textarea
                          className="field min-h-20"
                          name="notes"
                          defaultValue={performer.notes ?? ""}
                          maxLength={5000}
                        />
                      </label>
                      <div className="flex flex-wrap gap-2 sm:col-span-2">
                        <button className="button-primary" type="submit">
                          Save performer
                        </button>
                        <button
                          className="button-danger"
                          type="submit"
                          formAction={deletePerformer}
                          formNoValidate
                          aria-label={`Remove ${performer.name}`}
                        >
                          Remove performer
                        </button>
                      </div>
                    </form>

                    <div className="mt-5 border-t border-black/10 pt-4">
                      <h3 className="mb-3 text-sm font-semibold">Characters</h3>
                      {assignedRoles.length > 0 ? (
                        <ul className="mb-3 flex flex-wrap gap-2">
                          {assignedRoles.map((role) => (
                            <li key={role.id}>
                              <form action={unassignCharacter}>
                                <input type="hidden" name="performerId" value={performer.id} />
                                <input type="hidden" name="characterId" value={role.id} />
                                <button
                                  className="rounded-full border border-black/10 bg-[var(--background)] px-3 py-1 text-sm hover:border-[var(--accent)]"
                                  type="submit"
                                  aria-label={`Unassign ${role.name} from ${performer.name}`}
                                >
                                  {role.name} <span aria-hidden="true">×</span>
                                </button>
                              </form>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mb-3 text-sm text-[var(--muted)]">No characters assigned.</p>
                      )}

                      {availableCharacters.length > 0 && (
                        <form action={assignCharacter} className="flex flex-wrap gap-2">
                          <input type="hidden" name="performerId" value={performer.id} />
                          <label className="sr-only" htmlFor={`character-${performer.id}`}>
                            Assign a character to {performer.name}
                          </label>
                          <select
                            className="field min-w-48 flex-1"
                            id={`character-${performer.id}`}
                            name="characterId"
                            defaultValue=""
                            required
                          >
                            <option value="" disabled>
                              Choose a character
                            </option>
                            {availableCharacters.map((character) => (
                              <option key={character.id} value={character.id}>
                                {character.name}
                              </option>
                            ))}
                          </select>
                          <button className="button-secondary" type="submit">
                            Assign
                          </button>
                        </form>
                      )}
                      {characterList.length > 0 && availableCharacters.length === 0 && (
                        <p className="text-sm text-[var(--muted)]">All characters have been assigned to this performer.</p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <form action={createPerformer} className="mt-5 rounded-2xl border border-black/10 bg-white/60 p-5">
            <h3 className="mb-4 text-lg font-semibold">Add performer</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1 text-sm font-medium">
                Performer name
                <input className="field" name="name" required maxLength={160} />
              </label>
              <label className="grid gap-1 text-sm font-medium">
                Email
                <input className="field" type="email" name="email" maxLength={320} />
              </label>
              <label className="grid gap-1 text-sm font-medium">
                Phone
                <input className="field" name="phone" maxLength={40} />
              </label>
              <label className="grid gap-1 text-sm font-medium sm:col-span-2">
                Notes
                <textarea className="field min-h-20" name="notes" maxLength={5000} />
              </label>
              <button className="button-primary sm:col-span-2 sm:justify-self-start" type="submit">
                Add performer
              </button>
            </div>
          </form>
        </section>

        <aside aria-labelledby="characters-heading">
          <h2 id="characters-heading" className="mb-4 text-xl font-semibold">
            Characters
          </h2>
          {characterList.length > 0 && (
            <ul className="mb-5 space-y-3">
              {characterList.map((character) => (
                <li key={character.id} className="rounded-xl border border-black/10 bg-white/80 p-4">
                  <form action={updateCharacter} className="grid gap-3">
                    <input type="hidden" name="id" value={character.id} />
                    <label className="grid gap-1 text-sm font-medium">
                      Character
                      <input className="field" name="name" defaultValue={character.name} required maxLength={160} />
                    </label>
                    <label className="grid gap-1 text-sm font-medium">
                      Notes
                      <textarea
                        className="field min-h-16"
                        name="notes"
                        defaultValue={character.notes ?? ""}
                        maxLength={5000}
                      />
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button className="button-secondary" type="submit">
                        Save
                      </button>
                      <button className="button-danger" type="submit" formAction={deleteCharacter} formNoValidate>
                        Remove
                      </button>
                    </div>
                  </form>
                </li>
              ))}
            </ul>
          )}
          <form action={createCharacter} className="rounded-2xl border border-black/10 bg-white/60 p-5">
            <h3 className="mb-4 text-lg font-semibold">Add character</h3>
            <label className="mb-3 grid gap-1 text-sm font-medium">
              Character name
              <input className="field" name="name" required maxLength={160} />
            </label>
            <label className="mb-4 grid gap-1 text-sm font-medium">
              Notes
              <textarea className="field min-h-20" name="notes" maxLength={5000} />
            </label>
            <button className="button-primary" type="submit">
              Add character
            </button>
          </form>
        </aside>
      </div>
    </main>
  );
}
