// @vitest-environment node

import fs from "fs/promises";
import { describe, expect, it } from "vitest";
import { renderProjectPptx } from "@/lib/pptx/render";
import { withKalpaBookends } from "@/lib/slides/bookends";
import type { ProjectRecord, SlideContent } from "@/lib/schema";

describe("PPTX export", () => {
  it("writes a PowerPoint file for a representative Kalpa deck", async () => {
    const coreSlide: SlideContent = {
      id: "slide_1",
      sequence: 1,
      purpose: "Explain the operating model changes.",
      layoutKind: "industry-grid",
      eyebrow: "Operating model",
      headline: "Three changes that create reliable execution",
      subheadline: "A practical operating model for more confident decisions.",
      bullets: ["One trusted source for operations", "Clear ownership at every handoff", "A repeatable close process"],
      stats: [], steps: [], leftColumnTitle: "", leftColumnPoints: [], rightColumnTitle: "", rightColumnPoints: [],
      quote: "", quoteAttribution: "", ctaText: "", ctaSubtext: "", contactLine: "", imageAssetIds: [], notes: ""
    };
    const project: ProjectRecord = {
      id: "pptx-export-fixture",
      title: "Northstar implementation plan",
      description: "",
      createdAt: "2026-08-12T00:00:00.000Z",
      updatedAt: "2026-08-12T00:00:00.000Z",
      status: "generated",
      brief: null,
      templateFamily: "human-centered-sales",
      questions: [], outline: [], assets: [], themeConcepts: [], selectedThemeConceptId: null, revisions: [],
      slides: withKalpaBookends([coreSlide], "Northstar implementation plan", null)
    };

    const outputPath = await renderProjectPptx(project);
    const output = await fs.readFile(outputPath);
    expect(output.subarray(0, 2).toString()).toBe("PK");
    expect(output.length).toBeGreaterThan(10_000);
  });
});
