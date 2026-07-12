import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getSettings } from "@/lib/claude";

export async function GET() {
  const words = db
    .prepare("SELECT * FROM partner_words ORDER BY count DESC, created_at DESC")
    .all();
  return NextResponse.json({ words, settings: getSettings() });
}
