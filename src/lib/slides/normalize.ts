import path from "path";
import type { AssetRecord, SlideContent } from "@/lib/schema";
import { clipText } from "@/lib/utils";

const imageExtensions = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"]);

function cleanLine(value: string) {
  return value.replace(/\s+/g, " ").replace(/^[•\-\s]+/, "").trim();
}

function cleanList(values: string[], maxItems: number, maxLength: number) {
  return values
    .map((value) => cleanLine(value))
    .filter(Boolean)
    .slice(0, maxItems)
    .map((value) => clipText(value, maxLength));
}

function splitForComparison(values: string[]) {
  const midpoint = Math.ceil(values.length / 2);
  return {
    left: values.slice(0, midpoint),
    right: values.slice(midpoint)
  };
}

function normalizeComparison(slide: SlideContent) {
  const normalizedBullets = cleanList(slide.bullets, 6, 66);
  let leftColumnPoints = cleanList(slide.leftColumnPoints, 4, 58);
  let rightColumnPoints = cleanList(slide.rightColumnPoints, 4, 58);

  if (!leftColumnPoints.length && !rightColumnPoints.length && normalizedBullets.length) {
    const split = splitForComparison(normalizedBullets);
    leftColumnPoints = split.left;
    rightColumnPoints = split.right;
  }

  return {
    ...slide,
    leftColumnTitle: clipText(cleanLine(slide.leftColumnTitle || "Today"), 28),
    rightColumnTitle: clipText(cleanLine(slide.rightColumnTitle || "What good looks like"), 28),
    leftColumnPoints,
    rightColumnPoints
  };
}

export function normalizeSlideForRender(slide: SlideContent): SlideContent {
  const normalized: SlideContent = {
    ...slide,
    eyebrow: clipText(cleanLine(slide.eyebrow), 48),
    headline: clipText(cleanLine(slide.headline), slide.layoutKind === "hero" ? 78 : 72),
    subheadline: clipText(cleanLine(slide.subheadline), slide.layoutKind === "hero" ? 150 : 130),
    bullets: cleanList(slide.bullets, 6, 76),
    stats: slide.stats
      .slice(0, 3)
      .map((item) => ({
        value: clipText(cleanLine(item.value), 14),
        label: clipText(cleanLine(item.label), 34)
      })),
    steps: cleanList(slide.steps, 4, 36),
    leftColumnTitle: clipText(cleanLine(slide.leftColumnTitle), 28),
    leftColumnPoints: cleanList(slide.leftColumnPoints, 4, 58),
    rightColumnTitle: clipText(cleanLine(slide.rightColumnTitle), 28),
    rightColumnPoints: cleanList(slide.rightColumnPoints, 4, 58),
    quote: clipText(cleanLine(slide.quote), 220),
    quoteAttribution: clipText(cleanLine(slide.quoteAttribution), 64),
    ctaText: clipText(cleanLine(slide.ctaText), 50),
    ctaSubtext: clipText(cleanLine(slide.ctaSubtext), 90),
    contactLine: clipText(cleanLine(slide.contactLine), 72),
    imageAssetIds: slide.imageAssetIds.slice(0, 1),
    notes: clipText(cleanLine(slide.notes), 400)
  };

  if (normalized.layoutKind === "hero") {
    const heroBullets = cleanList(normalized.bullets, 3, 58);
    return {
      ...normalized,
      subheadline: normalized.subheadline || clipText(heroBullets[0] || normalized.purpose, 150),
      bullets: heroBullets
    };
  }

  if (normalized.layoutKind === "challenge") {
    const bullets = cleanList(normalized.bullets.length ? normalized.bullets : normalized.steps, 3, 52);
    return {
      ...normalized,
      bullets,
      subheadline: normalized.subheadline || clipText(cleanLine(normalized.purpose), 110)
    };
  }

  if (normalized.layoutKind === "industry-grid") {
    const bullets = cleanList(normalized.bullets.length ? normalized.bullets : normalized.steps, 3, 42);
    return {
      ...normalized,
      bullets,
      subheadline: normalized.subheadline || clipText(cleanLine(normalized.purpose), 96)
    };
  }

  if (normalized.layoutKind === "proof") {
    return {
      ...normalized,
      bullets: cleanList(normalized.bullets, 3, 48),
      stats: normalized.stats.slice(0, 3)
    };
  }

  if (normalized.layoutKind === "process") {
    const steps = cleanList(normalized.steps.length ? normalized.steps : normalized.bullets, 4, 34);
    return {
      ...normalized,
      steps,
      bullets: cleanList(normalized.bullets, 4, 42)
    };
  }

  if (normalized.layoutKind === "comparison") {
    return normalizeComparison(normalized);
  }

  if (normalized.layoutKind === "quote") {
    return {
      ...normalized,
      quote: normalized.quote || clipText(cleanLine(normalized.headline), 220),
      subheadline: clipText(cleanLine(normalized.subheadline || normalized.purpose), 90)
    };
  }

  if (normalized.layoutKind === "cta") {
    return {
      ...normalized,
      headline: clipText(cleanLine(normalized.headline), 64),
      ctaText: normalized.ctaText || "Book the discovery workshop",
      ctaSubtext: normalized.ctaSubtext || clipText(cleanLine(normalized.contactLine || normalized.purpose), 90)
    };
  }

  return normalized;
}

export function normalizeSlidesForRender(slides: SlideContent[]) {
  return slides.map((slide) => normalizeSlideForRender(slide));
}

export function isImageAsset(asset: Pick<AssetRecord, "mimeType" | "name" | "path">) {
  if (asset.mimeType.startsWith("image/")) return true;
  const extension = path.extname(asset.name || asset.path || "").toLowerCase();
  return imageExtensions.has(extension);
}

function imagePriority(slide: SlideContent) {
  switch (slide.layoutKind) {
    case "hero":
      return 0;
    case "proof":
      return 1;
    case "challenge":
    case "industry-grid":
      return 2;
    case "cta":
      return 3;
    default:
      return 10;
  }
}

export function finalizeSlidesForRender(slides: SlideContent[], assets: AssetRecord[]) {
  const imageAssets = assets.filter((asset) => isImageAsset(asset));
  const validImageIds = new Set(imageAssets.map((asset) => asset.id));

  const normalizedSlides = slides.map((slide) => {
    const normalized = normalizeSlideForRender(slide);
    return {
      ...normalized,
      imageAssetIds: normalized.imageAssetIds.filter((assetId) => validImageIds.has(assetId)).slice(0, 1)
    };
  });

  if (!imageAssets.length) {
    return normalizedSlides;
  }

  const candidateIndexes = normalizedSlides
    .map((slide, index) => ({ slide, index }))
    .filter(({ slide }) => imagePriority(slide) < 10 && !slide.imageAssetIds.length)
    .sort((left, right) => imagePriority(left.slide) - imagePriority(right.slide) || left.index - right.index);

  candidateIndexes.forEach(({ index }, candidateIndex) => {
    const imageAsset = imageAssets[candidateIndex];
    if (!imageAsset) return;
    normalizedSlides[index] = {
      ...normalizedSlides[index],
      // Each generated or uploaded visual is used once by default. Repetition makes a
      // generated deck feel templated; deliberate reuse can still be set per slide.
      imageAssetIds: [imageAsset.id]
    };
  });

  return normalizedSlides;
}
