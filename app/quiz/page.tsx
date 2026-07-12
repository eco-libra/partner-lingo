"use client";
import { useState } from "react";

type Question = {
  word_id: number;
  question: string;
  choices: string[];
  answer_index: number;
  explanation: string;
};

export default function QuizPage() {
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [current, setCurrent] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  async function start() {
    setLoading(true);
    setError("");
    const res = await fetch("/api/quiz");
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setError(data.error);
    if (data.questions.length === 0)
      return setError("辞書がまだ空です。先に会話を取り込んでください。");
    setQuestions(data.questions);
    setCurrent(0);
    setScore(0);
    setDone(false);
    setPicked(null);
  }

  async function pick(i: number) {
    if (picked !== null || !questions) return;
    setPicked(i);
    const q = questions[current];
    const correct = i === q.answer_index;
    if (correct) setScore((s) => s + 1);
    await fetch("/api/quiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ word_id: q.word_id, correct }),
    });
  }

  function next() {
    if (!questions) return;
    if (current + 1 >= questions.length) return setDone(true);
    setCurrent((c) => c + 1);
    setPicked(null);
  }

  const q = questions?.[current];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">✏️ 今日の3問</h1>
        <p className="text-sm text-gray-500 mt-1">
          恋人がよく使う言葉から出題。覚えていない語を優先します。
        </p>
      </div>

      {!questions && (
        <button
          onClick={start}
          disabled={loading}
          className="bg-rose-500 text-white px-5 py-2 rounded-lg hover:bg-rose-600 disabled:opacity-50"
        >
          {loading ? "出題を準備中…" : "クイズを始める"}
        </button>
      )}
      {error && <p className="text-red-600 text-sm">{error}</p>}

      {q && !done && (
        <div className="bg-white border border-rose-100 rounded-xl p-5 space-y-4">
          <div className="text-sm text-gray-400">
            {current + 1} / {questions!.length}
          </div>
          <div className="font-medium">{q.question}</div>
          <div className="space-y-2">
            {q.choices.map((c, i) => {
              let cls = "bg-rose-50 hover:bg-rose-100 border-transparent";
              if (picked !== null) {
                if (i === q.answer_index) cls = "bg-green-100 border-green-400";
                else if (i === picked) cls = "bg-red-100 border-red-300";
                else cls = "bg-gray-50 border-transparent";
              }
              return (
                <button
                  key={i}
                  onClick={() => pick(i)}
                  className={`block w-full text-left px-4 py-2 rounded-lg border ${cls}`}
                >
                  {c}
                </button>
              );
            })}
          </div>
          {picked !== null && (
            <>
              <div className="text-sm text-gray-600 border-t border-rose-50 pt-3">
                💡 {q.explanation}
              </div>
              <button
                onClick={next}
                className="bg-rose-500 text-white px-4 py-2 rounded-lg hover:bg-rose-600"
              >
                {current + 1 >= questions!.length ? "結果を見る" : "次の問題"}
              </button>
            </>
          )}
        </div>
      )}

      {done && (
        <div className="bg-white border border-rose-100 rounded-xl p-6 text-center space-y-3">
          <div className="text-3xl">
            {score === questions!.length ? "🎉" : score > 0 ? "👏" : "💪"}
          </div>
          <div className="font-bold">
            {questions!.length}問中 {score}問正解!
          </div>
          <p className="text-sm text-gray-500">
            間違えた言葉は次回優先的に出題されます。
          </p>
          <button
            onClick={start}
            className="bg-rose-500 text-white px-4 py-2 rounded-lg hover:bg-rose-600"
          >
            もう3問やる
          </button>
        </div>
      )}
    </div>
  );
}
