import { getDB } from "./db.js";
import { loadSummary, saveSummary, countMessages } from "./conversations.js";
import type { LLMClient } from "../llm/types.js";

/** Trigger compaction once this many new messages accumulate after the last summary. */
export const COMPACTION_MESSAGE_THRESHOLD = 80;

/**
 * Whether enough new messages have accumulated since the last summary
 * to warrant a compaction run.
 */
export function shouldCompact(userId: string): boolean {
  const summary = loadSummary(userId);
  const since = summary?.updatedAt ?? 0;
  return countMessages(userId, since) >= COMPACTION_MESSAGE_THRESHOLD;
}

interface CompactionRow {
  id: number;
  role: string;
  content: string;
  tool_calls: string | null;
}

export async function compactHistory(userId: string, llm: LLMClient): Promise<void> {
  const db = getDB();
  const existing = loadSummary(userId);

  // Only compact messages newer than the last summary; older ones are already covered.
  const since = existing?.updatedAt ?? 0;
  const allRows = db.prepare(
    "SELECT id, role, content, tool_calls FROM conversations WHERE user_id = ? AND timestamp > ? ORDER BY timestamp ASC, id ASC",
  ).all(userId, since) as CompactionRow[];

  if (allRows.length < 4) return;

  const mid = Math.floor(allRows.length / 2);
  let splitIdx = -1;

  for (let i = mid; i < allRows.length; i++) {
    if (allRows[i].role === "user") { splitIdx = i; break; }
  }
  if (splitIdx === -1) {
    for (let i = mid - 1; i >= 0; i--) {
      if (allRows[i].role === "user") { splitIdx = i; break; }
    }
  }
  if (splitIdx === -1) return;

  const oldPart = allRows.slice(0, splitIdx);
  if (oldPart.length === 0) return;

  const MAX_COMPACTION_CHARS = 30_000;
  let oldText = oldPart.map(m => `${m.role}: ${m.content}`).join("\n");
  if (oldText.length > MAX_COMPACTION_CHARS) {
    oldText = oldText.slice(-MAX_COMPACTION_CHARS);
  }

  const promptText = `Ты — помощник, который суммаризирует разговоры.

Предыдущее саммари (если есть):
${existing?.summary ?? "Нет"}

Новые сообщения для включения в саммари:
${oldText}

Обнови саммари, сохранив все важные факты, решения, контекст и предпочтения пользователя.
Пиши кратко, но не теряй важную информацию. Пиши на русском.`;

  const response = await llm.chat([{ role: "user", content: promptText }]);
  const newSummary = response.text.trim();

  if (!newSummary) {
    throw new Error("Compaction aborted: LLM returned empty summary");
  }

  const estimatedTokens = response.usage?.completionTokens ?? Math.ceil(newSummary.length / 4);
  const maxOldId = oldPart[oldPart.length - 1].id;

  db.transaction(() => {
    saveSummary(userId, newSummary, estimatedTokens);
    db.prepare("DELETE FROM conversations WHERE user_id = ? AND id <= ?").run(userId, maxOldId);
  })();
}
