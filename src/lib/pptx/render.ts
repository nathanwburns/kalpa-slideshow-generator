import fs from "fs/promises";
import path from "path";
import pptxgen from "pptxgenjs";
import type { ProjectRecord } from "@/lib/schema";
import { resolveSlide } from "@/lib/templates/layout-engine";
import { familyThemes } from "@/lib/templates/families";
import { absoluteDataPath, ensureProjectFilesDir } from "@/lib/data/storage";

function pptColor(value: string) {
  const hex = value.replace("#", "");
  if (/^[0-9A-Fa-f]{6}$/.test(hex)) return hex;
  const channels = value.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  return channels
    ? channels.slice(1, 4).map((channel) => Number(channel).toString(16).padStart(2, "0")).join("")
    : "000000";
}

export async function renderProjectPptx(project: ProjectRecord) {
  const pptx = new pptxgen();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "Kalpa Slideshow Generator";
  pptx.company = "Kalpa Inc.";
  pptx.subject = project.title;
  pptx.title = project.title;
  const theme = familyThemes[project.templateFamily];

  for (const slide of project.slides) {
    const pptSlide = pptx.addSlide();
    const resolved = resolveSlide(slide, project.templateFamily, project.assets);

    for (const element of resolved.elements) {
      const x = element.x * 13.333;
      const y = element.y * 7.5;
      const w = element.w * 13.333;
      const h = element.h * 7.5;

      if (element.kind === "shape") {
        pptSlide.addShape(element.variant === "parallelogram" ? pptx.ShapeType.parallelogram : element.radius ? pptx.ShapeType.roundRect : pptx.ShapeType.rect, {
          x,
          y,
          w,
          h,
          rectRadius: element.radius ? 0.08 : undefined,
          fill: {
            color: pptColor(element.solidFill || (element.fill.startsWith("#") ? element.fill : theme.panelSolid)),
            transparency: element.fill.startsWith("rgba") ? 16 : 0
          },
          line: { color: pptColor(element.stroke || theme.line), width: element.strokeWidth || 0 },
          rotate: element.rotate
        });
      }

      if (element.kind === "line") {
        pptSlide.addShape(pptx.ShapeType.line, {
          x,
          y,
          w,
          h,
          line: { color: pptColor(element.color), width: element.strokeWidth }
        });
      }

      if (element.kind === "text") {
        pptSlide.addText(element.text, {
          x,
          y,
          w,
          h,
          fontFace: element.fontFace || theme.fontBody,
          fontSize: element.fontSize,
          bold: element.fontWeight ? element.fontWeight >= 700 : false,
          color: pptColor(element.color),
          align: element.align,
          margin: 0,
          // Copy is already constrained in the shared layout engine. Avoid a
          // PowerPoint-only shrink pass that would make exports diverge from preview.
          fit: "resize",
          valign: "top"
        });
      }

      if (element.kind === "image" && element.src) {
        const imagePath = element.assetId
          ? path.resolve(absoluteDataPath(element.src))
          : path.join(process.cwd(), "public", element.src.replace(/^\//, ""));
        pptSlide.addImage({
          path: imagePath,
          x,
          y,
          w,
          h,
          // Match the browser's object-fit: cover behavior so photos keep their
          // proportions and receive the same centered crop in the exported deck.
          sizing: { type: element.fit || "cover", x, y, w, h }
        });
      }
    }
  }

  const exportDir = await ensureProjectFilesDir(project.id);
  const outPath = path.join(exportDir, `${project.id}.pptx`);
  await fs.mkdir(exportDir, { recursive: true });
  await pptx.writeFile({ fileName: outPath });
  return outPath;
}
