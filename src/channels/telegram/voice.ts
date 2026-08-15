import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { synthesizePiper, synthesizeSilero } from "./piper-voice.js";

/** Synthesize speech via local TTS (edge-tts or Silero). */
export async function synthesizeSpeech(
  text: string,
  voiceConfig: Record<string, unknown>,
  _falApiKey?: string,
): Promise<Buffer | null> {
  const provider = (voiceConfig.tts_provider as string) ?? "piper";

  if (provider === "silero") {
    const speaker = (voiceConfig.silero_speaker as string) ?? "baya";
    console.log(`🎤 Synthesizing with Silero TTS (speaker=${speaker})`);
    return synthesizeSilero(text, speaker);
  }

  // "piper" (and default) -> actually edge-tts
  const voiceId = (voiceConfig.voice_id as string) ?? "ru-RU-DmitryNeural";
  console.log(`🎤 Synthesizing with edge-tts (voice_id=${voiceId})`);
  return synthesizePiper(text, voiceId);
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
