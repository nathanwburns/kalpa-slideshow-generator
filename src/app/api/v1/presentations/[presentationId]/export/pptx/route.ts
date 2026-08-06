import fs from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { getProject } from "@/lib/data/storage";
import { renderProjectPptx } from "@/lib/pptx/render";

export async function GET(_: Request, { params }: { params: Promise<{ presentationId: string }> }) {
  const { presentationId } = await params;
  const project = await getProject(presentationId);
  const filePath = await renderProjectPptx(project);
  const buffer = await fs.readFile(filePath);
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "Content-Disposition": `attachment; filename="${path.basename(filePath)}"`
    }
  });
}
