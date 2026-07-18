import fs from "node:fs";
import path from "node:path";
import os from "node:os";

/**
 * Generate video using Hubris Veo 3.1, Sora 2 Pro, or Kling
 * Works from Russia with ruble payments
 */
export async function generateVideoHubris(
  text: string,
  hubrisApiKey: string,
  model: string = "google/veo-3.1"
): Promise<Buffer | null> {
  if (!hubrisApiKey) {
    console.error("❌ Hubris API key not configured");
    return null;
  }

  try {
    console.log(`🎬 Generating video with Hubris (${model})...`);

    // Call Hubris API to generate video
    const response = await fetch("https://api.hubris.pw/v1/videos", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${hubrisApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: text,
        model: model,
        duration: 10,
        resolution: "1080p",
        format: "mp4",
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`❌ Hubris video error ${response.status}:`, error);
      return null;
    }

    const data = (await response.json()) as Record<string, unknown>;
    const videoUrl = (data.video_url ?? data.url) as string | undefined;

    if (!videoUrl) {
      console.error("❌ No video URL in response");
      return null;
    }

    console.log(`✅ Video generated: ${videoUrl.slice(0, 50)}...`);

    // Download video
    const videoRes = await fetch(videoUrl);
    if (!videoRes.ok) {
      console.error("❌ Failed to download video");
      return null;
    }

    return Buffer.from(await videoRes.arrayBuffer());
  } catch (err) {
    console.error("❌ Hubris video generation error:", err);
    return null;
  }
}

/** Send video note through Telegram. Falls back to text. */
export async function sendVideoNoteHubris(
  ctx: {
    replyWithVideoNote: (file: unknown) => Promise<unknown>;
    replyWithVideo: (file: unknown) => Promise<unknown>;
    replyWithVoice: (file: unknown) => Promise<unknown>;
  },
  text: string,
  hubrisApiKey: string,
  model?: string
): Promise<boolean> {
  const video = await generateVideoHubris(text, hubrisApiKey, model);

  if (!video) {
    console.warn("⚠️ Video generation failed, falling back to text");
    return false;
  }

  const tmpFile = path.join(os.tmpdir(), `roman-video-${Date.now()}.mp4`);
  try {
    fs.writeFileSync(tmpFile, video);
    const { InputFile } = await import("grammy");
    const file = new InputFile(tmpFile);
    try {
      await ctx.replyWithVideoNote(file);
    } catch {
      // Fallback to regular video if video note fails
      await ctx.replyWithVideo(file);
    }
    console.log("✅ Video sent to Telegram");
    return true;
  } catch (err) {
    console.error("❌ Error sending video:", err);
    return false;
  } finally {
    try {
      fs.unlinkSync(tmpFile);
    } catch {
      /* ignore */
    }
  }
}
