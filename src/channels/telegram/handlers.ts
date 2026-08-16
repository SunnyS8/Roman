import type { Bot, Context } from "grammy";
import type { IncomingMessage, OutgoingMessage, ProgressCallback } from "../../core/types.js";
import type { MessageHandler } from "../types.js";
import { sendVoiceResponse } from "./voice.js";
import { sendVideoNoteHubris } from "./hubris-video.js";
import { SubscriptionStore, type Tier, type Feature } from "../../core/subscription-store.js";
import { getUserGender, setUserGender } from "../../core/memory/conversations.js";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

/** Max Telegram message length. */
const MAX_MSG_LEN = 4096;
/** Warn the user when this many daily messages remain. */
const WARN_THRESHOLD = 5;

/** Pluralize the Russian word "сообщение" for a given count. */
function pluralMsg(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "сообщение";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "сообщения";
  return "сообщений";
}

// ---------------------------------------------------------------------------
// Markdown → Telegram HTML (like OpenClaw's format.ts approach)
// ---------------------------------------------------------------------------

/** Escape HTML special chars. */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Convert LLM markdown to Telegram HTML.
 * Handles: **bold**, *italic*, `code`, ```code blocks```, [links](url)
 * Uses HTML parse_mode (more reliable than MarkdownV2).
 */
