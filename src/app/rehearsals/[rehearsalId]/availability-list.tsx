import type { RehearsalAvailabilityResponse } from "@/db/schema";

type AvailabilityPerformer = {
  id: string;
  name: string;
  response: RehearsalAvailabilityResponse | null;
  note: string | null;
};

type AvailabilityListProps = {
  requiredPerformers: AvailabilityPerformer[];
  optionalPerformers: AvailabilityPerformer[];
};

const responseStyles: Record<RehearsalAvailabilityResponse, string> = {
  yes: "bg-green-100 text-green-800",
  no: "bg-red-100 text-red-800",
  maybe: "bg-amber-100 text-amber-900",
  partial: "bg-blue-100 text-blue-800",
};

function PerformerList({ performers }: { performers: AvailabilityPerformer[] }) {
  if (performers.length === 0) {
    return <p className="text-sm text-[var(--muted)]">No performers in this section.</p>;
  }

  return (
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
  );
}

function AvailabilitySection({
  title,
  performers,
}: {
  title: string;
  performers: AvailabilityPerformer[];
}) {
  return (
    <section className="rounded-2xl border border-black/10 bg-white/80 p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        <button className="button-secondary" type="button">
          Notify
        </button>
      </div>
      <PerformerList performers={performers} />
    </section>
  );
}

export function AvailabilityList({ requiredPerformers, optionalPerformers }: AvailabilityListProps) {
  return (
    <div className="grid gap-6">
      <AvailabilitySection performers={requiredPerformers} title="Required" />
      <AvailabilitySection performers={optionalPerformers} title="Optional" />
    </div>
  );
}
