"use client";

import { Pencil } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  assignCharacter,
  deleteCharacter,
  unassignCharacter,
  updateCharacter,
  type CreateCastItemState,
} from "@/app/cast/actions";

type PerformerOption = { id: string; name: string };

type CharacterEditModalProps = {
  character: { id: string; name: string };
  assignedPerformers: PerformerOption[];
  availablePerformers: PerformerOption[];
};

const initialState: CreateCastItemState = {};

export function CharacterEditModal({
  character,
  assignedPerformers,
  availablePerformers,
}: CharacterEditModalProps) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(updateCharacter, initialState);
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

  return (
    <>
      <button
        aria-label={`Edit ${character.name}`}
        className="icon-button"
        onClick={() => setOpen(true)}
        title={`Edit ${character.name}`}
        type="button"
      >
        <Pencil aria-hidden="true" size={17} />
      </button>
      <dialog
        aria-labelledby={`edit-character-title-${character.id}`}
        className="modal-dialog"
        onClose={() => {
          formRef.current?.reset();
          setOpen(false);
        }}
        ref={dialogRef}
      >
        <div className="grid gap-5 p-6">
          <div>
            <p className="mb-2 text-sm font-medium uppercase tracking-widest text-[var(--accent)]">
              Cast list
            </p>
            <h2 className="text-2xl font-semibold" id={`edit-character-title-${character.id}`}>
              Edit character
            </h2>
          </div>
          <form action={action} className="grid gap-4" ref={formRef}>
            <input name="id" type="hidden" value={character.id} />
            <label className="grid gap-1 text-sm font-medium">
              Character name
              <input
                className="field"
                defaultValue={character.name}
                maxLength={160}
                name="name"
                required
              />
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
          <section className="border-t border-black/10 pt-4">
            <h3 className="mb-3 text-sm font-semibold">Performers</h3>
            {assignedPerformers.length > 0 ? (
              <ul className="mb-3 flex flex-wrap gap-2">
                {assignedPerformers.map((performer) => (
                  <li key={performer.id}>
                    <form action={unassignCharacter}>
                      <input name="characterId" type="hidden" value={character.id} />
                      <input name="performerId" type="hidden" value={performer.id} />
                      <button
                        aria-label={`Unassign ${performer.name} from ${character.name}`}
                        className="rounded-full border border-black/10 bg-white px-3 py-1 text-sm hover:border-[var(--accent)]"
                        type="submit"
                      >
                        {performer.name} <span aria-hidden="true">×</span>
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mb-3 text-sm text-[var(--muted)]">No performers assigned.</p>
            )}
            {availablePerformers.length > 0 && (
              <form action={assignCharacter} className="flex flex-wrap gap-2">
                <input name="characterId" type="hidden" value={character.id} />
                <label className="sr-only" htmlFor={`edit-performer-${character.id}`}>
                  Add a performer to {character.name}
                </label>
                <select
                  className="field min-w-48 flex-1"
                  defaultValue=""
                  id={`edit-performer-${character.id}`}
                  name="performerId"
                  required
                >
                  <option disabled value="">
                    Choose a performer
                  </option>
                  {availablePerformers.map((performer) => (
                    <option key={performer.id} value={performer.id}>
                      {performer.name}
                    </option>
                  ))}
                </select>
                <button className="button-secondary" type="submit">
                  Assign
                </button>
              </form>
            )}
          </section>
          <div className="flex justify-start border-t border-black/10 pt-4">
            <form action={deleteCharacter}>
              <input name="id" type="hidden" value={character.id} />
              <button className="button-danger" type="submit">
                Delete character
              </button>
            </form>
          </div>
        </div>
      </dialog>
    </>
  );
}
