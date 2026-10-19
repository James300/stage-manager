import { asc, eq } from "drizzle-orm";
import { connection } from "next/server";
import { PageLayout } from "@/app/page-layout";
import { formatRehearsalStart } from "@/app/rehearsals/format";
import { RehearsalCreateModal } from "@/app/rehearsals/rehearsal-create-modal";
import { RehearsalsList } from "@/app/rehearsals/rehearsals-list";
import { getDb } from "@/db";
import { rehearsalScenes, rehearsals, scenes } from "@/db/schema";
import { requireUser } from "@/lib/admin";
import { isAdminEmail } from "@/lib/auth";
import { getCurrentProduction } from "@/lib/production";

export default async function RehearsalsPage() {
  await connection();
  const user = await requireUser();
  const isAdmin = isAdminEmail(user.email);
  const production = await getCurrentProduction();
  const db = getDb();
  const [rehearsalList, sceneList, assignments] = await Promise.all([
    db
      .select()
      .from(rehearsals)
      .where(eq(rehearsals.productionId, production.id))
      .orderBy(asc(rehearsals.startsAt)),
    db
      .select({ id: scenes.id, sceneNumber: scenes.sceneNumber, title: scenes.title })
      .from(scenes)
      .where(eq(scenes.productionId, production.id))
      .orderBy(asc(scenes.sceneNumber)),
    db
      .select({
        rehearsalId: rehearsalScenes.rehearsalId,
        id: scenes.id,
        sceneNumber: scenes.sceneNumber,
        title: scenes.title,
      })
      .from(rehearsalScenes)
      .innerJoin(scenes, eq(rehearsalScenes.sceneId, scenes.id))
      .where(eq(rehearsalScenes.productionId, production.id))
      .orderBy(asc(scenes.sceneNumber)),
  ]);

  const scenesByRehearsal = new Map<string, typeof assignments>();
  for (const assignment of assignments) {
    const assigned = scenesByRehearsal.get(assignment.rehearsalId) ?? [];
    assigned.push(assignment);
    scenesByRehearsal.set(assignment.rehearsalId, assigned);
  }

  const listItems = rehearsalList.map((rehearsal) => {
    const start = formatRehearsalStart(rehearsal.startsAt, rehearsal.timeZone);
    return {
      id: rehearsal.id,
      startsAt: rehearsal.startsAt.toISOString(),
      timeZone: rehearsal.timeZone,
      dateLabel: start.date,
      timeLabel: start.time,
      durationMinutes: rehearsal.durationMinutes,
      status: rehearsal.status,
      scenes: scenesByRehearsal.get(rehearsal.id) ?? [],
    };
  });

  return (
    <PageLayout
      actions={isAdmin ? <RehearsalCreateModal scenes={sceneList} /> : undefined}
      isAdmin={isAdmin}
      userName={user.name}
      description={`${production.name} · ${rehearsalList.length} ${
        rehearsalList.length === 1 ? "rehearsal" : "rehearsals"
      }`}
      title="Rehearsals"
    >
      <RehearsalsList
        rehearsals={listItems}
        scenes={sceneList}
        now={new Date().toISOString()}
        editable={isAdmin}
      />
    </PageLayout>
  );
}
