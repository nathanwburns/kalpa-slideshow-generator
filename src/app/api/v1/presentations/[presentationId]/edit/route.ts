import { NextResponse } from "next/server";
import { editSlides } from "@/lib/ai/generator";
import { saveSlides } from "@/lib/data/project-service";
import { getAdminSettings, getProject } from "@/lib/data/storage";

export async function POST(request: Request, { params }: { params: Promise<{ presentationId: string }> }) {
  const { presentationId } = await params;
  const [project, settings] = await Promise.all([getProject(presentationId), getAdminSettings()]);
  const body = await request.json();
  const slides = await editSlides(body.instruction, project.slides, project.assets, body.targetSlideId || null, settings);
  const saved = await saveSlides(presentationId, slides, body.targetSlideId ? "Edited slide" : "Edited deck");
  return NextResponse.json({ data: saved, meta: { requestId: crypto.randomUUID() } });
}
