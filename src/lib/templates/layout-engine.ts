import path from "path";
import { familyThemes, type FamilyTheme } from "@/lib/templates/families";
import type { AssetRecord, SlideContent, TemplateFamilyId } from "@/lib/schema";
import { absoluteDataPath } from "@/lib/data/storage";

export type RenderElement =
  | {
      kind: "text";
      id: string;
      x: number;
      y: number;
      w: number;
      h: number;
      text: string;
      fontSize: number;
      fontWeight?: number;
      fontFace?: string;
      color: string;
      align?: "left" | "center" | "right";
      opacity?: number;
    }
  | {
      kind: "shape";
      id: string;
      x: number;
      y: number;
      w: number;
      h: number;
      fill: string;
      solidFill?: string;
      radius?: number;
      stroke?: string;
      strokeWidth?: number;
    }
  | {
      kind: "line";
      id: string;
      x: number;
      y: number;
      w: number;
      h: number;
      color: string;
      strokeWidth: number;
    }
  | {
      kind: "image";
      id: string;
      x: number;
      y: number;
      w: number;
      h: number;
      src: string;
      assetId?: string;
      radius?: number;
    };

export type ResolvedSlide = {
  slide: SlideContent;
  family: FamilyTheme;
  elements: RenderElement[];
};

function assetPath(assetId: string, assets: AssetRecord[]) {
  const match = assets.find((asset) => asset.id === assetId);
  return match ? match.path : "";
}

function baseFrame(family: FamilyTheme): RenderElement[] {
  return [
    { kind: "shape", id: "bg", x: 0, y: 0, w: 1, h: 1, fill: family.canvas, solidFill: family.canvasSolid },
    { kind: "shape", id: "panel", x: 0.045, y: 0.055, w: 0.91, h: 0.89, fill: family.panel, solidFill: family.panelSolid, radius: 24, stroke: family.frame, strokeWidth: 1 },
    { kind: "shape", id: "frame-top", x: 0.074, y: 0.1, w: 0.23, h: 0.018, fill: family.edge, solidFill: family.panelSolid },
    { kind: "shape", id: "frame-right", x: 0.905, y: 0.12, w: 0.018, h: 0.18, fill: family.edge, solidFill: family.panelSolid },
    { kind: "line", id: "bar", x: 0.072, y: 0.14, w: 0.008, h: 0.68, color: family.accent, strokeWidth: 0 },
    { kind: "shape", id: "signal-diamond", x: 0.835, y: 0.116, w: 0.04, h: 0.07, fill: family.signal, solidFill: family.signal, radius: 8 }
  ];
}

