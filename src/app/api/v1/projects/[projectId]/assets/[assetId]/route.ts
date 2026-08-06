import fs from "fs/promises";
import { NextResponse } from "next/server";
import { absoluteDataPath, getProject } from "@/lib/data/storage";

export async function GET(_: Request, { params }: { params: Promise<{ projectId: string; assetId: string }> }) {
  const { projectId, assetId } = await params;
  const project = await getProject(projectId);
  const asset = project.assets.find((item) => item.id === assetId);
  if (!asset) {
    return new NextResponse("Not found", { status: 404 });
  }
  const buffer = await fs.readFile(absoluteDataPath(asset.path));
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": asset.mimeType || "application/octet-stream"
    }
  });
}
