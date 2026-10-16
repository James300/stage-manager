import { asc, eq } from "drizzle-orm";
import { connection } from "next/server";
import { PageLayout } from "@/app/page-layout";
import {
  assignCharacter,
  deletePerformer,
  unassignCharacter,
  updatePerformer,
} from "@/app/cast/actions";
import { PerformerCreateModal } from "@/app/performers/performer-create-modal";
import { getDb } from "@/db";
import { characters, performerCharacters, performers } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";
import { getCurrentProduction } from "@/lib/production";

export default async function PerformersPage() {
  await connection();
  const admin = await requireAdmin();
  const production = await getCurrentProduction();
  const db = getDb();
  const performerList = await db
    .select()
    .from(performers)
    .where(eq(performers.productionId, production.id))
    .orderBy(asc(performers.name));
  const characterList = await db
    .select()
    .from(characters)
    .where(eq(characters.productionId, production.id))
    .orderBy(asc(characters.name));
  const assignments = await db
    .select({
      performerId: performerCharacters.performerId,
      id: characters.id,
      name: characters.name,
    })
    .from(performerCharacters)
    .innerJoin(characters, eq(performerCharacters.characterId, characters.id))
    .where(eq(performerCharacters.productionId, production.id))
    .orderBy(asc(characters.name));

  const charactersByPerformer = new Map<string, typeof assignments>();
  for (const assignment of assignments) {
    const assigned = charactersByPerformer.get(assignment.performerId) ?? [];
    assigned.push(assignment);
    charactersByPerformer.set(assignment.performerId, assigned);
  }

  return (
    <PageLayout
      actions={<PerformerCreateModal />}
      adminName={admin.name}
      description={`${production.name} · ${performerList.length} ${
        performerList.length === 1 ? "performer" : "performers"
      }`}
      title="Performers"
    >
      {performerList.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/20 bg-white/50 p-10 text-center">
          <h2 className="text-xl font-semibold">No performers yet</h2>
          <p className="mt-2 text-[var(--muted)]">
            Add a performer to start managing contact details and character assignments.
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {performerList.map((performer) => {
            const assignedCharacters = charactersByPerformer.get(performer.id) ?? [];
            const assignedIds = new Set(assignedCharacters.map((character) => character.id));
            const availableCharacters = characterList.filter(
              (character) => !assignedIds.has(character.id),
            );

            return (
              <li key={performer.id} className="rounded-2xl border border-black/10 bg-white/80 p-5 shadow-sm">
                <form action={updatePerformer} className="grid gap-3 sm:grid-cols-2">
                  <input name="id" type="hidden" value={performer.id} />
                  <label className="grid gap-1 text-sm font-medium">
                    Performer name
                    <input
                      className="field"
                      defaultValue={performer.name}
                      maxLength={160}
                      name="name"
                      required
                    />
                  </label>
                  <label className="grid gap-1 text-sm font-medium">
                    Email
                    <input
                      className="field"
                      defaultValue={performer.email ?? ""}
                      maxLength={320}
                      name="email"
                      type="email"
                    />
                  </label>
                  <label className="grid gap-1 text-sm font-medium">
                    Phone
                    <input
                      className="field"
                      defaultValue={performer.phone ?? ""}
                      maxLength={40}
                      name="phone"
                    />
                  </label>
                  <label className="grid gap-1 text-sm font-medium sm:col-span-2">
                    Notes
                    <textarea
                      className="field min-h-20"
                      defaultValue={performer.notes ?? ""}
                      maxLength={5000}
                      name="notes"
                    />
                  </label>
                  <div className="flex flex-wrap gap-2 sm:col-span-2">
                    <button className="button-primary" type="submit">
                      Save performer
                    </button>
                    <button
                      aria-label={`Remove ${performer.name}`}
                      className="button-danger"
                      formAction={deletePerformer}
                      formNoValidate
                      type="submit"
                    >
                      Remove performer
                    </button>
                  </div>
                </form>

                <div className="mt-5 border-t border-black/10 pt-4">
                  <h2 className="mb-3 text-sm font-semibold">Characters</h2>
                  {assignedCharacters.length > 0 ? (
                    <ul className="mb-3 flex flex-wrap gap-2">
                      {assignedCharacters.map((character) => (
                        <li key={character.id}>
                          <form action={unassignCharacter}>
                            <input name="performerId" type="hidden" value={performer.id} />
                            <input name="characterId" type="hidden" value={character.id} />
                            <button
                              aria-label={`Unassign ${character.name} from ${performer.name}`}
                              className="rounded-full border border-black/10 bg-[var(--background)] px-3 py-1 text-sm hover:border-[var(--accent)]"
                              type="submit"
                            >
                              {character.name} <span aria-hidden="true">×</span>
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
                      <input name="performerId" type="hidden" value={performer.id} />
                      <label className="sr-only" htmlFor={`character-${performer.id}`}>
                        Assign a character to {performer.name}
                      </label>
                      <select
                        className="field min-w-48 flex-1"
                        defaultValue=""
                        id={`character-${performer.id}`}
                        name="characterId"
                        required
                      >
                        <option disabled value="">
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
                    <p className="text-sm text-[var(--muted)]">
                      All characters have been assigned to this performer.
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </PageLayout>
  );
}
