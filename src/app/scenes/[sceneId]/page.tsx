import { and, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { z } from "zod";
import { SignOutButton } from "@/app/sign-out-button";
import { updateScene } from "@/app/scenes/actions";
import { getDb } from "@/db";
import { scenes } from "@/db/schema";
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

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-5 py-8 sm:px-8">
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

      <Link className="text-sm font-medium text-[var(--accent)] hover:underline" href="/scenes">
        ← All scenes
      </Link>
      <section className="mt-6">
        <p className="mb-3 text-sm font-medium uppercase tracking-widest text-[var(--accent)]">
          Scene {scene.sceneNumber}
        </p>
        <h1 className="text-4xl font-semibold sm:text-5xl">{scene.title}</h1>
        <p className="mt-3 text-[var(--muted)]">{production.name}</p>
      </section>

      <form action={updateScene} className="mt-8 grid gap-5 rounded-2xl border border-black/10 bg-white/80 p-6">
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
    </main>
  );
}
