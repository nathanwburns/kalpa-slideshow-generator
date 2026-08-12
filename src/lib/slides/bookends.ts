import type { BriefInput, SlideContent } from "@/lib/schema";
import { clipText } from "@/lib/utils";

const coverId = "kalpa-cover";
const closingId = "kalpa-contact";

function coverLabel(brief: BriefInput | null) {
  switch (brief?.type) {
    case "sales":
      return "KALPA SALES CONVERSATION";
    case "strategy":
      return "KALPA STRATEGY DECK";
    case "project":
      return "KALPA PROJECT PLAN";
    case "proposal":
      return "KALPA PROPOSAL";
    default:
      return "KALPA EXECUTIVE ASSESSMENT";
  }
}

function coverSlide(projectTitle: string, brief: BriefInput | null): SlideContent {
  return {
    id: coverId,
    sequence: 1,
    purpose: "Kalpa welcome cover",
    layoutKind: "hero",
    eyebrow: coverLabel(brief),
    headline: clipText(projectTitle || "Implementation point of view", 72),
    subheadline: brief?.audience
      ? clipText(`Prepared by Kalpa for ${brief.audience}.`, 120)
      : brief?.outcome
        ? clipText(brief.outcome, 120)
        : "Prepared by Kalpa.",
    bullets: [], stats: [], steps: [], leftColumnTitle: "", leftColumnPoints: [], rightColumnTitle: "", rightColumnPoints: [],
    quote: "", quoteAttribution: "", ctaText: "", ctaSubtext: "", contactLine: "", imageAssetIds: [],
    notes: "System-generated Kalpa title slide."
  };
}

function closingSlide(): SlideContent {
  return {
    id: closingId,
    sequence: 0,
    purpose: "Kalpa contact closing slide",
    layoutKind: "cta",
    eyebrow: "",
    headline: "Thank you",
    subheadline: "Build a more reliable path forward.",
    bullets: [], stats: [], steps: [], leftColumnTitle: "", leftColumnPoints: [], rightColumnTitle: "", rightColumnPoints: [],
    quote: "", quoteAttribution: "", ctaText: "Get in contact with us", ctaSubtext: "sales@kalpainc.com", contactLine: "sales@kalpainc.com", imageAssetIds: [],
    notes: "System-generated Kalpa contact slide."
  };
}

export function withKalpaBookends(slides: SlideContent[], projectTitle: string, brief: BriefInput | null) {
  const coreSlides = slides
    .filter((slide) => slide.id !== coverId && slide.id !== closingId)
    .map((slide, index) => ({ ...slide, sequence: index + 2 }));
  const closing = closingSlide();
  closing.sequence = coreSlides.length + 2;
  return [coverSlide(projectTitle, brief), ...coreSlides, closing];
}
