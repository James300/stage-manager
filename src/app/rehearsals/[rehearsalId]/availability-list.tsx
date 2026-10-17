import type { RehearsalAvailabilityResponse } from "@/db/schema";

type AvailabilityPerformer = {
  id: string;
  name: string;
  response: RehearsalAvailabilityResponse | null;
  note: string | null;
};

const responseStyles: Record<RehearsalAvailabilityResponse, string> = {
  yes: "bg-green-100 text-green-800",
  no: "bg-red-100 text-red-800",
  maybe: "bg-amber-100 text-amber-900",
  partial: "bg-blue-100 text-blue-800",
};

export function AvailabilityList({ performers }: { performers: AvailabilityPerformer[] }) {
  if (performers.length === 0) {
    return (
      <section className="rounded-2xl border border-black/10 bg-white/80 p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Availability</h2>
        <p className="mt-3 text-sm text-[var(--muted)]">No performers have been added to this production.</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-black/10 bg-white/80 p-6 shadow-sm">
      <h2 className="mb-4 text-xl font-semibold">Availability</h2>
      <ul className="divide-y divide-black/10">
        {performers.map((performer) => (
          <li
            className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between"
            key={performer.id}
          >
            <div>
              <p className="font-medium">{performer.name}</p>
              {performer.note && (
                <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--muted)]">{performer.note}</p>
              )}
            </div>
            {performer.response ? (
              <span
                className={`w-fit shrink-0 rounded-full px-3 py-1 text-sm font-semibold capitalize ${responseStyles[performer.response]}`}
              >
                {performer.response}
              </span>
            ) : (
              <span className="w-fit shrink-0 rounded-full bg-black/5 px-3 py-1 text-sm text-[var(--muted)]">
                No response yet
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
