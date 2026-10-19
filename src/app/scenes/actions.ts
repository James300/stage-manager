"use server";

import { and, eq, inArray, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "@/db";
import { characters, sceneCharacters, scenes } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";
import { getCurrentProduction } from "@/lib/production";

const sceneSchema = z.object({
  title: z.string().trim().min(1, "Enter a scene title.").max(160),
  sceneNumber: z.coerce.number().int().positive("Enter a positive scene number."),
  act: z.coerce.number().int().min(1, "Choose an act.").max(2, "Choose a valid act."),
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

export type UpdateSceneState = {
  error?: string;
  saved?: boolean;
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
    act: readText(formData, "act"),
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
    act: parsed.data.act,
    title: parsed.data.title,
    description: parsed.data.description,
  });

  revalidatePath("/scenes");
  return { created: true };
}

export async function updateScene(
  _previousState: UpdateSceneState,
  formData: FormData,
): Promise<UpdateSceneState> {
  await requireAdmin();
  const parsed = sceneUpdateSchema.safeParse({
    id: readText(formData, "id"),
    title: readText(formData, "title"),
    sceneNumber: readText(formData, "sceneNumber"),
    act: readText(formData, "act"),
    description: readText(formData, "description"),
    readiness: readText(formData, "readiness"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the scene details and try again." };
  }

  const production = await getCurrentProduction();
  const db = getDb();
  const [duplicate] = await db
    .select({ id: scenes.id })
    .from(scenes)
    .where(
      and(
        eq(scenes.productionId, production.id),
        eq(scenes.sceneNumber, parsed.data.sceneNumber),
        ne(scenes.id, parsed.data.id),
      ),
    )
    .limit(1);

  if (duplicate) return { error: `Scene ${parsed.data.sceneNumber} already exists.` };

  const [updated] = await db
    .update(scenes)
    .set({
      title: parsed.data.title,
      sceneNumber: parsed.data.sceneNumber,
      act: parsed.data.act,
      description: parsed.data.description,
      readiness: parsed.data.readiness,
      updatedAt: new Date(),
    })
    .where(and(eq(scenes.id, parsed.data.id), eq(scenes.productionId, production.id)))
    .returning({ id: scenes.id });

  if (!updated) throw new Error("Scene not found in the current production.");
  revalidatePath("/scenes");
  revalidatePath(`/scenes/${parsed.data.id}`);
  return { saved: true };
}

export async function updateSceneCharacters(
  _previousState: UpdateSceneState,
  formData: FormData,
): Promise<UpdateSceneState> {
  await requireAdmin();
  const parsed = z
    .object({
      sceneId: z.uuid(),
      characterIds: z.array(z.uuid()).refine(
        (characterIds) => new Set(characterIds).size === characterIds.length,
        "A character can only be selected once.",
      ),
    })
    .safeParse({
      sceneId: readText(formData, "sceneId"),
      characterIds: formData.getAll("characterIds").filter((value): value is string => typeof value === "string"),
    });
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Check the scene character assignments and try again.",
    };
  }

  const production = await getCurrentProduction();
  const db = getDb();
  const [scene] = await db
    .select({ id: scenes.id })
    .from(scenes)
    .where(and(eq(scenes.id, parsed.data.sceneId), eq(scenes.productionId, production.id)))
    .limit(1);
  if (!scene) throw new Error("Scene not found in the current production.");

  if (parsed.data.characterIds.length > 0) {
    const matchingCharacters = await db
      .select({ id: characters.id })
      .from(characters)
      .where(and(eq(characters.productionId, production.id), inArray(characters.id, parsed.data.characterIds)));
    if (matchingCharacters.length !== parsed.data.characterIds.length) {
      throw new Error("Choose characters from the current production.");
    }
  }

  await db.batch([
    db.delete(sceneCharacters).where(
      and(eq(sceneCharacters.sceneId, scene.id), eq(sceneCharacters.productionId, production.id)),
    ),
    ...(parsed.data.characterIds.length > 0
      ? [
          db.insert(sceneCharacters).values(
            parsed.data.characterIds.map((characterId) => ({
              sceneId: scene.id,
              characterId,
              productionId: production.id,
            })),
          ),
        ]
      : []),
  ]);

  revalidatePath(`/scenes/${scene.id}`);
  revalidatePath("/rehearsals");
  return { saved: true };
}
