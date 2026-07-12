import { NextResponse } from "next/server";
import db, { checkAndCountUsage, DAILY_LIMIT } from "@/lib/db";
import { analyzeConversation } from "@/lib/claude";

export async function POST(req: Request) {
  const { text } = await req.json();
  if (!text?.trim()) {
    return NextResponse.json({ error: "テキストが空です" }, { status: 400 });
  }
  if (!(await checkAndCountUsage())) {
    return NextResponse.json(
      { error: `1日の解析上限(${DAILY_LIMIT}回)に達しました` },
      { status: 429 }
    );
  }
  try {
    const result = await analyzeConversation(text);
    await db.batch(
      [
        ...result.messages.map((m) => ({
          sql: "INSERT INTO messages (speaker, original, translation) VALUES (?, ?, ?)",
          args: [m.speaker, m.original, m.translation],
        })),
        ...result.words.map((w) => ({
          sql: `INSERT INTO partner_words (word, meaning, note, example) VALUES (?, ?, ?, ?)
                ON CONFLICT(word) DO UPDATE SET count = count + 1`,
          args: [w.word, w.meaning, w.note, w.example],
        })),
      ],
      "write"
    );
    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "解析に失敗しました" }, { status: 500 });
  }
}
