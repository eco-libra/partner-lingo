"use client";
import { useEffect, useState } from "react";

type Word = {
  id: number;
  word: string;
  meaning: string;
  note: string;
  example: string;
  count: number;
};
type Settings = { partner_name: string };

export default function DictionaryPage() {
  const [words, setWords] = useState<Word[] | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    fetch("/api/dictionary")
      .then((r) => r.json())
      .then((d) => {
        setWords(d.words);
        setSettings(d.settings);
      });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">
          📖 {settings ? `${settings.partner_name}の辞書` : "相手辞書"}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          会話を取り込むほど、恋人がよく使う言葉のランキングが育ちます。
        </p>
      </div>
      {words && words.length === 0 && (
        <p className="text-gray-500">
          まだ空です。「取り込み」から会話を貼り付けてみましょう。
        </p>
      )}
      <div className="space-y-2">
        {words?.map((w, i) => (
          <div key={w.id} className="bg-white border border-rose-100 rounded-xl p-4 flex gap-4">
            <div className="text-2xl font-bold text-rose-200 w-8">{i + 1}</div>
            <div className="flex-1">
              <div>
                <span className="font-bold text-rose-600">{w.word}</span>
                <span className="ml-2 text-sm">{w.meaning}</span>
                <span className="ml-2 text-xs bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full">
                  {w.count}回
                </span>
              </div>
              {w.note && <div className="text-sm text-gray-500 mt-1">{w.note}</div>}
              {w.example && (
                <div className="text-sm text-gray-400 mt-1 italic">例: {w.example}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
