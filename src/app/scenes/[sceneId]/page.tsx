import { and, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { z } from "zod";
import { PageLayout } from "@/app/page-layout";
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
    </PageLayout>
  );
}
