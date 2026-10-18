"use client";

import { CalendarDays, Clock3 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { RehearsalEditModal } from "@/app/rehearsals/rehearsal-edit-modal";
import type { RehearsalStatus } from "@/db/schema";

type SceneOption = { id: string; sceneNumber: number; title: string };
type RehearsalListItem = {
  id: string;
  startsAt: string;
  dateLabel: string;
  timeLabel: string;
  durationMinutes: number;
  status: RehearsalStatus;
  scenes: SceneOption[];
};

const statusLabels: Record<RehearsalStatus, string> = {
  tentative: "Tentative",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
};

export function RehearsalsList({
  rehearsals,
  scenes,
  now,
  editable,
}: {
  rehearsals: RehearsalListItem[];
  scenes: SceneOption[];
  now: string;
  editable: boolean;
}) {
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  const nowTimestamp = new Date(now).getTime();
  const upcoming = rehearsals.filter((rehearsal) => new Date(rehearsal.startsAt).getTime() >= nowTimestamp);
  const past = rehearsals
    .filter((rehearsal) => new Date(rehearsal.startsAt).getTime() < nowTimestamp)
    .reverse();
  const visibleRehearsals = activeTab === "upcoming" ? upcoming : past;

  return (
    <section>
      <div aria-label="Rehearsal schedule" className="mb-5 flex gap-2 border-b border-black/10" role="tablist">
        {(["upcoming", "past"] as const).map((tab) => {
          const selected = activeTab === tab;
          const count = tab === "upcoming" ? upcoming.length : past.length;
          return (
            <button
              aria-selected={selected}
              aria-controls={`rehearsals-panel-${tab}`}
              className={`border-b-2 px-4 py-3 text-sm font-semibold capitalize transition-colors ${
                selected
                  ? "border-[var(--accent)] text-[var(--accent)]"
                  : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
              id={`rehearsals-tab-${tab}`}
              key={tab}
              onClick={() => setActiveTab(tab)}
              role="tab"
              type="button"
            >
              {tab} <span className="ml-1 text-xs">({count})</span>
            </button>
          );
        })}
      </div>
      <div
        aria-labelledby={`rehearsals-tab-${activeTab}`}
        className="outline-none"
        id={`rehearsals-panel-${activeTab}`}
        role="tabpanel"
        tabIndex={0}
      >
        {visibleRehearsals.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-black/20 bg-white/50 p-10 text-center">
            <h2 className="text-xl font-semibold">
              {activeTab === "upcoming" ? "No upcoming rehearsals" : "No past rehearsals"}
            </h2>
            <p className="mt-2 text-[var(--muted)]">
              {activeTab === "upcoming"
                ? editable
                  ? "Use the add button above to schedule a rehearsal."
                  : "Scheduled rehearsals will appear here."
                : "Rehearsals will appear here after their scheduled start time."}
            </p>
          </div>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visibleRehearsals.map((rehearsal) => (
              <li className="relative" key={rehearsal.id}>
                <Link
                  className="block h-full rounded-2xl border border-black/10 bg-white/80 p-5 pr-16 shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--accent)] hover:shadow-md"
                  href={`/rehearsals/${rehearsal.id}`}
                >
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                      rehearsal.status === "tentative"
                        ? "bg-amber-100 text-amber-900"
                        : rehearsal.status === "cancelled"
                          ? "bg-black/5 text-[var(--muted)]"
                          : "bg-emerald-100 text-emerald-900"
                    }`}
                  >
                    {statusLabels[rehearsal.status]}
                  </span>
                  <h2 className="mt-3 text-lg font-semibold">Rehearsal</h2>
                  <p className="mt-4 flex items-center gap-2 text-sm font-medium">
                    <CalendarDays aria-hidden="true" className="shrink-0 text-[var(--accent)]" size={17} />
                    {rehearsal.dateLabel}
                  </p>
                  <p className="mt-2 flex items-center gap-2 text-sm text-[var(--muted)]">
                    <Clock3 aria-hidden="true" className="shrink-0" size={17} />
                    {rehearsal.timeLabel} · {rehearsal.durationMinutes} min
                  </p>
                  <p className="mt-4 line-clamp-2 text-sm text-[var(--muted)]">
                    {rehearsal.scenes.map((scene) => `Scene ${scene.sceneNumber}: ${scene.title}`).join(" · ")}
                  </p>
                </Link>
                {editable && (
                  <div className="absolute right-3 top-3">
                    <RehearsalEditModal
                      rehearsal={{
                        id: rehearsal.id,
                        startsAt: rehearsal.startsAt,
                        durationMinutes: rehearsal.durationMinutes,
                        status: rehearsal.status,
                        sceneIds: rehearsal.scenes.map((scene) => scene.id),
                      }}
                      scenes={scenes}
                    />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
