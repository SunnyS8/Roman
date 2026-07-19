import type { Tool, ToolResult } from "./types.js";

const OR_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "google/gemini-3.1-flash-image";

const MIRROR_KEYWORDS =
  /одежд|плать|костюм|наряд|юбк|куртк|пальто|шуб|худи|футболк|джинс|туфл|кроссовк|шапк|очк|аксессуар|образ|стиль|лук|мод[аы]|примерк|надел|ношу|переодел|outfit|wearing|clothes|dress|suit|fashion|full.body|mirror|hoodie|jacket/i;

const DIRECT_KEYWORDS =
  /кафе|ресторан|пляж|парк|город|улиц|дом[аеу]?\b|кроват|работ[аеу]|офис|магазин|метро|машин|поезд|самолёт|гор[аыу]|мор[еяю]|озер|лес[аеу]?\b|снег|дожд|утр[оа]|вечер|ноч[ьи]|закат|рассвет|улыбк|грустн|весел|устал|сонн|счастлив|селфи|фото|лиц[оа]|портрет|cafe|restaurant|beach|park|city|portrait|smile|morning|sunset/i;

function detectMode(context: string): "mirror" | "direct" {
  if (MIRROR_KEYWORDS.test(context)) return "mirror";
  if (DIRECT_KEYWORDS.test(context)) return "direct";
  return "direct";
}

function buildPrompt(context: string, mode: "mirror" | "direct"): string {
  if (mode === "mirror") {
    return `selfie of a young man taking a mirror selfie, full body visible in the mirror, ${context}, realistic photo style, natural lighting`;
  }
  return `close-up selfie of a young man, ${context}, direct eye contact with the camera, natural and casual, realistic photo style, natural lighting, high quality`;
}

export interface SelfieToolConfig {
  apiKey?: string;
  referencePhotoUrl?: string;
}

export class SelfieTool implements Tool {
  name = "selfie";
  description =
    "Сгенерировать и отправить селфи. Используй когда просят фото/селфи, или когда уместно показать как выглядишь.";
  parameters = [
    { name: "context", type: "string", description: "Описание ситуации (в кафе, в новом платье, на пляже)", required: true },
    { name: "mode", type: "string", description: "Режим: mirror (зеркальное, full-body) или direct (close-up). Если не указан — определяется автоматически.", required: false },
  ];

  readonly config: SelfieToolConfig;

  constructor(config: SelfieToolConfig) {
    this.config = config;
  }

  /** Set reference photo path or URL. */
  setReferencePhoto(_pathOrUrl: string): void {
    // Reference photo not supported via OpenRouter, but kept for interface compatibility
  }

  async execute(params: Record<string, unknown>): Promise<ToolResult> {
    const context = String(params.context ?? "");
    if (!context) {
      return { success: false, output: "Не указан контекст для селфи", error: "Missing context" };
    }

    const apiKey = this.config.apiKey;
    if (!apiKey) {
      return {
        success: false,
        output: "API ключ не настроен для генерации селфи",
      };
    }

    const mode = (params.mode === "mirror" || params.mode === "direct")
      ? params.mode
      : detectMode(context);

    const prompt = buildPrompt(context, mode);

    try {
      console.log(`📸 Selfie (OpenRouter): mode=${mode}, prompt="${prompt.slice(0, 100)}"`);

      const response = await fetch(OR_ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [{ role: "user", content: prompt }],
          modalities: ["image", "text"],
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error(`📸 Selfie OR error ${response.status}: ${errText.slice(0, 200)}`);
        return {
          success: false,
          output: `Ошибка OpenRouter: ${response.status}`,
          error: errText.slice(0, 200),
        };
      }

      const raw = await response.text();
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return { success: false, output: "Некорректный ответ OpenRouter" };

      const data = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
      const choices = data.choices as Array<Record<string, unknown>> | undefined;
      const message = choices?.[0]?.message as Record<string, unknown> | undefined;

      // Try images array
      const images = message?.images as Array<{ image_url?: { url?: string } }> | undefined;
      const imageUrl = images?.[0]?.image_url?.url;
      if (imageUrl) {
        console.log(`📸 Selfie OK: ${imageUrl.slice(0, 60)}`);
        return { success: true, output: "Селфи сгенерировано", mediaUrl: imageUrl };
      }

      // Try base64 from content
      const content = String(message?.content ?? "");
      const b64Match = content.match(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/);
      if (b64Match) {
        return { success: true, output: "Селфи сгенерировано", mediaUrl: b64Match[0] };
      }

      console.error("📸 Selfie: no image in response", JSON.stringify(data).slice(0, 300));
      return { success: false, output: "Модель не вернула изображение" };
    } catch (err) {
      console.error(`📸 Selfie exception: ${err instanceof Error ? err.message : err}`);
      return { success: false, output: "Ошибка при генерации селфи" };
    }
  }
}
