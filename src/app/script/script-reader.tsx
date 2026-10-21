"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { ChevronDown, ChevronUp, Filter, X } from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type SyntheticEvent,
} from "react";
import type { ScriptBlock } from "@/db/schema";

type ScriptScene = {
  id: string;
  sceneNumber: number;
  title: string;
  blocks: ScriptBlock[];
};

type Character = { id: string; name: string };
type KeyedBlock = { key: string; block: ScriptBlock };
type ScriptSection = { id: string; title: string; blocks: KeyedBlock[] };
type ScriptRow = { key: string; lines: KeyedBlock[] };
type JumpTarget = { key: string; sectionId: string; rowIndex: number };

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
  practiceMode: boolean;
};

type SectionCardProps = {
  section: ScriptSection;
  rows: ScriptRow[];
  isOpen: boolean;
  charactersById: Map<string, string>;
  ownCharacterIds: Set<string>;
  highlightMyLines: boolean;
  practiceMode: boolean;
  clickedLineKey: string | null;
  jumpFlash: { lineKey: string; id: number } | null;
  jumpTarget: JumpTarget | null;
  onToggle: (sectionId: string, isOpen: boolean) => void;
  onJumpComplete: (lineKey: string) => void;
  onSelectLine: (line: KeyedBlock) => void;
};

const emptyFilters: FilterSettings = {
  characterIds: [],
  meOnly: false,
  highlightMyLines: true,
  practiceMode: false,
};

function characterIdsFor(block: ScriptBlock) {
  return [...new Set([...(block.characterIds ?? []), ...(block.characterId ? [block.characterId] : [])])];
}

function sectionsFor(blocks: ScriptBlock[]): ScriptSection[] {
  const sections = new Map<string, ScriptSection>();

  blocks.forEach((block, index) => {
    const id = block.sectionId ?? "section-1";
    const section = sections.get(id) ?? {
      id,
      title: block.sectionTitle ?? `Section ${sections.size + 1}`,
      blocks: [],
    };
    section.blocks.push({ key: `${id}:${block.id}:${index}`, block });
    sections.set(id, section);
  });

  return [...sections.values()];
}

function rowsFor(blocks: KeyedBlock[]): ScriptRow[] {
  const rows: ScriptRow[] = [];

  for (let index = 0; index < blocks.length; ) {
    const current = blocks[index];
    const groupId = current.block.concurrentGroupId;
    if (!groupId) {
      rows.push({ key: current.key, lines: [current] });
      index += 1;
      continue;
    }

    const lines: KeyedBlock[] = [];
    while (index < blocks.length && blocks[index].block.concurrentGroupId === groupId) {
      lines.push(blocks[index]);
      index += 1;
    }
    rows.push({ key: `concurrent:${groupId}`, lines });
  }

  return rows;
}

