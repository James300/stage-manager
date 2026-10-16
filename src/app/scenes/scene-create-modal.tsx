"use client";

import { Plus } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createScene, type CreateSceneState } from "@/app/scenes/actions";

const initialState: CreateSceneState = {};

export function SceneCreateModal() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(createScene, initialState);
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
    if (!state.created) return;
    formRef.current?.reset();
    dialogRef.current?.close();
    router.refresh();
  }, [router, state]);

  return (
    <>
      <button
        aria-label="Add scene"
        className="icon-button"
        onClick={() => setOpen(true)}
        title="Add scene"
        type="button"
      >
        <Plus aria-hidden="true" size={20} />
      </button>
      <dialog
        ref={dialogRef}
        className="modal-dialog"
        aria-labelledby="create-scene-title"
        onClose={() => setOpen(false)}
      >
        <form action={action} ref={formRef} className="grid gap-4 p-6">
          <div>
            <p className="mb-2 text-sm font-medium uppercase tracking-widest text-[var(--accent)]">
              New scene
            </p>
            <h2 id="create-scene-title" className="text-2xl font-semibold">
              Add a scene
            </h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Add the basics now. You can update readiness and other details from the scene page.
            </p>
          </div>
          <label className="grid gap-1 text-sm font-medium">
            Scene number
            <input className="field" name="sceneNumber" type="number" min="1" step="1" required />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Title
            <input className="field" name="title" required maxLength={160} />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Description
            <textarea className="field min-h-24" name="description" maxLength={5000} />
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
              {pending ? "Creating..." : "Create scene"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
