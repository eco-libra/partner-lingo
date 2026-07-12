"use client";
import { useState } from "react";

type Result = {
  translation: string;
  suggestions: { reply: string; translation: string; tone: string; explanation: string }[];
};

export default function ReplyPage() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);

  async function submit() {
    setLoading(true);
    setError("");
    setResult(null);
    const res = await fetch("/api/reply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setError(data.error);
    setResult(data);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">💬 返信を考える</h1>
        <p className="text-sm text-gray-500 mt-1">
          恋人からのメッセージを貼り付けると、翻訳と返事の案を3つ提案します。
          <b>コピーはできません</b> — 自分で打つことで覚えるアプリです。
        </p>
      </div>
      <textarea
        className="w-full h-24 bg-white border border-rose-100 rounded-xl p-4 text-sm"
        placeholder="例: Qué lindo, ya quiero verte 🥺"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button
        onClick={submit}
        disabled={loading || !text.trim()}
        className="bg-rose-500 text-white px-5 py-2 rounded-lg hover:bg-rose-600 disabled:opacity-50"
      >
        {loading ? "考え中…" : "返事の案をもらう"}
      </button>
      {error && <p className="text-red-600 text-sm">{error}</p>}

      {result && (
        <div className="space-y-4">
          <div className="bg-white border border-rose-100 rounded-xl p-4 text-sm">
            <span className="text-gray-400 text-xs">翻訳</span>
            <div>{result.translation}</div>
          </div>
          {result.suggestions.map((s, i) => (
            <div
              key={i}
              className="bg-white border border-rose-100 rounded-xl p-4 text-sm select-none"
            >
              <span className="inline-block bg-rose-100 text-rose-700 text-xs px-2 py-0.5 rounded-full mb-2">
                {s.tone}
              </span>
              <div className="text-lg font-medium">{s.reply}</div>
              <div className="text-gray-500 mt-1">{s.translation}</div>
              <div className="text-gray-600 mt-2 border-t border-rose-50 pt-2">
                💡 {s.explanation}
              </div>
            </div>
          ))}
          <p className="text-xs text-gray-400">
            気に入った案を、見ながら自分の手でメッセージアプリに打ち込みましょう。それが一番覚えます。
          </p>
        </div>
      )}
    </div>
  );
}