export function resolveSlide(slide: SlideContent, familyId: TemplateFamilyId, assets: AssetRecord[]): ResolvedSlide {
  const family = familyThemes[familyId];
  const imagePath = slide.imageAssetIds[0] ? assetPath(slide.imageAssetIds[0], assets) : "";
  const elements: RenderElement[] = [...baseFrame(family)];

  const addHeadline = () => {
    if (slide.eyebrow) {
      elements.push({
        kind: "text",
        id: "eyebrow",
        x: 0.11,
        y: 0.12,
        w: 0.48,
        h: 0.05,
        text: slide.eyebrow,
        fontSize: 14,
        fontWeight: 700,
        fontFace: family.fontDisplay,
        color: family.accent
      });
    }
    elements.push({
      kind: "text",
      id: "headline",
      x: 0.11,
      y: 0.18,
      w: slide.layoutKind === "hero" ? 0.42 : 0.74,
      h: 0.18,
      text: slide.headline,
      fontSize: slide.layoutKind === "hero" ? 28 : 23,
      fontWeight: 800,
      fontFace: family.fontDisplay,
      color: family.ink
    });
    if (slide.subheadline) {
      elements.push({
        kind: "text",
        id: "subheadline",
        x: 0.11,
        y: 0.35,
        w: slide.layoutKind === "hero" ? 0.4 : 0.7,
        h: 0.12,
        text: slide.subheadline,
        fontSize: 13,
        fontFace: family.fontBody,
        color: family.muted
      });
    }
  };

  if (slide.layoutKind === "hero") {
    addHeadline();
    if (imagePath) {
      elements.push({
        kind: "image",
        id: "hero-image",
        x: 0.6,
        y: 0.16,
        w: 0.27,
        h: 0.48,
        src: imagePath,
        assetId: slide.imageAssetIds[0],
        radius: 18
      });
    } else {
      elements.push({ kind: "shape", id: "hero-art", x: 0.6, y: 0.16, w: 0.27, h: 0.48, fill: family.accentSoft, solidFill: family.cardSolid, stroke: family.frame, strokeWidth: 1, radius: 18 });
      elements.push({ kind: "shape", id: "hero-art-tab", x: 0.805, y: 0.2, w: 0.05, h: 0.018, fill: family.signal, solidFill: family.signal, radius: 3 });
    }
    slide.bullets.slice(0, 3).forEach((bullet, index) => {
      elements.push({
        kind: "text",
        id: `bullet-${index}`,
        x: 0.11,
        y: 0.52 + index * 0.07,
        w: 0.41,
        h: 0.05,
        text: `• ${bullet}`,
        fontSize: 12,
        color: family.ink
      });
    });
  }

  if (slide.layoutKind === "challenge" || slide.layoutKind === "industry-grid") {
    addHeadline();
    const items = slide.bullets.slice(0, 4);
    items.forEach((item, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      elements.push({
        kind: "shape",
        id: `card-${index}`,
        x: 0.11 + col * 0.35,
        y: 0.5 + row * 0.16,
        w: 0.29,
        h: 0.115,
        fill: family.card,
        solidFill: family.cardSolid,
        radius: 18,
        stroke: family.frame,
        strokeWidth: 1
      });
      elements.push({
        kind: "text",
        id: `card-text-${index}`,
        x: 0.13 + col * 0.35,
        y: 0.54 + row * 0.16,
        w: 0.24,
        h: 0.05,
        text: item,
        fontSize: 12,
        color: family.ink
      });
    });
  }

  if (slide.layoutKind === "proof") {
    addHeadline();
    slide.stats.slice(0, 3).forEach((stat, index) => {
      elements.push({
        kind: "shape",
        id: `stat-${index}`,
        x: 0.11 + index * 0.24,
        y: 0.54,
        w: 0.19,
        h: 0.2,
        fill: family.card,
        solidFill: family.cardSolid,
        radius: 24
      });
      elements.push({
        kind: "shape",
        id: `stat-tab-${index}`,
        x: 0.125 + index * 0.24,
        y: 0.565,
        w: 0.045,
        h: 0.012,
        fill: family.signal,
        solidFill: family.signal,
        radius: 3
      });
      elements.push({
        kind: "text",
        id: `stat-value-${index}`,
        x: 0.125 + index * 0.24,
        y: 0.595,
        w: 0.16,
        h: 0.06,
        text: stat.value,
        fontSize: 24,
        fontWeight: 800,
        fontFace: family.fontDisplay,
        color: family.accent,
        align: "center"
      });
      elements.push({
        kind: "text",
        id: `stat-label-${index}`,
        x: 0.125 + index * 0.24,
        y: 0.66,
        w: 0.16,
        h: 0.06,
        text: stat.label,
        fontSize: 11,
        fontFace: family.fontBody,
        color: family.ink,
        align: "center"
      });
    });
  }

  if (slide.layoutKind === "process") {
    addHeadline();
    elements.push({ kind: "line", id: "process-line", x: 0.17, y: 0.63, w: 0.55, h: 0.003, color: family.accent, strokeWidth: 5 });
    slide.steps.slice(0, 4).forEach((step, index) => {
      const x = 0.13 + index * 0.18;
      elements.push({ kind: "shape", id: `step-node-${index}`, x, y: 0.58, w: 0.068, h: 0.1, fill: family.card, solidFill: family.cardSolid, stroke: family.frame, strokeWidth: 1, radius: 20 });
      elements.push({
        kind: "text",
        id: `step-number-${index}`,
        x: x + 0.017,
        y: 0.602,
        w: 0.036,
        h: 0.04,
        text: String(index + 1).padStart(2, "0"),
        fontSize: 12,
        fontWeight: 800,
        color: family.accent,
        align: "center"
      });
      elements.push({
        kind: "text",
        id: `step-copy-${index}`,
        x: x - 0.02,
        y: 0.72,
        w: 0.11,
        h: 0.09,
        text: step,
        fontSize: 10,
        color: family.ink,
        align: "center"
      });
    });
  }

  if (slide.layoutKind === "comparison") {
    addHeadline();
    elements.push({ kind: "shape", id: "left-col", x: 0.11, y: 0.52, w: 0.31, h: 0.26, fill: family.card, solidFill: family.cardSolid, stroke: family.frame, strokeWidth: 1, radius: 18 });
    elements.push({ kind: "shape", id: "right-col", x: 0.47, y: 0.52, w: 0.31, h: 0.26, fill: family.accentSoft, solidFill: family.panelSolid, stroke: family.frame, strokeWidth: 1, radius: 18 });
    elements.push({ kind: "text", id: "left-title", x: 0.14, y: 0.56, w: 0.24, h: 0.04, text: slide.leftColumnTitle, fontSize: 14, fontWeight: 700, color: family.ink });
    elements.push({ kind: "text", id: "right-title", x: 0.5, y: 0.56, w: 0.24, h: 0.04, text: slide.rightColumnTitle, fontSize: 14, fontWeight: 700, color: family.ink });
    slide.leftColumnPoints.slice(0, 4).forEach((item, index) => {
      elements.push({ kind: "text", id: `left-point-${index}`, x: 0.14, y: 0.62 + index * 0.05, w: 0.23, h: 0.04, text: `• ${item}`, fontSize: 11, color: family.ink });
    });
    slide.rightColumnPoints.slice(0, 4).forEach((item, index) => {
      elements.push({ kind: "text", id: `right-point-${index}`, x: 0.5, y: 0.62 + index * 0.05, w: 0.23, h: 0.04, text: `• ${item}`, fontSize: 11, color: family.ink });
    });
  }

  if (slide.layoutKind === "quote") {
    elements.push({ kind: "shape", id: "quote-mark", x: 0.18, y: 0.16, w: 0.06, h: 0.015, fill: family.signal, solidFill: family.signal, radius: 4 });
    elements.push({
      kind: "text",
      id: "quote",
      x: 0.14,
      y: 0.22,
      w: 0.72,
      h: 0.28,
      text: `“${slide.quote || slide.headline}”`,
      fontSize: 28,
      fontWeight: 700,
      color: family.ink,
      align: "center"
    });
    if (slide.quoteAttribution) {
      elements.push({
        kind: "text",
        id: "quote-attribution",
        x: 0.28,
        y: 0.58,
        w: 0.44,
        h: 0.06,
        text: slide.quoteAttribution,
        fontSize: 12,
        color: family.muted,
        align: "center"
      });
    }
    if (slide.subheadline) {
      elements.push({
        kind: "text",
        id: "quote-support",
        x: 0.22,
        y: 0.68,
        w: 0.56,
        h: 0.08,
        text: slide.subheadline,
        fontSize: 11,
        color: family.ink,
        align: "center"
      });
    }
  }

  if (slide.layoutKind === "cta") {
    elements.push({
      kind: "text",
      id: "cta-headline",
      x: 0.18,
      y: 0.24,
      w: 0.64,
      h: 0.15,
      text: slide.headline,
      fontSize: 28,
      fontWeight: 800,
      color: family.ink,
      align: "center"
    });
    elements.push({ kind: "shape", id: "cta-band", x: 0.24, y: 0.54, w: 0.52, h: 0.11, fill: family.accent, solidFill: family.accent, radius: 20 });
    elements.push({
      kind: "text",
      id: "cta-text",
      x: 0.28,
      y: 0.575,
      w: 0.44,
      h: 0.04,
      text: slide.ctaText || "Book your strategy call",
      fontSize: 16,
      fontWeight: 700,
      color: "#FFFFFF",
      align: "center"
    });
    if (slide.ctaSubtext || slide.contactLine) {
      elements.push({
        kind: "text",
        id: "cta-sub",
        x: 0.24,
        y: 0.71,
        w: 0.52,
        h: 0.06,
        text: slide.ctaSubtext || slide.contactLine,
        fontSize: 11,
        color: family.ink,
        align: "center"
      });
    }
  }

  return { slide, family, elements };
}

export function slidePreviewImagePath(assetId: string, assets: AssetRecord[]) {
  const asset = assets.find((item) => item.id === assetId);
  if (!asset) return "";
  const fileName = path.basename(asset.path);
  return `/api/v1/assets/${assetId}/file/${fileName}`;
}
