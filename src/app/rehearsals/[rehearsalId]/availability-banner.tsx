"use client";

import { setOwnRehearsalAvailability } from "@/app/rehearsals/actions";
import type { RehearsalAvailabilityResponse } from "@/db/schema";

const responseLabels: Record<RehearsalAvailabilityResponse, string> = {
  yes: "Attending",
  no: "Not attending",
  maybe: "Maybe",
  partial: "Partially available",
};

export function AvailabilityBanner({
  rehearsalId,
  required,
  response,
}: {
  rehearsalId: string;
  required: boolean;
  response: RehearsalAvailabilityResponse | null;
}) {
  return (
    <section className="mb-6 flex flex-col gap-4 rounded-2xl border border-[var(--accent)]/20 bg-[var(--accent)]/5 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-semibold">{required ? "You are required at this rehearsal" : "You are not required at this rehearsal"}</p>
        <p className="mt-1 text-sm text-[var(--muted)]">Let the team know how you will attend.</p>
      </div>
      <form action={setOwnRehearsalAvailability}>
        <input name="rehearsalId" type="hidden" value={rehearsalId} />
        <label className="flex flex-col gap-1.5 text-sm font-medium sm:min-w-56">
          Your response
          <select
            className="field"
            defaultValue={response ?? ""}
            name="response"
            onChange={(event) => event.currentTarget.form?.requestSubmit()}
            required
          >
            <option disabled value="">Choose your response</option>
            {Object.entries(responseLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
      </form>
    </section>
  );
}
