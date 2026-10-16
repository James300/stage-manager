import type { ReactNode } from "react";
import { AppHeader } from "@/app/app-header";

type PageLayoutProps = {
  adminName: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  maxWidth?: "max-w-4xl" | "max-w-7xl";
  children: ReactNode;
};

export function PageLayout({
  adminName,
  title,
  description,
  actions,
  maxWidth = "max-w-7xl",
  children,
}: PageLayoutProps) {
  return (
    <main className={`mx-auto min-h-screen ${maxWidth} px-5 py-8 sm:px-8`}>
      <AppHeader adminName={adminName} />
      <section className="mb-8">
        <div className="flex items-center justify-between gap-4">
          <h1 className="min-w-0 text-3xl font-semibold sm:text-4xl">{title}</h1>
          {actions && <div className="flex shrink-0 items-center gap-3">{actions}</div>}
        </div>
        {description && <p className="mt-2 text-[var(--muted)]">{description}</p>}
      </section>
      {children}
    </main>
  );
}
