import { asc, eq } from "drizzle-orm";
import Link from "next/link";
import { connection } from "next/server";
import { SignOutButton } from "@/app/sign-out-button";
import { SceneCreateModal } from "@/app/scenes/scene-create-modal";
import { getDb } from "@/db";
import { scenes } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";
import { getCurrentProduction } from "@/lib/production";

export default async function ScenesPage() {
  await connection();
  const admin = await requireAdmin();
  const production = await getCurrentProduction();
  const sceneList = await getDb()
    .select()
    .from(scenes)
    .where(eq(scenes.productionId, production.id))
    .orderBy(asc(scenes.sceneNumber));

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-5 py-8 sm:px-8">
      <header className="mb-10 flex flex-wrap items-center justify-between gap-4 border-b border-black/10 pb-5">
        <Link className="text-sm font-semibold tracking-wide text-[var(--accent)]" href="/">
          INTO THE WOODS
        </Link>
        <div className="flex items-center gap-4 text-sm text-[var(--muted)]">
          <Link className="font-medium text-[var(--accent)]" href="/cast">
            Cast
          </Link>
          <span>{admin.name}</span>
          <SignOutButton />
        </div>
      </header>

      <section className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-3 text-sm font-medium uppercase tracking-widest text-[var(--accent)]">
            Production workspace
          </p>
          <h1 className="text-4xl font-semibold sm:text-5xl">Scenes</h1>
          <p className="mt-3 text-[var(--muted)]">{production.name}</p>
        </div>
        <div className="flex items-center gap-4">
          <p className="rounded-xl border border-black/10 bg-white/70 px-5 py-3 text-sm">
            <span className="font-semibold">{sceneList.length}</span>{" "}
            {sceneList.length === 1 ? "scene" : "scenes"}
          </p>
          <SceneCreateModal />
        </div>
      </section>

      {sceneList.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/20 bg-white/50 p-10 text-center">
          <h2 className="text-xl font-semibold">No scenes yet</h2>
          <p className="mt-2 text-[var(--muted)]">Create a scene to start organizing your production.</p>
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
    </main>
  );
}
