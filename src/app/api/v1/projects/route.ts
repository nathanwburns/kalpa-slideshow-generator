import { NextResponse } from "next/server";
import { createProjectRecord } from "@/lib/data/project-service";
import { getAdminSettings, listProjects, saveProject } from "@/lib/data/storage";
import { templateFamilySchema } from "@/lib/schema";

export async function GET() {
  const projects = await listProjects();
  return NextResponse.json({ data: projects, meta: { requestId: crypto.randomUUID() } });
}

export async function POST(request: Request) {
  const body = await request.json();
  const settings = await getAdminSettings();
  const project = createProjectRecord({
    title: body.title || "Untitled Kalpa deck",
    description: body.description || "",
    templateFamily: templateFamilySchema.parse(body.templateFamily || settings.preferredTemplateFamily)
  });
  await saveProject(project);
  return NextResponse.json({ data: project, meta: { requestId: crypto.randomUUID() } });
}
