import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  CheckCircle2,
  Loader2,
  Upload,
  Video,
  X,
  AlertCircle,
} from "lucide-react";
import { apiGet, apiPost } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { ApiRequestError } from "@/lib/api/errors";
import { Button } from "@/components/ui/button";
import type { MediaJob, MediaJobStatus } from "@/types";
import { cn } from "@/lib/utils";

const ACCEPTED_TYPES = "video/mp4,video/webm,video/quicktime";
// The signed-URL endpoint enforces 100MB max; multipart upload would lift
// this. We surface a friendly error rather than failing silently at S3.
const MAX_FILE_SIZE = 100 * 1024 * 1024;

interface SignedUrlResponse {
  uploadUrl: string;
  publicUrl: string;
  cdnUrl: string;
  key: string;
  expiresIn: number;
  bucket: string;
}

interface VideoUploadFieldProps {
  /** Existing values from a schedule being edited. */
  initialMediaJobId?: string;
  initialHlsUrl?: string;
  /** Called whenever the resolved values change so the parent can render
   * matching hidden inputs for the form submission. */
  onChange: (next: { mediaJobId?: string; hlsUrl?: string }) => void;
}

type UiPhase =
  | { kind: "idle" }
  | { kind: "uploading"; percent: number; fileName: string }
  | { kind: "queueing"; fileName: string }
  | {
      kind: "transcoding";
      percent: number;
      fileName: string;
      jobId: string;
      status: MediaJobStatus;
    }
  | { kind: "ready"; jobId: string; hlsUrl: string; fileName: string }
  | { kind: "failed"; error: string; fileName?: string };

export function VideoUploadField({
  initialMediaJobId,
  initialHlsUrl,
  onChange,
}: VideoUploadFieldProps) {
  const [phase, setPhase] = useState<UiPhase>(() =>
    initialMediaJobId && initialHlsUrl
      ? {
          kind: "ready",
          jobId: initialMediaJobId,
          hlsUrl: initialHlsUrl,
          fileName: "Existing recording",
        }
      : { kind: "idle" },
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pollAbortRef = useRef<{ cancelled: boolean } | null>(null);

  // Resolve a media job we already have an id for (e.g. when re-opening the
  // form on a schedule whose transcode is still in progress).
  useEffect(() => {
    if (
      phase.kind !== "ready" ||
      !initialMediaJobId ||
      initialHlsUrl ||
      phase.jobId !== initialMediaJobId
    ) {
      return;
    }
    // Already in ready state with a known url — nothing to do.
  }, [initialMediaJobId, initialHlsUrl, phase]);

  const requestSignedUrl = useMutation({
    mutationFn: (file: File) =>
      apiPost<SignedUrlResponse>(endpoints.upload.signedUrl, {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        folder: "uploads",
      }),
  });

  const startTranscode = useMutation({
    mutationFn: (sourceKey: string) =>
      apiPost<MediaJob>(endpoints.media.transcode, {
        sourceKey,
        sourceContentType: undefined,
      }),
  });

  function pickFile() {
    fileInputRef.current?.click();
  }

  async function handleFile(file: File) {
    if (file.size > MAX_FILE_SIZE) {
      const msg = `File exceeds 100MB limit (${(file.size / 1024 / 1024).toFixed(1)} MB)`;
      setPhase({ kind: "failed", error: msg, fileName: file.name });
      toast.error(msg);
      return;
    }

    pollAbortRef.current?.cancelled && (pollAbortRef.current.cancelled = true);
    onChange({ mediaJobId: undefined, hlsUrl: undefined });

    try {
      // 1. Get signed URL
      setPhase({ kind: "uploading", percent: 0, fileName: file.name });
      const signed = await requestSignedUrl.mutateAsync(file);
      if (!signed.data) throw new Error("Signed URL response missing data");
      const { uploadUrl, key } = signed.data;

      // 2. PUT the file to S3 with progress tracking
      await uploadWithProgress(uploadUrl, file, (percent) => {
        setPhase({ kind: "uploading", percent, fileName: file.name });
      });

      // 3. Kick off the transcode job
      setPhase({ kind: "queueing", fileName: file.name });
      const jobRes = await startTranscode.mutateAsync(key);
      const job = jobRes.data;
      if (!job) throw new Error("Failed to create transcode job");

      // 4. Poll
      setPhase({
        kind: "transcoding",
        percent: 0,
        fileName: file.name,
        jobId: job.id,
        status: job.status,
      });
      const abort = { cancelled: false };
      pollAbortRef.current = abort;
      pollJobUntilDone(job.id, abort, (current) => {
        if (abort.cancelled) return;
        if (current.status === "READY" && current.hlsUrl) {
          setPhase({
            kind: "ready",
            jobId: current.id,
            hlsUrl: current.hlsUrl,
            fileName: file.name,
          });
          onChange({ mediaJobId: current.id, hlsUrl: current.hlsUrl });
          toast.success("Video ready");
          return;
        }
        if (current.status === "FAILED") {
          const msg = current.error || "Transcoding failed";
          setPhase({ kind: "failed", error: msg, fileName: file.name });
          toast.error(msg);
          return;
        }
        setPhase({
          kind: "transcoding",
          percent: current.progress ?? 0,
          fileName: file.name,
          jobId: current.id,
          status: current.status,
        });
      });
    } catch (err) {
      const msg =
        err instanceof ApiRequestError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Upload failed";
      setPhase({ kind: "failed", error: msg, fileName: file.name });
      toast.error(msg);
    }
  }

  function reset() {
    pollAbortRef.current && (pollAbortRef.current.cancelled = true);
    setPhase({ kind: "idle" });
    onChange({ mediaJobId: undefined, hlsUrl: undefined });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {phase.kind === "idle" && (
        <button
          type="button"
          onClick={pickFile}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border/70 bg-muted/20 p-6 text-center transition-colors",
            "hover:border-primary/40 hover:bg-muted/40",
          )}
        >
          <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10">
            <Upload className="h-5 w-5 text-primary" />
          </div>
          <p className="text-sm font-medium">Click to choose a video</p>
          <p className="text-xs text-muted-foreground">
            MP4, WebM, MOV up to 100MB. We&apos;ll transcode it into adaptive
            HLS automatically.
          </p>
        </button>
      )}

      {phase.kind === "uploading" && (
        <ProgressBlock
          icon={<Loader2 className="h-4 w-4 animate-spin text-primary" />}
          fileName={phase.fileName}
          label={`Uploading… ${phase.percent}%`}
          percent={phase.percent}
          onCancel={reset}
        />
      )}

      {phase.kind === "queueing" && (
        <ProgressBlock
          icon={<Loader2 className="h-4 w-4 animate-spin text-primary" />}
          fileName={phase.fileName}
          label="Queueing transcoding job…"
          percent={0}
        />
      )}

      {phase.kind === "transcoding" && (
        <ProgressBlock
          icon={<Loader2 className="h-4 w-4 animate-spin text-primary" />}
          fileName={phase.fileName}
          label={`Transcoding (${phase.status.toLowerCase()})… ${phase.percent}%`}
          percent={phase.percent}
        />
      )}

      {phase.kind === "ready" && (
        <div className="flex items-start gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{phase.fileName}</p>
            <p className="truncate text-xs text-muted-foreground">
              Ready · master.m3u8 · saved with this schedule
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={reset}
            className="shrink-0"
          >
            Replace
          </Button>
        </div>
      )}

      {phase.kind === "failed" && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {phase.fileName ?? "Upload failed"}
            </p>
            <p className="text-xs text-muted-foreground">{phase.error}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={pickFile}
            className="shrink-0"
          >
            Try again
          </Button>
        </div>
      )}
    </div>
  );
}

