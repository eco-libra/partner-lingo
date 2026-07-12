import { NextResponse } from "next/server";
import db, { ensureSchema } from "@/lib/db";
import { getSettings } from "@/lib/claude";

export async function GET() {
  return NextResponse.json(await getSettings());
}

export async function POST(req: Request) {
  await ensureSchema();
  const { partner_name, partner_lang, my_lang } = await req.json();
  await db.execute({
    sql: "UPDATE settings SET partner_name = ?, partner_lang = ?, my_lang = ? WHERE id = 1",
    args: [partner_name, partner_lang, my_lang],
  });
  return NextResponse.json(await getSettings());
}
