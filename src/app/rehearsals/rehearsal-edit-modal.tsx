"use client";

import { Pencil } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  updateRehearsal,
  type RehearsalActionState,
} from "@/app/rehearsals/actions";

type SceneOption = { id: string; sceneNumber: number; title: string };
type RehearsalStatus = "tentative" | "confirmed" | "completed" | "cancelled";

type RehearsalEditModalProps = {
  rehearsal: {
    id: string;
    startsAt: string;
    durationMinutes: number;
    status: RehearsalStatus;
    sceneIds: string[];
  };
  scenes: SceneOption[];
};

const initialState: RehearsalActionState = {};
const statusOptions: [RehearsalStatus, string][] = [
  ["tentative", "Tentative"],
  ["confirmed", "Confirmed"],
  ["completed", "Completed"],
  ["cancelled", "Cancelled"],
];

function toLocalDateTime(isoDate: string) {
  const date = new Date(isoDate);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

export function RehearsalEditModal({ rehearsal, scenes }: RehearsalEditModalProps) {
  const [open, setOpen] = useState(false);
  const [startAtLocal, setStartAtLocal] = useState("");
  const [state, action, pending] = useActionState(updateRehearsal, initialState);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (!state.saved) return;
    dialogRef.current?.close();
    router.refresh();
  }, [router, state]);

  function prepareSubmission(event: React.FormEvent<HTMLFormElement>) {
    const form = event.currentTarget;
    const localStart = form.elements.namedItem("startsAtLocal");
    const startsAt = form.elements.namedItem("startsAt");
    const timeZone = form.elements.namedItem("timeZone");
    if (
      !(localStart instanceof HTMLInputElement) ||
      !(startsAt instanceof HTMLInputElement) ||
      !(timeZone instanceof HTMLInputElement)
    ) {
      return;
    }
    startsAt.value = new Date(localStart.value).toISOString();
    timeZone.value = Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  return (
    <>
      <button
        aria-label="Edit rehearsal"
        className="icon-button"
        onClick={() => {
          setStartAtLocal(toLocalDateTime(rehearsal.startsAt));
          setOpen(true);
        }}
        title="Edit rehearsal"
        type="button"
      >
        <Pencil aria-hidden="true" size={17} />
      </button>
      <dialog
        aria-labelledby={`edit-rehearsal-title-${rehearsal.id}`}
        className="modal-dialog"
        onClose={() => setOpen(false)}
        ref={dialogRef}
      >
        <form action={action} className="grid gap-4 p-6" onSubmit={prepareSubmission} ref={formRef}>
          <div>
            <p className="mb-2 text-sm font-medium uppercase tracking-widest text-[var(--accent)]">
              Rehearsal schedule
            </p>
            <h2 className="text-2xl font-semibold" id={`edit-rehearsal-title-${rehearsal.id}`}>
              Edit rehearsal
            </h2>
          </div>
          <input name="id" type="hidden" value={rehearsal.id} />
          <label className="grid gap-1 text-sm font-medium">
            Start date and time
            <input
              className="field"
              name="startsAtLocal"
              onChange={(event) => setStartAtLocal(event.currentTarget.value)}
              required
              type="datetime-local"
              value={startAtLocal}
            />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Duration in minutes
            <input
              className="field"
              defaultValue={rehearsal.durationMinutes}
              max={1440}
              min={1}
              name="durationMinutes"
              type="number"
              required
            />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Status
            <select className="field" defaultValue={rehearsal.status} name="status">
              {statusOptions.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
          <fieldset className="grid gap-2">
            <legend className="mb-1 text-sm font-medium">Scenes to rehearse</legend>
            {scenes.length > 0 ? (
              <div className="grid max-h-48 gap-2 overflow-y-auto">
                {scenes.map((scene) => (
                  <label
                    className="flex items-center gap-3 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
                    key={scene.id}
                  >
                    <input
                      className="accent-[var(--accent)]"
                      defaultChecked={rehearsal.sceneIds.includes(scene.id)}
                      name="sceneIds"
                      type="checkbox"
                      value={scene.id}
                    />
                    <span>Scene {scene.sceneNumber}: {scene.title}</span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[var(--muted)]">No scenes are available.</p>
            )}
          </fieldset>
          <input name="startsAt" type="hidden" />
          <input name="timeZone" type="hidden" />
          {state.error && (
            <p className="text-sm text-red-800" role="alert">
              {state.error}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <button className="button-secondary" onClick={() => setOpen(false)} type="button">
              Cancel
            </button>
            <button className="button-primary" disabled={pending || scenes.length === 0} type="submit">
              {pending ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
