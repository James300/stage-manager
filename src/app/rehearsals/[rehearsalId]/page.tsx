import { and, asc, eq, sql } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { z } from "zod";
import { PageLayout } from "@/app/page-layout";
import { AttendanceList } from "@/app/rehearsals/[rehearsalId]/attendance-list";
import { AvailabilityList } from "@/app/rehearsals/[rehearsalId]/availability-list";
import { AvailabilityBanner } from "@/app/rehearsals/[rehearsalId]/availability-banner";
import { formatRehearsalStart } from "@/app/rehearsals/format";
import { RehearsalEditModal } from "@/app/rehearsals/rehearsal-edit-modal";
import { RehearsalTabs } from "@/app/rehearsals/[rehearsalId]/rehearsal-tabs";
import { getDb } from "@/db";
import {
  performers,
  performerCharacters,
  rehearsalAvailability,
  rehearsalAttendance,
  rehearsalScenes,
  rehearsals,
  sceneCharacters,
  scenes,
} from "@/db/schema";
import { requireUser } from "@/lib/admin";
import { isAdminEmail } from "@/lib/auth";
import { getCurrentProduction } from "@/lib/production";

export default async function RehearsalPage({
  params,
}: {
  params: Promise<{ rehearsalId: string }>;
}) {
  await connection();
  const user = await requireUser();
  const isAdmin = isAdminEmail(user.email);
  const { rehearsalId } = await params;
  const parsedId = z.uuid().safeParse(rehearsalId);
  if (!parsedId.success) notFound();

  const production = await getCurrentProduction();
  const db = getDb();
  const [rehearsal] = await db
    .select()
    .from(rehearsals)
    .where(and(eq(rehearsals.id, parsedId.data), eq(rehearsals.productionId, production.id)))
    .limit(1);

  if (!rehearsal) notFound();

  const [sceneList, assignedScenes] = await Promise.all([
    db
      .select({ id: scenes.id, sceneNumber: scenes.sceneNumber, title: scenes.title })
      .from(scenes)
      .where(eq(scenes.productionId, production.id))
      .orderBy(scenes.sceneNumber),
    db
      .select({ id: scenes.id, sceneNumber: scenes.sceneNumber, title: scenes.title })
      .from(rehearsalScenes)
      .innerJoin(scenes, eq(rehearsalScenes.sceneId, scenes.id))
      .where(
        and(
          eq(rehearsalScenes.rehearsalId, rehearsal.id),
          eq(rehearsalScenes.productionId, production.id),
        ),
      )
      .orderBy(scenes.sceneNumber),
  ]);
  let ownAvailability: { required: boolean; response: "yes" | "no" | "maybe" | "partial" | null } | null = null;
  if (!isAdmin) {
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

    if (performer) {
      const [requiredAssignment, responseRecord] = await Promise.all([
        db
          .select({ id: performerCharacters.performerId })
          .from(rehearsalScenes)
          .innerJoin(sceneCharacters, eq(rehearsalScenes.sceneId, sceneCharacters.sceneId))
          .innerJoin(
            performerCharacters,
            and(
              eq(performerCharacters.characterId, sceneCharacters.characterId),
              eq(performerCharacters.productionId, production.id),
              eq(performerCharacters.performerId, performer.id),
            ),
          )
          .where(
            and(
              eq(rehearsalScenes.rehearsalId, rehearsal.id),
              eq(rehearsalScenes.productionId, production.id),
            ),
          )
          .limit(1),
        db
          .select({ response: rehearsalAvailability.response })
          .from(rehearsalAvailability)
          .where(
            and(
              eq(rehearsalAvailability.rehearsalId, rehearsal.id),
              eq(rehearsalAvailability.performerId, performer.id),
              eq(rehearsalAvailability.productionId, production.id),
            ),
          )
          .limit(1),
      ]);
      ownAvailability = {
        required: requiredAssignment.length > 0,
        response: responseRecord[0]?.response ?? null,
      };
    }
  }
  let attendanceTab = null;
  let availabilityTab = null;
  if (isAdmin) {
    const [performerList, requiredPerformers, attendanceRecords] = await Promise.all([
      db
        .select({
          id: performers.id,
          name: performers.name,
          response: rehearsalAvailability.response,
          note: rehearsalAvailability.note,
        })
        .from(performers)
        .leftJoin(
          rehearsalAvailability,
          and(
            eq(rehearsalAvailability.performerId, performers.id),
            eq(rehearsalAvailability.rehearsalId, rehearsal.id),
            eq(rehearsalAvailability.productionId, production.id),
          ),
        )
        .where(eq(performers.productionId, production.id))
        .orderBy(asc(performers.name)),
      db
        .selectDistinct({ id: performers.id })
        .from(rehearsalScenes)
        .innerJoin(sceneCharacters, eq(rehearsalScenes.sceneId, sceneCharacters.sceneId))
        .innerJoin(
          performerCharacters,
          and(
            eq(performerCharacters.characterId, sceneCharacters.characterId),
            eq(performerCharacters.productionId, production.id),
          ),
        )
        .innerJoin(performers, eq(performerCharacters.performerId, performers.id))
        .where(
          and(
            eq(rehearsalScenes.rehearsalId, rehearsal.id),
            eq(rehearsalScenes.productionId, production.id),
          ),
        ),
      db
        .select({ performerId: rehearsalAttendance.performerId })
        .from(rehearsalAttendance)
        .where(
          and(
            eq(rehearsalAttendance.rehearsalId, rehearsal.id),
            eq(rehearsalAttendance.productionId, production.id),
          ),
        ),
    ]);
    const requiredPerformerIds = new Set(requiredPerformers.map(({ id }) => id));
    const presentPerformerIds = new Set(attendanceRecords.map(({ performerId }) => performerId));
    const requiredAttendance = performerList
      .filter((performer) => requiredPerformerIds.has(performer.id))
      .map((performer) => ({ ...performer, present: presentPerformerIds.has(performer.id) }));
    const optionalAttendance = performerList
      .filter((performer) => !requiredPerformerIds.has(performer.id))
      .map((performer) => ({ ...performer, present: presentPerformerIds.has(performer.id) }));
    const requiredAvailability = performerList.filter((performer) => requiredPerformerIds.has(performer.id));
    const optionalAvailability = performerList.filter((performer) => !requiredPerformerIds.has(performer.id));
    attendanceTab = (
      <AttendanceList
        optionalPerformers={optionalAttendance}
        rehearsalId={rehearsal.id}
        requiredPerformers={requiredAttendance}
      />
    );
    availabilityTab = (
      <AvailabilityList
        optionalPerformers={optionalAvailability}
        requiredPerformers={requiredAvailability}
      />
    );
  }
  const start = formatRehearsalStart(rehearsal.startsAt, rehearsal.timeZone);

  return (
    <PageLayout
      actions={
        <>
          {isAdmin && (
            <RehearsalEditModal
              rehearsal={{
                id: rehearsal.id,
                startsAt: rehearsal.startsAt.toISOString(),
                durationMinutes: rehearsal.durationMinutes,
                status: rehearsal.status,
                sceneIds: assignedScenes.map((scene) => scene.id),
              }}
              scenes={sceneList}
            />
          )}
          <Link className="button-secondary" href="/rehearsals">
            All rehearsals
          </Link>
        </>
      }
      isAdmin={isAdmin}
      userName={user.name}
      description={production.name}
      title="Rehearsal"
    >
      {ownAvailability && (
        <AvailabilityBanner
          rehearsalId={rehearsal.id}
          required={ownAvailability.required}
          response={ownAvailability.response}
        />
      )}
      <RehearsalTabs
        isAdmin={isAdmin}
        attendance={attendanceTab}
        availability={availabilityTab}
        details={
          <div className="grid gap-6">
            <section className="rounded-2xl border border-black/10 bg-white/80 p-6 shadow-sm">
              <h2 className="text-xl font-semibold">Schedule</h2>
              <dl className="mt-5 grid gap-5 sm:grid-cols-3">
                <div>
                  <dt className="text-sm font-medium text-[var(--muted)]">Date</dt>
                  <dd className="mt-1 font-semibold">{start.date}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-[var(--muted)]">Start time</dt>
                  <dd className="mt-1 font-semibold">{start.time}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-[var(--muted)]">Duration</dt>
                  <dd className="mt-1 font-semibold">{rehearsal.durationMinutes} minutes</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-[var(--muted)]">Status</dt>
                  <dd className="mt-1 font-semibold capitalize">{rehearsal.status}</dd>
                </div>
              </dl>
            </section>
            <section className="rounded-2xl border border-black/10 bg-white/80 p-6 shadow-sm">
              <h2 className="text-xl font-semibold">Scenes</h2>
              {assignedScenes.length > 0 ? (
                <ul className="mt-4 grid gap-3">
                  {assignedScenes.map((scene) => (
                    <li key={scene.id}>
                      <Link
                        className="block rounded-xl border border-black/10 bg-white px-4 py-3 transition hover:border-[var(--accent)] hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                        href={`/scenes/${scene.id}`}
                      >
                        <p className="text-sm font-semibold text-[var(--accent)]">Scene {scene.sceneNumber}</p>
                        <p className="mt-1 font-medium">{scene.title}</p>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-[var(--muted)]">No scenes are assigned to this rehearsal.</p>
              )}
            </section>
          </div>
        }
      />
    </PageLayout>
  );
}
