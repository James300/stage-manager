import { asc, eq } from "drizzle-orm";
import { connection } from "next/server";
import { CharacterCreateModal } from "@/app/cast/character-create-modal";
import { CharacterEditModal } from "@/app/cast/character-edit-modal";
import { PageLayout } from "@/app/page-layout";
import { getDb } from "@/db";
import { characters, performerCharacters, performers } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";
import { getCurrentProduction } from "@/lib/production";

export default async function CastPage() {
  await connection();
  const admin = await requireAdmin();
  const production = await getCurrentProduction();
  const db = getDb();
  const characterList = await db
    .select()
    .from(characters)
    .where(eq(characters.productionId, production.id))
    .orderBy(asc(characters.name));
  const performerList = await db
    .select()
    .from(performers)
    .where(eq(performers.productionId, production.id))
    .orderBy(asc(performers.name));
  const assignments = await db
    .select({
      characterId: performerCharacters.characterId,
      performerId: performers.id,
      performerName: performers.name,
    })
    .from(performerCharacters)
    .innerJoin(performers, eq(performerCharacters.performerId, performers.id))
    .where(eq(performerCharacters.productionId, production.id))
    .orderBy(asc(performers.name));

  const performersByCharacter = new Map<string, typeof assignments>();
  for (const assignment of assignments) {
    const names = performersByCharacter.get(assignment.characterId) ?? [];
    names.push(assignment);
    performersByCharacter.set(assignment.characterId, names);
  }

  return (
    <PageLayout
      actions={<CharacterCreateModal />}
      adminName={admin.name}
      description={`${production.name} · ${characterList.length} ${
        characterList.length === 1 ? "character" : "characters"
      }`}
      title="Cast"
    >
      {characterList.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/20 bg-white/50 p-10 text-center">
          <h2 className="text-xl font-semibold">No characters yet</h2>
          <p className="mt-2 text-[var(--muted)]">
            Add a character to start building the cast list.
          </p>
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {characterList.map((character) => {
            const assignedPerformers = performersByCharacter.get(character.id) ?? [];
            const assignedPerformerIds = new Set(
              assignedPerformers.map((performer) => performer.performerId),
            );
            const availablePerformers = performerList.filter(
              (performer) => !assignedPerformerIds.has(performer.id),
            );

            return (
              <li
                key={character.id}
                className="rounded-2xl border border-black/10 bg-white/80 p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold">{character.name}</h2>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {assignedPerformers.length > 0
                        ? `Played by ${assignedPerformers
                            .map((performer) => performer.performerName)
                            .join(", ")}`
                        : "Nobody assigned to this role yet."}
                    </p>
                  </div>
                  <CharacterEditModal
                    assignedPerformers={assignedPerformers.map(({ performerId, performerName }) => ({
                      id: performerId,
                      name: performerName,
                    }))}
                    availablePerformers={availablePerformers.map(({ id, name }) => ({ id, name }))}
                    character={{ id: character.id, name: character.name }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </PageLayout>
  );
}