function ProgressBlock({
  icon,
  fileName,
  label,
  percent,
  onCancel,
}: {
  icon: React.ReactNode;
  fileName: string;
  label: string;
  percent: number;
  onCancel?: () => void;
}) {
  return (
    <div className="space-y-2 rounded-lg border border-border/70 bg-card p-3">
      <div className="flex items-center gap-3">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-muted">
          <Video className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{fileName}</p>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {icon}
            {label}
          </p>
        </div>
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onCancel}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all"
          style={{ width: `${Math.max(0, Math.min(100, percent))}%` }}
        />
      </div>
    </div>
  );
}

/* ─── Helpers ─────────────────────────────────────────────────── */

function uploadWithProgress(
  url: string,
  file: File,
  onProgress: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`S3 upload failed (HTTP ${xhr.status})`));
    };
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(file);
  });
}

async function pollJobUntilDone(
  jobId: string,
  abort: { cancelled: boolean },
  onUpdate: (job: MediaJob) => void,
) {
  const intervalMs = 3000;
  // Cap at ~30 minutes of polling for one upload — anything longer means the
  // job is stuck and we'd rather surface that.
  const maxAttempts = (30 * 60_000) / intervalMs;
  let attempt = 0;
  while (!abort.cancelled && attempt < maxAttempts) {
    try {
      const job = await apiGet<MediaJob>(endpoints.media.job(jobId));
      onUpdate(job);
      if (job.status === "READY" || job.status === "FAILED") return;
    } catch {
      // Transient errors shouldn't tear down the polling loop.
    }
    await new Promise((r) => setTimeout(r, intervalMs));
    attempt++;
  }
}
