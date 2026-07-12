import { NextResponse } from "next/server";
import db, { checkAndCountUsage, DAILY_LIMIT } from "@/lib/db";
import { generateQuiz } from "@/lib/claude";

export async function GET() {
  if (!checkAndCountUsage()) {
    return NextResponse.json(
      { error: `1日の解析上限(${DAILY_LIMIT}回)に達しました` },
      { status: 429 }
    );
  }
  try {
    const questions = await generateQuiz();
    return NextResponse.json({ questions });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "クイズ生成に失敗しました" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { word_id, correct } = await req.json();
  db.prepare("INSERT INTO quiz_results (word_id, correct) VALUES (?, ?)").run(
    word_id,
    correct ? 1 : 0
  );
  return NextResponse.json({ ok: true });
}
