import { NextResponse } from "next/server";
import { getProject } from "@/lib/data/storage";
import { exportProjectToGoogleSlides } from "@/lib/google-slides/render";

export async function POST(request: Request, { params }: { params: Promise<{ presentationId: string }> }) {
  try {
    const { presentationId } = await params;
    const project = await getProject(presentationId);
    const exported = await exportProjectToGoogleSlides(project, new URL(request.url).origin);
    return NextResponse.json({ data: exported });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Google Slides export failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