function markdownToTelegramHtml(text: string): string {
  const parts: string[] = [];
  // Split by code blocks and inline code (preserve them separately)
  const segments = text.split(/(```[\s\S]*?```|`[^`]+`)/g);

  for (const segment of segments) {
    if (segment.startsWith("```") && segment.endsWith("```")) {
      const inner = segment.slice(3, -3);
      const newlineIdx = inner.indexOf("\n");
      if (newlineIdx !== -1) {
        const lang = inner.slice(0, newlineIdx).trim();
        const code = inner.slice(newlineIdx + 1);
        parts.push(
          lang
            ? `<pre><code class="language-${escapeHtml(lang)}">${escapeHtml(code)}</code></pre>`
            : `<pre>${escapeHtml(code)}</pre>`,
        );
      } else {
        parts.push(`<pre>${escapeHtml(inner)}</pre>`);
      }
    } else if (segment.startsWith("`") && segment.endsWith("`")) {
      parts.push(`<code>${escapeHtml(segment.slice(1, -1))}</code>`);
    } else {
      // Regular text — convert formatting
      // Extract markdown links before escaping HTML (urls contain & etc.)
      const linkPlaceholders: string[] = [];
      let withPlaceholders = segment.replace(
        /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
        (_match, label, url) => {
          const idx = linkPlaceholders.length;
          linkPlaceholders.push(
            `<a href="${escapeHtml(url)}">${escapeHtml(label)}</a>`,
          );
          return `\x00LINK${idx}\x00`;
        },
      );
      let html = escapeHtml(withPlaceholders);
      // Restore link placeholders
      html = html.replace(/\x00LINK(\d+)\x00/g, (_m, i) => linkPlaceholders[Number(i)]);
      // ### heading → <b>heading</b> (strip markdown headers)
      html = html.replace(/^#{1,6}\s+(.+)$/gm, "<b>$1</b>");
      // **bold** → <b>bold</b>
      html = html.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
      // *italic* → <i>italic</i> (but not inside bold tags)
      html = html.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, "<i>$1</i>");
      // ~~strikethrough~~ → <s>strikethrough</s>
      html = html.replace(/~~(.+?)~~/g, "<s>$1</s>");
      // > blockquote → <blockquote>
      html = html.replace(/^&gt;\s?(.+)$/gm, "<blockquote>$1</blockquote>");
      // Merge adjacent blockquotes into one
      html = html.replace(/<\/blockquote>\n<blockquote>/g, "\n");
      parts.push(html);
    }
  }

  return parts.join("");
}

// ---------------------------------------------------------------------------
// Typing indicator with circuit breaker (like OpenClaw)
// ---------------------------------------------------------------------------

/** Consecutive 401 failures before suspending chat actions. */
const MAX_401_FAILURES = 10;
/** Max backoff between typing pings (ms). */
const MAX_BACKOFF_MS = 300_000; // 5 min

let consecutive401 = 0;
let backoffMs = 4000;
let suspended = false;

/** Start sending "typing" action with circuit breaker. Returns stop function. */
function startTyping(ctx: Context): () => void {
  let running = true;
  const typingInterval = 3000; // Send typing action every 3 seconds (Telegram timeout is ~5 sec)

  const tick = async () => {
    // Send first typing indicator immediately
    try {
      await ctx.replyWithChatAction("typing");
      console.log("⏳ Typing indicator started");
    } catch (err) {
      // Silently fail on first attempt
    }

    while (running) {
      if (suspended) {
        await sleep(backoffMs);
        continue;
      }
      try {
        await ctx.replyWithChatAction("typing");
        // Success — reset backoff
        if (consecutive401 > 0) {
          consecutive401 = 0;
          backoffMs = 4000;
          suspended = false;
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("401") || msg.includes("Unauthorized")) {
          consecutive401++;
          backoffMs = Math.min(backoffMs * 2, MAX_BACKOFF_MS);
          if (consecutive401 >= MAX_401_FAILURES) {
            suspended = true;
          }
        }
        // Other errors — just skip this tick
      }
      // Wait before next typing indicator
      await sleep(typingInterval);
    }
  };

  // Start typing in background (don't await)
  tick().catch(() => {});
  
  return () => { 
    running = false;
    console.log("⏸ Typing indicator stopped");
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ---------------------------------------------------------------------------
// Message delivery with chunking
// ---------------------------------------------------------------------------

/** Send text as HTML, chunking if needed. Falls back to plain text on parse error. */
async function replyHtml(ctx: Context, text: string): Promise<void> {
  const html = markdownToTelegramHtml(text);
  const chunks = chunkText(html, MAX_MSG_LEN);

  for (const chunk of chunks) {
    try {
      console.log(`📤 Sending HTML message (${chunk.length} chars)...`);
      await ctx.reply(chunk, { parse_mode: "HTML" });
      console.log(`✅ HTML message sent successfully`);
    } catch (err) {
      console.error(`❌ HTML send failed:`, err instanceof Error ? err.message : err);
      // HTML parse failed — send as plain text
      const plainChunks = chunkText(text, MAX_MSG_LEN);
      for (const pc of plainChunks) {
        try {
          console.log(`📤 Sending plain text message (${pc.length} chars)...`);
          await ctx.reply(pc);
          console.log(`✅ Plain text message sent successfully`);
        } catch (e) {
          console.error(`❌ Plain text send failed:`, e instanceof Error ? e.message : e);
        }
      }
      return;
    }
  }
}

/** Split text into chunks respecting max length, trying to break at newlines. */
function chunkText(text: string, maxLen: number): string[] {
  if (text.length <= maxLen) return [text];

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= maxLen) {
      chunks.push(remaining);
      break;
    }

    // Try to break at last newline within limit
    let breakAt = remaining.lastIndexOf("\n", maxLen);
    if (breakAt <= 0) {
      // No good newline — break at last space
      breakAt = remaining.lastIndexOf(" ", maxLen);
    }
    if (breakAt <= 0) {
      // No space either — hard break
      breakAt = maxLen;
    }

    chunks.push(remaining.slice(0, breakAt));
    remaining = remaining.slice(breakAt).trimStart();
  }

  return chunks;
}

/** File extension to Telegram send method mapping. */
const VIDEO_EXTS = new Set([".mp4", ".webm", ".mkv", ".avi", ".mov"]);
const AUDIO_EXTS = new Set([".mp3", ".ogg", ".wav", ".flac", ".m4a", ".aac", ".opus"]);

/** Deliver an OutgoingMessage through the appropriate Telegram media type. */
async function deliver(
  ctx: Context,
  response: OutgoingMessage,
  voiceConfig?: Record<string, unknown>,
  videoConfig?: Record<string, unknown>,
): Promise<void> {
  console.log(`📤 deliver() called, mode=${response.mode}, text_length=${response.text?.length ?? 0}`);
  const mode = response.mode ?? "text";

  // If response has a local file to send
  if (response.mediaPath && fs.existsSync(response.mediaPath)) {
    try {
      const { InputFile } = await import("grammy");
      const ext = path.extname(response.mediaPath).toLowerCase();
      const caption = response.text ? markdownToTelegramHtml(response.text).slice(0, 1024) : undefined;
      const parseMode = caption ? ("HTML" as const) : undefined;
      const file = new InputFile(response.mediaPath);

      if (VIDEO_EXTS.has(ext)) {
        await ctx.replyWithVideo(file, { caption, parse_mode: parseMode });
      } else if (AUDIO_EXTS.has(ext)) {
        await ctx.replyWithAudio(file, { caption, parse_mode: parseMode });
      } else {
        await ctx.replyWithDocument(file, { caption, parse_mode: parseMode });
      }
      return;
    } catch (err) {
      console.error("Failed to send file:", err instanceof Error ? err.message : err);
      // Fall through to text delivery
    }
  }

  // If response has a media URL (e.g. from selfie/image_gen tool), send as photo
  if (response.mediaUrl) {
    try {
      let buffer: Buffer;
      if (response.mediaUrl.startsWith("data:")) {
        const base64 = response.mediaUrl.replace(/^data:image\/[^;]+;base64,/, "");
        buffer = Buffer.from(base64, "base64");
      } else {
        const imgRes = await fetch(response.mediaUrl);
        buffer = Buffer.from(await imgRes.arrayBuffer());
      }
      const { InputFile } = await import("grammy");
      const caption = response.text ? markdownToTelegramHtml(response.text) : undefined;
      await ctx.replyWithPhoto(new InputFile(buffer, "selfie.jpg"), {
        caption,
        parse_mode: caption ? "HTML" : undefined,
      });
      console.log(`📸 Photo sent successfully (${buffer.length} bytes)`);
      return;
    } catch (err) {
      console.error(`❌ replyWithPhoto failed: ${err instanceof Error ? err.message : err}`);
      // Fall through to text delivery
    }
  }

  if (mode === "voice") {
    console.log(`🎙️ Voice mode detected`);
    const sent = await sendVoiceResponse(ctx as never, response.text, voiceConfig ?? {});
    if (!sent) await replyHtml(ctx, response.text);
    return;
  }

  if (mode === "video") {
    console.log(`🎬 Video mode detected`);
    const model = (videoConfig?.model as string) || "google/veo-3.1";
    const sent = await sendVideoNoteHubris(ctx as never, response.text, apiKey ?? "", model);
    if (!sent) await replyHtml(ctx, response.text);
    return;
  }

  console.log(`📝 Calling replyHtml with text (${response.text?.length ?? 0} chars)`);
  await replyHtml(ctx, response.text);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Extract the text body after a slash-command prefix. */
function commandBody(ctx: Context, command: string): string {
  const raw = ctx.message?.text ?? "";
  return raw.replace(new RegExp(`^/${command}\\s*`), "");
}

/** Download a Telegram photo (largest size) as base64. */
async function downloadPhotoBase64(ctx: Context, photo: { file_id: string }[], botToken: string): Promise<string | null> {
  try {
    const fileId = photo[photo.length - 1].file_id;
    const file = await ctx.api.getFile(fileId);
    const fileUrl = `https://api.telegram.org/file/bot${botToken}/${file.file_path}`;
    const res = await fetch(fileUrl);
    const buffer = Buffer.from(await res.arrayBuffer());
    return buffer.toString("base64");
  } catch {
    return null;
  }
}

