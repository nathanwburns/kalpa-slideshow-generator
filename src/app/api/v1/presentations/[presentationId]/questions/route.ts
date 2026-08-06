import { NextResponse } from "next/server";
import { generateQuestions } from "@/lib/ai/generator";
import { saveQuestions } from "@/lib/data/project-service";
import { getAdminSettings, getProject } from "@/lib/data/storage";

export async function POST(_: Request, { params }: { params: Promise<{ presentationId: string }> }) {
  const { presentationId } = await params;
  const [project, settings] = await Promise.all([getProject(presentationId), getAdminSettings()]);
  if (!project.brief) {
    return NextResponse.json({ error: { code: "BRIEF_REQUIRED", message: "Save a brief first.", requestId: crypto.randomUUID() } }, { status: 400 });
  }
  const questions = await generateQuestions(project.brief, project.assets, settings);
  const saved = await saveQuestions(presentationId, questions);
  return NextResponse.json({ data: saved, meta: { requestId: crypto.randomUUID() } });
}
