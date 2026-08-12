import path from "path";
import { familyThemes, type FamilyTheme } from "@/lib/templates/families";
import type { AssetRecord, SlideContent, TemplateFamilyId } from "@/lib/schema";
import { normalizeSlideForRender } from "@/lib/slides/normalize";

export type RenderElement =
  | { kind: "text"; id: string; x: number; y: number; w: number; h: number; text: string; fontSize: number; fontWeight?: number; fontFace?: string; color: string; align?: "left" | "center" | "right"; opacity?: number }
  | { kind: "shape"; id: string; x: number; y: number; w: number; h: number; fill: string; solidFill?: string; radius?: number; stroke?: string; strokeWidth?: number; rotate?: number }
  | { kind: "line"; id: string; x: number; y: number; w: number; h: number; color: string; strokeWidth: number }
  | { kind: "image"; id: string; x: number; y: number; w: number; h: number; src: string; assetId?: string; radius?: number };

export type ResolvedSlide = { slide: SlideContent; family: FamilyTheme; elements: RenderElement[] };

type Treatment = {
  dark: boolean;
  canvas: string;
  ink: string;
  muted: string;
  primary: string;
  coral: string;
  card: string;
  line: string;
};

const kalpa = {
  navy: "#003C51",
  deepNavy: "#002B3E",
  ink: "#092A3B",
  blue: "#137BB9",
  coral: "#F26E57",
  paper: "#FBFAF7",
  mist: "#EDF2F3",
  lightLine: "#D9E3E5"
};

function assetPath(assetId: string, assets: AssetRecord[]) {
  return assets.find((asset) => asset.id === assetId)?.path || "";
}

function fitFont(text: string, baseSize: number, minimum: number, compactAt: number) {
  if (text.length > compactAt * 1.6) return Math.max(minimum, baseSize - 5);
  if (text.length > compactAt) return Math.max(minimum, baseSize - 2);
  return baseSize;
}

function isDarkSlide(slide: SlideContent) {
  return ["hero", "challenge", "process", "cta"].includes(slide.layoutKind);
}

function treatmentFor(slide: SlideContent): Treatment {
  const dark = isDarkSlide(slide);
  return dark
    ? { dark, canvas: kalpa.navy, ink: "#FFFFFF", muted: "#BBD0D7", primary: "#FFFFFF", coral: kalpa.coral, card: "#0A4A60", line: "#397083" }
    : { dark, canvas: kalpa.paper, ink: kalpa.ink, muted: "#5F7480", primary: kalpa.blue, coral: kalpa.coral, card: "#F0F4F3", line: kalpa.lightLine };
}

function addBackground(elements: RenderElement[], treatment: Treatment) {
  elements.push({ kind: "shape", id: "canvas", x: 0, y: 0, w: 1, h: 1, fill: treatment.canvas, solidFill: treatment.canvas });
}

function addBrand(elements: RenderElement[], slide: SlideContent, family: FamilyTheme, treatment: Treatment) {
  if (treatment.dark) {
    elements.push({ kind: "text", id: "brand", x: 0.075, y: 0.075, w: 0.3, h: 0.024, text: "KALPA  |  IMPLEMENTATION", fontSize: 8, fontWeight: 800, fontFace: family.fontDisplay, color: "#FFFFFF" });
    elements.push({ kind: "line", id: "brand-rule", x: 0.075, y: 0.115, w: 0.085, h: 0.003, color: treatment.coral, strokeWidth: 2 });
  } else {
    elements.push({ kind: "image", id: "kalpa-logo", x: 0.07, y: 0.065, w: 0.045, h: 0.09, src: "/kalpa-logo.png" });
    elements.push({ kind: "text", id: "brand", x: 0.13, y: 0.082, w: 0.32, h: 0.02, text: slide.eyebrow || "KALPA IMPLEMENTATION", fontSize: 8, fontWeight: 800, fontFace: family.fontDisplay, color: treatment.coral });
  }
}

function addWireDiamond(elements: RenderElement[], id: string, x: number, y: number, size: number, treatment: Treatment, opacity = 1) {
  elements.push({ kind: "shape", id, x, y, w: size, h: size, fill: "rgba(0,0,0,0)", solidFill: treatment.dark ? kalpa.navy : kalpa.paper, stroke: treatment.line, strokeWidth: 1, rotate: 45 });
  if (opacity < 1) elements.push({ kind: "shape", id: `${id}-inner`, x: x + size * 0.2, y: y + size * 0.2, w: size * 0.6, h: size * 0.6, fill: "rgba(0,0,0,0)", solidFill: treatment.dark ? kalpa.navy : kalpa.paper, stroke: treatment.line, strokeWidth: 1, rotate: 45 });
}

