import type { Tool, ToolResult } from "./types.js";
import * as fs from "fs";
import * as os from "os";

const MODEL = "google/gemini-3.1-flash-image";

export interface ImageGenToolConfig {
  apiKey: string;
  referencePhotoUrl?: string;
}

export class ImageGenTool implements Tool {
  name = "image_gen";
  description =
    "Сгенерировать изображение по текстовому описанию. Если нужно сохранить внешность персонажа — используй параметр reference. ВАЖНО: обязан вызывать когда пользователь просит любую картинку/изображение/иллюстрацию. НЕ писать [Image] или [Картинка].";
  parameters = [
    { name: "prompt", type: "string", description: "Детальное описание сцены на русском", required: true },
    { name: "reference", type: "string", description: "Путь к файлу с референсным фото для сохранения внешности (указать путь или 'default' для использования основного референса)", required: false },
  ];

  readonly config: ImageGenToolConfig;
  private apiKey: string;
  private referenceBase64: string | null = null;

  constructor(config: ImageGenToolConfig) {
    this.apiKey = config.apiKey;
    this.config = config;
    if (config.referencePhotoUrl) {
      this.loadReference(config.referencePhotoUrl);
    }
  }

  setReferencePhoto(pathOrUrl: string): void {
    this.loadReference(pathOrUrl);
  }

  private loadReference(pathOrUrl: string): void {
    try {
      const resolved = pathOrUrl.replace(/^~/, os.homedir());
      if (fs.existsSync(resolved)) {
        const data = fs.readFileSync(resolved);
        this.referenceBase64 = `data:image/jpeg;base64,${data.toString("base64")}`;
        console.log(`🎨 Референс загружен в image_gen: ${resolved.slice(0, 60)} (${data.length} bytes)`);
      } else if (pathOrUrl.startsWith("data:image") || pathOrUrl.startsWith("http")) {
        this.referenceBase64 = pathOrUrl;
        console.log(`🎨 Референс (URL) сохранён в image_gen`);
      } else {
        // Try as literal path after homedir expansion
        const expanded = pathOrUrl.replace(/^~/, os.homedir());
        if (fs.existsSync(expanded)) {
          const data = fs.readFileSync(expanded);
          this.referenceBase64 = `data:image/jpeg;base64,${data.toString("base64")}`;
        }
      }
    } catch (err) {
      console.error(`🎨 Ошибка загрузки референса в image_gen: ${err instanceof Error ? err.message : err}`);
    }
  }

  async execute(params: Record<string, unknown>): Promise<ToolResult> {
    const prompt = String(params.prompt ?? "").trim();
    if (!prompt) {
      return { success: false, output: "Missing required parameter: prompt" };
    }

    // Check if reference was requested: either explicit path or "default"
    const refParam = String(params.reference ?? "").trim().toLowerCase();
    let useRef = false;
    if (refParam === "default" || refParam === "yes" || refParam === "да") {
      useRef = !!this.referenceBase64;
    } else if (refParam && fs.existsSync(refParam.replace(/^~/, os.homedir()))) {
      // Load the explicitly specified reference
      this.loadReference(refParam);
      useRef = !!this.referenceBase64;
    }

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 60_000);

      let messages: unknown[];
      if (useRef) {
        messages = [{
          role: "user",
          content: [
            { type: "text", text: `Generate an image PRESERVING THE EXACT FACE, IDENTITY, AND APPEARANCE of the person in the reference photo below. The face, facial features, hair, eyes must be IDENTICAL to the reference. Only change pose, clothing, background, lighting, or expression as described. CRITICAL: the person's identity must remain the same.\n\n${prompt}` },
            { type: "image_url", image_url: { url: this.referenceBase64 } },
          ],
        }];
      } else {
        messages = [{ role: "user", content: prompt }];
      }

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: MODEL,
          messages,
          modalities: ["image", "text"],
        }),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        const errText = await response.text();
        console.error(`image_gen error ${response.status}: ${errText.slice(0, 300)}`);
        return { success: false, output: `OpenRouter error: ${response.status}`, error: errText.slice(0, 300) };
      }

      const rawText = await response.text();
      // OpenRouter may append extra data after JSON — extract first JSON object
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error("image_gen: no JSON in response", rawText.slice(0, 300));
        return { success: false, output: "Invalid response from OpenRouter" };
      }
      const data = JSON.parse(jsonMatch[0]) as {
        choices?: Array<{
          message?: {
            content?: string | null;
            images?: Array<{ image_url?: { url?: string } }>;
          };
        }>;
      };

      const message = data.choices?.[0]?.message;

      // Try images array first (OpenRouter native format)
      const imageUrl = message?.images?.[0]?.image_url?.url;
      if (imageUrl) {
        console.log(`image_gen OK: data URL ${imageUrl.slice(0, 50)}...`);
        return {
          success: true,
          output: "Image generated successfully",
          mediaUrl: imageUrl,
        };
      }

      // Try extracting base64 from content (inline format)
      const content = message?.content ?? "";
      const b64Match = content.match(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/);
      if (b64Match) {
        console.log(`image_gen OK: extracted from content`);
        return {
          success: true,
          output: "Image generated successfully",
          mediaUrl: b64Match[0],
        };
      }

      // Try extracting from multipart content
      const jsonStr = JSON.stringify(data);
      const b64MatchJson = jsonStr.match(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/);
      if (b64MatchJson) {
        console.log(`image_gen OK: extracted from response JSON`);
        return {
          success: true,
          output: "Image generated successfully",
          mediaUrl: b64MatchJson[0],
        };
      }

      console.error("image_gen: no image in response", JSON.stringify(data).slice(0, 500));
      return { success: false, output: "Model did not return an image. Try a different prompt." };
    } catch (err) {
      console.error(`image_gen exception: ${err instanceof Error ? err.message : err}`);
      return {
        success: false,
        output: "Error generating image",
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }
}
