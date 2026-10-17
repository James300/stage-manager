"use client";

import { ChevronDown, ChevronUp, Filter, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import type { ScriptBlock } from "@/db/schema";

type ScriptScene = {
  id: string;
  sceneNumber: number;
  title: string;
  blocks: ScriptBlock[];
};

type Character = { id: string; name: string };

type ScriptReaderProps = {
  scenes: ScriptScene[];
  characters: Character[];
  ownCharacterIds: string[];
  initialSceneId: string;
};

type FilterSettings = {
  characterIds: string[];
  meOnly: boolean;
  highlightMyLines: boolean;
};

const emptyFilters: FilterSettings = {
  characterIds: [],
  meOnly: false,
  highlightMyLines: false,
};

export function ScriptReader({
  scenes,
  characters,
  ownCharacterIds,
  initialSceneId,
}: ScriptReaderProps) {
  const [sceneId, setSceneId] = useState(initialSceneId);
  const [filters, setFilters] = useState(emptyFilters);
  const [draftFilters, setDraftFilters] = useState(emptyFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeOwnLine, setActiveOwnLine] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const ownCharacterSet = useMemo(() => new Set(ownCharacterIds), [ownCharacterIds]);
  const currentScene = scenes.find((scene) => scene.id === sceneId);
  const characterNames = useMemo(
    () => new Map(characters.map((character) => [character.id, character.name])),
    [characters],
  );

  const visibleBlocks = useMemo(
    () =>
      (currentScene?.blocks ?? []).filter((block) => {
        if (filters.meOnly && (!block.characterId || !ownCharacterSet.has(block.characterId))) {
          return false;
        }
        if (
          filters.characterIds.length > 0 &&
          block.characterId &&
          !filters.characterIds.includes(block.characterId)
        ) {
          return false;
        }
        return true;
      }),
    [currentScene, filters, ownCharacterSet],
  );
  const ownLineIndexes = useMemo(
    () =>
      visibleBlocks.flatMap((block, index) =>
        block.characterId && ownCharacterSet.has(block.characterId) ? [index] : [],
      ),
    [ownCharacterSet, visibleBlocks],
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (filtersOpen && !dialog.open) dialog.showModal();
    if (!filtersOpen && dialog.open) dialog.close();
  }, [filtersOpen]);

  function openFilters() {
    setDraftFilters(filters);
    setFiltersOpen(true);
  }

  function toggleCharacter(characterId: string) {
    setDraftFilters((current) => ({
      ...current,
      characterIds: current.characterIds.includes(characterId)
        ? current.characterIds.filter((id) => id !== characterId)
        : [...current.characterIds, characterId],
    }));
  }

  function jumpToOwnLine(direction: "previous" | "next") {
    if (ownLineIndexes.length === 0) return;
    const nextIndex =
      activeOwnLine === null
        ? direction === "next"
          ? 0
          : ownLineIndexes.length - 1
        : activeOwnLine + (direction === "next" ? 1 : -1);
    if (nextIndex < 0 || nextIndex >= ownLineIndexes.length) return;
    setActiveOwnLine(nextIndex);
    const blockIndex = ownLineIndexes[nextIndex];
    document.getElementById(`script-block-${blockIndex}`)?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFilters(draftFilters);
    setActiveOwnLine(null);
    setFiltersOpen(false);
  }

  function changeScene(nextSceneId: string) {
    setSceneId(nextSceneId);
    setActiveOwnLine(null);
  }

  const activeLinePosition = activeOwnLine;
  const canIdentifyOwnLines = ownCharacterIds.length > 0;

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <label className="grid min-w-56 flex-1 gap-1 text-sm font-medium sm:max-w-md">
          Scene
          <select
            className="field"
            disabled={scenes.length === 0}
            onChange={(event) => changeScene(event.target.value)}
            value={sceneId}
          >
            {scenes.length === 0 ? (
              <option value="">No scenes available</option>
            ) : (
              scenes.map((scene) => (
                <option key={scene.id} value={scene.id}>
                  Scene {scene.sceneNumber}: {scene.title}
                </option>
              ))
            )}
          </select>
        </label>
        <div className="flex flex-wrap gap-2">
          <button className="button-secondary gap-2" onClick={openFilters} type="button">
            <Filter aria-hidden="true" size={17} />
            Filters
          </button>
          <button
            aria-label="Jump to previous line"
            className="button-secondary gap-2"
            disabled={
              !canIdentifyOwnLines ||
              ownLineIndexes.length === 0 ||
              (activeLinePosition !== null && activeLinePosition <= 0)
            }
            onClick={() => jumpToOwnLine("previous")}
            type="button"
          >
            <ChevronUp aria-hidden="true" size={17} />
            Previous line
          </button>
          <button
            aria-label="Jump to next line"
            className="button-secondary gap-2"
            disabled={
              !canIdentifyOwnLines ||
              ownLineIndexes.length === 0 ||
              activeLinePosition === ownLineIndexes.length - 1
            }
            onClick={() => jumpToOwnLine("next")}
            type="button"
          >
            <ChevronDown aria-hidden="true" size={17} />
            Next line
          </button>
        </div>
      </div>

      {!canIdentifyOwnLines && (
        <p className="rounded-xl border border-amber-900/20 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Your account email is not linked to a performer. Add it to a performer profile to use
          “Me only”, line highlighting, and line navigation.
        </p>
      )}

      {!currentScene ? (
        <div className="rounded-2xl border border-dashed border-black/20 bg-white/50 p-10 text-center">
          <h2 className="text-xl font-semibold">No scenes yet</h2>
          <p className="mt-2 text-[var(--muted)]">Create a scene before adding its script.</p>
        </div>
      ) : visibleBlocks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/20 bg-white/50 p-10 text-center">
          <h2 className="text-xl font-semibold">
            {currentScene.blocks.length === 0 ? "No script for this scene yet" : "No lines match these filters"}
          </h2>
          <p className="mt-2 text-[var(--muted)]">
            {currentScene.blocks.length === 0
              ? "Script content can be added here once it has been prepared."
              : "Adjust the filters to see more of this scene."}
          </p>
        </div>
      ) : (
        <ol aria-label={`Script for scene ${currentScene.sceneNumber}`} className="grid gap-3">
          {visibleBlocks.map((block, index) => {
            const isOwnLine = Boolean(block.characterId && ownCharacterSet.has(block.characterId));
            const isHighlighted = filters.highlightMyLines && isOwnLine;
            return (
              <li
                className={`scroll-mt-8 rounded-2xl border p-5 shadow-sm ${
                  isHighlighted
                    ? "border-[var(--accent)] bg-[#edf4ed]"
                    : "border-black/10 bg-white/80"
                }`}
                id={`script-block-${index}`}
                key={`${block.id}-${index}`}
              >
                {block.characterId && (
                  <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--accent)]">
                    {characterNames.get(block.characterId) ?? "Unknown character"}
                  </p>
                )}
                <p className="whitespace-pre-wrap text-base leading-7">{block.text}</p>
              </li>
            );
          })}
        </ol>
      )}

      <dialog
        aria-labelledby="script-filters-title"
        className="modal-dialog"
        onClose={() => setFiltersOpen(false)}
        ref={dialogRef}
      >
        <form className="grid gap-5 p-6" onSubmit={applyFilters}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="mb-2 text-sm font-medium uppercase tracking-widest text-[var(--accent)]">
                Script options
              </p>
              <h2 className="text-2xl font-semibold" id="script-filters-title">
                Filters
              </h2>
            </div>
            <button
              aria-label="Close filters"
              className="icon-button"
              onClick={() => setFiltersOpen(false)}
              type="button"
            >
              <X aria-hidden="true" size={18} />
            </button>
          </div>

          <fieldset className="grid gap-2">
            <legend className="mb-2 text-sm font-semibold">Follow characters</legend>
            <details className="relative">
              <summary className="button-secondary flex w-full cursor-pointer list-none justify-between">
                {draftFilters.characterIds.length === 0
                  ? "All characters"
                  : `${draftFilters.characterIds.length} selected`}
                <ChevronDown aria-hidden="true" size={17} />
              </summary>
              <div className="absolute z-10 mt-2 max-h-56 w-full overflow-y-auto rounded-xl border border-black/15 bg-white p-2 shadow-lg">
                {characters.length === 0 ? (
                  <p className="px-3 py-2 text-sm text-[var(--muted)]">No characters available.</p>
                ) : (
                  characters.map((character) => (
                    <label
                      className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-black/5"
                      key={character.id}
                    >
                      <input
                        checked={draftFilters.characterIds.includes(character.id)}
                        className="accent-[var(--accent)]"
                        onChange={() => toggleCharacter(character.id)}
                        type="checkbox"
                      />
                      {character.name}
                    </label>
                  ))
                )}
              </div>
            </details>
          </fieldset>

          <label className="flex items-start gap-3 rounded-xl border border-black/10 bg-white px-4 py-3">
            <input
              checked={draftFilters.meOnly}
              className="mt-1 accent-[var(--accent)]"
              disabled={!canIdentifyOwnLines}
              onChange={(event) =>
                setDraftFilters((current) => ({ ...current, meOnly: event.target.checked }))
              }
              type="checkbox"
            />
            <span>
              <span className="block text-sm font-semibold">Me only</span>
              <span className="mt-1 block text-sm text-[var(--muted)]">
                Show only dialogue for characters assigned to your performer profile.
              </span>
            </span>
          </label>

          <label className="flex items-start gap-3 rounded-xl border border-black/10 bg-white px-4 py-3">
            <input
              checked={draftFilters.highlightMyLines}
              className="mt-1 accent-[var(--accent)]"
              disabled={!canIdentifyOwnLines}
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  highlightMyLines: event.target.checked,
                }))
              }
              type="checkbox"
            />
            <span>
              <span className="block text-sm font-semibold">Highlight my lines</span>
              <span className="mt-1 block text-sm text-[var(--muted)]">
                Highlight dialogue for characters assigned to your performer profile.
              </span>
            </span>
          </label>

          <div className="flex justify-end gap-2">
            <button
              className="button-secondary"
              onClick={() => setFiltersOpen(false)}
              type="button"
            >
              Cancel
            </button>
            <button className="button-primary" type="submit">
              Apply filters
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