function addHeader(elements: RenderElement[], slide: SlideContent, family: FamilyTheme, treatment: Treatment, options?: { width?: number; y?: number; size?: number; subtitleY?: number }) {
  const titleY = options?.y ?? 0.22;
  const width = options?.width ?? 0.64;
  if (slide.eyebrow && treatment.dark) {
    elements.push({ kind: "text", id: "eyebrow", x: 0.075, y: 0.16, w: 0.55, h: 0.025, text: slide.eyebrow.toUpperCase(), fontSize: 9, fontWeight: 800, fontFace: family.fontDisplay, color: treatment.coral });
  }
  elements.push({ kind: "text", id: "headline", x: 0.075, y: titleY, w: width, h: 0.18, text: slide.headline, fontSize: options?.size ?? 28, fontWeight: 800, fontFace: family.fontDisplay, color: treatment.ink });
  if (slide.subheadline) elements.push({ kind: "text", id: "subheadline", x: 0.078, y: options?.subtitleY ?? titleY + 0.205, w: Math.min(width, 0.52), h: 0.07, text: slide.subheadline, fontSize: 13, fontFace: family.fontBody, color: treatment.muted });
}

function addImage(elements: RenderElement[], id: string, src: string, assetId: string, x: number, y: number, w: number, h: number, treatment: Treatment) {
  elements.push({ kind: "shape", id: `${id}-edge`, x: x - 0.01, y: y - 0.01, w: w + 0.02, h: h + 0.02, fill: treatment.card, solidFill: treatment.card, stroke: treatment.coral, strokeWidth: 1 });
  elements.push({ kind: "image", id, x, y, w, h, src, assetId, radius: 0 });
}

function addEditorialList(elements: RenderElement[], items: string[], treatment: Treatment, x: number, y: number, width: number) {
  items.slice(0, 4).forEach((item, index) => {
    const rowY = y + index * 0.095;
    elements.push({ kind: "shape", id: `list-marker-${index}`, x, y: rowY + 0.013, w: 0.012, h: 0.012, fill: index === 0 ? treatment.coral : treatment.primary, solidFill: index === 0 ? treatment.coral : treatment.primary, rotate: 45 });
    elements.push({ kind: "text", id: `list-item-${index}`, x: x + 0.035, y: rowY, w: width - 0.035, h: 0.052, text: item, fontSize: fitFont(item, 13, 10, 48), fontWeight: index === 0 ? 700 : undefined, color: treatment.ink });
  });
}

