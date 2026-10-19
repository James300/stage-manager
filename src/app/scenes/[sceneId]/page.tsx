import { and, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { z } from "zod";
import { PageLayout } from "@/app/page-layout";
import { SceneCharactersModal } from "@/app/scenes/scene-characters-modal";
import { SceneEditModal } from "@/app/scenes/scene-edit-modal";
import { SceneTabs } from "@/app/scenes/scene-tabs";
import { getDb } from "@/db";
import { characters, sceneCharacters, scenes } from "@/db/schema";
import { requireUser } from "@/lib/admin";
import { isAdminEmail } from "@/lib/auth";
import { getCurrentProduction } from "@/lib/production";

const readinessOptions = [
  ["not_started", "Not started"],
  ["early_blocking", "Early / Blocking"],
  ["mid_working", "Mid / Working"],
  ["polished", "Polished / Show-Ready"],
] as const;

export default async function ScenePage({ params }: { params: Promise<{ sceneId: string }> }) {
  await connection();
  const user = await requireUser();
  const isAdmin = isAdminEmail(user.email);
  const { sceneId } = await params;
  const parsedSceneId = z.uuid().safeParse(sceneId);
  if (!parsedSceneId.success) notFound();

  const production = await getCurrentProduction();
  const [scene] = await getDb()
    .select()
    .from(scenes)
    .where(and(eq(scenes.id, parsedSceneId.data), eq(scenes.productionId, production.id)))
    .limit(1);

  if (!scene) notFound();

  const db = getDb();
  const [characterList, assignedCharacters] = await Promise.all([
    db
      .select({ id: characters.id, name: characters.name })
      .from(characters)
      .where(eq(characters.productionId, production.id))
      .orderBy(characters.name),
    db
      .select({ characterId: sceneCharacters.characterId })
      .from(sceneCharacters)
      .where(and(eq(sceneCharacters.sceneId, scene.id), eq(sceneCharacters.productionId, production.id))),
  ]);
  const assignedCharacterIds = new Set(assignedCharacters.map(({ characterId }) => characterId));
  const sceneCharactersList = characterList.filter((character) => assignedCharacterIds.has(character.id));
  const readinessOption = readinessOptions.find(([value]) => value === scene.readiness);
  if (!readinessOption) throw new Error(`Unsupported scene readiness: ${scene.readiness}`);

  return (
    <PageLayout
      actions={
        <Link className="button-secondary" href="/scenes">
          All scenes
        </Link>
      }
      isAdmin={isAdmin}
      userName={user.name}
      description={`${production.name} · Scene ${scene.sceneNumber}`}
      title={scene.title}
    >
      <SceneTabs
        blocking={
          <section className="rounded-2xl border border-dashed border-black/20 bg-white/50 p-10 text-center">
            <h2 className="text-xl font-semibold">Blocking</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">Blocking details will be available here.</p>
          </section>
        }
        details={
          <div className="grid gap-6">
            <section className="rounded-2xl border border-black/10 bg-white/80 p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold">Scene details</h2>
                  <p className="mt-1 text-sm text-[var(--muted)]">Basic information and readiness.</p>
                </div>
                {isAdmin && (
                  <SceneEditModal
                    scene={{
                      id: scene.id,
                      sceneNumber: scene.sceneNumber,
                      act: scene.act,
                      title: scene.title,
                      description: scene.description,
                      readiness: readinessOption[0],
                    }}
                  />
                )}
              </div>
              <dl className="mt-5 grid gap-5 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-[var(--muted)]">Scene number</dt>
                  <dd className="mt-1 font-semibold">{scene.sceneNumber}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-[var(--muted)]">Act</dt>
                  <dd className="mt-1 font-semibold">{scene.act === 1 ? "Act I" : "Act II"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-[var(--muted)]">Readiness</dt>
                  <dd className="mt-1 font-semibold">{readinessOption[1]}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-[var(--muted)]">Description</dt>
                  <dd className="mt-1 whitespace-pre-wrap">{scene.description || "No description yet."}</dd>
                </div>
              </dl>
            </section>
            <section className="rounded-2xl border border-black/10 bg-white/80 p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold">Characters in this scene</h2>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    Performers assigned to these characters will be required at rehearsals for this scene.
                  </p>
                </div>
                {isAdmin && (
                  <SceneCharactersModal
                    characters={characterList}
                    sceneId={scene.id}
                    assignedCharacterIds={Array.from(assignedCharacterIds)}
                  />
                )}
              </div>
              {sceneCharactersList.length > 0 ? (
                <ul className="mt-4 flex flex-wrap gap-2">
                  {sceneCharactersList.map((character) => (
                    <li
                      className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-sm font-medium"
                      key={character.id}
                    >
                      {character.name}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-[var(--muted)]">No characters are assigned to this scene.</p>
              )}
            </section>
          </div>
        }
      />
    </PageLayout>
  );
}
