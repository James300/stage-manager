import type { ReactNode } from "react";
import { AppHeader } from "@/app/app-header";

type PageLayoutProps = {
  userName: string;
  isAdmin?: boolean;
  title: string;
  description?: string;
  actions?: ReactNode;
  maxWidth?: "max-w-4xl" | "max-w-7xl";
  children: ReactNode;
};

export function PageLayout({
  userName,
  isAdmin = true,
  title,
  description,
  actions,
  maxWidth = "max-w-7xl",
  children,
}: PageLayoutProps) {
  return (
    <main className={`mx-auto min-h-screen ${maxWidth} px-5 py-8 sm:px-8`}>
      <AppHeader isAdmin={isAdmin} userName={userName} />
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
