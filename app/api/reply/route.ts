import { NextResponse } from "next/server";
import { checkAndCountUsage, DAILY_LIMIT } from "@/lib/db";
import { suggestReplies } from "@/lib/claude";

export async function POST(req: Request) {
  const { text } = await req.json();
  if (!text?.trim()) {
    return NextResponse.json({ error: "テキストが空です" }, { status: 400 });
  }
  if (!checkAndCountUsage()) {
    return NextResponse.json(
      { error: `1日の解析上限(${DAILY_LIMIT}回)に達しました` },
      { status: 429 }
    );
  }
  try {
    return NextResponse.json(await suggestReplies(text));
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "提案の生成に失敗しました" }, { status: 500 });
  }
}
