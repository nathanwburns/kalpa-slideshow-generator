import { NextResponse } from "next/server";
import { generatePresentationVisuals, generateSlides } from "@/lib/ai/generator";
import { saveSlides } from "@/lib/data/project-service";
import { getAdminSettings, getProject } from "@/lib/data/storage";
import { finalizeSlidesForRender } from "@/lib/slides/normalize";
import type { AssetRecord } from "@/lib/schema";

export async function POST(_: Request, { params }: { params: Promise<{ presentationId: string }> }) {
  const { presentationId } = await params;
  const [project, settings] = await Promise.all([getProject(presentationId), getAdminSettings()]);
  if (!project.brief || !project.outline.length) {
    return NextResponse.json({ error: { code: "OUTLINE_REQUIRED", message: "Generate an outline first.", requestId: crypto.randomUUID() } }, { status: 400 });
  }
  const selectedTheme = project.themeConcepts.find((item) => item.id === project.selectedThemeConceptId) || null;
  const slides = await generateSlides(
    project.brief,
    project.outline,
    project.assets,
    selectedTheme?.templateFamily || project.templateFamily,
    settings,
    selectedTheme
  );
  let generatedAssets: AssetRecord[] = [];
  try {
    generatedAssets = await generatePresentationVisuals({
      projectId: presentationId,
      brief: project.brief,
      slides,
      assets: project.assets,
      settings
    });
  } catch (error) {
    console.error("Kalpa visual generation was unavailable", error);
  }
  const renderableSlides = finalizeSlidesForRender(slides, [...project.assets, ...generatedAssets]);
  const saved = await saveSlides(presentationId, renderableSlides, "Generated slide deck", generatedAssets);
  return NextResponse.json({ data: saved, meta: { requestId: crypto.randomUUID() } });
}
