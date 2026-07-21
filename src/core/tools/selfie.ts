import type { Tool, ToolResult } from "./types.js";
import * as fs from "fs";

const OR_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "google/gemini-3.1-flash-image";

const CHARACTER_DESCRIPTION = "A 45-year-old fit athletic man, short hair, confident look, masculine features, realistic Russian male appearance";

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
  const base = `${CHARACTER_DESCRIPTION}, ${context}`;
  if (mode === "mirror") {
    return `selfie of a middle-aged man (${base}) taking a mirror selfie, full body visible in the mirror, realistic photo style, natural lighting, high detail, photorealistic`;
  }
  return `close-up selfie of a middle-aged man (${base}), direct eye contact with the camera, natural casual expression, realistic photo style, natural lighting, high quality, photorealistic`;
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
  private referenceBase64: string | null = null;

  constructor(config: SelfieToolConfig) {
    this.config = config;
    if (config.referencePhotoUrl) {
      this.loadReference(config.referencePhotoUrl);
    }
  }

  /** Set reference photo path or URL — loads and stores as base64 for multimodal input. */
  setReferencePhoto(pathOrUrl: string): void {
    this.loadReference(pathOrUrl);
  }

  private loadReference(pathOrUrl: string): void {
    try {
      if (fs.existsSync(pathOrUrl)) {
        const data = fs.readFileSync(pathOrUrl);
        this.referenceBase64 = `data:image/jpeg;base64,${data.toString("base64")}`;
        console.log(`📸 Референсное фото загружено: ${pathOrUrl.slice(0, 60)} (${data.length} bytes)`);
      } else if (pathOrUrl.startsWith("data:image") || pathOrUrl.startsWith("http")) {
        this.referenceBase64 = pathOrUrl;
        console.log(`📸 Референсное фото (URL) сохранено: ${pathOrUrl.slice(0, 60)}`);
      }
    } catch (err) {
      console.error(`📸 Ошибка загрузки референсного фото: ${err instanceof Error ? err.message : err}`);
    }
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

    // Try with reference photo first (multimodal), fall back to text-only
    const tryWithRef = !!(this.referenceBase64);

    try {
      console.log(`📸 Selfie (OpenRouter): mode=${mode}, ref=${tryWithRef}, prompt="${prompt.slice(0, 80)}"`);

      let messages: unknown[];
      if (tryWithRef) {
        messages = [{
          role: "user",
          content: [
            { type: "text", text: `Generate a selfie of this person. ${prompt}` },
            { type: "image_url", image_url: { url: this.referenceBase64 } },
          ],
        }];
      } else {
        messages = [{ role: "user", content: prompt }];
      }

      const response = await fetch(OR_ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model: MODEL, messages, modalities: ["image", "text"] }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error(`📸 Selfie OR error ${response.status}: ${errText.slice(0, 200)}`);

        // If failed with reference photo, retry without it
        if (tryWithRef) {
          console.log("📸 Retrying without reference photo...");
          const retryRes = await fetch(OR_ENDPOINT, {
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

          if (retryRes.ok) {
            const raw = await retryRes.text();
            const jsonMatch = raw.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const data = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
              const choices = data.choices as Array<Record<string, unknown>> | undefined;
              const message = choices?.[0]?.message as Record<string, unknown> | undefined;

              const images = message?.images as Array<{ image_url?: { url?: string } }> | undefined;
              const imageUrl = images?.[0]?.image_url?.url;
              if (imageUrl) {
                console.log(`📸 Selfie OK (fallback): ${imageUrl.slice(0, 60)}`);
                return { success: true, output: "Селфи сгенерировано", mediaUrl: imageUrl };
              }

              const content = String(message?.content ?? "");
              const b64Match = content.match(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/);
              if (b64Match) {
                return { success: true, output: "Селфи сгенерировано", mediaUrl: b64Match[0] };
              }
            }
          }
        }

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

      const images = message?.images as Array<{ image_url?: { url?: string } }> | undefined;
      const imageUrl = images?.[0]?.image_url?.url;
      if (imageUrl) {
        console.log(`📸 Selfie OK: ${imageUrl.slice(0, 60)}`);
        return { success: true, output: "Селфи сгенерировано", mediaUrl: imageUrl };
      }

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
