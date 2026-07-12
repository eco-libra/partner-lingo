import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Partner Lingo",
  description: "恋人の言葉から学ぶ、国際カップル向け言語学習アプリ",
};

const nav = [
  { href: "/", label: "🏠 ホーム" },
  { href: "/import", label: "📥 取り込み" },
  { href: "/reply", label: "💬 返信提案" },
  { href: "/dictionary", label: "📖 相手辞書" },
  { href: "/quiz", label: "✏️ 今日の3問" },
];

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-rose-50 text-gray-900 antialiased">
        <header className="bg-white border-b border-rose-100 sticky top-0 z-10">
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-4 flex-wrap">
            <span className="font-bold text-rose-500">💞 Partner Lingo</span>
            <nav className="flex gap-3 text-sm">
              {nav.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className="px-2 py-1 rounded hover:bg-rose-100"
                >
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="max-w-3xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
