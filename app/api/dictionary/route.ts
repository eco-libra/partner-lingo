import { NextResponse } from "next/server";
import db, { ensureSchema } from "@/lib/db";
import { getSettings } from "@/lib/claude";

export async function GET() {
  await ensureSchema();
  const res = await db.execute(
    "SELECT * FROM partner_words ORDER BY count DESC, created_at DESC"
  );
  return NextResponse.json({ words: res.rows, settings: await getSettings() });
}
