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
    .orderBy(asc(scenes.sceneNumber));

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
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sceneList.map((scene) => (
            <li key={scene.id}>
              <Link
                className="block h-full rounded-2xl border border-black/10 bg-white/80 p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--accent)] hover:shadow-md"
                href={`/scenes/${scene.id}`}
              >
                <p className="text-sm font-semibold uppercase tracking-wide text-[var(--accent)]">
                  Scene {scene.sceneNumber}
                </p>
                <h2 className="mt-2 text-xl font-semibold">{scene.title}</h2>
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
      )}
    </PageLayout>
  );
}
