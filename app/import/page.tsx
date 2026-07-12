"use client";
import { useState } from "react";

type Result = {
  messages: { speaker: string; original: string; translation: string }[];
  words: { word: string; meaning: string; note: string; example: string }[];
};

export default function ImportPage() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);

  async function submit() {
    setLoading(true);
    setError("");
    setResult(null);
    const res = await fetch("/api/import", {
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
        <h1 className="text-xl font-bold">📥 会話を取り込む</h1>
        <p className="text-sm text-gray-500 mt-1">
          LINEやWhatsAppの会話をコピーして貼り付けてください。翻訳して、恋人がよく使う言葉を辞書に追加します。
        </p>
      </div>
      <textarea
        className="w-full h-48 bg-white border border-rose-100 rounded-xl p-4 text-sm"
        placeholder={"例:\nAlex: omg that movie was insane lol\n私: 本当に!すごかったね"}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button
        onClick={submit}
        disabled={loading || !text.trim()}
        className="bg-rose-500 text-white px-5 py-2 rounded-lg hover:bg-rose-600 disabled:opacity-50"
      >
        {loading ? "解析中…" : "翻訳して辞書に追加"}
      </button>
      {error && <p className="text-red-600 text-sm">{error}</p>}

      {result && (
        <div className="space-y-6">
          <section>
            <h2 className="font-semibold mb-2">会話の翻訳</h2>
            <div className="space-y-2">
              {result.messages.map((m, i) => (
                <div
                  key={i}
                  className={`max-w-[85%] rounded-xl p-3 text-sm ${
                    m.speaker === "partner"
                      ? "bg-white border border-rose-100"
                      : "bg-rose-100 ml-auto"
                  }`}
                >
                  <div>{m.original}</div>
                  <div className="text-gray-500 mt-1">{m.translation}</div>
                </div>
              ))}
            </div>
          </section>
          <section>
            <h2 className="font-semibold mb-2">
              辞書に追加された言葉({result.words.length})
            </h2>
            <div className="space-y-2">
              {result.words.map((w, i) => (
                <div key={i} className="bg-white border border-rose-100 rounded-xl p-3 text-sm">
                  <span className="font-bold text-rose-600">{w.word}</span>
                  <span className="ml-2">{w.meaning}</span>
                  <div className="text-gray-500 mt-1">{w.note}</div>
                  {w.example && (
                    <div className="text-gray-400 mt-1 italic">例: {w.example}</div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
