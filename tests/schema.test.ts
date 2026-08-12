import { describe, expect, it } from "vitest";
import { briefSchema, slideContentSchema, type SlideContent } from "@/lib/schema";
import { finalizeSlidesForRender, normalizeSlideForRender } from "@/lib/slides/normalize";
import { withKalpaBookends } from "@/lib/slides/bookends";
import { resolveSlide } from "@/lib/templates/layout-engine";

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
    expect(rendered.bullets.every((bullet) => bullet.length <= 50)).toBe(true);
  });

  it("adds Kalpa's protected welcome and contact slides around generated content", () => {
    const generated = withKalpaBookends([], "Northstar implementation plan", {
      rawPrompt: "Create an executive assessment deck.",
      type: "strategy",
      audience: "Northstar leadership",
      outcome: "Align on the assessment scope.",
      context: "",
      requestedSlideCount: 8
    });
    expect(generated).toHaveLength(2);
    expect(generated[0]).toMatchObject({ id: "kalpa-cover", layoutKind: "hero", headline: "Northstar implementation plan", eyebrow: "KALPA STRATEGY DECK", subheadline: "Prepared by Kalpa for Northstar leadership." });
    expect(generated[1]).toMatchObject({ id: "kalpa-contact", layoutKind: "cta", ctaSubtext: "sales@kalpainc.com" });
  });

  it("uses uncropped logos and simplified bookend treatments", () => {
    const [cover, contact] = withKalpaBookends([], "Northstar plan", null);
    const coverElements = resolveSlide(cover, "human-centered-sales", []).elements;
    const contactElements = resolveSlide(contact, "human-centered-sales", []).elements;

    expect(coverElements.find((element) => element.id === "cover-logo")).toMatchObject({ kind: "image", fit: "contain" });
    expect(coverElements.some((element) => element.id === "brand" || element.id === "brand-rule")).toBe(false);
    expect(contactElements.some((element) => element.id === "brand" || element.id === "brand-rule" || element.id === "eyebrow")).toBe(false);
    expect(contactElements.find((element) => element.id === "cta-subtext")).toMatchObject({ kind: "text", fontSize: 18, fontWeight: 800, color: "#F26E57" });
  });

  it("uses an expanded rounded card surface for three-pillar slides", () => {
    const resolved = resolveSlide({
      id: "slide_grid",
      sequence: 1,
      purpose: "Explain the operating model pillars.",
      layoutKind: "industry-grid",
      eyebrow: "Operating model",
      headline: "Three changes that create reliable execution",
      subheadline: "",
      bullets: ["Trusted data", "Clear accountability", "Repeatable execution"],
      stats: [], steps: [], leftColumnTitle: "", leftColumnPoints: [], rightColumnTitle: "", rightColumnPoints: [],
      quote: "", quoteAttribution: "", ctaText: "", ctaSubtext: "", contactLine: "", imageAssetIds: [], notes: ""
    }, "strategic-frameworks", []);

    expect(resolved.elements.find((element) => element.id === "pillar-0")).toMatchObject({ kind: "shape", h: 0.25, radius: 0.14, shadow: true, fillTransparency: 18 });
    expect(resolved.elements.find((element) => element.id === "pillar-0-glint")).toMatchObject({ kind: "shape", solidFill: "#FFFFFF" });
  });
});
