import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    status: "ok",
    version: process.env.RAILWAY_GIT_COMMIT_SHA || "local",
    timestamp: new Date().toISOString()
  });
}
