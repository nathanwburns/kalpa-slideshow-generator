import { NextResponse } from "next/server";
import { generateSlides } from "@/lib/ai/generator";
import { saveSlides } from "@/lib/data/project-service";
import { getAdminSettings, getProject } from "@/lib/data/storage";

export async function POST(_: Request, { params }: { params: Promise<{ presentationId: string }> }) {
  const { presentationId } = await params;
  const [project, settings] = await Promise.all([getProject(presentationId), getAdminSettings()]);
  if (!project.brief || !project.outline.length) {
    return NextResponse.json({ error: { code: "OUTLINE_REQUIRED", message: "Generate an outline first.", requestId: crypto.randomUUID() } }, { status: 400 });
  }
  const slides = await generateSlides(project.brief, project.outline, project.assets, project.templateFamily, settings);
  const saved = await saveSlides(presentationId, slides, "Generated slide deck");
  return NextResponse.json({ data: saved, meta: { requestId: crypto.randomUUID() } });
}
