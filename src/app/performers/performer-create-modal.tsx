"use client";

import { Plus } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createPerformer, type CreateCastItemState } from "@/app/cast/actions";

const initialState: CreateCastItemState = {};

export function PerformerCreateModal() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(createPerformer, initialState);
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
        aria-label="Add performer"
        className="icon-button"
        onClick={() => setOpen(true)}
        title="Add performer"
        type="button"
      >
        <Plus aria-hidden="true" size={20} />
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby="create-performer-title"
        className="modal-dialog"
        onClose={() => setOpen(false)}
      >
        <form action={action} className="grid gap-4 p-6" ref={formRef}>
          <div>
            <p className="mb-2 text-sm font-medium uppercase tracking-widest text-[var(--accent)]">
              Production directory
            </p>
            <h2 className="text-2xl font-semibold" id="create-performer-title">
              Add a performer
            </h2>
          </div>
          <label className="grid gap-1 text-sm font-medium">
            Performer name
            <input className="field" name="name" required maxLength={160} />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Email
            <input className="field" type="email" name="email" maxLength={320} />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Phone
            <input className="field" name="phone" maxLength={40} />
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
              {pending ? "Adding..." : "Add performer"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
