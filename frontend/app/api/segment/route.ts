// app/api/segment/route.ts
import { NextResponse } from "next/server";

//  TODO: DELETE OR CHANGE THIS LATER, just for testing purposes rn

export async function GET() {
  // For now return mock JSON
  return NextResponse.json({
    message: "Coming from /api/segment!",
    time: new Date().toISOString(),
  });
}
