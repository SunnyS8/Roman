import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const OR_ENDPOINT = "https://openrouter.ai/api/v1/videos";

/**
 * Generate video using OpenRouter Video API (Veo, Kling, etc.)
 * Async: submit → poll → download
 */
export async function generateVideoHubris(
  text: string,
  apiKey: string,
  model: string = "google/veo-3.1"
): Promise<Buffer | null> {
  if (!apiKey) {
    console.error("❌ OpenRouter API key not configured for video");
    return null;
  }

  try {
    console.log(`🎬 Generating video with OpenRouter (${model})...`);

    // Step 1: Submit job
    const submitRes = await fetch(OR_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        prompt: text,
        duration: 10,
        resolution: "720p",
      }),
    });

    if (!submitRes.ok) {
      const err = await submitRes.text();
      console.error(`❌ OpenRouter video submit error ${submitRes.status}:`, err.slice(0, 300));
      return null;
    }

    const job = (await submitRes.json()) as Record<string, unknown>;
    const jobId = job.id as string | undefined;
    if (!jobId) {
      console.error("❌ No job ID in OpenRouter response");
      return null;
    }

    console.log(`🎬 Video job submitted: ${jobId}`);

    // Step 2: Poll until completed (max 120s)
    const pollUrl = `${OR_ENDPOINT}/${jobId}`;
    const deadline = Date.now() + 120_000;
    let videoUrl: string | null = null;

    while (Date.now() < deadline) {
      await new Promise(r => setTimeout(r, 3000));

      const pollRes = await fetch(pollUrl, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      if (!pollRes.ok) {
        console.error(`❌ Poll error ${pollRes.status}`);
        return null;
      }

      const status = (await pollRes.json()) as Record<string, unknown>;
      const jobStatus = status.status as string;
      console.log(`  Video job status: ${jobStatus}`);

      if (jobStatus === "completed") {
        const urls = status.unsigned_urls as string[] | undefined;
        videoUrl = urls?.[0] ?? null;
        if (!videoUrl) {
          // Try content endpoint
          const contentUrl = (status as any).content_url as string | undefined;
          if (contentUrl) videoUrl = contentUrl;
        }
        break;
      }

      if (jobStatus === "failed" || jobStatus === "error") {
        const errMsg = (status.error as string) || "unknown error";
        console.error(`❌ Video generation failed: ${errMsg}`);
        return null;
      }

      // Still processing — continue polling
    }

    if (!videoUrl) {
      console.error("❌ No video URL after polling completion");
      return null;
    }

    console.log(`✅ Video generated: ${videoUrl.slice(0, 60)}...`);

    // Step 3: Download
    const videoRes = await fetch(videoUrl);
    if (!videoRes.ok) {
      console.error(`❌ Failed to download video: ${videoRes.status}`);
      return null;
    }

    return Buffer.from(await videoRes.arrayBuffer());
  } catch (err) {
    console.error("❌ Video generation error:", err instanceof Error ? err.message : err);
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
  apiKey: string,
  model?: string
): Promise<boolean> {
  const video = await generateVideoHubris(text, apiKey, model);

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
    } catch { /* ignore */ }
  }
}
