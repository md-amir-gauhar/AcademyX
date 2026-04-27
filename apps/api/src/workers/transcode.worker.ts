import { Worker, type Job } from "bullmq";
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import ffmpeg from "fluent-ffmpeg";
import { eq } from "drizzle-orm";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";

import { db } from "../db";
import { mediaJobs } from "../db/schema";
import {
  bullConnection,
  QUEUE_NAMES,
  type MediaTranscodeJobData,
} from "./queue";

/* ─── Configuration ──────────────────────────────────────────────── */

if (process.env.FFMPEG_PATH) {
  ffmpeg.setFfmpegPath(process.env.FFMPEG_PATH);
}
if (process.env.FFPROBE_PATH) {
  ffmpeg.setFfprobePath(process.env.FFPROBE_PATH);
}

const BUCKET = process.env.AWS_S3_BUCKET || "queztlearn-uploads";
const REGION = process.env.AWS_REGION || "us-east-1";

const s3 = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

/* ─── Rendition ladder ───────────────────────────────────────────── */

interface Rendition {
  name: string;
  height: number;
  width: number;
  videoBitrate: string; // ffmpeg -b:v
  maxRate: string; // ffmpeg -maxrate
  bufSize: string; // ffmpeg -bufsize
  audioBitrate: string;
}

const RENDITIONS: Rendition[] = [
  {
    name: "480p",
    height: 480,
    width: 854,
    videoBitrate: "1400k",
    maxRate: "1500k",
    bufSize: "2100k",
    audioBitrate: "128k",
  },
  {
    name: "720p",
    height: 720,
    width: 1280,
    videoBitrate: "2800k",
    maxRate: "2996k",
    bufSize: "4200k",
    audioBitrate: "128k",
  },
  {
    name: "1080p",
    height: 1080,
    width: 1920,
    videoBitrate: "5000k",
    maxRate: "5350k",
    bufSize: "7500k",
    audioBitrate: "192k",
  },
];

/* ─── Helpers ────────────────────────────────────────────────────── */

function publicUrl(key: string): string {
  if (process.env.AWS_CLOUDFRONT_DOMAIN) {
    return `https://${process.env.AWS_CLOUDFRONT_DOMAIN}/${key}`;
  }
  return `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
}

interface ProbeResult {
  width: number;
  height: number;
  duration: number;
}

function probe(file: string): Promise<ProbeResult> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(file, (err, data) => {
      if (err) return reject(err);
      const stream = data.streams.find((s) => s.codec_type === "video");
      if (!stream) return reject(new Error("No video stream"));
      resolve({
        width: stream.width ?? 0,
        height: stream.height ?? 0,
        duration: Number(data.format.duration ?? stream.duration ?? 0),
      });
    });
  });
}

function transcodeOne(
  source: string,
  outDir: string,
  rendition: Rendition,
  onProgress?: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const playlistPath = path.join(outDir, "index.m3u8");
    const segmentPattern = path.join(outDir, "segment_%03d.ts");

    ffmpeg(source)
      .videoCodec("libx264")
      .audioCodec("aac")
      .outputOptions([
        "-preset veryfast",
        "-profile:v main",
        "-level 4.0",
        "-pix_fmt yuv420p",
        // Maintain aspect ratio while fitting inside the target box.
        `-vf scale='min(${rendition.width},iw)':'min(${rendition.height},ih)':force_original_aspect_ratio=decrease,pad=ceil(iw/2)*2:ceil(ih/2)*2`,
        `-b:v ${rendition.videoBitrate}`,
        `-maxrate ${rendition.maxRate}`,
        `-bufsize ${rendition.bufSize}`,
        `-b:a ${rendition.audioBitrate}`,
        "-ar 48000",
        "-ac 2",
        // HLS settings.
        "-f hls",
        "-hls_time 6",
        "-hls_playlist_type vod",
        "-hls_segment_type mpegts",
        "-hls_flags independent_segments",
        `-hls_segment_filename ${segmentPattern}`,
      ])
      .output(playlistPath)
      .on("progress", (p) => {
        if (onProgress && typeof p.percent === "number") {
          onProgress(Math.max(0, Math.min(100, p.percent)));
        }
      })
      .on("end", () => resolve())
      .on("error", (err) => reject(err))
      .run();
  });
}

function masterPlaylist(
  variants: Array<{ rendition: Rendition; uri: string; bandwidth: number }>,
): string {
  const lines = ["#EXTM3U", "#EXT-X-VERSION:3"];
  for (const v of variants) {
    lines.push(
      `#EXT-X-STREAM-INF:BANDWIDTH=${v.bandwidth},RESOLUTION=${v.rendition.width}x${v.rendition.height},NAME="${v.rendition.name}"`,
    );
    lines.push(v.uri);
  }
  return lines.join("\n") + "\n";
}

function bandwidthOf(rendition: Rendition): number {
  // Rough estimate: video kbps + audio kbps, in bits.
  const v = parseInt(rendition.videoBitrate, 10) * 1000;
  const a = parseInt(rendition.audioBitrate, 10) * 1000;
  return Math.round(v + a);
}

const HLS_CONTENT_TYPES: Record<string, string> = {
  ".m3u8": "application/vnd.apple.mpegurl",
  ".ts": "video/mp2t",
};

async function uploadDirectory(
  localDir: string,
  s3Prefix: string,
): Promise<void> {
  const entries = fs.readdirSync(localDir, { withFileTypes: true });
  await Promise.all(
    entries.map(async (entry) => {
      const local = path.join(localDir, entry.name);
      const remote = `${s3Prefix}/${entry.name}`;
      if (entry.isDirectory()) {
        await uploadDirectory(local, remote);
        return;
      }
      const body = fs.readFileSync(local);
      const ext = path.extname(entry.name).toLowerCase();
      const contentType = HLS_CONTENT_TYPES[ext] ?? "application/octet-stream";
      await s3.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: remote,
          Body: body,
          ContentType: contentType,
          CacheControl:
            ext === ".m3u8"
              ? "public, max-age=60"
              : "public, max-age=31536000, immutable",
        }),
      );
    }),
  );
}

