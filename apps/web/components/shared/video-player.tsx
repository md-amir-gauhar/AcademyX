"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Loader2, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { detectVideoType, type VideoType } from "@/lib/video";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ReactPlayer = dynamic(() => import("react-player") as any, { ssr: false }) as any;

interface VideoPlayerProps {
  url: string;
  videoType?: VideoType;
  title?: string;
  thumbnail?: string | null;
  onProgress?: (state: { played: number; playedSeconds: number; loaded: number }) => void;
  onDuration?: (duration: number) => void;
  onEnded?: () => void;
  onReady?: () => void;
  autoPlay?: boolean;
  className?: string;
}

export { type VideoType };

export function VideoPlayer({
  url,
  videoType,
  title,
  thumbnail,
  onProgress,
  onDuration,
  onEnded,
  onReady,
  autoPlay = false,
  className,
}: VideoPlayerProps) {
  const [isReady, setIsReady] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const playerRef = React.useRef<any>(null);

  const resolvedType = videoType ?? detectVideoType(url);

  const playerConfig = React.useMemo(
    () => ({
      youtube: {
        playerVars: {
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          iv_load_policy: 3,
          cc_load_policy: 0,
        },
      },
      file: {
        forceHLS: resolvedType === "HLS",
        hlsOptions: {
          enableWorker: true,
          lowLatencyMode: true,
        },
        attributes: {
          controlsList: "nodownload",
          disablePictureInPicture: false,
        },
      },
    }),
    [resolvedType]
  );

  function handleReady() {
    setIsReady(true);
    onReady?.();
  }

  function handleError() {
    setHasError(true);
  }

  if (hasError) {
    return (
      <div className={cn("relative aspect-video w-full overflow-hidden rounded-2xl bg-black/95", className)}>
        <div className="flex h-full flex-col items-center justify-center gap-3 text-white/70">
          <p className="text-sm">Failed to load video</p>
          <button
            onClick={() => { setHasError(false); setIsReady(false); }}
            className="rounded-full bg-white/10 px-4 py-1.5 text-xs font-medium hover:bg-white/20 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative aspect-video w-full overflow-hidden rounded-2xl bg-black", className)}>
      {!isReady && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-white/50" />
            <p className="text-xs text-white/40">Loading video...</p>
          </div>
        </div>
      )}
      <ReactPlayer
        ref={playerRef}
        url={url}
        width="100%"
        height="100%"
        controls
        playing={autoPlay}
        config={playerConfig}
        onReady={handleReady}
        onError={handleError}
        onProgress={onProgress}
        onDuration={onDuration}
        onEnded={onEnded}
        light={!autoPlay && thumbnail ? thumbnail : false}
        playIcon={
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/90 text-white shadow-glow backdrop-blur transition-transform hover:scale-110">
            <Play className="h-7 w-7 fill-current" />
          </div>
        }
        style={{ position: "absolute", top: 0, left: 0 }}
      />
    </div>
  );
}
