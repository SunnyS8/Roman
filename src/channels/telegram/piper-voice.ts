import { execSync, spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

/**
 * Synthesize speech using Piper TTS (runs locally, free, no API key needed)
 * Supports Russian and many other languages
 * Download models from https://huggingface.co/rhasspy/piper
 */
export async function synthesizeSpeechPiper(
  text: string,
  voiceId: string = "ru_RU-irina-medium"
): Promise<Buffer | null> {
  try {
    // Check if piper is installed
    try {
      execSync("piper --version", { stdio: "pipe" });
    } catch {
      console.warn("⚠️ Piper TTS not installed. Install with: pip install piper-tts");
      return null;
    }

    const outputFile = path.join(os.tmpdir(), `roman-voice-${Date.now()}.wav`);

    console.log(`🎤 Synthesizing speech with Piper (${voiceId})...`);

    // Run piper command
    return new Promise((resolve, reject) => {
      const piper = spawn("piper", [
        "--model",
        voiceId,
        "--output_file",
        outputFile,
        "--output_format",
        "wav",
      ]);

      let stderr = "";

      piper.stdin?.write(text);
      piper.stdin?.end();

      piper.stderr?.on("data", (data) => {
        stderr += data.toString();
      });

      piper.on("close", (code) => {
        if (code !== 0) {
          console.error("❌ Piper error:", stderr);
          reject(new Error(`Piper exited with code ${code}`));
          return;
        }

        try {
          if (!fs.existsSync(outputFile)) {
            console.error("❌ Piper output file not created");
            resolve(null);
            return;
          }

          const buffer = fs.readFileSync(outputFile);
          fs.unlinkSync(outputFile);

          console.log("✅ Speech synthesized");
          resolve(buffer);
        } catch (err) {
          console.error("❌ Error reading audio file:", err);
          resolve(null);
        }
      });

      piper.on("error", (err) => {
        console.error("❌ Piper spawn error:", err);
        reject(err);
      });
    });
  } catch (err) {
    console.error("❌ Piper TTS error:", err);
    return null;
  }
}

/** Send voice message through Telegram. Falls back to text. */
export async function sendVoiceResponsePiper(
  ctx: {
    replyWithVoice: (file: unknown) => Promise<unknown>;
  },
  text: string,
  voiceId?: string
): Promise<boolean> {
  const audio = await synthesizeSpeechPiper(text, voiceId);

  if (!audio) {
    console.warn("⚠️ Voice synthesis failed, falling back to text");
    return false;
  }

  const tmpFile = path.join(os.tmpdir(), `roman-voice-${Date.now()}.ogg`);
  try {
    fs.writeFileSync(tmpFile, audio);
    const { InputFile } = await import("grammy");
    const file = new InputFile(tmpFile);

    await ctx.replyWithVoice(file);
    console.log("✅ Voice message sent to Telegram");
    return true;
  } catch (err) {
    console.error("❌ Error sending voice:", err);
    return false;
  } finally {
    try {
      fs.unlinkSync(tmpFile);
    } catch {
      /* ignore */
    }
  }
}
