"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type Settings = { partner_name: string; partner_lang: string; my_lang: string };

export default function Home() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings").then((r) => r.json()).then(setSettings);
  }, []);

  async function save() {
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-bold mb-2">恋人の言葉から、言語を学ぶ。</h1>
        <p className="text-gray-600">
          会話を貼り付けると、恋人がよく使う言葉の辞書ができて、毎日3問のクイズで自然な表現が身につきます。
        </p>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { href: "/import", title: "📥 会話を取り込む", desc: "LINEやWhatsAppの会話を貼り付けて翻訳+単語抽出" },
          { href: "/reply", title: "💬 返信を考える", desc: "相手のメッセージに自然な返事を3案(解説付き)" },
          { href: "/dictionary", title: "📖 相手辞書", desc: "恋人がよく使う言葉ランキング" },
          { href: "/quiz", title: "✏️ 今日の3問", desc: "辞書から出題。覚えてない語を優先" },
        ].map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="bg-white rounded-xl p-5 border border-rose-100 hover:border-rose-300 hover:shadow transition"
          >
            <div className="font-semibold mb-1">{c.title}</div>
            <div className="text-sm text-gray-500">{c.desc}</div>
          </Link>
        ))}
      </section>

      {settings && (
        <section className="bg-white rounded-xl p-5 border border-rose-100 space-y-3">
          <h2 className="font-semibold">⚙️ 設定</h2>
          {(
            [
              ["partner_name", "恋人の名前"],
              ["partner_lang", "恋人の言語(学習中)"],
              ["my_lang", "あなたの母語"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="block text-sm">
              <span className="text-gray-500">{label}</span>
              <input
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2"
                value={settings[key]}
                onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
              />
            </label>
          ))}
          <button
            onClick={save}
            className="bg-rose-500 text-white px-4 py-2 rounded-lg hover:bg-rose-600"
          >
            {saved ? "保存しました ✓" : "保存"}
          </button>
        </section>
      )}
    </div>
  );
}
