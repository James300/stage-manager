"use client";

import { Pencil } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { updateScene, type UpdateSceneState } from "@/app/scenes/actions";

type Readiness = "not_started" | "early_blocking" | "mid_working" | "polished";

type SceneEditModalProps = {
  scene: {
    id: string;
    sceneNumber: number;
    act: number;
    title: string;
    description: string;
    readiness: Readiness;
  };
};

const initialState: UpdateSceneState = {};
const readinessOptions: [Readiness, string][] = [
  ["not_started", "Not started"],
  ["early_blocking", "Early / Blocking"],
  ["mid_working", "Mid / Working"],
  ["polished", "Polished / Show-Ready"],
];

export function SceneEditModal({ scene }: SceneEditModalProps) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(updateScene, initialState);
  const dialogRef = useRef<HTMLDialogElement>(null);
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

  return (
    <>
      <button
        className="button-secondary shrink-0"
        onClick={() => setOpen(true)}
        type="button"
      >
        <Pencil aria-hidden="true" className="mr-2" size={16} />
        Edit details
      </button>
      <dialog
        aria-labelledby={`edit-scene-title-${scene.id}`}
        className="modal-dialog"
        onClose={() => setOpen(false)}
        ref={dialogRef}
      >
        <form action={action} className="grid gap-4 p-6">
          <div>
            <p className="mb-2 text-sm font-medium uppercase tracking-widest text-[var(--accent)]">
              Scene {scene.sceneNumber}
            </p>
            <h2 className="text-2xl font-semibold" id={`edit-scene-title-${scene.id}`}>
              Edit scene details
            </h2>
          </div>
          <input name="id" type="hidden" value={scene.id} />
          <div className="grid gap-4 sm:grid-cols-[10rem_minmax(0,1fr)]">
            <label className="grid gap-1 text-sm font-medium">
              Scene number
              <input
                className="field"
                defaultValue={scene.sceneNumber}
                min="1"
                name="sceneNumber"
                required
                step="1"
                type="number"
              />
            </label>
            <label className="grid gap-1 text-sm font-medium">
              Act
              <select className="field" defaultValue={scene.act} name="act">
                <option value="1">Act I</option>
                <option value="2">Act II</option>
              </select>
            </label>
            <label className="grid gap-1 text-sm font-medium">
              Title
              <input className="field" defaultValue={scene.title} maxLength={160} name="title" required />
            </label>
          </div>
          <label className="grid gap-1 text-sm font-medium">
            Description
            <textarea
              className="field min-h-32"
              defaultValue={scene.description}
              maxLength={5000}
              name="description"
            />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Readiness
            <select className="field" defaultValue={scene.readiness} name="readiness">
              {readinessOptions.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          {state.error && (
            <p className="text-sm text-red-800" role="alert">
              {state.error}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <button className="button-secondary" onClick={() => setOpen(false)} type="button">
              Cancel
            </button>
            <button className="button-primary" disabled={pending} type="submit">
              {pending ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
