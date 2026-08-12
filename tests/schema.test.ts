import { describe, expect, it } from "vitest";
import { briefSchema, slideContentSchema, type SlideContent } from "@/lib/schema";
import { finalizeSlidesForRender, normalizeSlideForRender } from "@/lib/slides/normalize";

describe("schema validation", () => {
  it("accepts a valid brief", () => {
    const result = briefSchema.parse({
      rawPrompt: "Create a sales deck for a manufacturing ERP prospect.",
      type: "sales",
      audience: "Operations leaders",
      outcome: "Book a strategy call",
      context: "",
      requestedSlideCount: 8
    });
    expect(result.requestedSlideCount).toBe(8);
  });

  it("accepts a valid slide", () => {
    const slide = slideContentSchema.parse({
      id: "slide_1",
      sequence: 1,
      purpose: "orient",
      layoutKind: "hero",
      eyebrow: "Kalpa",
      headline: "ERP done right",
      subheadline: "A better path for operations teams.",
      bullets: ["Right-fit advisory", "Cleaner implementation"],
      stats: [],
      steps: [],
      leftColumnTitle: "",
      leftColumnPoints: [],
      rightColumnTitle: "",
      rightColumnPoints: [],
      quote: "",
      quoteAttribution: "",
      ctaText: "",
      ctaSubtext: "",
      contactLine: "",
      imageAssetIds: [],
      notes: ""
    });
    expect(slide.layoutKind).toBe("hero");
  });

  it("does not repeat a visual asset across generated slides", () => {
    const base: SlideContent = {
      id: "slide_1",
      sequence: 1,
      purpose: "orient",
      layoutKind: "hero",
      eyebrow: "Kalpa",
      headline: "ERP done right",
      subheadline: "",
      bullets: [],
      stats: [],
      steps: [],
      leftColumnTitle: "",
      leftColumnPoints: [],
      rightColumnTitle: "",
      rightColumnPoints: [],
      quote: "",
      quoteAttribution: "",
      ctaText: "",
      ctaSubtext: "",
      contactLine: "",
      imageAssetIds: [],
      notes: ""
    };
    const slides = [base, { ...base, id: "slide_2", sequence: 2 }, { ...base, id: "slide_3", sequence: 3 }];
    const rendered = finalizeSlidesForRender(slides, [
      { id: "asset_1", name: "first.png", mimeType: "image/png", size: 1, path: "uploads/first.png", extractedText: "", createdAt: "2026-01-01" },
      { id: "asset_2", name: "second.png", mimeType: "image/png", size: 1, path: "uploads/second.png", extractedText: "", createdAt: "2026-01-01" }
    ]);

    expect(rendered.map((slide) => slide.imageAssetIds[0] || "")).toEqual(["asset_1", "asset_2", ""]);
  });

  it("keeps dense framework copy within the renderer's safe card budget", () => {
    const rendered = normalizeSlideForRender({
      id: "slide_grid",
      sequence: 1,
      purpose: "Explain the operating model pillars in practical terms.",
      layoutKind: "industry-grid",
      eyebrow: "Operating model",
      headline: "Three changes that create reliable execution",
      subheadline: "",
      bullets: [
        "A long operational pillar that cannot fit cleanly inside a compact presentation card without being rewritten",
        "Standardize ownership across purchasing, warehouse operations, finance, and customer service handoffs",
        "Build trusted reporting from a single operational source of truth",
        "This fourth point must not be rendered because the layout has three pillars"
      ],
      stats: [],
      steps: [],
      leftColumnTitle: "",
      leftColumnPoints: [],
      rightColumnTitle: "",
      rightColumnPoints: [],
      quote: "",
      quoteAttribution: "",
      ctaText: "",
      ctaSubtext: "",
      contactLine: "",
      imageAssetIds: [],
      notes: ""
    });

    expect(rendered.bullets).toHaveLength(3);
    expect(rendered.bullets.every((bullet) => bullet.length <= 42)).toBe(true);
  });
});
