import type { Tool, ToolResult } from "./types.js";

const RANDOM_API = "https://meme-api.com/gimme";

function sanitizeTopic(topic: string): string {
  const clean = topic.toLowerCase().replace(/[^a-zа-яё0-9\s]/g, "").trim();
  if (!clean) return "memes";
  const subs: Record<string, string> = {
    "айти": "programmingmemes",
    "кот": "cats",
    "собак": "dogmemes",
    "программирование": "programmingmemes",
    "работа": "office",
    "школа": "schoolmemes",
    "игра": "gaming",
    "спорт": "fitness",
    "еда": "foodmemes",
    "отношение": "relationshipmemes",
    "жиза": "wholesomememes",
  };
  return subs[clean] || "memes";
}

export class MemeTool implements Tool {
  name = "meme";
  description = "Найти и отправить мем. Подбирает мемы по теме или случайный";
  parameters = [
    { name: "topic", type: "string", description: "Тема мема (айти, кот, работа, спорт, еда, отношения и т.д.)", required: false },
  ];

  async execute(params: Record<string, unknown>): Promise<ToolResult> {
    const topic = String(params.topic ?? "").trim();
    const sub = topic ? sanitizeTopic(topic) : "";

    try {
      const url = sub ? `${RANDOM_API}/${sub}` : RANDOM_API;
      console.log(`🎭 Meme: fetching from ${url}`);

      const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (!res.ok) {
        const err = await res.text();
        console.error(`🎭 Meme API error ${res.status}: ${err.slice(0, 200)}`);
        return { success: false, output: "Не удалось загрузить мем" };
      }

      const data = (await res.json()) as Record<string, unknown>;

      if (data.code === 404 || (data as any).code === "404") {
        return { success: false, output: "Мемов по этой теме не нашёл, попробуй другую" };
      }

      const imageUrl = (data.url as string) || (data.preview?.[0] as string);
      const title = data.title as string | undefined;

      if (!imageUrl) {
        return { success: false, output: "Пустой ответ от API — попробуй ещё раз" };
      }

      const output = title ? `🎭 *${title}*` : "🎭 Держи мем!";
      return { success: true, output, mediaUrl: imageUrl };
    } catch (err) {
      console.error(`🎭 Meme error: ${err instanceof Error ? err.message : err}`);
      return { success: false, output: "Ошибка при загрузке мема, попробуй позже" };
    }
  }
}
