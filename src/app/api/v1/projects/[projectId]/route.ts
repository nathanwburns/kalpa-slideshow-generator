import { NextResponse } from "next/server";
import { getProject, saveProject } from "@/lib/data/storage";
import { briefSchema, outlineItemSchema } from "@/lib/schema";
import { stampRevision } from "@/lib/data/project-service";

export async function GET(_: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const project = await getProject(projectId);
  return NextResponse.json({ data: project, meta: { requestId: crypto.randomUUID() } });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const project = await getProject(projectId);
  const body = await request.json();

  if (body.brief) {
    project.brief = briefSchema.parse(body.brief);
    project.status = "questions";
    stampRevision(project, "Updated brief");
  }

  if (body.outline) {
    project.outline = Array.isArray(body.outline) ? body.outline.map((item: unknown) => outlineItemSchema.parse(item)) : project.outline;
    project.status = "outline";
    stampRevision(project, "Updated outline");
  }

  if (body.selectedThemeConceptId !== undefined) {
    const selectedTheme = project.themeConcepts.find((item) => item.id === body.selectedThemeConceptId) || null;
    project.selectedThemeConceptId = selectedTheme?.id || null;
    if (selectedTheme) {
      project.templateFamily = selectedTheme.templateFamily;
      stampRevision(project, `Selected theme direction: ${selectedTheme.name}`);
    }
  }

  await saveProject(project);
  return NextResponse.json({ data: project, meta: { requestId: crypto.randomUUID() } });
}
