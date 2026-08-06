import { NextResponse } from "next/server";
import { getAdminSettings, saveAdminSettings } from "@/lib/data/storage";

export async function GET() {
  const settings = await getAdminSettings();
  return NextResponse.json({ data: settings, meta: { requestId: crypto.randomUUID() } });
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const settings = await saveAdminSettings(body);
  return NextResponse.json({ data: settings, meta: { requestId: crypto.randomUUID() } });
}