function SectionCard({
  section,
  rows,
  isOpen,
  charactersById,
  ownCharacterIds,
  highlightMyLines,
  practiceMode,
  clickedLineKey,
  jumpFlash,
  jumpTarget,
  onToggle,
  onJumpComplete,
  onSelectLine,
}: SectionCardProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 144,
    getItemKey: (index) => rows[index]?.key ?? index,
    overscan: 5,
    useFlushSync: false,
  });

  useEffect(() => {
    if (isOpen && jumpTarget?.sectionId === section.id) {
      virtualizer.scrollToIndex(jumpTarget.rowIndex, { align: "center", behavior: "smooth" });
      onJumpComplete(jumpTarget.key);
    }
  }, [isOpen, jumpTarget, onJumpComplete, section.id, virtualizer]);

  function handleToggle(event: SyntheticEvent<HTMLDetailsElement>) {
    onToggle(section.id, event.currentTarget.open);
  }

  return (
    <details
      className="overflow-hidden rounded-2xl border border-black/10 bg-white/65 shadow-sm"
      onToggle={handleToggle}
      open={isOpen}
    >
      <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 bg-white/60 px-5 py-4 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--accent)]">
        <span className="flex items-center gap-3">
          <ChevronDown aria-hidden="true" className="text-[var(--accent)]" size={19} />
          <span className="font-semibold">{section.title}</span>
          <span className="text-sm text-[var(--muted)]">{rows.length} lines</span>
        </span>
        <span className="rounded-full border border-black/10 px-3 py-1 text-xs text-[var(--muted)]">
          Audio clip can be added later
        </span>
      </summary>

      {isOpen && (
        <div
          aria-label={`Scrollable lines in ${section.title}`}
          className="h-[60vh] min-h-72 max-h-[38rem] overflow-y-auto overscroll-contain border-t border-black/10 px-3 py-3 sm:px-5"
          ref={scrollRef}
          tabIndex={0}
        >
          <ol
            aria-label={`Lines in ${section.title}`}
            className="relative w-full"
            style={{ height: `${virtualizer.getTotalSize()}px` }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const row = rows[virtualRow.index];
              return (
                <li
                  className="absolute left-0 top-0 w-full pb-3"
                  data-index={virtualRow.index}
                  key={virtualRow.key}
                  ref={virtualizer.measureElement}
                  style={{ transform: `translateY(${virtualRow.start}px)` }}
                >
                  <div className={row.lines.length > 1 ? "grid gap-3 md:grid-cols-2" : "grid gap-3"}>
                    {row.lines.length > 1 && (
                      <p className="col-span-full px-1 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                        Spoken at the same time
                      </p>
                    )}
                    {row.lines.map((line) => {
                      const speakerIds = characterIdsFor(line.block);
                      const isOwnLine = speakerIds.some((id) => ownCharacterIds.has(id));
                      const isClicked = clickedLineKey === line.key;
                      const isJumpFlash = jumpFlash?.lineKey === line.key;
                      const isOwnLineHighlighted = highlightMyLines && isOwnLine;
                      const isHiddenForPractice = practiceMode && isOwnLine && !isClicked;
                      const speakerNames = speakerIds.map((id) => charactersById.get(id) ?? "Unknown character");
                      const highlightClass = isClicked
                        ? "border-blue-500 bg-blue-100 shadow-sm"
                        : isOwnLineHighlighted
                          ? "border-[var(--accent)] bg-[#edf4ed] shadow-sm"
                          : "border-transparent bg-transparent hover:border-black/10 hover:bg-white/75";

                      return (
                        <div className="min-w-0" key={line.key}>
                          <button
                            aria-pressed={isClicked}
                            className={`block w-full cursor-pointer rounded-xl border px-4 py-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${highlightClass} ${
                              isJumpFlash && !isClicked ? "script-line-card--jump" : ""
                            }`}
                            key={isJumpFlash ? `${line.key}:${jumpFlash.id}` : line.key}
                            onClick={() => onSelectLine(line)}
                            type="button"
                          >
                            {speakerNames.length > 0 && (
                              <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
                                {speakerNames.join(" + ")}
                              </span>
                            )}
                            <span
                              className={`block whitespace-pre-wrap text-base leading-7 ${
                                isHiddenForPractice || line.block.type === "direction"
                                  ? "italic text-[var(--muted)]"
                                  : ""
                              }`}
                            >
                              {isHiddenForPractice ? "Click to reveal your line" : line.block.text}
                            </span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </details>
  );
}

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
  const [clickedLineKey, setClickedLineKey] = useState<string | null>(null);
  const [jumpFlash, setJumpFlash] = useState<{ lineKey: string; id: number } | null>(null);
  const [activeOwnLineKey, setActiveOwnLineKey] = useState<string | null>(null);
  const [jumpTarget, setJumpTarget] = useState<JumpTarget | null>(null);
  const [sectionOpenState, setSectionOpenState] = useState<{
    sceneId: string;
    ids: Set<string>;
  } | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const jumpFlashSequence = useRef(0);
  const ownCharacterSet = useMemo(() => new Set(ownCharacterIds), [ownCharacterIds]);
  const canIdentifyOwnLines = ownCharacterIds.length > 0;
  const currentScene = scenes.find((scene) => scene.id === sceneId);
  const charactersById = useMemo(
    () => new Map(characters.map((character) => [character.id, character.name])),
    [characters],
  );

  const sections = useMemo(() => {
    const sectionList = sectionsFor(currentScene?.blocks ?? []);
    return sectionList
      .map((section) => {
        const filtered = section.blocks.filter(({ block }) => {
          const speakerIds = characterIdsFor(block);
          if (filters.meOnly && !speakerIds.some((id) => ownCharacterSet.has(id))) return false;
          if (
            filters.characterIds.length > 0 &&
            speakerIds.length > 0 &&
            !speakerIds.some((id) => filters.characterIds.includes(id))
          ) {
            return false;
          }
          return true;
        });
        return { section, rows: rowsFor(filtered) };
      })
      .filter(({ rows }) => rows.length > 0);
  }, [currentScene, filters, ownCharacterSet]);

  const ownLineTargets = useMemo(
    () =>
      sections.flatMap(({ section, rows }) =>
        rows.flatMap((row, rowIndex) =>
          row.lines
            .filter(({ block }) => characterIdsFor(block).some((id) => ownCharacterSet.has(id)))
            .map((line) => ({ key: line.key, sectionId: section.id, rowIndex })),
        ),
      ),
    [ownCharacterSet, sections],
  );
  const activeOwnLineIndex = ownLineTargets.findIndex((target) => target.key === activeOwnLineKey);
  const canJumpPrevious = canIdentifyOwnLines && activeOwnLineIndex > 0;
  const canJumpNext =
    canIdentifyOwnLines &&
    ownLineTargets.length > 0 &&
    (activeOwnLineIndex === -1 || activeOwnLineIndex < ownLineTargets.length - 1);
  const openSectionIds =
    sectionOpenState?.sceneId === sceneId
      ? sectionOpenState.ids
      : new Set(sections[0] ? [sections[0].section.id] : []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (filtersOpen && !dialog.open) dialog.showModal();
    if (!filtersOpen && dialog.open) dialog.close();
  }, [filtersOpen]);

  useEffect(() => {
    if (!jumpFlash) return;
    const timeout = window.setTimeout(() => {
      setJumpFlash((current) => (current?.id === jumpFlash.id ? null : current));
    }, 2000);
    return () => window.clearTimeout(timeout);
  }, [jumpFlash]);

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
    if (ownLineTargets.length === 0) return;
    if (activeOwnLineIndex === -1 && direction === "previous") return;
    const nextIndex = activeOwnLineIndex === -1
      ? 0
      : activeOwnLineIndex + (direction === "next" ? 1 : -1);
    if (nextIndex < 0 || nextIndex >= ownLineTargets.length) return;

    const target = ownLineTargets[nextIndex];
    const currentTarget = ownLineTargets[activeOwnLineIndex];
    const nextOpenSectionIds = new Set(openSectionIds);
    if (currentTarget && currentTarget.sectionId !== target.sectionId) {
      nextOpenSectionIds.delete(currentTarget.sectionId);
    }
    nextOpenSectionIds.add(target.sectionId);

    setActiveOwnLineKey(target.key);
    setClickedLineKey(null);
    setJumpFlash({ lineKey: target.key, id: ++jumpFlashSequence.current });
    setJumpTarget(target);
    setSectionOpenState({
      sceneId,
      ids: nextOpenSectionIds,
    });
  }

  function selectLine(line: KeyedBlock) {
    setClickedLineKey((current) => (current === line.key ? null : line.key));
    setActiveOwnLineKey(
      characterIdsFor(line.block).some((id) => ownCharacterSet.has(id)) ? line.key : null,
    );
  }

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFilters(draftFilters);
    setClickedLineKey(null);
    setJumpFlash(null);
    setActiveOwnLineKey(null);
    setJumpTarget(null);
    setFiltersOpen(false);
  }

  function changeScene(nextSceneId: string) {
    setSceneId(nextSceneId);
    setClickedLineKey(null);
    setJumpFlash(null);
    setActiveOwnLineKey(null);
    setJumpTarget(null);
  }

  function toggleSection(sectionId: string, isOpen: boolean) {
    const next = new Set(openSectionIds);
    if (isOpen) next.add(sectionId);
    else next.delete(sectionId);
    setSectionOpenState({ sceneId, ids: next });
  }

  function completeJump(lineKey: string) {
    setJumpTarget((current) => (current?.key === lineKey ? null : current));
  }

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <label className="grid min-w-56 flex-1 gap-1 text-sm font-medium sm:max-w-md">
          Scene
          <span className="relative block">
            <select
              className="field appearance-none pr-10"
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
            <ChevronDown
              aria-hidden="true"
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
              size={17}
            />
          </span>
        </label>
        <div className="flex flex-wrap gap-2">
          <button className="button-secondary gap-2" onClick={openFilters} type="button">
            <Filter aria-hidden="true" size={17} />
            Filters
          </button>
          <button
            aria-pressed={filters.practiceMode}
            className={`button-secondary gap-2 ${filters.practiceMode ? "script-practice-toggle--active" : ""} disabled:cursor-not-allowed disabled:opacity-50`}
            disabled={!canIdentifyOwnLines}
            onClick={() => {
              setFilters((current) => ({ ...current, practiceMode: !current.practiceMode }));
              setClickedLineKey(null);
            }}
            title="Hide your dialogue until you click a line to reveal it"
            type="button"
          >
            Practice mode
          </button>
          <button
            aria-label="Jump to previous line"
            className="button-secondary gap-2 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!canJumpPrevious}
            onClick={() => jumpToOwnLine("previous")}
            type="button"
          >
            <ChevronUp aria-hidden="true" size={17} />
            Previous line
          </button>
          <button
            aria-label="Jump to next line"
            className="button-secondary gap-2 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!canJumpNext}
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
      ) : sections.length === 0 ? (
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
        <div className="grid gap-4">
          {sections.map(({ section, rows }) => (
            <SectionCard
              charactersById={charactersById}
              highlightMyLines={filters.highlightMyLines}
              isOpen={openSectionIds.has(section.id)}
              jumpFlash={jumpFlash}
              jumpTarget={jumpTarget}
              key={section.id}
              onJumpComplete={completeJump}
              onSelectLine={selectLine}
              onToggle={toggleSection}
              ownCharacterIds={ownCharacterSet}
              practiceMode={filters.practiceMode}
              rows={rows}
              section={section}
              clickedLineKey={clickedLineKey}
            />
          ))}
        </div>
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

          <p className="rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-[var(--muted)]">
            Practice mode hides dialogue for your assigned characters until you click a line to reveal it.
          </p>

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
