import { asc, eq } from "drizzle-orm";
import { connection } from "next/server";
import { CharacterCreateModal } from "@/app/cast/character-create-modal";
import { PageLayout } from "@/app/page-layout";
import { deleteCharacter, updateCharacter } from "@/app/cast/actions";
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
  const assignments = await db
    .select({
      characterId: performerCharacters.characterId,
      performerName: performers.name,
    })
    .from(performerCharacters)
    .innerJoin(performers, eq(performerCharacters.performerId, performers.id))
    .where(eq(performerCharacters.productionId, production.id))
    .orderBy(asc(performers.name));

  const performersByCharacter = new Map<string, string[]>();
  for (const assignment of assignments) {
    const names = performersByCharacter.get(assignment.characterId) ?? [];
    names.push(assignment.performerName);
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
          {characterList.map((character) => (
            <li key={character.id} className="rounded-2xl border border-black/10 bg-white/80 p-5 shadow-sm">
              <form action={updateCharacter} className="grid gap-3">
                <input name="id" type="hidden" value={character.id} />
                <label className="grid gap-1 text-sm font-medium">
                  Character
                  <input
                    className="field"
                    defaultValue={character.name}
                    maxLength={160}
                    name="name"
                    required
                  />
                </label>
                <label className="grid gap-1 text-sm font-medium">
                  Notes
                  <textarea
                    className="field min-h-20"
                    defaultValue={character.notes ?? ""}
                    maxLength={5000}
                    name="notes"
                  />
                </label>
                <div className="flex flex-wrap gap-2">
                  <button className="button-secondary" type="submit">
                    Save
                  </button>
                  <button
                    className="button-danger"
                    formAction={deleteCharacter}
                    formNoValidate
                    type="submit"
                  >
                    Remove
                  </button>
                </div>
              </form>
              <div className="mt-4 border-t border-black/10 pt-3">
                <h2 className="text-sm font-semibold">Performers</h2>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {performersByCharacter.get(character.id)?.join(", ") || "No performers assigned"}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </PageLayout>
  );
}
