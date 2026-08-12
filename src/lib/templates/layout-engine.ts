import path from "path";
import { familyThemes, type FamilyTheme } from "@/lib/templates/families";
import type { AssetRecord, SlideContent, TemplateFamilyId } from "@/lib/schema";
import { normalizeSlideForRender } from "@/lib/slides/normalize";

export type RenderElement =
  | { kind: "text"; id: string; x: number; y: number; w: number; h: number; text: string; fontSize: number; fontWeight?: number; fontFace?: string; color: string; align?: "left" | "center" | "right"; opacity?: number }
  | { kind: "shape"; id: string; x: number; y: number; w: number; h: number; fill: string; solidFill?: string; radius?: number; stroke?: string; strokeWidth?: number }
  | { kind: "line"; id: string; x: number; y: number; w: number; h: number; color: string; strokeWidth: number }
  | { kind: "image"; id: string; x: number; y: number; w: number; h: number; src: string; assetId?: string; radius?: number };

export type ResolvedSlide = { slide: SlideContent; family: FamilyTheme; elements: RenderElement[] };

function assetPath(assetId: string, assets: AssetRecord[]) {
  return assets.find((asset) => asset.id === assetId)?.path || "";
}

function fitFont(text: string, baseSize: number, minimum: number, compactAt: number) {
  if (text.length > compactAt * 1.6) return Math.max(minimum, baseSize - 4);
  if (text.length > compactAt) return Math.max(minimum, baseSize - 2);
  return baseSize;
}

function bullet(text: string) {
  return `• ${text}`;
}

function baseFrame(family: FamilyTheme): RenderElement[] {
  return [
    { kind: "shape", id: "canvas", x: 0, y: 0, w: 1, h: 1, fill: family.canvas, solidFill: family.canvasSolid },
    { kind: "shape", id: "surface", x: 0.032, y: 0.04, w: 0.936, h: 0.92, fill: family.panel, solidFill: family.panelSolid, radius: 28, stroke: family.frame, strokeWidth: 1 },
    { kind: "line", id: "brand-rule", x: 0.078, y: 0.132, w: 0.118, h: 0.004, color: family.accent, strokeWidth: 3 },
    { kind: "image", id: "kalpa-logo", x: 0.873, y: 0.082, w: 0.052, h: 0.102, src: "/kalpa-logo.png" }
  ];
}

function addHeader(elements: RenderElement[], slide: SlideContent, family: FamilyTheme, options?: { width?: number; y?: number; size?: number; subtitleY?: number }) {
  const titleY = options?.y ?? 0.19;
  const width = options?.width ?? 0.68;
  if (slide.eyebrow) {
    elements.push({ kind: "text", id: "eyebrow", x: 0.09, y: 0.145, w: 0.62, h: 0.035, text: slide.eyebrow, fontSize: 12, fontWeight: 700, fontFace: family.fontDisplay, color: family.accent });
  }
  elements.push({ kind: "text", id: "headline", x: 0.09, y: titleY, w: width, h: 0.16, text: slide.headline, fontSize: options?.size ?? 25, fontWeight: 800, fontFace: family.fontDisplay, color: family.ink });
  if (slide.subheadline) {
    elements.push({ kind: "text", id: "subheadline", x: 0.09, y: options?.subtitleY ?? titleY + 0.19, w: Math.min(width, 0.58), h: 0.075, text: slide.subheadline, fontSize: 13, fontFace: family.fontBody, color: family.muted });
  }
}

function addImage(elements: RenderElement[], id: string, src: string, assetId: string, x: number, y: number, w: number, h: number, family: FamilyTheme) {
  elements.push({ kind: "shape", id: `${id}-backdrop`, x: x - 0.015, y: y - 0.015, w: w + 0.03, h: h + 0.03, fill: family.accentSoft, solidFill: family.cardSolid, radius: 24, stroke: family.frame, strokeWidth: 1 });
  elements.push({ kind: "image", id, x, y, w, h, src, assetId, radius: 20 });
}

