import type { BriefInput, SlideContent } from "@/lib/schema";
import { clipText } from "@/lib/utils";

const coverId = "kalpa-cover";
const closingId = "kalpa-contact";

function coverSlide(projectTitle: string, brief: BriefInput | null): SlideContent {
  return {
    id: coverId,
    sequence: 1,
    purpose: "Kalpa welcome cover",
    layoutKind: "hero",
    eyebrow: "KALPA INC. | IMPLEMENTATION",
    headline: clipText(projectTitle || "Implementation point of view", 72),
    subheadline: brief?.outcome ? clipText(brief.outcome, 120) : "A tailored implementation point of view.",
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
    eyebrow: "KALPA INC. | IMPLEMENTATION",
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