async function downloadSource(key: string, dest: string): Promise<void> {
  const res = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
  if (!res.Body) throw new Error("S3 GetObject returned no body");
  await pipeline(res.Body as Readable, fs.createWriteStream(dest));
}

async function patchJob(
  id: string,
  patch: Partial<typeof mediaJobs.$inferInsert>,
) {
  await db
    .update(mediaJobs)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(mediaJobs.id, id));
}

/* ─── Worker ─────────────────────────────────────────────────────── */

async function processJob(
  job: Job<MediaTranscodeJobData>,
): Promise<{ hlsUrl: string }> {
  const { jobRowId, sourceKey, organizationId } = job.data;

  await patchJob(jobRowId, {
    status: "PROCESSING",
    startedAt: new Date(),
    progress: 0,
    error: null,
  });

  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), `hls-${jobRowId}-`));
  const sourcePath = path.join(workDir, "source");

  try {
    // 1. Download original
    await downloadSource(sourceKey, sourcePath);
    const sizeBytes = fs.statSync(sourcePath).size;
    await patchJob(jobRowId, { sizeBytes, progress: 5 });
    await job.updateProgress(5);

    // 2. Probe
    const probed = await probe(sourcePath);
    await patchJob(jobRowId, {
      width: probed.width,
      height: probed.height,
      durationSeconds: probed.duration,
      progress: 8,
    });

    // 3. Pick rendition ladder — skip variants larger than the source so we
    // never upscale (which inflates bitrate without adding quality).
    const ladder = RENDITIONS.filter((r) => r.height <= probed.height);
    const effective =
      ladder.length > 0 ? ladder : [RENDITIONS[0]]; // always emit at least one
    const variants: Array<{
      rendition: Rendition;
      uri: string;
      bandwidth: number;
    }> = [];

    // 4. Transcode each rendition sequentially (CPU-bound — parallelism here
    // would just thrash). Progress is interpolated across the ladder.
    const span = 80; // 10..90% reserved for transcoding
    for (let i = 0; i < effective.length; i++) {
      const r = effective[i];
      const localOut = path.join(workDir, r.name);
      fs.mkdirSync(localOut, { recursive: true });

      const sliceStart = 10 + (i / effective.length) * span;
      const sliceLen = span / effective.length;

      await transcodeOne(sourcePath, localOut, r, (percent) => {
        const overall = sliceStart + (percent / 100) * sliceLen;
        const rounded = Math.floor(overall);
        // Don't hammer the DB: only patch when integer percent advances.
        void patchJob(jobRowId, { progress: rounded });
        void job.updateProgress(rounded);
      });

      variants.push({
        rendition: r,
        uri: `${r.name}/index.m3u8`,
        bandwidth: bandwidthOf(r),
      });
    }

    // 5. Write master.m3u8
    const masterPath = path.join(workDir, "master.m3u8");
    fs.writeFileSync(masterPath, masterPlaylist(variants));

    // 6. Upload everything
    const outputPrefix = `${organizationId}/videos/hls/${jobRowId}`;
    await job.updateProgress(92);
    await patchJob(jobRowId, { progress: 92, outputPrefix });

    // Upload each rendition folder
    for (const v of variants) {
      const localDir = path.join(workDir, v.rendition.name);
      await uploadDirectory(localDir, `${outputPrefix}/${v.rendition.name}`);
    }
    // Upload master.m3u8
    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: `${outputPrefix}/master.m3u8`,
        Body: fs.readFileSync(masterPath),
        ContentType: "application/vnd.apple.mpegurl",
        CacheControl: "public, max-age=60",
      }),
    );

    const hlsUrl = publicUrl(`${outputPrefix}/master.m3u8`);
    await patchJob(jobRowId, {
      status: "READY",
      hlsUrl,
      progress: 100,
      completedAt: new Date(),
    });
    await job.updateProgress(100);

    return { hlsUrl };
  } finally {
    fs.rmSync(workDir, { recursive: true, force: true });
  }
}

let workerInstance: Worker<MediaTranscodeJobData> | null = null;

export function startTranscodeWorker(): Worker<MediaTranscodeJobData> {
  if (workerInstance) return workerInstance;

  const worker = new Worker<MediaTranscodeJobData>(
    QUEUE_NAMES.mediaTranscode,
    processJob,
    {
      connection: bullConnection,
      // ffmpeg is CPU-bound; one job per process is the safe default.
      concurrency: 1,
    },
  );

  worker.on("ready", () => {
    console.log(
      `[transcode-worker] ready, listening on '${QUEUE_NAMES.mediaTranscode}'`,
    );
  });

  worker.on("failed", async (job, err) => {
    if (!job) return;
    console.error(
      `[transcode-worker] job ${job.id} (row ${job.data.jobRowId}) failed:`,
      err,
    );
    const finalAttempt = (job.attemptsMade ?? 0) >= (job.opts.attempts ?? 1);
    if (finalAttempt) {
      try {
        await patchJob(job.data.jobRowId, {
          status: "FAILED",
          error: err.message?.slice(0, 1000) ?? "unknown error",
          completedAt: new Date(),
        });
      } catch (dbErr) {
        console.error("[transcode-worker] failed to mark job FAILED:", dbErr);
      }
    }
  });

  worker.on("error", (err) => {
    console.error("[transcode-worker] worker error:", err);
  });

  workerInstance = worker;
  return worker;
}
