"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VideoType } from "@/lib/video";
import "video.js/dist/video-js.css";
import "./videojs-skin.css";

type VideoJsPlayer = {
  dispose: () => void;
  src: (source: { src: string; type: string }) => void;
  on: (event: string, handler: () => void) => void;
  duration: () => number;
  currentTime: () => number;
  buffered: () => { length: number; end: (i: number) => number };
  ready: (cb: () => void) => void;
  poster: (poster?: string) => void;
};

type VideoJsModule = {
  default: (
    el: Element,
    options?: Record<string, unknown>,
  ) => VideoJsPlayer;
};

interface VideoJsPlayerProps {
  url: string;
  videoType: Extract<VideoType, "HLS" | "MP4">;
  thumbnail?: string | null;
  autoPlay?: boolean;
  className?: string;
  onReady?: () => void;
  onProgress?: (state: {
    played: number;
    playedSeconds: number;
    loaded: number;
  }) => void;
  onDuration?: (duration: number) => void;
  onEnded?: () => void;
  onError?: () => void;
}

const SOURCE_TYPE: Record<"HLS" | "MP4", string> = {
  HLS: "application/x-mpegURL",
  MP4: "video/mp4",
};

export function VideoJsPlayer({
  url,
  videoType,
  thumbnail,
  autoPlay = false,
  className,
  onReady,
  onProgress,
  onDuration,
  onEnded,
  onError,
}: VideoJsPlayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<VideoJsPlayer | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Capture latest callbacks without restarting the player on every render.
  const onReadyRef = useRef(onReady);
  const onProgressRef = useRef(onProgress);
  const onDurationRef = useRef(onDuration);
  const onEndedRef = useRef(onEnded);
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onReadyRef.current = onReady;
    onProgressRef.current = onProgress;
    onDurationRef.current = onDuration;
    onEndedRef.current = onEnded;
    onErrorRef.current = onError;
  }, [onReady, onProgress, onDuration, onEnded, onError]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    let player: VideoJsPlayer | null = null;

    const setup = async () => {
      // Build the <video> element fresh inside our wrapper so React doesn't
      // try to reconcile DOM that video.js takes ownership of.
      const videoEl = document.createElement("video-js");
      videoEl.setAttribute(
        "class",
        "video-js vjs-fluid vjs-academyx vjs-big-play-centered",
      );
      videoEl.setAttribute("playsinline", "");
      if (autoPlay) videoEl.setAttribute("autoplay", "");
      if (thumbnail) videoEl.setAttribute("poster", thumbnail);
      container.innerHTML = "";
      container.appendChild(videoEl);

      const mod = (await import("video.js")) as unknown as VideoJsModule;
      if (cancelled) return;

      player = mod.default(videoEl, {
        controls: true,
        autoplay: autoPlay,
        preload: "auto",
        responsive: true,
        fluid: true,
        playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2],
        controlBar: {
          remainingTimeDisplay: { displayNegative: false },
        },
        html5: {
          vhs: {
            overrideNative: true,
            enableLowInitialPlaylist: true,
            limitRenditionByPlayerDimensions: true,
            useDevicePixelRatio: true,
          },
        },
      });

      player.src({ src: url, type: SOURCE_TYPE[videoType] });
      playerRef.current = player;

      player.ready(() => {
        if (cancelled) return;
        setIsReady(true);
        onReadyRef.current?.();
        const duration = player?.duration() ?? 0;
        if (duration > 0) onDurationRef.current?.(duration);
      });

      player.on("loadedmetadata", () => {
        const duration = player?.duration() ?? 0;
        if (duration > 0) onDurationRef.current?.(duration);
      });

      player.on("timeupdate", () => {
        if (!player) return;
        const duration = player.duration();
        const current = player.currentTime();
        const buffered = player.buffered();
        const loadedEnd =
          buffered.length > 0 ? buffered.end(buffered.length - 1) : 0;
        if (duration > 0) {
          onProgressRef.current?.({
            played: current / duration,
            playedSeconds: current,
            loaded: loadedEnd / duration,
          });
        }
      });

      player.on("ended", () => onEndedRef.current?.());

      player.on("error", () => {
        setHasError(true);
        onErrorRef.current?.();
      });
    };

    setup();

    return () => {
      cancelled = true;
      try {
        playerRef.current?.dispose();
      } catch {
        // ignore disposal errors during fast remounts
      }
      playerRef.current = null;
      // `container` was captured at effect start; safe to clear here even if
      // React already unmounted the wrapper.
      container.innerHTML = "";
    };
  }, [url, videoType, autoPlay, thumbnail]);

  if (hasError) {
    return (
      <div
        className={cn(
          "relative aspect-video w-full overflow-hidden rounded-2xl bg-black/95",
          className,
        )}
      >
        <div className="flex h-full flex-col items-center justify-center gap-3 text-white/70">
          <p className="text-sm">Failed to load video</p>
          <button
            onClick={() => {
              setHasError(false);
              setIsReady(false);
            }}
            className="rounded-full bg-white/10 px-4 py-1.5 text-xs font-medium text-white hover:bg-white/20 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative aspect-video w-full overflow-hidden rounded-2xl bg-black",
        className,
      )}
    >
      {!isReady && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-white/50" />
            <p className="text-xs text-white/40">Loading video...</p>
          </div>
        </div>
      )}
      <div
        ref={containerRef}
        data-vjs-player
        className="absolute inset-0 h-full w-full"
      />
    </div>
  );
}
