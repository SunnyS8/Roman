import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { synthesizePiper } from "./piper-voice.js";

/** Synthesize speech via local Piper TTS. */
export async function synthesizeSpeech(
  text: string,
  voiceConfig: Record<string, unknown>,
  _falApiKey?: string,
): Promise<Buffer | null> {
  const provider = (voiceConfig.tts_provider as string) ?? "piper";

  if (provider === "piper") {
    const voiceId = (voiceConfig.voice_id as string) ?? "ru_RU-irina-medium";
    console.log(`🎤 Synthesizing with Piper TTS (voice_id=${voiceId})`);
    return synthesizePiper(text, voiceId);
  }

  console.error(`❌ Unknown TTS provider: ${provider}`);
  return null;
}

/** Send a voice response through a grammY context. */
export async function sendVoiceResponse(
  ctx: { replyWithVoice: (file: unknown) => Promise<unknown> },
  text: string,
  voiceConfig: Record<string, unknown>,
): Promise<boolean> {
  const audio = await synthesizeSpeech(text, voiceConfig);

  if (!audio) {
    console.error(`❌ synthesizeSpeech returned null`);
    return false;
  }

  const tmpFile = path.join(os.tmpdir(), `betsy-tts-${Date.now()}.wav`);
  try {
    fs.writeFileSync(tmpFile, audio);
    const { InputFile } = await import("grammy");
    await ctx.replyWithVoice(new InputFile(tmpFile));
    console.log(`✅ Sent voice message to Telegram`);
    return true;
  } catch (err) {
    console.error(`❌ Error sending voice:`, err instanceof Error ? err.message : err);
    return false;
  } finally {
    try { fs.unlinkSync(tmpFile); } catch { /* ignore */ }
  }
}
