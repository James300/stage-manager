import { and, asc, eq, sql } from "drizzle-orm";
import { connection } from "next/server";
import { PageLayout } from "@/app/page-layout";
import { ScriptReader } from "@/app/script/script-reader";
import { getDb } from "@/db";
import { characters, performerCharacters, performers, scenes, scripts } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";
import { getCurrentProduction } from "@/lib/production";

type ScriptPageProps = {
  searchParams: Promise<{ sceneId?: string | string[] }>;
};

export default async function ScriptPage({ searchParams }: ScriptPageProps) {
  await connection();
  const admin = await requireAdmin();
  const production = await getCurrentProduction();
  const db = getDb();
  const [{ sceneId: requestedSceneId }, sceneList, characterList, scriptList, ownAssignments] =
    await Promise.all([
      searchParams,
      db
        .select({ id: scenes.id, sceneNumber: scenes.sceneNumber, title: scenes.title })
        .from(scenes)
        .where(eq(scenes.productionId, production.id))
        .orderBy(asc(scenes.sceneNumber)),
      db
        .select({ id: characters.id, name: characters.name })
        .from(characters)
        .where(eq(characters.productionId, production.id))
        .orderBy(asc(characters.name)),
      db
        .select({ sceneId: scripts.sceneId, blocks: scripts.blocks })
        .from(scripts)
        .where(eq(scripts.productionId, production.id)),
      db
        .select({ characterId: performerCharacters.characterId })
        .from(performerCharacters)
        .innerJoin(performers, eq(performerCharacters.performerId, performers.id))
        .where(
          and(
            eq(performerCharacters.productionId, production.id),
            sql`lower(${performers.email}) = lower(${admin.email})`,
          ),
        ),
    ]);
  const scriptsByScene = new Map(scriptList.map((script) => [script.sceneId, script.blocks]));
  const selectedSceneId =
    typeof requestedSceneId === "string" && sceneList.some((scene) => scene.id === requestedSceneId)
      ? requestedSceneId
      : (sceneList[0]?.id ?? "");

  return (
    <PageLayout
      adminName={admin.name}
      description={`${production.name} · Read the script by scene`}
      title="Script"
    >
      <ScriptReader
        characters={characterList}
        initialSceneId={selectedSceneId}
        ownCharacterIds={[...new Set(ownAssignments.map(({ characterId }) => characterId))]}
        scenes={sceneList.map((scene) => ({
          ...scene,
          blocks: scriptsByScene.get(scene.id) ?? [],
        }))}
      />
    </PageLayout>
  );
}
