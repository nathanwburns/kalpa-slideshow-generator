import { google } from "googleapis";
import type { ProjectRecord } from "@/lib/schema";
import type { RenderElement } from "@/lib/templates/layout-engine";
import { resolveSlide } from "@/lib/templates/layout-engine";

const SLIDE_WIDTH_PT = 960;
const SLIDE_HEIGHT_PT = 540;

type RgbColor = { red: number; green: number; blue: number };

function color(value: string): RgbColor {
  const hex = value.replace("#", "");
  const match = value.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  const [red, green, blue] = /^[0-9A-Fa-f]{6}$/.test(hex)
    ? [hex.slice(0, 2), hex.slice(2, 4), hex.slice(4, 6)].map((channel) => Number.parseInt(channel, 16))
    : match
      ? match.slice(1, 4).map(Number)
      : [0, 0, 0];
  return { red: red / 255, green: green / 255, blue: blue / 255 };
}

function alpha(value: string, transparency = 0) {
  const match = value.match(/^rgba\([^,]+,[^,]+,[^,]+,\s*([\d.]+)\)$/);
  return Math.max(0, Math.min(1, (match ? Number(match[1]) : 1) * (1 - transparency / 100)));
}

function dimension(value: number) {
  return { magnitude: value, unit: "PT" } as const;
}

function elementProperties(pageObjectId: string, element: RenderElement) {
  return {
    pageObjectId,
    size: { width: dimension(element.w * SLIDE_WIDTH_PT), height: dimension(element.h * SLIDE_HEIGHT_PT) },
    transform: { scaleX: 1, scaleY: 1, translateX: element.x * SLIDE_WIDTH_PT, translateY: element.y * SLIDE_HEIGHT_PT, unit: "PT" }
  };
}

function shapeType(element: Extract<RenderElement, { kind: "shape" }>) {
  if (element.variant === "parallelogram") return "PARALLELOGRAM";
  if (element.rotate === 45 && Math.abs(element.w - element.h) < 0.01) return "DIAMOND";
  return element.radius ? "ROUND_RECTANGLE" : "RECTANGLE";
}

function googleImageUrl(project: ProjectRecord, element: Extract<RenderElement, { kind: "image" }>, appUrl: string) {
  if (element.assetId) return `${appUrl}/api/v1/projects/${project.id}/assets/${element.assetId}`;
  return `${appUrl}${element.src}`;
}

function elementRequests(project: ProjectRecord, pageObjectId: string, element: RenderElement, objectId: string, appUrl: string): Record<string, unknown>[] {
  const properties = elementProperties(pageObjectId, element);
  if (element.kind === "shape") {
    const fillAlpha = alpha(element.fill, element.fillTransparency);
    const outline = element.stroke
      ? { outlineFill: { solidFill: { color: { rgbColor: color(element.stroke) }, alpha: 1 - (element.strokeTransparency || 0) / 100 } }, weight: dimension(element.strokeWidth || 1) }
      : { propertyState: "NOT_RENDERED" };
    return [
      { createShape: { objectId, shapeType: shapeType(element), elementProperties: properties } },
      { updateShapeProperties: { objectId, shapeProperties: { shapeBackgroundFill: { solidFill: { color: { rgbColor: color(element.solidFill || element.fill) }, alpha: fillAlpha } }, outline }, fields: "shapeBackgroundFill,outline" } }
    ];
  }
  if (element.kind === "line") {
    return [
      { createLine: { objectId, lineCategory: "STRAIGHT", elementProperties: properties } },
      { updateLineProperties: { objectId, lineProperties: { lineFill: { solidFill: { color: { rgbColor: color(element.color) } } }, weight: dimension(element.strokeWidth) }, fields: "lineFill,weight" } }
    ];
  }
  if (element.kind === "image") {
    return [{ createImage: { objectId, url: googleImageUrl(project, element, appUrl), elementProperties: properties } }];
  }
  const textStyle: Record<string, unknown> = {
    foregroundColor: { opaqueColor: { rgbColor: color(element.color) } },
    fontSize: dimension(element.fontSize),
    bold: Boolean(element.fontWeight && element.fontWeight >= 700),
    weightedFontFamily: { fontFamily: element.fontFace || "Arial" }
  };
  return [
    { createShape: { objectId, shapeType: "TEXT_BOX", elementProperties: properties } },
    { insertText: { objectId, text: element.text } },
    { updateTextStyle: { objectId, textRange: { type: "ALL" }, style: textStyle, fields: "foregroundColor,fontSize,bold,weightedFontFamily" } },
    { updateParagraphStyle: { objectId, textRange: { type: "ALL" }, style: { alignment: (element.align || "left").toUpperCase() }, fields: "alignment" } }
  ];
}

function credentials() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error("Google Slides export is not configured. Add GOOGLE_SERVICE_ACCOUNT_JSON and GOOGLE_SLIDES_SHARE_EMAIL in Railway.");
  try {
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON must contain valid service-account JSON.");
  }
}

export async function exportProjectToGoogleSlides(project: ProjectRecord, appUrl: string) {
  const shareEmail = process.env.GOOGLE_SLIDES_SHARE_EMAIL;
  if (!shareEmail) throw new Error("Google Slides export is not configured. Add GOOGLE_SLIDES_SHARE_EMAIL in Railway.");

  const auth = new google.auth.GoogleAuth({
    credentials: credentials(),
    scopes: ["https://www.googleapis.com/auth/presentations", "https://www.googleapis.com/auth/drive"]
  });
  const slides = google.slides({ version: "v1", auth });
  const drive = google.drive({ version: "v3", auth });
  const created = await slides.presentations.create({ requestBody: { title: project.title } });
  const presentationId = created.data.presentationId;
  const defaultSlideId = created.data.slides?.[0]?.objectId;
  if (!presentationId || !defaultSlideId) throw new Error("Google did not return a presentation ID.");

  const requests: Record<string, unknown>[] = [{ deleteObject: { objectId: defaultSlideId } }];
  let counter = 0;
  project.slides.forEach((slide, index) => {
    const pageObjectId = `kalpa_slide_${index + 1}`;
    requests.push({ createSlide: { objectId: pageObjectId, insertionIndex: index, slideLayoutReference: { predefinedLayout: "BLANK" } } });
    const resolved = resolveSlide(slide, project.templateFamily, project.assets);
    resolved.elements.forEach((element) => {
      counter += 1;
      requests.push(...elementRequests(project, pageObjectId, element, `kalpa_element_${counter}`, appUrl));
    });
  });

  // Google validates each batch atomically. Chunking preserves a reliable export for larger decks.
  for (let index = 0; index < requests.length; index += 250) {
    await slides.presentations.batchUpdate({ presentationId, requestBody: { requests: requests.slice(index, index + 250) } });
  }

  await drive.permissions.create({
    fileId: presentationId,
    sendNotificationEmail: false,
    requestBody: { type: "user", role: "writer", emailAddress: shareEmail }
  });
  return { presentationId, url: `https://docs.google.com/presentation/d/${presentationId}/edit` };
}
