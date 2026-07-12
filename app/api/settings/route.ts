import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getSettings } from "@/lib/claude";

export async function GET() {
  return NextResponse.json(getSettings());
}

export async function POST(req: Request) {
  const { partner_name, partner_lang, my_lang } = await req.json();
  db.prepare(
    "UPDATE settings SET partner_name = ?, partner_lang = ?, my_lang = ? WHERE id = 1"
  ).run(partner_name, partner_lang, my_lang);
  return NextResponse.json(getSettings());
}
