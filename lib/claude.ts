import Anthropic from "@anthropic-ai/sdk";
import db, { ensureSchema } from "./db";

const client = new Anthropic();

// 単語抽出・クイズ生成など裏方の処理は低コストなHaiku、
// 返信提案だけ品質重視でSonnetを使う(コスト方針)
const CHEAP_MODEL = "claude-haiku-4-5";
const SMART_MODEL = "claude-sonnet-5";

export async function getSettings() {
  await ensureSchema();
  const res = await db.execute("SELECT * FROM settings WHERE id = 1");
  return res.rows[0] as unknown as {
    partner_name: string;
    partner_lang: string;
    my_lang: string;
  };
}

function firstText(res: Anthropic.Message): string {
  const block = res.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") throw new Error("no text in response");
  return block.text;
}

export type AnalyzedMessage = {
  speaker: "partner" | "me";
  original: string;
  translation: string;
};
export type ExtractedWord = {
  word: string;
  meaning: string;
  note: string;
  example: string;
};

export async function analyzeConversation(raw: string): Promise<{
  messages: AnalyzedMessage[];
  words: ExtractedWord[];
}> {
  const s = await getSettings();
  const res = await client.messages.create({
    model: CHEAP_MODEL,
    max_tokens: 4096,
    system: `あなたは国際カップル向け言語学習アプリの解析エンジンです。ユーザーの母語は${s.my_lang}、恋人(${s.partner_name})の言語は${s.partner_lang}です。貼り付けられた会話ログを解析してください。
- 各発言の話者を推定する(恋人=partner、ユーザー=me)。${s.partner_lang}の発言はpartner、${s.my_lang}の発言はmeの可能性が高い。
- 各発言を相手側の言語に翻訳する。
- partnerの発言から、学習価値のある単語・スラング・言い回しを抽出する(基礎的すぎる語は除く)。meaningは${s.my_lang}で、noteにはニュアンスやスラング解説を${s.my_lang}で書く。`,
    messages: [{ role: "user", content: raw }],
    output_config: {
      format: {
        type: "json_schema",
        schema: {
          type: "object",
          properties: {
            messages: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  speaker: { type: "string", enum: ["partner", "me"] },
                  original: { type: "string" },
                  translation: { type: "string" },
                },
                required: ["speaker", "original", "translation"],
                additionalProperties: false,
              },
            },
            words: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  word: { type: "string" },
                  meaning: { type: "string" },
                  note: { type: "string" },
                  example: { type: "string" },
                },
                required: ["word", "meaning", "note", "example"],
                additionalProperties: false,
              },
            },
          },
          required: ["messages", "words"],
          additionalProperties: false,
        },
      },
    },
  });
  return JSON.parse(firstText(res));
}

export type ReplySuggestion = {
  reply: string;
  translation: string;
  tone: string;
  explanation: string;
};

export async function suggestReplies(
  partnerMessage: string
): Promise<{ translation: string; suggestions: ReplySuggestion[] }> {
  const s = await getSettings();
  const recentRes = await db.execute(
    "SELECT word FROM partner_words ORDER BY count DESC LIMIT 15"
  );
  const recentWords = recentRes.rows.map((r) => r.word).join(", ");
  const res = await client.messages.create({
    model: SMART_MODEL,
    max_tokens: 4096,
    system: `あなたは国際カップル向け言語学習アプリの返信コーチです。ユーザーの母語は${s.my_lang}、恋人の言語は${s.partner_lang}。恋人からのメッセージに対し:
1. ${s.my_lang}への翻訳
2. ${s.partner_lang}での自然な返事を3案(tone: 丁寧/カジュアル/甘め)。各案にreply(${s.partner_lang})、translation(${s.my_lang}訳)、explanation(使われている表現の解説、${s.my_lang}で)を付ける。
恋人がよく使う語(参考): ${recentWords || "なし"}。これらを自然に織り込めると学習効果が高い。
ユーザーは覚えるために自分で打ちます。丸写し用ではなく学べる解説を。`,
    messages: [{ role: "user", content: partnerMessage }],
    output_config: {
      format: {
        type: "json_schema",
        schema: {
          type: "object",
          properties: {
            translation: { type: "string" },
            suggestions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  reply: { type: "string" },
                  translation: { type: "string" },
                  tone: { type: "string" },
                  explanation: { type: "string" },
                },
                required: ["reply", "translation", "tone", "explanation"],
                additionalProperties: false,
              },
            },
          },
          required: ["translation", "suggestions"],
          additionalProperties: false,
        },
      },
    },
  });
  return JSON.parse(firstText(res));
}

export type QuizQuestion = {
  word_id: number;
  question: string;
  choices: string[];
  answer_index: number;
  explanation: string;
};

export async function generateQuiz(): Promise<QuizQuestion[]> {
  const s = await getSettings();
  // 未出題・不正解が多い語を優先
  const wordsRes = await db.execute(
    `SELECT w.id, w.word, w.meaning, w.note, w.example,
            COALESCE(SUM(q.correct), 0) AS correct_count, COUNT(q.id) AS attempts
     FROM partner_words w LEFT JOIN quiz_results q ON q.word_id = w.id
     GROUP BY w.id
     ORDER BY attempts ASC, (CAST(correct_count AS REAL) / MAX(attempts, 1)) ASC, w.count DESC
     LIMIT 3`
  );
  const words = wordsRes.rows as unknown as {
    id: number;
    word: string;
    meaning: string;
    note: string;
    example: string;
  }[];
  if (words.length === 0) return [];

  const res = await client.messages.create({
    model: CHEAP_MODEL,
    max_tokens: 2048,
    system: `国際カップル向け言語学習アプリのクイズ作成係です。ユーザーの母語は${s.my_lang}、学習中の言語は${s.partner_lang}。渡された「恋人がよく使う単語」それぞれについて4択問題を1問ずつ作ってください。questionとchoicesとexplanationは${s.my_lang}で。word_idは入力のidをそのまま使うこと。answer_indexは正解のchoicesの添字(0-3)。`,
    messages: [{ role: "user", content: JSON.stringify(words) }],
    output_config: {
      format: {
        type: "json_schema",
        schema: {
          type: "object",
          properties: {
            questions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  word_id: { type: "integer" },
                  question: { type: "string" },
                  choices: { type: "array", items: { type: "string" } },
                  answer_index: { type: "integer" },
                  explanation: { type: "string" },
                },
                required: [
                  "word_id",
                  "question",
                  "choices",
                  "answer_index",
                  "explanation",
                ],
                additionalProperties: false,
              },
            },
          },
          required: ["questions"],
          additionalProperties: false,
        },
      },
    },
  });
  return JSON.parse(firstText(res)).questions;
}
