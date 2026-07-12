import Database from "better-sqlite3";
import path from "path";

const db = new Database(path.join(process.cwd(), "partner-lingo.db"));
db.pragma("journal_mode = WAL");

db.exec(`
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  partner_name TEXT NOT NULL DEFAULT 'パートナー',
  partner_lang TEXT NOT NULL DEFAULT '英語',
  my_lang TEXT NOT NULL DEFAULT '日本語'
);
INSERT OR IGNORE INTO settings (id) VALUES (1);

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  speaker TEXT NOT NULL,            -- 'partner' | 'me'
  original TEXT NOT NULL,
  translation TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS partner_words (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  word TEXT NOT NULL UNIQUE,
  meaning TEXT NOT NULL,
  note TEXT,                        -- スラング解説・ニュアンス
  example TEXT,
  count INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS quiz_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  word_id INTEGER NOT NULL REFERENCES partner_words(id),
  correct INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS api_usage (
  day TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0
);
`);

export const DAILY_LIMIT = 30;

export function checkAndCountUsage(): boolean {
  const day = new Date().toISOString().slice(0, 10);
  const row = db.prepare("SELECT count FROM api_usage WHERE day = ?").get(day) as
    | { count: number }
    | undefined;
  if ((row?.count ?? 0) >= DAILY_LIMIT) return false;
  db.prepare(
    "INSERT INTO api_usage (day, count) VALUES (?, 1) ON CONFLICT(day) DO UPDATE SET count = count + 1"
  ).run(day);
  return true;
}

export default db;
