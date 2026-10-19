import { asc, eq } from "drizzle-orm";
import Link from "next/link";
import { connection } from "next/server";
import { PageLayout } from "@/app/page-layout";
import { SceneCreateModal } from "@/app/scenes/scene-create-modal";
import { getDb } from "@/db";
import { scenes } from "@/db/schema";
import { requireUser } from "@/lib/admin";
import { isAdminEmail } from "@/lib/auth";
import { getCurrentProduction } from "@/lib/production";

export default async function ScenesPage() {
  await connection();
  const user = await requireUser();
  const isAdmin = isAdminEmail(user.email);
  const production = await getCurrentProduction();
  const sceneList = await getDb()
    .select()
    .from(scenes)
    .where(eq(scenes.productionId, production.id))
    .orderBy(asc(scenes.act), asc(scenes.sceneNumber));
  const scenesByAct = [1, 2].map((act) => ({
    act,
    scenes: sceneList.filter((scene) => scene.act === act),
  }));

  return (
    <PageLayout
      actions={isAdmin ? <SceneCreateModal /> : undefined}
      isAdmin={isAdmin}
      userName={user.name}
      description={`${production.name} · ${sceneList.length} ${
        sceneList.length === 1 ? "scene" : "scenes"
      }`}
      title="Scenes"
    >
      {sceneList.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/20 bg-white/50 p-10 text-center">
          <h2 className="text-xl font-semibold">No scenes yet</h2>
          <p className="mt-2 text-[var(--muted)]">
            Create a scene to start organizing your production.
          </p>
        </div>
      ) : (
        <div className="grid gap-8">
          {scenesByAct.map(({ act, scenes: actScenes }) => (
            <section aria-labelledby={`act-${act}-heading`} className="grid gap-4" key={act}>
              <h2 className="text-2xl font-semibold" id={`act-${act}-heading`}>Act {act === 1 ? "I" : "II"}</h2>
              {actScenes.length > 0 ? (
                <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {actScenes.map((scene) => (
                    <li key={scene.id}>
                      <Link
                        className="block h-full rounded-2xl border border-black/10 bg-white/80 p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--accent)] hover:shadow-md"
                        href={`/scenes/${scene.id}`}
                      >
                        <p className="text-sm font-semibold uppercase tracking-wide text-[var(--accent)]">
                          Scene {scene.sceneNumber}
                        </p>
                        <h3 className="mt-2 text-xl font-semibold">{scene.title}</h3>
                        <p className="mt-3 line-clamp-3 min-h-6 text-sm leading-6 text-[var(--muted)]">
                          {scene.description || "No description yet."}
                        </p>
                        <p className="mt-5 text-xs font-medium text-[var(--muted)]">
                          {scene.readiness === "not_started" ? "Not started" : "Readiness updated"}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-[var(--muted)]">No scenes assigned to this act yet.</p>
              )}
            </section>
          ))}
        </div>
      )}
    </PageLayout>
  );
}
