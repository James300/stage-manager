import { and, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { z } from "zod";
import { PageLayout } from "@/app/page-layout";
import { updateScene, updateSceneCharacters } from "@/app/scenes/actions";
import { getDb } from "@/db";
import { characters, sceneCharacters, scenes } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";
import { getCurrentProduction } from "@/lib/production";

const readinessOptions = [
  ["not_started", "Not started"],
  ["early_blocking", "Early / Blocking"],
  ["mid_working", "Mid / Working"],
  ["polished", "Polished / Show-Ready"],
] as const;

export default async function ScenePage({ params }: { params: Promise<{ sceneId: string }> }) {
  await connection();
  const admin = await requireAdmin();
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

  return (
    <PageLayout
      actions={
        <Link className="button-secondary" href="/scenes">
          All scenes
        </Link>
      }
      adminName={admin.name}
      description={`${production.name} · Scene ${scene.sceneNumber}`}
      maxWidth="max-w-4xl"
      title={scene.title}
    >
      <form action={updateScene} className="grid gap-5 rounded-2xl border border-black/10 bg-white/80 p-6">
        <input type="hidden" name="id" value={scene.id} />
        <h2 className="text-xl font-semibold">Scene details</h2>
        <div className="grid gap-4 sm:grid-cols-[10rem_minmax(0,1fr)]">
          <label className="grid gap-1 text-sm font-medium">
            Scene number
            <input
              className="field"
              name="sceneNumber"
              type="number"
              min="1"
              step="1"
              defaultValue={scene.sceneNumber}
              required
            />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Title
            <input className="field" name="title" defaultValue={scene.title} required maxLength={160} />
          </label>
        </div>
        <label className="grid gap-1 text-sm font-medium">
          Description
          <textarea
            className="field min-h-32"
            name="description"
            defaultValue={scene.description}
            maxLength={5000}
          />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Readiness
          <select className="field" name="readiness" defaultValue={scene.readiness}>
            {readinessOptions.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <div>
          <button className="button-primary" type="submit">
            Save scene
          </button>
        </div>
      </form>
      <form
        action={updateSceneCharacters}
        className="mt-6 grid gap-4 rounded-2xl border border-black/10 bg-white/80 p-6"
      >
        <input name="sceneId" type="hidden" value={scene.id} />
        <div>
          <h2 className="text-xl font-semibold">Characters in this scene</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Performers assigned to these characters will be required at rehearsals for this scene.
          </p>
        </div>
        {characterList.length > 0 ? (
          <ul className="grid gap-2 sm:grid-cols-2">
            {characterList.map((character) => (
              <li key={character.id}>
                <label className="flex items-center gap-3 rounded-xl border border-black/10 bg-white px-4 py-3">
                  <input
                    className="accent-[var(--accent)]"
                    defaultChecked={assignedCharacterIds.has(character.id)}
                    name="characterIds"
                    type="checkbox"
                    value={character.id}
                  />
                  <span className="font-medium">{character.name}</span>
                </label>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[var(--muted)]">Add characters in Cast before assigning them to scenes.</p>
        )}
        <div>
          <button className="button-primary" type="submit">
            Save scene characters
          </button>
        </div>
      </form>
    </PageLayout>
  );
}
