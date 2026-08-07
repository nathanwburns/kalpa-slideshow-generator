import fs from "fs/promises";
import path from "path";
import pptxgen from "pptxgenjs";
import type { ProjectRecord } from "@/lib/schema";
import { resolveSlide } from "@/lib/templates/layout-engine";
import { familyThemes } from "@/lib/templates/families";
import { absoluteDataPath, ensureProjectFilesDir } from "@/lib/data/storage";

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
        pptSlide.addShape(pptx.ShapeType.rect, {
          x,
          y,
          w,
          h,
          rectRadius: element.radius ? 0.08 : undefined,
          fill: {
            color: (element.solidFill || (element.fill.startsWith("#") ? element.fill : theme.panelSolid)).replace("#", ""),
            transparency: element.fill.startsWith("rgba") ? 16 : 0
          },
          line: { color: (element.stroke || theme.line).replace("#", ""), width: element.strokeWidth || 0 }
        });
      }

      if (element.kind === "line") {
        pptSlide.addShape(pptx.ShapeType.line, {
          x,
          y,
          w,
          h,
          line: { color: element.color.replace("#", ""), width: element.strokeWidth }
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
          color: element.color.replace("#", ""),
          align: element.align,
          margin: 0,
          fit: "shrink",
          valign: "top"
        });
      }

      if (element.kind === "image" && element.src) {
        pptSlide.addImage({
          path: path.resolve(absoluteDataPath(element.src)),
          x,
          y,
          w,
          h
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
