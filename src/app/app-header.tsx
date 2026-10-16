"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { SignOutButton } from "@/app/sign-out-button";

const navigation = [
  { href: "/rehearsals", label: "Rehearsals" },
  { href: "/scenes", label: "Scenes" },
  { href: "/cast", label: "Cast" },
  { href: "/performers", label: "Performers" },
];

export function AppHeader({ adminName }: { adminName: string }) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <header className="mb-8 flex items-center justify-between border-b border-black/10 pb-5">
      <div className="flex items-center gap-3">
        <button
          aria-label="Open navigation menu"
          className="icon-button"
          onClick={() => setOpen(true)}
          type="button"
        >
          <Menu aria-hidden="true" size={20} />
        </button>
        <Link className="text-sm font-semibold tracking-wide text-[var(--accent)]" href="/scenes">
          INTO THE WOODS
        </Link>
      </div>
      <div className="flex items-center gap-4 text-sm text-[var(--muted)]">
        <span className="hidden sm:inline">{adminName}</span>
        <SignOutButton />
      </div>
      <dialog
        ref={dialogRef}
        aria-label="Navigation menu"
        className="sidebar-dialog"
        onClose={() => setOpen(false)}
      >
        <div className="flex h-full flex-col bg-[var(--background)] p-5">
          <div className="mb-8 flex items-center justify-between">
            <span className="text-sm font-semibold tracking-wide text-[var(--accent)]">
              INTO THE WOODS
            </span>
            <button
              aria-label="Close navigation menu"
              className="icon-button"
              onClick={() => setOpen(false)}
              type="button"
            >
              <X aria-hidden="true" size={20} />
            </button>
          </div>
          <nav aria-label="Main navigation" className="grid gap-2">
            {navigation.map(({ href, label }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  aria-current={active ? "page" : undefined}
                  className={`rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                    active
                      ? "bg-white text-[var(--accent)]"
                      : "text-[var(--foreground)] hover:bg-white/70"
                  }`}
                  href={href}
                  key={href}
                  onClick={() => setOpen(false)}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto border-t border-black/10 pt-4 text-sm text-[var(--muted)]">
            Signed in as {adminName}
          </div>
        </div>
      </dialog>
    </header>
  );
}
