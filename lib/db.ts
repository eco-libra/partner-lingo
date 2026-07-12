import { createClient } from "@libsql/client";

// 本番(Vercel)ではTurso、ローカルではファイルを使う
const db = createClient({
  url: process.env.TURSO_DATABASE_URL ?? "file:partner-lingo.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

let initialized: Promise<void> | null = null;

export function ensureSchema(): Promise<void> {
  if (!initialized) {
    initialized = (async () => {
      await db.batch(
        [
          `CREATE TABLE IF NOT EXISTS settings (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            partner_name TEXT NOT NULL DEFAULT 'パートナー',
            partner_lang TEXT NOT NULL DEFAULT '英語',
            my_lang TEXT NOT NULL DEFAULT '日本語'
          )`,
          `INSERT OR IGNORE INTO settings (id) VALUES (1)`,
          `CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            speaker TEXT NOT NULL,
            original TEXT NOT NULL,
            translation TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
          )`,
          `CREATE TABLE IF NOT EXISTS partner_words (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            word TEXT NOT NULL UNIQUE,
            meaning TEXT NOT NULL,
            note TEXT,
            example TEXT,
            count INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
          )`,
          `CREATE TABLE IF NOT EXISTS quiz_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            word_id INTEGER NOT NULL REFERENCES partner_words(id),
            correct INTEGER NOT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
          )`,
          `CREATE TABLE IF NOT EXISTS api_usage (
            day TEXT PRIMARY KEY,
            count INTEGER NOT NULL DEFAULT 0
          )`,
        ],
        "write"
      );
    })();
  }
  return initialized;
}

export const DAILY_LIMIT = 30;

export async function checkAndCountUsage(): Promise<boolean> {
  await ensureSchema();
  const day = new Date().toISOString().slice(0, 10);
  const res = await db.execute({
    sql: "SELECT count FROM api_usage WHERE day = ?",
    args: [day],
  });
  const count = (res.rows[0]?.count as number | undefined) ?? 0;
  if (count >= DAILY_LIMIT) return false;
  await db.execute({
    sql: "INSERT INTO api_usage (day, count) VALUES (?, 1) ON CONFLICT(day) DO UPDATE SET count = count + 1",
    args: [day],
  });
  return true;
}

export default db;
