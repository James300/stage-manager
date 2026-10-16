"use client";

import { Plus } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createRehearsal,
  type RehearsalActionState,
} from "@/app/rehearsals/actions";

type SceneOption = { id: string; sceneNumber: number; title: string };

const initialState: RehearsalActionState = {};

export function RehearsalCreateModal({ scenes }: { scenes: SceneOption[] }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(createRehearsal, initialState);
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
    formRef.current?.reset();
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
        aria-label="Add rehearsal"
        className="icon-button"
        onClick={() => setOpen(true)}
        title="Add rehearsal"
        type="button"
      >
        <Plus aria-hidden="true" size={20} />
      </button>
      <dialog
        aria-labelledby="create-rehearsal-title"
        className="modal-dialog"
        onClose={() => setOpen(false)}
        ref={dialogRef}
      >
        <form action={action} className="grid gap-4 p-6" onSubmit={prepareSubmission} ref={formRef}>
          <div>
            <p className="mb-2 text-sm font-medium uppercase tracking-widest text-[var(--accent)]">
              Rehearsal schedule
            </p>
            <h2 className="text-2xl font-semibold" id="create-rehearsal-title">
              Add a rehearsal
            </h2>
          </div>
          <label className="grid gap-1 text-sm font-medium">
            Start date and time
            <input className="field" name="startsAtLocal" type="datetime-local" required />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Duration in minutes
            <input
              className="field"
              defaultValue={120}
              max={1440}
              min={1}
              name="durationMinutes"
              type="number"
              required
            />
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
                    <input className="accent-[var(--accent)]" name="sceneIds" type="checkbox" value={scene.id} />
                    <span>Scene {scene.sceneNumber}: {scene.title}</span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[var(--muted)]">
                Create a scene before scheduling a rehearsal.
              </p>
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
              {pending ? "Adding..." : "Add rehearsal"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