/** Convert a grammY Context into a channel-neutral IncomingMessage. */
async function toIncoming(ctx: Context, text: string, botToken: string): Promise<IncomingMessage> {
  const reply = ctx.message?.reply_to_message;
  const replyToText = reply?.text ?? reply?.caption;

  // Collect images: from the message itself and from the replied-to message
  const images: string[] = [];
  const msgPhoto = ctx.message?.photo;
  if (msgPhoto?.length) {
    const b64 = await downloadPhotoBase64(ctx, msgPhoto, botToken);
    if (b64) images.push(b64);
  }
  const replyPhoto = reply?.photo;
  if (replyPhoto?.length) {
    const b64 = await downloadPhotoBase64(ctx, replyPhoto, botToken);
    if (b64) images.push(b64);
  }

  return {
    channelName: "telegram",
    userId: String(ctx.chat?.id ?? ctx.from?.id ?? "unknown"),
    text,
    timestamp: Date.now(),
    metadata: {
      messageId: ctx.message?.message_id,
      fromUsername: ctx.from?.username,
      firstName: ctx.from?.first_name,
      ...(replyToText && { replyToText }),
    },
    ...(images.length && { images }),
  };
}

/** Human-readable tool names for status messages. */
const TOOL_LABELS: Record<string, string> = {
  shell: "выполняю команду",
  files: "работаю с файлами",
  http: "делаю HTTP-запрос",
  browser: "открываю браузер",
  memory: "ищу в памяти",
  npm_install: "устанавливаю пакет",
  self_config: "меняю настройки",
  scheduler: "настраиваю расписание",
  ssh: "подключаюсь по SSH",
};

