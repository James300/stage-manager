"use client";

import { setRehearsalAttendance } from "@/app/rehearsals/actions";

type AttendancePerformer = {
  id: string;
  name: string;
  present: boolean;
};

type AttendanceListProps = {
  rehearsalId: string;
  requiredPerformers: AttendancePerformer[];
  optionalPerformers: AttendancePerformer[];
};

function PerformerList({
  rehearsalId,
  performers,
}: {
  rehearsalId: string;
  performers: AttendancePerformer[];
}) {
  if (performers.length === 0) {
    return <p className="text-sm text-[var(--muted)]">No performers in this section.</p>;
  }

  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {performers.map((performer) => (
        <li key={performer.id}>
          <form action={setRehearsalAttendance}>
            <input name="rehearsalId" type="hidden" value={rehearsalId} />
            <input name="performerId" type="hidden" value={performer.id} />
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-black/10 bg-white px-4 py-3">
              <input
                className="size-4 accent-[var(--accent)]"
                defaultChecked={performer.present}
                name="present"
                onChange={(event) => event.currentTarget.form?.requestSubmit()}
                type="checkbox"
                value="true"
              />
              <span className="font-medium">{performer.name}</span>
            </label>
          </form>
        </li>
      ))}
    </ul>
  );
}

export function AttendanceList({
  rehearsalId,
  requiredPerformers,
  optionalPerformers,
}: AttendanceListProps) {
  return (
    <div className="grid gap-6">
      <section className="rounded-2xl border border-black/10 bg-white/80 p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">Required</h2>
        <PerformerList performers={requiredPerformers} rehearsalId={rehearsalId} />
      </section>
      <section className="rounded-2xl border border-black/10 bg-white/80 p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">Optional</h2>
        <PerformerList performers={optionalPerformers} rehearsalId={rehearsalId} />
      </section>
    </div>
  );
}
