"use client";

import { Pencil } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { updateSceneCharacters, type UpdateSceneState } from "@/app/scenes/actions";

type SceneCharactersModalProps = {
  sceneId: string;
  characters: { id: string; name: string }[];
  assignedCharacterIds: string[];
};

const initialState: UpdateSceneState = {};

export function SceneCharactersModal({
  sceneId,
  characters,
  assignedCharacterIds,
}: SceneCharactersModalProps) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(updateSceneCharacters, initialState);
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
        Edit characters
      </button>
      <dialog
        aria-labelledby={`edit-scene-characters-title-${sceneId}`}
        className="modal-dialog"
        onClose={() => setOpen(false)}
        ref={dialogRef}
      >
        <form action={action} className="grid gap-4 p-6">
          <div>
            <p className="mb-2 text-sm font-medium uppercase tracking-widest text-[var(--accent)]">
              Scene characters
            </p>
            <h2 className="text-2xl font-semibold" id={`edit-scene-characters-title-${sceneId}`}>
              Edit characters in this scene
            </h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Performers assigned to these characters will be required at rehearsals for this scene.
            </p>
          </div>
          <input name="sceneId" type="hidden" value={sceneId} />
          {characters.length > 0 ? (
            <ul className="grid gap-2 sm:grid-cols-2">
              {characters.map((character) => (
                <li key={character.id}>
                  <label className="flex items-center gap-3 rounded-xl border border-black/10 bg-white px-4 py-3">
                    <input
                      className="accent-[var(--accent)]"
                      defaultChecked={assignedCharacterIds.includes(character.id)}
                      name="characterIds"
                      type="checkbox"
                      value={character.id}
                    />
                    <span className="font-medium">{character.name}</span>
                  </label>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[var(--muted)]">Add characters in Cast before assigning them to scenes.</p>
          )}
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
              {pending ? "Saving..." : "Save characters"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
