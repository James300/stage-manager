import { asc, eq } from "drizzle-orm";
import { connection } from "next/server";
import { PageLayout } from "@/app/page-layout";
import { PerformerEditModal } from "@/app/performers/performer-edit-modal";
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
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {performerList.map((performer) => {
            const assignedCharacters = charactersByPerformer.get(performer.id) ?? [];
            const assignedIds = new Set(assignedCharacters.map((character) => character.id));
            const availableCharacters = characterList.filter(
              (character) => !assignedIds.has(character.id),
            );

            return (
              <li
                key={performer.id}
                className="rounded-2xl border border-black/10 bg-white/80 p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold">{performer.name}</h2>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {assignedCharacters.length > 0
                        ? `Playing ${assignedCharacters.map((character) => character.name).join(", ")}`
                        : "No characters assigned yet."}
                    </p>
                  </div>
                  <PerformerEditModal
                    assignedCharacters={assignedCharacters.map(({ id, name }) => ({ id, name }))}
                    availableCharacters={availableCharacters.map(({ id, name }) => ({ id, name }))}
                    performer={{
                      id: performer.id,
                      name: performer.name,
                      email: performer.email,
                      phone: performer.phone,
                    }}
                  />
                </div>
                <details className="mt-4 border-t border-black/10 pt-3">
                  <summary className="cursor-pointer text-sm font-medium text-[var(--accent)]">
                    Contact details
                  </summary>
                  <dl className="mt-3 grid gap-2 text-sm">
                    <div>
                      <dt className="font-medium">Email</dt>
                      <dd className="text-[var(--muted)]">{performer.email || "Not provided"}</dd>
                    </div>
                    <div>
                      <dt className="font-medium">Phone</dt>
                      <dd className="text-[var(--muted)]">{performer.phone || "Not provided"}</dd>
                    </div>
                  </dl>
                </details>
              </li>
            );
          })}
        </ul>
      )}
    </PageLayout>
  );
}
