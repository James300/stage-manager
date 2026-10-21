import { and, asc, eq, sql } from "drizzle-orm";
import { connection } from "next/server";
import { PageLayout } from "@/app/page-layout";
import {
  createDevSampleBlocks,
  devSampleCharacters,
  devSampleFallbackBakersWife,
  devSampleScene,
} from "@/app/script/dev-sample-script";
import { ScriptReader } from "@/app/script/script-reader";
import { getDb } from "@/db";
import { characters, performerCharacters, performers, scenes, scripts } from "@/db/schema";
import { requireUser } from "@/lib/admin";
import { isAdminEmail } from "@/lib/auth";
import { getCurrentProduction } from "@/lib/production";

type ScriptPageProps = {
  searchParams: Promise<{ sceneId?: string | string[] }>;
};

export default async function ScriptPage({ searchParams }: ScriptPageProps) {
  await connection();
  const user = await requireUser();
  const isAdmin = isAdminEmail(user.email);
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
            sql`lower(${performers.email}) = lower(${user.email})`,
          ),
        ),
    ]);
  const scriptsByScene = new Map(scriptList.map((script) => [script.sceneId, script.blocks]));
  const sceneOne = sceneList.find((scene) => scene.sceneNumber === 1);
  const sampleSceneId = sceneOne?.id ?? devSampleScene.id;
  const useDevelopmentSample =
    process.env.NODE_ENV === "development" && !scriptsByScene.get(sampleSceneId)?.length;
  const bakersWife = characterList.find(
    (character) => character.name.trim().toLowerCase() === "the baker's wife",
  );
  const sampleBlocks = createDevSampleBlocks(bakersWife?.id ?? devSampleFallbackBakersWife.id);
  const displayedScenes =
    useDevelopmentSample && !sceneOne
      ? [devSampleScene, ...sceneList]
      : sceneList;
  const displayedCharacters = useDevelopmentSample
    ? [
        ...characterList,
        ...devSampleCharacters,
        ...(bakersWife ? [] : [devSampleFallbackBakersWife]),
      ]
    : characterList;
  const selectedSceneId =
    typeof requestedSceneId === "string" &&
    displayedScenes.some((scene) => scene.id === requestedSceneId)
      ? requestedSceneId
      : (displayedScenes[0]?.id ?? "");

  return (
    <PageLayout
      isAdmin={isAdmin}
      userName={user.name}
      description={`${production.name} · Read the script by scene`}
      title="Script"
    >
      {useDevelopmentSample && (
        <p className="mb-5 rounded-xl border border-amber-900/20 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Development sample script for Scene 1. This original placeholder is not saved to the database.
        </p>
      )}
      <ScriptReader
        characters={displayedCharacters}
        initialSceneId={selectedSceneId}
        ownCharacterIds={[...new Set(ownAssignments.map(({ characterId }) => characterId))]}
        scenes={displayedScenes.map((scene) => ({
          ...scene,
          blocks:
            useDevelopmentSample && scene.sceneNumber === 1
              ? sampleBlocks
              : (scriptsByScene.get(scene.id) ?? []),
        }))}
      />
    </PageLayout>
  );
}
