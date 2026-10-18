"use client";

import type { ReactNode } from "react";
import { useState } from "react";

type RehearsalTabsProps = {
  details: ReactNode;
  attendance?: ReactNode;
  availability?: ReactNode;
  isAdmin: boolean;
};

export function RehearsalTabs({ details, attendance, availability, isAdmin }: RehearsalTabsProps) {
  const [activeTab, setActiveTab] = useState<"details" | "attendance" | "availability">("details");
  const tabs = isAdmin ? ["details", "attendance", "availability"] as const : ["details"] as const;

  return (
    <div>
      <div aria-label="Rehearsal sections" className="mb-6 flex gap-2 border-b border-black/10" role="tablist">
        {tabs.map((tab) => (
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
      {isAdmin && (
        <>
          <section
            aria-labelledby="rehearsal-attendance-tab"
            hidden={activeTab !== "attendance"}
            id="rehearsal-attendance-panel"
            role="tabpanel"
            tabIndex={0}
          >
            {attendance}
          </section>
          <section
            aria-labelledby="rehearsal-availability-tab"
            hidden={activeTab !== "availability"}
            id="rehearsal-availability-panel"
            role="tabpanel"
            tabIndex={0}
          >
            {availability}
          </section>
        </>
      )}
    </div>
  );
}
