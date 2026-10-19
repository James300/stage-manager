"use server";

import { randomUUID } from "node:crypto";
import { and, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "@/db";
import { performers, rehearsalAttendance, rehearsalAvailability, rehearsalScenes, rehearsals, scenes } from "@/db/schema";
import { requireAdmin, requireUser } from "@/lib/admin";
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
  const rehearsalId = randomUUID();
  await db.batch([
    db.insert(rehearsals).values({
      id: rehearsalId,
      productionId: production.id,
      startsAt: new Date(parsed.data.startsAt),
      durationMinutes: parsed.data.durationMinutes,
      timeZone: parsed.data.timeZone,
    }),
    db.insert(rehearsalScenes).values(
      parsed.data.sceneIds.map((sceneId) => ({
        rehearsalId,
        sceneId,
        productionId: production.id,
      })),
    ),
  ]);

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
  const [existing] = await db
    .select({ id: rehearsals.id })
    .from(rehearsals)
    .where(and(eq(rehearsals.id, parsed.data.id), eq(rehearsals.productionId, production.id)))
    .limit(1);
  if (!existing) return { error: "Rehearsal not found in the current production." };

  await db.batch([
    db
      .update(rehearsals)
      .set({
        startsAt: new Date(parsed.data.startsAt),
        durationMinutes: parsed.data.durationMinutes,
        timeZone: parsed.data.timeZone,
        status: parsed.data.status,
        updatedAt: new Date(),
      })
      .where(and(eq(rehearsals.id, existing.id), eq(rehearsals.productionId, production.id))),
    db
      .delete(rehearsalScenes)
      .where(and(eq(rehearsalScenes.rehearsalId, existing.id), eq(rehearsalScenes.productionId, production.id))),
    db.insert(rehearsalScenes).values(
      parsed.data.sceneIds.map((sceneId) => ({
        rehearsalId: existing.id,
        sceneId,
        productionId: production.id,
      })),
    ),
  ]);

  revalidatePath("/rehearsals");
  revalidatePath(`/rehearsals/${existing.id}`);
  return { saved: true };
}

export async function setRehearsalAttendance(formData: FormData) {
  await requireAdmin();
  const parsed = z
    .object({
      rehearsalId: z.uuid(),
      performerId: z.uuid(),
      present: z.enum(["true", "false"]),
    })
    .safeParse({
      rehearsalId: readText(formData, "rehearsalId"),
      performerId: readText(formData, "performerId"),
      present: formData.get("present") === "true" ? "true" : "false",
    });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Check the attendance details and try again.");
  }

  const production = await getCurrentProduction();
  const db = getDb();
  const [rehearsal] = await db
    .select({ id: rehearsals.id })
    .from(rehearsals)
    .where(and(eq(rehearsals.id, parsed.data.rehearsalId), eq(rehearsals.productionId, production.id)))
    .limit(1);
  if (!rehearsal) throw new Error("Rehearsal not found in the current production.");

  const [performer] = await db
    .select({ id: performers.id })
    .from(performers)
    .where(and(eq(performers.id, parsed.data.performerId), eq(performers.productionId, production.id)))
    .limit(1);
  if (!performer) throw new Error("Performer not found in the current production.");

  if (parsed.data.present === "true") {
    await db
      .insert(rehearsalAttendance)
      .values({
        rehearsalId: rehearsal.id,
        performerId: performer.id,
        productionId: production.id,
      })
      .onConflictDoNothing();
  } else {
    await db
      .delete(rehearsalAttendance)
      .where(
        and(
          eq(rehearsalAttendance.rehearsalId, rehearsal.id),
          eq(rehearsalAttendance.performerId, performer.id),
          eq(rehearsalAttendance.productionId, production.id),
        ),
      );
  }

  revalidatePath(`/rehearsals/${rehearsal.id}`);
}

export async function setOwnRehearsalAvailability(formData: FormData) {
  const user = await requireUser();
  const parsed = z
    .object({
      rehearsalId: z.uuid(),
      response: z.enum(["yes", "no", "maybe", "partial"]),
    })
    .safeParse({
      rehearsalId: readText(formData, "rehearsalId"),
      response: readText(formData, "response"),
    });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Choose an attendance response.");
  }

  const production = await getCurrentProduction();
  const db = getDb();
  const [rehearsal] = await db
    .select({ id: rehearsals.id })
    .from(rehearsals)
    .where(and(eq(rehearsals.id, parsed.data.rehearsalId), eq(rehearsals.productionId, production.id)))
    .limit(1);
  if (!rehearsal) throw new Error("Rehearsal not found in the current production.");

  const [performer] = await db
    .select({ id: performers.id })
    .from(performers)
    .where(
      and(
        eq(performers.productionId, production.id),
        sql`lower(${performers.email}) = ${user.email.trim().toLowerCase()}`,
      ),
    )
    .limit(1);
  if (!performer) throw new Error("No cast profile is linked to your account.");

  await db
    .insert(rehearsalAvailability)
    .values({
      rehearsalId: rehearsal.id,
      performerId: performer.id,
      productionId: production.id,
      response: parsed.data.response,
      respondedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [rehearsalAvailability.rehearsalId, rehearsalAvailability.performerId],
      set: { response: parsed.data.response, respondedAt: new Date() },
    });

  revalidatePath(`/rehearsals/${rehearsal.id}`);
}
