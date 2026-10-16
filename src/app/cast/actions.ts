"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "@/db";
import { characters, performerCharacters, performers } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";
import { getCurrentProduction } from "@/lib/production";

const performerSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1).max(160),
  email: z.union([z.email(), z.literal("")]).optional(),
  phone: z.string().trim().max(40),
});

const characterSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1).max(160),
});

const assignmentSchema = z.object({
  performerId: z.string().uuid(),
  characterId: z.string().uuid(),
});

export type CreateCastItemState = {
  error?: string;
  created?: boolean;
  saved?: boolean;
};

function readText(formData: FormData, field: string) {
  const value = formData.get(field);
  return typeof value === "string" ? value.trim() : "";
}

export async function createPerformer(
  _previousState: CreateCastItemState,
  formData: FormData,
): Promise<CreateCastItemState> {
  await requireAdmin();
  const parsed = performerSchema.omit({ id: true }).safeParse({
    name: readText(formData, "name"),
    email: readText(formData, "email"),
    phone: readText(formData, "phone"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the performer details and try again." };
  }
  const production = await getCurrentProduction();

  await getDb().insert(performers).values({
    productionId: production.id,
    name: parsed.data.name,
    email: parsed.data.email || null,
    phone: parsed.data.phone || null,
  });

  revalidatePath("/performers");
  revalidatePath("/cast");
  return { created: true };
}

export async function updatePerformer(
  _previousState: CreateCastItemState,
  formData: FormData,
): Promise<CreateCastItemState> {
  await requireAdmin();
  const parsed = performerSchema.safeParse({
    id: readText(formData, "id"),
    name: readText(formData, "name"),
    email: readText(formData, "email"),
    phone: readText(formData, "phone"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the performer details and try again." };
  }
  const production = await getCurrentProduction();

  const input = parsed.data;
  const [updated] = await getDb()
    .update(performers)
    .set({
      name: input.name,
      email: input.email || null,
      phone: input.phone || null,
      updatedAt: new Date(),
    })
    .where(and(eq(performers.id, input.id), eq(performers.productionId, production.id)))
    .returning({ id: performers.id });

  if (!updated) throw new Error("Performer not found in the current production.");
  revalidatePath("/performers");
  revalidatePath("/cast");
  return { saved: true };
}

export async function deletePerformer(formData: FormData) {
  await requireAdmin();
  const id = z.string().uuid().parse(readText(formData, "id"));
  const production = await getCurrentProduction();

  const [deleted] = await getDb()
    .delete(performers)
    .where(and(eq(performers.id, id), eq(performers.productionId, production.id)))
    .returning({ id: performers.id });

  if (!deleted) throw new Error("Performer not found in the current production.");
  revalidatePath("/performers");
  revalidatePath("/cast");
}

export async function createCharacter(
  _previousState: CreateCastItemState,
  formData: FormData,
): Promise<CreateCastItemState> {
  await requireAdmin();
  const parsed = characterSchema.omit({ id: true }).safeParse({
    name: readText(formData, "name"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the character details and try again." };
  }
  const production = await getCurrentProduction();
  const db = getDb();
  const [duplicate] = await db
    .select({ id: characters.id })
    .from(characters)
    .where(and(eq(characters.productionId, production.id), eq(characters.name, parsed.data.name)))
    .limit(1);
  if (duplicate) return { error: `${parsed.data.name} already exists in the cast.` };

  await db.insert(characters).values({
    productionId: production.id,
    name: parsed.data.name,
  });

  revalidatePath("/cast");
  revalidatePath("/performers");
  return { created: true };
}

export async function updateCharacter(
  _previousState: CreateCastItemState,
  formData: FormData,
): Promise<CreateCastItemState> {
  await requireAdmin();
  const parsed = characterSchema.safeParse({
    id: readText(formData, "id"),
    name: readText(formData, "name"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the character details and try again." };
  }
  const production = await getCurrentProduction();
  const db = getDb();
  const [duplicate] = await db
    .select({ id: characters.id })
    .from(characters)
    .where(
      and(
        eq(characters.productionId, production.id),
        eq(characters.name, parsed.data.name),
        ne(characters.id, parsed.data.id),
      ),
    )
    .limit(1);
  if (duplicate) return { error: `${parsed.data.name} already exists in the cast.` };

  const [updated] = await db
    .update(characters)
    .set({
      name: parsed.data.name,
      updatedAt: new Date(),
    })
    .where(and(eq(characters.id, parsed.data.id), eq(characters.productionId, production.id)))
    .returning({ id: characters.id });

  if (!updated) throw new Error("Character not found in the current production.");
  revalidatePath("/cast");
  revalidatePath("/performers");
  return { saved: true };
}

export async function deleteCharacter(formData: FormData) {
  await requireAdmin();
  const id = z.string().uuid().parse(readText(formData, "id"));
  const production = await getCurrentProduction();

  const [deleted] = await getDb()
    .delete(characters)
    .where(and(eq(characters.id, id), eq(characters.productionId, production.id)))
    .returning({ id: characters.id });

  if (!deleted) throw new Error("Character not found in the current production.");
  revalidatePath("/cast");
  revalidatePath("/performers");
}

export async function assignCharacter(formData: FormData) {
  await requireAdmin();
  const input = assignmentSchema.parse({
    performerId: readText(formData, "performerId"),
    characterId: readText(formData, "characterId"),
  });
  const production = await getCurrentProduction();
  const db = getDb();

  const [performer] = await db
    .select({ id: performers.id })
    .from(performers)
    .where(and(eq(performers.id, input.performerId), eq(performers.productionId, production.id)))
    .limit(1);
  const [character] = await db
    .select({ id: characters.id })
    .from(characters)
    .where(and(eq(characters.id, input.characterId), eq(characters.productionId, production.id)))
    .limit(1);

  if (!performer || !character) throw new Error("The performer and character must belong to the current production.");

  await db
    .insert(performerCharacters)
    .values({
      performerId: input.performerId,
      characterId: input.characterId,
      productionId: production.id,
    })
    .onConflictDoNothing();

  revalidatePath("/performers");
  revalidatePath("/cast");
}

export async function unassignCharacter(formData: FormData) {
  await requireAdmin();
  const input = assignmentSchema.parse({
    performerId: readText(formData, "performerId"),
    characterId: readText(formData, "characterId"),
  });
  const production = await getCurrentProduction();
  const db = getDb();

  const [performer] = await db
    .select({ id: performers.id })
    .from(performers)
    .where(and(eq(performers.id, input.performerId), eq(performers.productionId, production.id)))
    .limit(1);
  const [character] = await db
    .select({ id: characters.id })
    .from(characters)
    .where(and(eq(characters.id, input.characterId), eq(characters.productionId, production.id)))
    .limit(1);

  if (!performer || !character) throw new Error("The performer and character must belong to the current production.");

  await db
    .delete(performerCharacters)
    .where(
      and(
        eq(performerCharacters.performerId, input.performerId),
        eq(performerCharacters.characterId, input.characterId),
        eq(performerCharacters.productionId, production.id),
      ),
    );

  revalidatePath("/performers");
  revalidatePath("/cast");
}
