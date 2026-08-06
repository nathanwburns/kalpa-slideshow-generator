import { describe, expect, it } from "vitest";
import { briefSchema, slideContentSchema } from "@/lib/schema";

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
});
