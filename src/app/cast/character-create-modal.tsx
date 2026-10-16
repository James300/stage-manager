"use client";

import { Plus } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createCharacter, type CreateCastItemState } from "@/app/cast/actions";

const initialState: CreateCastItemState = {};

export function CharacterCreateModal() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(createCharacter, initialState);
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
        aria-label="Add character"
        className="icon-button"
        onClick={() => setOpen(true)}
        title="Add character"
        type="button"
      >
        <Plus aria-hidden="true" size={20} />
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby="create-character-title"
        className="modal-dialog"
        onClose={() => setOpen(false)}
      >
        <form action={action} className="grid gap-4 p-6" ref={formRef}>
          <div>
            <p className="mb-2 text-sm font-medium uppercase tracking-widest text-[var(--accent)]">
              Cast list
            </p>
            <h2 className="text-2xl font-semibold" id="create-character-title">
              Add a character
            </h2>
          </div>
          <label className="grid gap-1 text-sm font-medium">
            Character name
            <input className="field" name="name" required maxLength={160} />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Notes
            <textarea className="field min-h-24" name="notes" maxLength={5000} />
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
              {pending ? "Adding..." : "Add character"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
