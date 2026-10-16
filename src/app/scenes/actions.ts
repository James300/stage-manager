"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "@/db";
import { scenes } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";
import { getCurrentProduction } from "@/lib/production";

const sceneSchema = z.object({
  title: z.string().trim().min(1, "Enter a scene title.").max(160),
  sceneNumber: z.coerce.number().int().positive("Enter a positive scene number."),
  description: z.string().trim().max(5000),
});

const sceneUpdateSchema = sceneSchema.extend({
  id: z.uuid(),
  readiness: z.enum(["not_started", "early_blocking", "mid_working", "polished"]),
});

export type CreateSceneState = {
  error?: string;
  created?: boolean;
};

function readText(formData: FormData, field: string) {
  const value = formData.get(field);
  return typeof value === "string" ? value.trim() : "";
}

export async function createScene(
  _previousState: CreateSceneState,
  formData: FormData,
): Promise<CreateSceneState> {
  await requireAdmin();
  const parsed = sceneSchema.safeParse({
    title: readText(formData, "title"),
    sceneNumber: readText(formData, "sceneNumber"),
    description: readText(formData, "description"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the scene details and try again." };
  }

  const production = await getCurrentProduction();
  const db = getDb();
  const [duplicate] = await db
    .select({ id: scenes.id })
    .from(scenes)
    .where(and(eq(scenes.productionId, production.id), eq(scenes.sceneNumber, parsed.data.sceneNumber)))
    .limit(1);

  if (duplicate) return { error: `Scene ${parsed.data.sceneNumber} already exists.` };

  await db.insert(scenes).values({
    productionId: production.id,
    sceneNumber: parsed.data.sceneNumber,
    title: parsed.data.title,
    description: parsed.data.description,
  });

  revalidatePath("/scenes");
  return { created: true };
}

export async function updateScene(formData: FormData) {
  await requireAdmin();
  const parsed = sceneUpdateSchema.parse({
    id: readText(formData, "id"),
    title: readText(formData, "title"),
    sceneNumber: readText(formData, "sceneNumber"),
    description: readText(formData, "description"),
    readiness: readText(formData, "readiness"),
  });
  const production = await getCurrentProduction();
  const db = getDb();
  const [duplicate] = await db
    .select({ id: scenes.id })
    .from(scenes)
    .where(
      and(
        eq(scenes.productionId, production.id),
        eq(scenes.sceneNumber, parsed.sceneNumber),
        ne(scenes.id, parsed.id),
      ),
    )
    .limit(1);

  if (duplicate) throw new Error(`Scene ${parsed.sceneNumber} already exists.`);

  const [updated] = await db
    .update(scenes)
    .set({
      title: parsed.title,
      sceneNumber: parsed.sceneNumber,
      description: parsed.description,
      readiness: parsed.readiness,
      updatedAt: new Date(),
    })
    .where(and(eq(scenes.id, parsed.id), eq(scenes.productionId, production.id)))
    .returning({ id: scenes.id });

  if (!updated) throw new Error("Scene not found in the current production.");
  revalidatePath("/scenes");
  revalidatePath(`/scenes/${parsed.id}`);
}