export function resolveSlide(sourceSlide: SlideContent, familyId: TemplateFamilyId, assets: AssetRecord[]): ResolvedSlide {
  const slide = normalizeSlideForRender(sourceSlide);
  const family = familyThemes[familyId];
  const treatment = treatmentFor(slide);
  const imageAssetId = slide.imageAssetIds[0] || "";
  const imagePath = imageAssetId ? assetPath(imageAssetId, assets) : "";
  const elements: RenderElement[] = [];
  addBackground(elements, treatment);
  addBrand(elements, slide, family, treatment);

  if (slide.layoutKind === "hero") {
    addHeader(elements, slide, family, treatment, { width: imagePath ? 0.48 : 0.58, y: 0.24, size: 34, subtitleY: 0.48 });
    if (imagePath) addImage(elements, "hero-image", imagePath, imageAssetId, 0.63, 0.17, 0.27, 0.62, treatment);
    else {
      addWireDiamond(elements, "hero-diamond-a", 0.7, 0.27, 0.19, treatment, 0.7);
      addWireDiamond(elements, "hero-diamond-b", 0.77, 0.35, 0.12, treatment);
      elements.push({ kind: "shape", id: "hero-signal", x: 0.77, y: 0.39, w: 0.06, h: 0.06, fill: treatment.coral, solidFill: treatment.coral, rotate: 45 });
    }
    addEditorialList(elements, slide.bullets, treatment, 0.08, 0.64, imagePath ? 0.43 : 0.5);
  }

  if (slide.layoutKind === "challenge") {
    addHeader(elements, slide, family, treatment, { width: imagePath ? 0.45 : 0.58, y: 0.24, size: 31, subtitleY: 0.47 });
    if (imagePath) addImage(elements, "challenge-image", imagePath, imageAssetId, 0.64, 0.19, 0.26, 0.58, treatment);
    else {
      addWireDiamond(elements, "challenge-diamond", 0.72, 0.35, 0.18, treatment, 0.7);
      elements.push({ kind: "shape", id: "challenge-signal", x: 0.78, y: 0.41, w: 0.055, h: 0.055, fill: treatment.coral, solidFill: treatment.coral, rotate: 45 });
    }
    addEditorialList(elements, slide.bullets, treatment, 0.08, 0.59, imagePath ? 0.46 : 0.53);
  }

  if (slide.layoutKind === "industry-grid") {
    addHeader(elements, slide, family, treatment, { width: 0.62, y: 0.23, size: 29, subtitleY: 0.42 });
    const cards = slide.bullets.slice(0, 3);
    cards.forEach((item, index) => {
      const x = 0.075 + index * 0.285;
      elements.push({ kind: "shape", id: `pillar-${index}`, x, y: 0.55, w: 0.24, h: 0.22, fill: "#FFFFFF", solidFill: "#FFFFFF", stroke: treatment.line, strokeWidth: 1 });
      elements.push({ kind: "shape", id: `pillar-signal-${index}`, x: x + 0.025, y: 0.575, w: 0.026, h: 0.026, fill: index === 1 ? treatment.coral : treatment.primary, solidFill: index === 1 ? treatment.coral : treatment.primary, rotate: 45 });
      elements.push({ kind: "text", id: `pillar-number-${index}`, x: x + 0.065, y: 0.575, w: 0.13, h: 0.025, text: `0${index + 1}`, fontSize: 9, fontWeight: 800, color: treatment.muted });
      elements.push({ kind: "text", id: `pillar-copy-${index}`, x: x + 0.025, y: 0.64, w: 0.19, h: 0.08, text: item, fontSize: fitFont(item, 12, 10, 32), fontWeight: 700, color: treatment.ink });
    });
  }

  if (slide.layoutKind === "proof") {
    if (slide.stats.length) {
      const primaryStat = slide.stats[0];
      elements.push({ kind: "text", id: "proof-overline", x: 0.08, y: 0.22, w: 0.26, h: 0.025, text: slide.eyebrow || "BATTLE-TESTED EXPERTISE", fontSize: 9, fontWeight: 800, color: treatment.coral });
      elements.push({ kind: "text", id: "proof-primary-stat", x: 0.08, y: 0.3, w: 0.38, h: 0.19, text: primaryStat.value, fontSize: fitFont(primaryStat.value, 58, 34, 7), fontWeight: 800, fontFace: family.fontDisplay, color: treatment.ink });
      elements.push({ kind: "text", id: "proof-primary-label", x: 0.09, y: 0.51, w: 0.3, h: 0.06, text: primaryStat.label, fontSize: 13, fontWeight: 700, color: treatment.muted });
      elements.push({ kind: "text", id: "proof-headline-right", x: 0.54, y: 0.29, w: 0.36, h: 0.15, text: slide.headline, fontSize: 27, fontWeight: 800, fontFace: family.fontDisplay, color: treatment.ink });
      addEditorialList(elements, slide.bullets, treatment, 0.54, 0.53, 0.34);
    } else {
      addHeader(elements, slide, family, treatment, { width: imagePath ? 0.46 : 0.7, y: 0.23, size: 29, subtitleY: 0.42 });
      if (imagePath) addImage(elements, "proof-image", imagePath, imageAssetId, 0.64, 0.24, 0.26, 0.5, treatment);
      addEditorialList(elements, slide.bullets, treatment, 0.08, 0.55, imagePath ? 0.46 : 0.72);
    }
  }

  if (slide.layoutKind === "process") {
    addHeader(elements, slide, family, treatment, { width: 0.7, y: 0.23, size: 29, subtitleY: 0.42 });
    const count = Math.max(1, Math.min(5, slide.steps.length));
    const start = count === 5 ? 0.1 : 0.16;
    const gap = count === 5 ? 0.17 : 0.21;
    elements.push({ kind: "line", id: "process-line", x: start + 0.03, y: 0.65, w: gap * (count - 1), h: 0.003, color: treatment.line, strokeWidth: 2 });
    slide.steps.slice(0, 5).forEach((step, index) => {
      const x = start + index * gap;
      elements.push({ kind: "shape", id: `process-diamond-${index}`, x, y: 0.6, w: 0.06, h: 0.06, fill: index < 4 ? treatment.coral : kalpa.deepNavy, solidFill: index < 4 ? treatment.coral : kalpa.deepNavy, stroke: index === 4 ? treatment.line : undefined, strokeWidth: 1, rotate: 45 });
      elements.push({ kind: "text", id: `process-number-${index}`, x: x + 0.013, y: 0.615, w: 0.034, h: 0.018, text: String(index + 1).padStart(2, "0"), fontSize: 7, fontWeight: 800, color: "#FFFFFF", align: "center" });
      elements.push({ kind: "text", id: `process-title-${index}`, x: x - 0.045, y: 0.72, w: 0.15, h: 0.04, text: step, fontSize: fitFont(step, 10, 8, 19), fontWeight: 700, color: treatment.ink, align: "center" });
    });
  }

  if (slide.layoutKind === "comparison") {
    addHeader(elements, slide, family, treatment, { width: 0.66, y: 0.23, size: 29, subtitleY: 0.42 });
    [[0.075, slide.leftColumnTitle, slide.leftColumnPoints, "today", "#FFFFFF"], [0.52, slide.rightColumnTitle, slide.rightColumnPoints, "future", treatment.card]].forEach(([rawX, heading, points, id, fill]) => {
      const x = rawX as number;
      const list = points as string[];
      elements.push({ kind: "shape", id: `${id}-panel`, x, y: 0.55, w: 0.35, h: 0.27, fill: fill as string, solidFill: fill as string, stroke: treatment.line, strokeWidth: 1 });
      elements.push({ kind: "line", id: `${id}-rule`, x: x + 0.025, y: 0.59, w: 0.07, h: 0.003, color: id === "future" ? treatment.coral : treatment.primary, strokeWidth: 3 });
      elements.push({ kind: "text", id: `${id}-heading`, x: x + 0.025, y: 0.625, w: 0.28, h: 0.035, text: heading as string, fontSize: 15, fontWeight: 800, color: treatment.ink });
      list.slice(0, 4).forEach((item, index) => elements.push({ kind: "text", id: `${id}-point-${index}`, x: x + 0.025, y: 0.69 + index * 0.045, w: 0.29, h: 0.035, text: `• ${item}`, fontSize: fitFont(item, 10, 8, 32), color: treatment.ink }));
    });
  }

  if (slide.layoutKind === "quote") {
    elements.push({ kind: "text", id: "quote-mark", x: 0.085, y: 0.2, w: 0.08, h: 0.08, text: "“", fontSize: 50, fontWeight: 800, fontFace: family.fontDisplay, color: treatment.coral });
    elements.push({ kind: "text", id: "quote", x: 0.16, y: 0.29, w: 0.68, h: 0.2, text: `“${slide.quote || slide.headline}”`, fontSize: 31, fontWeight: 800, fontFace: family.fontDisplay, color: treatment.ink, align: "center" });
    if (slide.quoteAttribution) elements.push({ kind: "text", id: "quote-attribution", x: 0.3, y: 0.58, w: 0.4, h: 0.03, text: slide.quoteAttribution, fontSize: 11, fontWeight: 800, color: treatment.primary, align: "center" });
    addWireDiamond(elements, "quote-diamond", 0.77, 0.66, 0.08, treatment);
  }

  if (slide.layoutKind === "cta") {
    elements.push({ kind: "shape", id: "cta-gradient-block", x: 0.76, y: -0.15, w: 0.38, h: 1.3, fill: treatment.coral, solidFill: treatment.coral, rotate: 18 });
    addHeader(elements, slide, family, treatment, { width: imagePath ? 0.48 : 0.62, y: 0.29, size: 36, subtitleY: 0.52 });
    if (imagePath) addImage(elements, "cta-image", imagePath, imageAssetId, 0.67, 0.29, 0.2, 0.36, treatment);
    elements.push({ kind: "line", id: "cta-rule", x: 0.08, y: 0.64, w: 0.18, h: 0.004, color: treatment.coral, strokeWidth: 3 });
    elements.push({ kind: "text", id: "cta-action", x: 0.08, y: 0.69, w: 0.45, h: 0.045, text: slide.ctaText || "Schedule your implementation planning call.", fontSize: 15, fontWeight: 800, color: treatment.ink });
    if (slide.ctaSubtext || slide.contactLine) elements.push({ kind: "text", id: "cta-subtext", x: 0.08, y: 0.77, w: 0.46, h: 0.035, text: slide.ctaSubtext || slide.contactLine, fontSize: 11, color: treatment.muted });
  }

  return { slide, family, elements };
}

export function slidePreviewImagePath(assetId: string, assets: AssetRecord[]) {
  const asset = assets.find((item) => item.id === assetId);
  return asset ? `/api/v1/assets/${assetId}/file/${path.basename(asset.path)}` : "";
}
