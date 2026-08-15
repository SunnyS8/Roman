import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

/** Strip emojis and other non-spoken characters from text for TTS. */
function stripEmojis(text: string): string {
  return text
    .replace(/[\u{1F000}-\u{1FFFF}]|[\u{200D}]|[\u{FE00}-\u{FE0F}]|[\u{2702}-\u{27B0}]|[\u{24C2}-\u{1F251}]|[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2934}-\u{2935}]|[\u{2B05}-\u{2B55}]|[\u{3030}]|[\u{303D}]|[\u{3297}]|[\u{3299}]/gu, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** Resolve path to a script in the project scripts/ directory. */
function scriptPath(name: string): string {
  return path.join(process.cwd(), "scripts", name);
}

/** Synthesize speech using edge-tts (free, Microsoft Edge). */
export async function synthesizePiper(text: string, voiceId: string = "ru-RU-DmitryNeural"): Promise<Buffer | null> {
  const cleanText = stripEmojis(text);
  if (!cleanText) {
    console.warn("⚠️ edge-tts: empty text after stripping emojis");
    return null;
  }

  const tmpFile = path.join(os.tmpdir(), `edge-tts-${Date.now()}.mp3`);

  return new Promise((resolve) => {
    let stderr = "";
    const proc = spawn("edge-tts", [
      "--voice", voiceId,
      "--text", cleanText,
      "--write-media", tmpFile,
    ], { stdio: ["ignore", "pipe", "pipe"] });

    proc.stdout?.on("data", () => {});
    proc.stderr?.on("data", (chunk: Buffer) => { stderr += chunk.toString(); });
    proc.on("error", (err) => {
      console.error(`❌ edge-tts process error:`, err.message);
      resolve(null);
    });
    proc.on("exit", (code) => {
      if (code !== 0) {
        console.error(`❌ edge-tts exited with code ${code}:`, stderr.slice(0, 300));
        resolve(null);
        return;
      }
      try {
        const audio = fs.readFileSync(tmpFile);
        if (audio.length === 0) {
          console.error(`❌ edge-tts produced empty file`);
          resolve(null);
          return;
        }
        console.log(`✅ edge-tts generated ${audio.length} bytes`);
        resolve(audio);
      } catch (err) {
        console.error(`❌ edge-tts output error:`, err);
        resolve(null);
      } finally {
        try { fs.unlinkSync(tmpFile); } catch { /* ignore */ }
      }
    });
  });
}

/** Synthesize speech using Silero TTS (local, PyTorch). */
export async function synthesizeSilero(text: string, speaker: string = "baya"): Promise<Buffer | null> {
  const cleanText = stripEmojis(text);
  if (!cleanText) {
    console.warn("⚠️ silero: empty text after stripping emojis");
    return null;
  }

  const script = scriptPath("silero-tts.py");

  return new Promise((resolve) => {
    let stderr = "";
    const chunks: Buffer[] = [];
    const proc = spawn("python", [script, cleanText, speaker], {
      stdio: ["ignore", "pipe", "pipe"],
    });

    proc.stdout?.on("data", (chunk: Buffer) => { chunks.push(chunk); });
    proc.stderr?.on("data", (chunk: Buffer) => { stderr += chunk.toString(); });
    proc.on("error", (err) => {
      console.error(`❌ silero process error:`, err.message);
      resolve(null);
    });
    proc.on("exit", (code) => {
      if (code !== 0) {
        console.error(`❌ silero exited with code ${code}:`, stderr.slice(0, 300));
        resolve(null);
        return;
      }
      const audio = Buffer.concat(chunks);
      if (audio.length < 44) {
        console.error(`❌ silero produced too little data (${audio.length} bytes)`);
        resolve(null);
        return;
      }
      console.log(`✅ silero generated ${audio.length} bytes (speaker=${speaker})`);
      resolve(audio);
    });
  });
}
