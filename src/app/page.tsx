import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col justify-between px-6 py-8 sm:px-10">
      <header className="flex items-center justify-between border-b border-black/10 pb-5">
        <span className="text-sm font-semibold tracking-wide text-[var(--accent)]">
          INTO THE WOODS
        </span>
        <span className="text-sm text-[var(--muted)]">Rehearsal Scheduler</span>
      </header>
      <section className="py-20">
        <p className="mb-4 text-sm font-medium uppercase tracking-widest text-[var(--accent)]">
          Production workspace
        </p>
        <h1 className="max-w-2xl text-4xl font-semibold leading-tight sm:text-5xl">
          Keep the whole cast in sync.
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-8 text-[var(--muted)]">
          Manage performer details, organize characters, and keep every role assignment
          up to date for Into the Woods.
        </p>
        <Link
          className="button-primary mt-8"
          href="/cast"
        >
          Open cast directory
        </Link>
      </section>
      <footer className="border-t border-black/10 pt-5 text-sm text-[var(--muted)]">
        Into the Woods rehearsal team
      </footer>
    </main>
  );
}