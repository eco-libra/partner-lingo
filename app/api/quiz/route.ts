import { NextResponse } from "next/server";
import db, { ensureSchema, checkAndCountUsage, DAILY_LIMIT } from "@/lib/db";
import { generateQuiz } from "@/lib/claude";

export async function GET() {
  if (!(await checkAndCountUsage())) {
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
  await ensureSchema();
  const { word_id, correct } = await req.json();
  await db.execute({
    sql: "INSERT INTO quiz_results (word_id, correct) VALUES (?, ?)",
    args: [word_id, correct ? 1 : 0],
  });
  return NextResponse.json({ ok: true });
}
