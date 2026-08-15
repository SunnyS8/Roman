import { getDB } from "./db.js";

export interface KnowledgeRow {
  id: number;
  topic: string;
  insight: string;
  source: string;
  confidence: number;
  timestamp: number;
}

/**
 * Add a knowledge entry to the database.
 * @param entry - The knowledge entry (topic, insight, source).
 * @param confidence - Confidence score between 0 and 1 (default 0.5).
 */
export function addKnowledge(
  entry: { topic: string; insight: string; source: string },
  confidence = 0.5,
): void {
  const db = getDB();
  db.prepare(
    "INSERT INTO knowledge (topic, insight, source, confidence, timestamp) VALUES (?, ?, ?, ?, ?)",
  ).run(entry.topic, entry.insight, entry.source, confidence, Math.floor(Date.now() / 1000));
}

/** Words too common to be useful for matching. */
const STOPWORDS = new Set([
  "и", "в", "во", "не", "что", "я", "ты", "он", "она", "мы", "вы",
  "на", "с", "со", "по", "за", "у", "для", "от", "до", "о", "об",
  "как", "так", "это", "тот", "то", "все", "еще", "уже", "только",
  "меня", "тебя", "мне", "тебе", "быть", "был", "была", "было",
  "будет", "есть", "нет", "да", "а", "но", "или", "если", "чтобы",
  "помнишь", "помни", "запомни", "запомнишь", "помнить", "скажи",
  "давай", "хочу", "надо", "нужно", "можно", "очень", "просто",
]);

/** Split a free-form query into meaningful lowercase tokens (Cyrillic/Latin/digits only). */
function tokenizeQuery(input: string): string[] {
  const tokens = input
    .toLowerCase()
    .replace(/[^a-zа-яё0-9\s-]/gi, " ")
    .split(/[\s-]+/)
    .filter((w) => w.length >= 2 && !STOPWORDS.has(w));
  return [...new Set(tokens)];
}

/** Build an FTS5-safe MATCH expression from tokens, or null if empty. */
function buildFtsQuery(input: string): string | null {
  const tokens = tokenizeQuery(input).slice(0, 8);
  if (tokens.length === 0) return null;
  return tokens.map((t) => `"${t}"`).join(" OR ");
}

/**
 * Full-text search across knowledge entries.
 * First tries FTS5 with a sanitized token query, then falls back to a
 * LIKE scan so that Russian word forms still match. Returns up to `limit`
 * matching rows, deduplicated by id.
 */
export function searchKnowledge(query: string, limit = 5): KnowledgeRow[] {
  if (!query.trim()) return [];

  const db = getDB();
  const found: Map<number, KnowledgeRow> = new Map();

  const ftsQuery = buildFtsQuery(query);
  if (ftsQuery) {
    try {
      const rows = db
        .prepare(
          `SELECT k.id, k.topic, k.insight, k.source, k.confidence, k.timestamp
           FROM knowledge_fts fts
           JOIN knowledge k ON k.id = fts.rowid
           WHERE knowledge_fts MATCH ?
           ORDER BY rank
           LIMIT ?`,
        )
        .all(ftsQuery, limit * 2) as KnowledgeRow[];
      for (const r of rows) {
        if (!found.has(r.id)) found.set(r.id, r);
      }
    } catch {
      // Malformed query — fall through to LIKE scan
    }
  }

  // LIKE fallback: matches Russian word forms ("готовить"/"приготовить")
  if (found.size < limit) {
    const tokens = tokenizeQuery(query).slice(0, 8);
    if (tokens.length > 0) {
      const conditions: string[] = [];
      const params: unknown[] = [];
      tokens.forEach((t) => {
        conditions.push("(k.topic LIKE ? OR k.insight LIKE ?)");
        params.push(`%${t}%`, `%${t}%`);
      });
      const likeSql = `SELECT k.id, k.topic, k.insight, k.source, k.confidence, k.timestamp
         FROM knowledge k
         WHERE ${conditions.join(" OR ")}
         ORDER BY k.timestamp DESC
         LIMIT ?`;
      const rows = db.prepare(likeSql).all(...params, limit * 2) as KnowledgeRow[];
      for (const r of rows) {
        if (!found.has(r.id)) found.set(r.id, r);
        if (found.size >= limit * 2) break;
      }
    }
  }

  return [...found.values()].slice(0, limit);
}

/**
 * Retrieve all knowledge entries, ordered by most recent first.
 */
export function getAllKnowledge(): KnowledgeRow[] {
  const db = getDB();
  return db
    .prepare("SELECT id, topic, insight, source, confidence, timestamp FROM knowledge ORDER BY timestamp DESC")
    .all() as KnowledgeRow[];
}

/**
 * Get the total number of knowledge entries.
 */
export function getKnowledgeCount(): number {
  const db = getDB();
  const row = db.prepare("SELECT COUNT(*) as count FROM knowledge").get() as { count: number };
  return row.count;
}

/**
 * Delete all knowledge entries with the given topic.
 * Returns the number of deleted rows.
 */
export function deleteKnowledgeByTopic(topic: string): number {
  const db = getDB();
  const result = db.prepare("DELETE FROM knowledge WHERE topic = ?").run(topic);
  return result.changes;
}
