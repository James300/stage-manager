"use client";

import type { ReactNode } from "react";
import { useState } from "react";

type RehearsalTabsProps = {
  details: ReactNode;
  attendance: ReactNode;
};

export function RehearsalTabs({ details, attendance }: RehearsalTabsProps) {
  const [activeTab, setActiveTab] = useState<"details" | "attendance">("details");

  return (
    <div>
      <div aria-label="Rehearsal sections" className="mb-6 flex gap-2 border-b border-black/10" role="tablist">
        {(["details", "attendance"] as const).map((tab) => (
          <button
            aria-controls={`rehearsal-${tab}-panel`}
            aria-selected={activeTab === tab}
            className={`border-b-2 px-4 py-3 text-sm font-semibold capitalize transition ${
              activeTab === tab
                ? "border-[var(--accent)] text-[var(--accent)]"
                : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
            id={`rehearsal-${tab}-tab`}
            key={tab}
            onClick={() => setActiveTab(tab)}
            role="tab"
            type="button"
          >
            {tab}
          </button>
        ))}
      </div>
      <section
        aria-labelledby="rehearsal-details-tab"
        hidden={activeTab !== "details"}
        id="rehearsal-details-panel"
        role="tabpanel"
        tabIndex={0}
      >
        {details}
      </section>
      <section
        aria-labelledby="rehearsal-attendance-tab"
        hidden={activeTab !== "attendance"}
        id="rehearsal-attendance-panel"
        role="tabpanel"
        tabIndex={0}
      >
        {attendance}
      </section>
    </div>
  );
}