export function resolveSlide(sourceSlide: SlideContent, familyId: TemplateFamilyId, assets: AssetRecord[]): ResolvedSlide {
  const slide = normalizeSlideForRender(sourceSlide);
  const family = familyThemes[familyId];
  const imageAssetId = slide.imageAssetIds[0] || "";
  const imagePath = imageAssetId ? assetPath(imageAssetId, assets) : "";
  const elements: RenderElement[] = baseFrame(family);

  if (slide.layoutKind === "hero") {
    addHeader(elements, slide, family, { width: imagePath ? 0.43 : 0.49, y: 0.205, size: 30, subtitleY: 0.46 });
    if (imagePath) {
      addImage(elements, "hero-image", imagePath, imageAssetId, 0.59, 0.17, 0.3, 0.62, family);
      elements.push({ kind: "shape", id: "hero-image-label", x: 0.615, y: 0.73, w: 0.22, h: 0.055, fill: family.accent, solidFill: family.accent, radius: 12 });
      elements.push({ kind: "text", id: "hero-image-label-copy", x: 0.63, y: 0.748, w: 0.19, h: 0.02, text: slide.bullets[0] || "A clearer operating picture", fontSize: 9, fontWeight: 700, color: "#FFFFFF", align: "center" });
    } else {
      elements.push({ kind: "shape", id: "hero-field", x: 0.62, y: 0.17, w: 0.27, h: 0.62, fill: family.accent, solidFill: family.accent, radius: 24 });
      elements.push({ kind: "shape", id: "hero-field-signal", x: 0.76, y: 0.24, w: 0.09, h: 0.09, fill: family.signal, solidFill: family.signal, radius: 18 });
      elements.push({ kind: "text", id: "hero-field-number", x: 0.66, y: 0.39, w: 0.18, h: 0.14, text: String(slide.sequence).padStart(2, "0"), fontSize: 50, fontWeight: 800, fontFace: family.fontDisplay, color: "#FFFFFF", align: "center" });
      elements.push({ kind: "text", id: "hero-field-copy", x: 0.665, y: 0.575, w: 0.18, h: 0.1, text: "A decisive path from complexity to confidence.", fontSize: 12, fontWeight: 700, color: "#FFFFFF", align: "center" });
    }
    slide.bullets.slice(0, 3).forEach((item, index) => {
      elements.push({ kind: "line", id: `hero-bullet-rule-${index}`, x: 0.09, y: 0.605 + index * 0.085, w: 0.018, h: 0.003, color: family.signal, strokeWidth: 3 });
      elements.push({ kind: "text", id: `hero-bullet-${index}`, x: 0.12, y: 0.588 + index * 0.085, w: imagePath ? 0.4 : 0.43, h: 0.052, text: item, fontSize: fitFont(item, 12, 10, 56), color: family.ink });
    });
  }

  if (slide.layoutKind === "challenge" || slide.layoutKind === "industry-grid") {
    addHeader(elements, slide, family, { width: 0.72, y: 0.19, size: 25, subtitleY: 0.37 });
    if (imagePath) {
      const copyX = slide.sequence % 2 ? 0.5 : 0.09;
      const visualX = slide.sequence % 2 ? 0.1 : 0.61;
      addImage(elements, "challenge-image", imagePath, imageAssetId, visualX, 0.28, 0.29, 0.5, family);
      slide.bullets.slice(0, 3).forEach((item, index) => {
        const y = 0.42 + index * 0.115;
        elements.push({ kind: "line", id: `challenge-bullet-rule-${index}`, x: copyX, y: y + 0.018, w: 0.025, h: 0.003, color: index === 0 ? family.signal : family.accent, strokeWidth: 4 });
        elements.push({ kind: "text", id: `challenge-bullet-${index}`, x: copyX + 0.04, y, w: 0.32, h: 0.07, text: item, fontSize: fitFont(item, 13, 10, 43), fontWeight: index === 0 ? 700 : undefined, color: family.ink });
      });
    } else {
      slide.bullets.slice(0, 4).forEach((item, index) => {
        const col = index % 2;
        const row = Math.floor(index / 2);
        const x = 0.09 + col * 0.405;
        const y = 0.48 + row * 0.155;
        elements.push({ kind: "shape", id: `challenge-card-${index}`, x, y, w: 0.35, h: 0.12, fill: index === 0 ? family.accentSoft : family.card, solidFill: index === 0 ? family.panelSolid : family.cardSolid, radius: 18, stroke: family.frame, strokeWidth: 1 });
        elements.push({ kind: "text", id: `challenge-number-${index}`, x: x + 0.025, y: y + 0.024, w: 0.04, h: 0.03, text: `0${index + 1}`, fontSize: 10, fontWeight: 800, color: family.accent });
        elements.push({ kind: "text", id: `challenge-copy-${index}`, x: x + 0.085, y: y + 0.025, w: 0.23, h: 0.07, text: item, fontSize: fitFont(item, 12, 10, 42), fontWeight: 600, color: family.ink });
      });
    }
  }

  if (slide.layoutKind === "proof") {
    addHeader(elements, slide, family, { width: imagePath ? 0.43 : 0.72, y: 0.19, size: 25, subtitleY: 0.37 });
    if (slide.stats.length) {
      slide.stats.slice(0, 3).forEach((stat, index) => {
        const x = 0.1 + index * 0.27;
        elements.push({ kind: "shape", id: `stat-field-${index}`, x, y: 0.51, w: 0.225, h: 0.2, fill: index === 1 ? family.accent : family.card, solidFill: index === 1 ? family.accent : family.cardSolid, radius: 22, stroke: index === 1 ? family.accent : family.frame, strokeWidth: 1 });
        elements.push({ kind: "text", id: `stat-value-${index}`, x: x + 0.025, y: 0.55, w: 0.175, h: 0.07, text: stat.value, fontSize: fitFont(stat.value, 29, 18, 8), fontWeight: 800, fontFace: family.fontDisplay, color: index === 1 ? "#FFFFFF" : family.accent, align: "center" });
        elements.push({ kind: "text", id: `stat-label-${index}`, x: x + 0.025, y: 0.64, w: 0.175, h: 0.04, text: stat.label, fontSize: fitFont(stat.label, 11, 9, 22), fontWeight: 700, color: index === 1 ? "#FFFFFF" : family.ink, align: "center" });
      });
    } else if (imagePath) {
      addImage(elements, "proof-image", imagePath, imageAssetId, 0.6, 0.24, 0.28, 0.5, family);
      slide.bullets.slice(0, 3).forEach((item, index) => elements.push({ kind: "text", id: `proof-bullet-${index}`, x: 0.1, y: 0.5 + index * 0.09, w: 0.4, h: 0.055, text: bullet(item), fontSize: fitFont(item, 13, 10, 48), color: family.ink }));
    } else {
      slide.bullets.slice(0, 3).forEach((item, index) => {
        const y = 0.5 + index * 0.1;
        elements.push({ kind: "shape", id: `proof-band-${index}`, x: 0.1, y, w: 0.7, h: 0.075, fill: index === 0 ? family.accentSoft : family.card, solidFill: index === 0 ? family.panelSolid : family.cardSolid, radius: 14, stroke: family.frame, strokeWidth: 1 });
        elements.push({ kind: "text", id: `proof-copy-${index}`, x: 0.13, y: y + 0.023, w: 0.62, h: 0.03, text: item, fontSize: fitFont(item, 13, 10, 62), fontWeight: index === 0 ? 700 : undefined, color: family.ink });
      });
    }
  }

  if (slide.layoutKind === "process") {
    addHeader(elements, slide, family, { width: 0.72, y: 0.19, size: 25, subtitleY: 0.37 });
    const count = Math.max(1, Math.min(4, slide.steps.length));
    const start = count === 4 ? 0.09 : 0.17;
    const gap = count === 4 ? 0.205 : 0.26;
    elements.push({ kind: "line", id: "process-line", x: start + 0.045, y: 0.61, w: gap * (count - 1), h: 0.004, color: family.frame, strokeWidth: 4 });
    slide.steps.slice(0, 4).forEach((step, index) => {
      const x = start + index * gap;
      elements.push({ kind: "shape", id: `step-node-${index}`, x, y: 0.555, w: 0.09, h: 0.11, fill: index === 0 ? family.accent : family.panel, solidFill: index === 0 ? family.accent : family.panelSolid, radius: 20, stroke: family.frame, strokeWidth: 1 });
      elements.push({ kind: "text", id: `step-number-${index}`, x: x + 0.02, y: 0.585, w: 0.05, h: 0.035, text: String(index + 1).padStart(2, "0"), fontSize: 13, fontWeight: 800, color: index === 0 ? "#FFFFFF" : family.accent, align: "center" });
      elements.push({ kind: "text", id: `step-title-${index}`, x: x - 0.025, y: 0.705, w: 0.14, h: 0.05, text: step, fontSize: fitFont(step, 12, 9, 19), fontWeight: 700, color: family.ink, align: "center" });
      const detail = slide.bullets[index];
      if (detail) elements.push({ kind: "text", id: `step-detail-${index}`, x: x - 0.025, y: 0.77, w: 0.14, h: 0.055, text: detail, fontSize: fitFont(detail, 9, 8, 24), color: family.muted, align: "center" });
    });
  }

  if (slide.layoutKind === "comparison") {
    addHeader(elements, slide, family, { width: 0.72, y: 0.19, size: 25, subtitleY: 0.37 });
    const rows = Math.max(3, Math.min(4, Math.max(slide.leftColumnPoints.length, slide.rightColumnPoints.length)));
    const h = rows === 4 ? 0.35 : 0.3;
    const gap = rows === 4 ? 0.061 : 0.072;
    [[0.09, family.card, family.cardSolid, slide.leftColumnTitle, slide.leftColumnPoints, "left"], [0.51, family.accentSoft, family.panelSolid, slide.rightColumnTitle, slide.rightColumnPoints, "right"]].forEach(([rawX, fill, solidFill, title, points, side]) => {
      const x = rawX as number;
      const list = points as string[];
      elements.push({ kind: "shape", id: `${side}-column`, x, y: 0.49, w: 0.34, h, fill: fill as string, solidFill: solidFill as string, radius: 20, stroke: family.frame, strokeWidth: 1 });
      elements.push({ kind: "text", id: `${side}-title`, x: x + 0.03, y: 0.53, w: 0.27, h: 0.04, text: title as string, fontSize: 14, fontWeight: 800, color: family.ink });
      list.slice(0, 4).forEach((item, index) => elements.push({ kind: "text", id: `${side}-point-${index}`, x: x + 0.03, y: 0.6 + index * gap, w: 0.27, h: 0.05, text: bullet(item), fontSize: fitFont(item, 11, 9, 34), color: family.ink }));
    });
  }

  if (slide.layoutKind === "quote") {
    elements.push({ kind: "shape", id: "quote-field", x: 0.14, y: 0.23, w: 0.72, h: 0.44, fill: family.accentSoft, solidFill: family.panelSolid, radius: 26, stroke: family.frame, strokeWidth: 1 });
    elements.push({ kind: "text", id: "quote-mark", x: 0.19, y: 0.27, w: 0.08, h: 0.08, text: "“", fontSize: 44, fontWeight: 800, fontFace: family.fontDisplay, color: family.signal });
    elements.push({ kind: "text", id: "quote", x: 0.23, y: 0.35, w: 0.54, h: 0.16, text: `“${slide.quote || slide.headline}”`, fontSize: 24, fontWeight: 700, fontFace: family.fontDisplay, color: family.ink, align: "center" });
    if (slide.quoteAttribution) elements.push({ kind: "text", id: "quote-attribution", x: 0.28, y: 0.56, w: 0.44, h: 0.035, text: slide.quoteAttribution, fontSize: 11, fontWeight: 700, color: family.accent, align: "center" });
  }

  if (slide.layoutKind === "cta") {
    elements.push({ kind: "shape", id: "cta-field", x: 0.09, y: 0.19, w: 0.76, h: 0.61, fill: family.accent, solidFill: family.accent, radius: 28 });
    elements.push({ kind: "shape", id: "cta-signal", x: 0.72, y: 0.25, w: 0.09, h: 0.09, fill: family.signal, solidFill: family.signal, radius: 20 });
    if (imagePath) addImage(elements, "cta-image", imagePath, imageAssetId, 0.57, 0.33, 0.22, 0.35, family);
    elements.push({ kind: "text", id: "cta-headline", x: 0.15, y: 0.31, w: imagePath ? 0.36 : 0.58, h: 0.15, text: slide.headline, fontSize: 28, fontWeight: 800, fontFace: family.fontDisplay, color: "#FFFFFF" });
    elements.push({ kind: "shape", id: "cta-action", x: 0.15, y: 0.57, w: 0.3, h: 0.095, fill: "#FFFFFF", solidFill: "#FFFFFF", radius: 18 });
    elements.push({ kind: "text", id: "cta-action-copy", x: 0.18, y: 0.603, w: 0.24, h: 0.03, text: slide.ctaText || "Book the discovery workshop", fontSize: 12, fontWeight: 800, color: family.accent, align: "center" });
    if (slide.ctaSubtext || slide.contactLine) elements.push({ kind: "text", id: "cta-subtext", x: 0.15, y: 0.7, w: 0.5, h: 0.04, text: slide.ctaSubtext || slide.contactLine, fontSize: 11, color: "#FFFFFF" });
  }

  return { slide, family, elements };
}

export function slidePreviewImagePath(assetId: string, assets: AssetRecord[]) {
  const asset = assets.find((item) => item.id === assetId);
  return asset ? `/api/v1/assets/${assetId}/file/${path.basename(asset.path)}` : "";
}
