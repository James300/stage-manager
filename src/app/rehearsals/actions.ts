"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "@/db";
import { rehearsalScenes, rehearsals, scenes } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";
import { getCurrentProduction } from "@/lib/production";

const timeZoneSchema = z.string().min(1).max(64).refine((timeZone) => {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch (error) {
    if (error instanceof RangeError) return false;
    throw error;
  }
}, "Choose a valid time zone.");

const rehearsalFieldsSchema = z.object({
  startsAt: z.iso.datetime(),
  durationMinutes: z.coerce.number().int().min(1, "Duration must be at least 1 minute.").max(1440),
  timeZone: timeZoneSchema,
  sceneIds: z.array(z.uuid()).min(1, "Choose at least one scene.").refine(
    (sceneIds) => new Set(sceneIds).size === sceneIds.length,
    "A scene can only be selected once.",
  ),
});

const rehearsalUpdateSchema = rehearsalFieldsSchema.extend({
  id: z.uuid(),
  status: z.enum(["tentative", "confirmed", "completed", "cancelled"]),
});

export type RehearsalActionState = {
  error?: string;
  saved?: boolean;
};

function readText(formData: FormData, field: string) {
  const value = formData.get(field);
  return typeof value === "string" ? value.trim() : "";
}

function readFields(formData: FormData) {
  return {
    startsAt: readText(formData, "startsAt"),
    durationMinutes: readText(formData, "durationMinutes"),
    timeZone: readText(formData, "timeZone"),
    sceneIds: formData.getAll("sceneIds").filter((value): value is string => typeof value === "string"),
  };
}

async function validateScenes(sceneIds: string[], productionId: string) {
  const matchingScenes = await getDb()
    .select({ id: scenes.id })
    .from(scenes)
    .where(and(eq(scenes.productionId, productionId), inArray(scenes.id, sceneIds)));

  return matchingScenes.length === sceneIds.length;
}

export async function createRehearsal(
  _previousState: RehearsalActionState,
  formData: FormData,
): Promise<RehearsalActionState> {
  await requireAdmin();
  const parsed = rehearsalFieldsSchema.safeParse(readFields(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the rehearsal details and try again." };
  }

  const production = await getCurrentProduction();
  if (!(await validateScenes(parsed.data.sceneIds, production.id))) {
    return { error: "Choose scenes from the current production." };
  }

  const db = getDb();
  await db.transaction(async (tx) => {
    const [rehearsal] = await tx
      .insert(rehearsals)
      .values({
        productionId: production.id,
        startsAt: new Date(parsed.data.startsAt),
        durationMinutes: parsed.data.durationMinutes,
        timeZone: parsed.data.timeZone,
      })
      .returning({ id: rehearsals.id });

    await tx.insert(rehearsalScenes).values(
      parsed.data.sceneIds.map((sceneId) => ({
        rehearsalId: rehearsal.id,
        sceneId,
        productionId: production.id,
      })),
    );
  });

  revalidatePath("/rehearsals");
  return { saved: true };
}

export async function updateRehearsal(
  _previousState: RehearsalActionState,
  formData: FormData,
): Promise<RehearsalActionState> {
  await requireAdmin();
  const parsed = rehearsalUpdateSchema.safeParse({
    ...readFields(formData),
    id: readText(formData, "id"),
    status: readText(formData, "status"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the rehearsal details and try again." };
  }

  const production = await getCurrentProduction();
  if (!(await validateScenes(parsed.data.sceneIds, production.id))) {
    return { error: "Choose scenes from the current production." };
  }

  const db = getDb();
  const updatedId = await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(rehearsals)
      .set({
        startsAt: new Date(parsed.data.startsAt),
        durationMinutes: parsed.data.durationMinutes,
        timeZone: parsed.data.timeZone,
        status: parsed.data.status,
        updatedAt: new Date(),
      })
      .where(and(eq(rehearsals.id, parsed.data.id), eq(rehearsals.productionId, production.id)))
      .returning({ id: rehearsals.id });

    if (!updated) return null;

    await tx
      .delete(rehearsalScenes)
      .where(and(eq(rehearsalScenes.rehearsalId, updated.id), eq(rehearsalScenes.productionId, production.id)));
    await tx.insert(rehearsalScenes).values(
      parsed.data.sceneIds.map((sceneId) => ({
        rehearsalId: updated.id,
        sceneId,
        productionId: production.id,
      })),
    );
    return updated.id;
  });

  if (!updatedId) return { error: "Rehearsal not found in the current production." };

  revalidatePath("/rehearsals");
  revalidatePath(`/rehearsals/${updatedId}`);
  return { saved: true };
}
