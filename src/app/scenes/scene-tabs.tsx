"use client";

import type { ReactNode } from "react";
import { useState } from "react";

type SceneTabsProps = {
  details: ReactNode;
  blocking: ReactNode;
};

export function SceneTabs({ details, blocking }: SceneTabsProps) {
  const [activeTab, setActiveTab] = useState<"details" | "blocking">("details");

  return (
    <div>
      <div aria-label="Scene sections" className="mb-6 flex gap-2 border-b border-black/10" role="tablist">
        {(["details", "blocking"] as const).map((tab) => (
          <button
            aria-controls={`scene-${tab}-panel`}
            aria-selected={activeTab === tab}
            className={`border-b-2 px-4 py-3 text-sm font-semibold capitalize transition ${
              activeTab === tab
                ? "border-[var(--accent)] text-[var(--accent)]"
                : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
            id={`scene-${tab}-tab`}
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
        aria-labelledby="scene-details-tab"
        hidden={activeTab !== "details"}
        id="scene-details-panel"
        role="tabpanel"
        tabIndex={0}
      >
        {details}
      </section>
      <section
        aria-labelledby="scene-blocking-tab"
        hidden={activeTab !== "blocking"}
        id="scene-blocking-panel"
        role="tabpanel"
        tabIndex={0}
      >
        {blocking}
      </section>
    </div>
  );
}