// ---------------------------------------------------------------------------
// Handler registration
// ---------------------------------------------------------------------------

/** Callback to update selfie reference photo URL. */
export type SetReferencePhotoFn = (url: string) => void;

/** Callback when first user claims ownership. */
export type OnOwnerClaimedFn = (chatId: number) => void;

export function registerHandlers(
  bot: Bot,
  handler: MessageHandler,
  ownerChatId: number | null,
  onSetReferencePhoto?: SetReferencePhotoFn,
  onOwnerClaimed?: OnOwnerClaimedFn,
  voiceConfig?: Record<string, unknown>,
  videoConfig?: Record<string, unknown>,
  apiKey?: string,
  subscriptionStore?: SubscriptionStore,
  publicMode?: boolean,
): void {
  // --- Owner tracking (admin) + subscription/limit check ---
  let currentOwner = ownerChatId;

  bot.use(async (ctx, next) => {
    const chatId = ctx.chat?.id;
    if (!chatId) return next();

    // First user claims ownership when no owner is configured (private mode only).
    if (!publicMode && currentOwner === null) {
      currentOwner = chatId;
      onOwnerClaimed?.(chatId);
      console.log(`🔒 Владелец бота установлен: ${chatId}`);
    }

    if (publicMode) {
      // Public mode: enforce subscription tiers and daily message limits.
      if (subscriptionStore) {
        subscriptionStore.getOrCreateSubscription(String(chatId), "telegram");
        if (subscriptionStore.isOverDailyLimit(String(chatId), "telegram")) {
          await ctx.reply("Сегодня лимит сообщений исчерпан (20). Возвращайся завтра! 🌙");
          console.log(`⛔ Лимит исчерпан для пользователя: ${chatId}`);
          return;
        }
        // Warn softly when the user is close to the daily limit.
        const tier = subscriptionStore.getSubscription(String(chatId), "telegram")?.tier ?? "free";
        const limit = subscriptionStore.getDailyLimit(tier);
        if (Number.isFinite(limit)) {
          const today = new Date().toISOString().slice(0, 10);
          const used = subscriptionStore.getDailyUsage(String(chatId), today, "telegram");
          const remaining = limit - used;
          if (remaining > 0 && remaining <= WARN_THRESHOLD) {
            await ctx.reply(`⚠️ Осталось ${remaining} ${pluralMsg(remaining)} на сегодня (лимит ${limit} в день).`);
            console.log(`⚠️ Предупреждение о лимите для пользователя: ${chatId} (осталось ${remaining})`);
          }
        }
      }
    } else if (subscriptionStore && chatId !== currentOwner) {
      // Private mode — only owner allowed
      await ctx.reply("Извини, бот сейчас в приватном режиме. Только для владельца.");
      console.log(`🚫 Заблокирован сторонний пользователь: ${chatId}`);
      return;
    }

    await next();

    // Count the processed message toward the daily usage (public mode only).
    if (publicMode && subscriptionStore && ctx.message) {
      subscriptionStore.incrementDailyUsage(String(chatId), "telegram");
    }
  });

  /** Handle message with typing indicator and tool progress. */
  async function handleWithTyping(
    ctx: Context,
    text: string,
    modeOverride?: OutgoingMessage["mode"],
  ): Promise<void> {
    console.log("🔵 handleWithTyping called for:", text.slice(0, 50));
    const stopTyping = startTyping(ctx);
    const chatId = ctx.chat!.id;

    let statusMsgId: number | null = null;

    const onProgress: ProgressCallback = (event) => {
      if (event.type === "text_chunk") {
        if (statusMsgId) {
          ctx.api.deleteMessage(chatId, statusMsgId).catch(() => {});
          statusMsgId = null;
        }
        return;
      }

      if (event.type === "tool_start") {
        const label = TOOL_LABELS[event.tool];
        if (!label) return;
        const statusText = `⏳ ${label}...`;
        if (statusMsgId) {
          ctx.api.editMessageText(chatId, statusMsgId, statusText).catch(() => {});
        } else {
          ctx.reply(statusText).then((msg) => { statusMsgId = msg.message_id; }).catch(() => {});
        }
        return;
      }

      if (event.type === "turn_complete" && event.turn > 1 && statusMsgId) {
        ctx.api.editMessageText(chatId, statusMsgId, `🔄 Думаю... (шаг ${event.turn})`).catch(() => {});
      }
    };

    try {
      const response = await handler(await toIncoming(ctx, text, bot.token), onProgress);
      stopTyping();

      if (statusMsgId) {
        ctx.api.deleteMessage(chatId, statusMsgId).catch(() => {});
      }

      await deliver(ctx, modeOverride ? { ...response, mode: modeOverride } : response, voiceConfig, videoConfig);
    } catch (err) {
      stopTyping();
      if (statusMsgId) {
        ctx.api.deleteMessage(chatId, statusMsgId).catch(() => {});
      }
      const msg = err instanceof Error ? err.message : String(err);
      await ctx.reply(`Ошибка: ${msg}`);
    }
  }

  // /start
  bot.command("start", async (ctx) => {
    const chatId = String(ctx.chat?.id ?? "");
    if (publicMode && chatId && !getUserGender(chatId)) {
      await ctx.reply(
        "Привет! Я твой персональный помощник по здоровью — тренировки, питание, поддержка.\n\n" +
          "Кем тебе удобнее со мной общаться — выбери 👨 или 👩",
        {
          reply_markup: {
            inline_keyboard: [
              [
                { text: "👨 Тренер-мужчина", callback_data: "gender:male" },
                { text: "👩 Тренер-женщина", callback_data: "gender:female" },
              ],
            ],
          },
        },
      );
      return;
    }
    await handleWithTyping(ctx, "/start");
  });

  // Gender choice callback
  bot.on("callback_query:data", async (ctx) => {
    const data = ctx.callbackQuery.data;
    if (!data?.startsWith("gender:")) return;
    const gender = data.split(":")[1];
    const chatId = String(ctx.chat?.id ?? "");
    if (gender !== "male" && gender !== "female") return;
    setUserGender(chatId, gender);
    await ctx.answerCallbackQuery();

    const firstName = ctx.from?.first_name ?? "";
    const greet = firstName ? `${firstName}, привет!` : "Привет!";
    const who = gender === "male"
      ? "Я — твой персональный тренер 👨"
      : "Я — твой персональный тренер 👩";

    const capabilities = [
      "🏋️ Тренировки — составлю план для дома или зала, подскажу технику и прогресс",
      "🥗 Питание — проанализирую фото еды, посчитаю калории и БЖУ, составлю меню",
      "📔 Дневник питания — запомню, что ты ел, и подведу итог дня",
      "🧠 Поддержка — помогу с мотивацией, настроением и самооценкой",
      "💬 Друг — выслушаю и поддержу в любых начинаниях",
      "🎙️ Голосовые — могу отвечать голосом, если попросишь",
      "⏰ Напоминания — напомню про тренировку, воду или приём пищи",
      "🧠 Память — запомню о тебе важное, чтобы лучше помогать",
    ].join("\n");

    const getToKnow = [
      "Расскажи о себе, чтобы я лучше помогал:",
      "• Как тебя зовут?",
      "• Сколько тебе лет?",
      "• Какой у тебя рост и вес?",
      "• Твоя цель (похудеть, набрать массу, подтянуться, лучше питаться)?",
      "• Как часто занимаешься и есть ли проблемы со здоровьем (например, диета)?",
    ].join("\n");

    await ctx.reply(
      `${greet} 🎉\n\n` +
        `${who}\n` +
        `Я помогу тебе с тренировками, питанием, мотивацией и просто буду рядом.\n\n` +
        `✨ Что я умею:\n${capabilities}\n\n` +
        `🤝 Давай познакомимся!\n${getToKnow}\n\n` +
        `Можешь просто написать всё сразу или по частям — я всё запомню. 😊`,
    );
  });
  // /status — show current plan, daily usage and available features
  bot.command("status", async (ctx) => {
    const chatId = String(ctx.chat?.id ?? "");
    if (!publicMode || !subscriptionStore) {
      await handleWithTyping(ctx, "/status");
      return;
    }
    const sub = subscriptionStore.getOrCreateSubscription(chatId, "telegram");
    const today = new Date().toISOString().slice(0, 10);
    const used = subscriptionStore.getDailyUsage(chatId, today, "telegram");
    const tier = sub.tier;
    const limit = subscriptionStore.getDailyLimit(tier);
    const features = subscriptionStore.getFeatures(tier);

    const tierLabel: Record<Tier, string> = {
      free: "Бесплатный",
      trial: "Пробный (триал)",
      pro: "PRO",
      premium: "PREMIUM",
    };
    const featureLabel: Record<Feature, string> = {
      text_chat: "💬 Общение",
      voice_input: "🎤 Голосовые сообщения",
      voice_output: "🎙️ Ответы голосом",
      food_analysis: "🥗 Анализ еды",
      image_gen: "🖼️ Генерация картинок",
      selfie: "📸 Селфи",
      scheduler: "⏰ Напоминания",
      web_search: "🌐 Поиск в интернете",
    };

    let trialInfo = "";
    if (tier === "trial" && sub.trialEnd) {
      const hoursLeft = Math.max(0, Math.ceil((sub.trialEnd - Date.now()) / 3_600_000));
      trialInfo = hoursLeft > 0
        ? `⏳ Триал истекает через ~${hoursLeft} ч\n`
        : "⏳ Триал истёк\n";
    }

    const limitText = Number.isFinite(limit)
      ? `📨 Сообщений сегодня: ${used} / ${limit}`
      : `📨 Сообщений сегодня: ${used} (безлимит)`;

    const featuresText = [...features].map((f) => `• ${featureLabel[f] ?? f}`).join("\n");

    await ctx.reply(
      `📊 Твой статус\n\n` +
      `💳 Тариф: ${tierLabel[tier]}\n` +
      `${trialInfo}` +
      `${limitText}\n\n` +
      `✨ Доступно:\n${featuresText}\n\n` +
      `🔧 Команды: /help — возможности, /status — этот экран`,
    );
  });

  // /help — static list of commands and capabilities
  bot.command("help", async (ctx) => {
    await ctx.reply(
      `🤖 Я — твой персональный тренер и помощник по здоровью\n\n` +
      `🏋️ Тренировки — планы для дома и зала, техника, прогресс\n` +
      `🥗 Питание — анализ фото еды, калории и БЖУ, меню\n` +
      `📔 Дневник питания — запомню, что ты ел, подведу итог\n` +
      `🧠 Поддержка — мотивация, настроение, самооценка\n` +
      `💬 Друг — выслушаю и поддержу\n` +
      `🎙️ Голосовые — скажи «ответь голосом» и я озвучу ответ\n` +
      `⏰ Напоминания — «напомни через 2 часа выпить воды»\n` +
      `🧠 Память — я запомню о тебе важное\n\n` +
      `🔧 Команды:\n` +
      `/help — эта справка\n` +
      `/status — тариф и лимит сообщений\n\n` +
      `Просто напиши, с чем помочь — и начнём! 😊`,
    );
  });

  // /voice <text>
  bot.command("voice", async (ctx) => {
    console.log(`🎙️ /voice command received`);
    const body = commandBody(ctx, "voice");
    console.log(`📝 Voice command body: "${body}"`);
    if (!body) { await ctx.reply("Usage: /voice <text to speak>"); return; }
    console.log(`🔊 Calling handleWithTyping with mode='voice'`);
    await handleWithTyping(ctx, body, "voice");
  });

  // /video <text>
  bot.command("video", async (ctx) => {
    const body = commandBody(ctx, "video");
    if (!body) { await ctx.reply("Usage: /video <text for lip-sync>"); return; }
    await handleWithTyping(ctx, body, "video");
  });

  // /selfie <prompt>
  bot.command("selfie", async (ctx) => {
    const body = commandBody(ctx, "selfie");
    if (!body) { await ctx.reply("Usage: /selfie <description>"); return; }
    await handleWithTyping(ctx, `Сделай селфи: ${body}`);
  });

  // /setphoto — set reference photo for selfie generation (saved locally)
  bot.command("setphoto", async (ctx) => {
    const photo = ctx.message?.reply_to_message?.photo ?? ctx.message?.photo;
    if (!photo?.length) {
      await ctx.reply("Отправь фото или ответь на фото командой /setphoto");
      return;
    }
    try {
      const fileId = photo[photo.length - 1].file_id;
      const file = await ctx.api.getFile(fileId);
      if (!file.file_path) {
        await ctx.reply("Не удалось получить путь к файлу");
        return;
      }
      const token = bot.token;
      const fileUrl = `https://api.telegram.org/file/bot${token}/${file.file_path}`;
      const res = await fetch(fileUrl);
      if (!res.ok) {
        await ctx.reply("Не удалось скачать фото");
        return;
      }
      const buffer = Buffer.from(await res.arrayBuffer());
      const savePath = path.join(os.homedir(), ".betsy", "reference.jpg");
      fs.mkdirSync(path.dirname(savePath), { recursive: true });
      fs.writeFileSync(savePath, buffer);
      onSetReferencePhoto?.(savePath);
      await ctx.reply("✅ Фото сохранено как референс для селфи");
    } catch (err) {
      console.error("❌ /setphoto error:", err instanceof Error ? err.message : err);
      await ctx.reply("Не удалось обработать фото");
    }
  });

  // /study
  bot.command("study", (ctx) => handleWithTyping(ctx, "/study"));
  // /settings
  bot.command("settings", (ctx) => handleWithTyping(ctx, "/settings"));

  // Photos: /setphoto saves reference, everything else is sent to the LLM
  bot.on("message:photo", async (ctx) => {
    const caption = ctx.message.caption?.trim();

    // /setphoto — save reference photo
    if (caption === "/setphoto") {
      const photo = ctx.message.photo;
      if (!photo || photo.length === 0) {
        await ctx.reply("Нет фото в сообщении");
        return;
      }
      try {
        const fileId = photo[photo.length - 1].file_id;
        const file = await ctx.api.getFile(fileId);
        const token = bot.token;
        if (!file.file_path) {
          await ctx.reply("Не удалось получить путь к файлу");
          return;
        }
        const fileUrl = `https://api.telegram.org/file/bot${token}/${file.file_path}`;
        const res = await fetch(fileUrl);
        if (!res.ok) {
          await ctx.reply("Не удалось скачать фото");
          return;
        }
        const buffer = Buffer.from(await res.arrayBuffer());
        const savePath = path.join(os.homedir(), ".betsy", "reference.jpg");
        fs.mkdirSync(path.dirname(savePath), { recursive: true });
        fs.writeFileSync(savePath, buffer);
        onSetReferencePhoto?.(savePath);
        await ctx.reply("✅ Фото сохранено как референс для селфи");
      } catch (err) {
        console.error("❌ /setphoto (photo msg) error:", err instanceof Error ? err.message : err);
        await ctx.reply("Не удалось обработать фото");
      }
      return;
    }

    // Regular photo — send to LLM with caption as text
    await handleWithTyping(ctx, caption || "Что на этом фото?");
  });

  // Plain text messages (including unregistered /commands — let LLM handle them)
  bot.on("message:text", async (ctx) => {
    const userText = ctx.message.text;
    await handleWithTyping(ctx, userText);
  });

// Voice messages — transcribe with OpenRouter Whisper
  bot.on("message:voice", async (ctx) => {
    try {
      const voice = ctx.message.voice;
      if (!voice) return;

      console.log(`🎙️ Получено голосовое (${voice.duration}s)`);

      // Download voice file
      const file = await ctx.api.getFile(voice.file_id);
      const token = bot.token;
      const fileUrl = `https://api.telegram.org/file/bot${token}/${file.file_path}`;
      const res = await fetch(fileUrl);
      const audioBuffer = Buffer.from(await res.arrayBuffer());

      // Send to OpenRouter Whisper for transcription
      if (!apiKey) {
        await ctx.reply("API ключ не найден для распознавания речи 😔");
        return;
      }

      console.log(`🔊 Отправляю на распознавание в OpenRouter...`);
      
      const formData = new FormData();
      const blob = new Blob([audioBuffer], { type: "audio/ogg" });
      formData.append("file", blob, "voice.ogg");
      formData.append("model", "openai/whisper-1");

      const whisperRes = await fetch("https://openrouter.ai/api/v1/audio/transcriptions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: formData,
      });

      if (!whisperRes.ok) {
        const errText = await whisperRes.text();
        console.error(`❌ Whisper error: ${whisperRes.status}`, errText.slice(0, 200));
        await ctx.reply("Не удалось распознать речь. Попробуй написать текстом! 😊");
        return;
      }

      const whisperData = await whisperRes.json() as { text?: string };
      const recognizedText = whisperData?.text?.trim() || "";
      
      if (!recognizedText) {
        await ctx.reply("Ничего не расслышал. Повтори, пожалуйста! 🎤");
        return;
      }

      console.log(`✅ Распознано: "${recognizedText}"`);
      // Process the recognized text as a voice command (respond with voice)
      await handleWithTyping(ctx, recognizedText, "voice");
    } catch (err) {
      console.error("❌ Ошибка обработки голосового:", err instanceof Error ? err.message : err);
      await ctx.reply("Ошибка при обработке голосового 😔");
    }
  });
}
