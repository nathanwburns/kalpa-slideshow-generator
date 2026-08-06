import { NextResponse } from "next/server";
import { generateOutline } from "@/lib/ai/generator";
import { saveOutline } from "@/lib/data/project-service";
import { getAdminSettings, getProject } from "@/lib/data/storage";

export async function POST(request: Request, { params }: { params: Promise<{ presentationId: string }> }) {
  const { presentationId } = await params;
  const [project, settings] = await Promise.all([getProject(presentationId), getAdminSettings()]);
  if (!project.brief) {
    return NextResponse.json({ error: { code: "BRIEF_REQUIRED", message: "Save a brief first.", requestId: crypto.randomUUID() } }, { status: 400 });
  }
  const body = await request.json();
  const answeredQuestions = project.questions.map((question) => ({
    question: question.question,
    answer: body.answers?.[question.id] || question.answer || "",
    assumption: question.assumption
  }));
  const outline = await generateOutline(project.brief, project.assets, answeredQuestions, settings);
  const saved = await saveOutline(presentationId, outline);
  return NextResponse.json({ data: saved, meta: { requestId: crypto.randomUUID() } });
}
