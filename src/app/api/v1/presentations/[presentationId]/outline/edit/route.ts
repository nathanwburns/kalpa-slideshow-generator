import { NextResponse } from "next/server";
import { editOutline } from "@/lib/ai/generator";
import { saveOutline } from "@/lib/data/project-service";
import { getAdminSettings, getProject } from "@/lib/data/storage";

export async function POST(request: Request, { params }: { params: Promise<{ presentationId: string }> }) {
  const { presentationId } = await params;
  const [project, settings] = await Promise.all([getProject(presentationId), getAdminSettings()]);

  if (!project.brief || !project.outline.length) {
    return NextResponse.json(
      { error: { code: "OUTLINE_REQUIRED", message: "Generate an outline first.", requestId: crypto.randomUUID() } },
      { status: 400 }
    );
  }

  const body = await request.json();
  if (!body.instruction?.trim()) {
    return NextResponse.json(
      { error: { code: "INSTRUCTION_REQUIRED", message: "Provide an outline edit instruction.", requestId: crypto.randomUUID() } },
      { status: 400 }
    );
  }

  const outline = await editOutline(
    project.brief,
    project.outline,
    project.assets,
    body.instruction,
    body.targetOutlineId || null,
    settings
  );

  const saved = await saveOutline(presentationId, outline, {
    label: body.targetOutlineId ? "Edited outline slide" : "Edited full outline"
  });

  return NextResponse.json({ data: saved, meta: { requestId: crypto.randomUUID() } });
}
