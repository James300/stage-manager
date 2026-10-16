"use client";

import { Pencil } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  assignCharacter,
  deletePerformer,
  unassignCharacter,
  updatePerformer,
  type CreateCastItemState,
} from "@/app/cast/actions";

type CharacterOption = { id: string; name: string };

type PerformerEditModalProps = {
  performer: { id: string; name: string; email: string | null; phone: string | null };
  assignedCharacters: CharacterOption[];
  availableCharacters: CharacterOption[];
};

const initialState: CreateCastItemState = {};

export function PerformerEditModal({
  performer,
  assignedCharacters,
  availableCharacters,
}: PerformerEditModalProps) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(updatePerformer, initialState);
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
        aria-label={`Edit ${performer.name}`}
        className="icon-button"
        onClick={() => setOpen(true)}
        title={`Edit ${performer.name}`}
        type="button"
      >
        <Pencil aria-hidden="true" size={17} />
      </button>
      <dialog
        aria-labelledby={`edit-performer-title-${performer.id}`}
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
              Production directory
            </p>
            <h2 className="text-2xl font-semibold" id={`edit-performer-title-${performer.id}`}>
              Edit performer
            </h2>
          </div>
          <form action={action} className="grid gap-4" ref={formRef}>
            <input name="id" type="hidden" value={performer.id} />
            <label className="grid gap-1 text-sm font-medium">
              Performer name
              <input
                className="field"
                defaultValue={performer.name}
                maxLength={160}
                name="name"
                required
              />
            </label>
            <label className="grid gap-1 text-sm font-medium">
              Email
              <input
                className="field"
                defaultValue={performer.email ?? ""}
                maxLength={320}
                name="email"
                type="email"
              />
            </label>
            <label className="grid gap-1 text-sm font-medium">
              Phone
              <input
                className="field"
                defaultValue={performer.phone ?? ""}
                maxLength={40}
                name="phone"
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
            <h3 className="mb-3 text-sm font-semibold">Characters</h3>
            {assignedCharacters.length > 0 ? (
              <ul className="mb-3 flex flex-wrap gap-2">
                {assignedCharacters.map((character) => (
                  <li key={character.id}>
                    <form action={unassignCharacter}>
                      <input name="performerId" type="hidden" value={performer.id} />
                      <input name="characterId" type="hidden" value={character.id} />
                      <button
                        aria-label={`Unassign ${character.name} from ${performer.name}`}
                        className="rounded-full border border-black/10 bg-white px-3 py-1 text-sm hover:border-[var(--accent)]"
                        type="submit"
                      >
                        {character.name} <span aria-hidden="true">×</span>
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mb-3 text-sm text-[var(--muted)]">No characters assigned.</p>
            )}
            {availableCharacters.length > 0 && (
              <form action={assignCharacter} className="flex flex-wrap gap-2">
                <input name="performerId" type="hidden" value={performer.id} />
                <label className="sr-only" htmlFor={`edit-character-${performer.id}`}>
                  Assign a character to {performer.name}
                </label>
                <select
                  className="field min-w-48 flex-1"
                  defaultValue=""
                  id={`edit-character-${performer.id}`}
                  name="characterId"
                  required
                >
                  <option disabled value="">
                    Choose a character
                  </option>
                  {availableCharacters.map((character) => (
                    <option key={character.id} value={character.id}>
                      {character.name}
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
            <form action={deletePerformer}>
              <input name="id" type="hidden" value={performer.id} />
              <button className="button-danger" type="submit">
                Delete performer
              </button>
            </form>
          </div>
        </div>
      </dialog>
    </>
  );
}
