import { NextResponse } from "next/server";
import { supabaseJourneySync } from "@/lib/bloom-db";

export async function GET() {
  const status = await supabaseJourneySync.healthCheck();
  return NextResponse.json(status, { status: status.ok ? 200 : 500 });
}
