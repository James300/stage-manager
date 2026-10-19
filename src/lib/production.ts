import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { productions } from "@/db/schema";
import { requireUser } from "@/lib/admin";
import { isAdminEmail } from "@/lib/auth";

export async function getCurrentProduction() {
  const db = getDb();
  const slug = "into-the-woods";
  const [existing] = await db.select().from(productions).where(eq(productions.slug, slug)).limit(1);
  if (existing) return existing;

  const user = await requireUser();
  if (!isAdminEmail(user.email)) {
    throw new Error("Only an administrator can initialize the production.");
  }

  const [created] = await db
    .insert(productions)
    .values({ name: "Into the Woods", slug })
    .onConflictDoNothing({ target: productions.slug })
    .returning();

  if (created) return created;

  const [production] = await db.select().from(productions).where(eq(productions.slug, slug)).limit(1);
  if (!production) throw new Error("Unable to create or load the Into the Woods production.");
  return production;
}
