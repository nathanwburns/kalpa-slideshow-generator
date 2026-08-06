import { NextResponse } from "next/server";
import { addUploadedFiles } from "@/lib/data/project-service";

export async function POST(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const formData = await request.formData();
  const files = formData.getAll("files").filter((value): value is File => value instanceof File);
  const payload = await addUploadedFiles(projectId, files);
  return NextResponse.json({ data: payload.project, meta: { requestId: crypto.randomUUID() } });
}
