"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getYouTubeEmbedUrl,
  parseYouTube,
  type YouTubeEmbedOptions,
} from "@/lib/video";

/**
 * YouTube IFrame Player API — minimal types for what we use.
 * The script is loaded on demand and exposes a `YT` global.
 */
type YTPlayer = {
  destroy: () => void;
  getDuration: () => number;
  getCurrentTime: () => number;
  pauseVideo: () => void;
  playVideo: () => void;
};

type YTReadyEvent = { target: YTPlayer };
type YTStateChangeEvent = { data: number; target: YTPlayer };

declare global {
  interface Window {
    YT?: {
      Player: new (
        element: HTMLElement | string,
        config: {
          events?: {
            onReady?: (event: YTReadyEvent) => void;
            onStateChange?: (event: YTStateChangeEvent) => void;
          };
        },
      ) => YTPlayer;
      PlayerState?: {
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
        CUED: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

const YT_API_SRC = "https://www.youtube.com/iframe_api";
let apiPromise: Promise<void> | null = null;

function loadYouTubeApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();
  if (apiPromise) return apiPromise;

  apiPromise = new Promise<void>((resolve) => {
    const prevHandler = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prevHandler?.();
      resolve();
    };
    if (!document.querySelector(`script[src="${YT_API_SRC}"]`)) {
      const tag = document.createElement("script");
      tag.src = YT_API_SRC;
      tag.async = true;
      document.body.appendChild(tag);
    }
  });
  return apiPromise;
}

interface YouTubeIframeProps {
  url: string;
  isLive?: boolean;
  autoPlay?: boolean;
  className?: string;
  onReady?: () => void;
  onEnded?: () => void;
  onProgress?: (state: {
    played: number;
    playedSeconds: number;
    loaded: number;
  }) => void;
  onDuration?: (duration: number) => void;
}

export function YouTubeIframe({
  url,
  isLive,
  autoPlay = false,
  className,
  onReady,
  onEnded,
  onProgress,
  onDuration,
}: YouTubeIframeProps) {
  const iframeId = useId().replace(/:/g, "_");
  const [isReady, setIsReady] = useState(false);
  const playerRef = useRef<YTPlayer | null>(null);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Stable refs for callbacks so the IFrame API setup effect can stay
  // dependency-free without missing updates.
  const onReadyRef = useRef(onReady);
  const onEndedRef = useRef(onEnded);
  const onProgressRef = useRef(onProgress);
  const onDurationRef = useRef(onDuration);
  useEffect(() => {
    onReadyRef.current = onReady;
    onEndedRef.current = onEnded;
    onProgressRef.current = onProgress;
    onDurationRef.current = onDuration;
  }, [onReady, onEnded, onProgress, onDuration]);

  const parsed = parseYouTube(url);
  const embedOptions: YouTubeEmbedOptions = {
    autoplay: autoPlay,
    mute: autoPlay,
    origin:
      typeof window !== "undefined" ? window.location.origin : undefined,
  };
  const src = parsed
    ? getYouTubeEmbedUrl(parsed.videoId, embedOptions)
    : null;

  useEffect(() => {
    if (!src) return;
    let cancelled = false;

    loadYouTubeApi().then(() => {
      if (cancelled || !window.YT?.Player) return;
      const el = document.getElementById(iframeId);
      if (!el) return;

      const player = new window.YT.Player(iframeId, {
        events: {
          onReady: (event) => {
            playerRef.current = event.target;
            setIsReady(true);
            onReadyRef.current?.();
            const duration = event.target.getDuration();
            if (duration > 0) onDurationRef.current?.(duration);
          },
          onStateChange: (event) => {
            const ended = window.YT?.PlayerState?.ENDED ?? 0;
            const playing = window.YT?.PlayerState?.PLAYING ?? 1;

            if (event.data === ended) {
              if (progressTimerRef.current) {
                clearInterval(progressTimerRef.current);
                progressTimerRef.current = null;
              }
              onEndedRef.current?.();
            }

            if (event.data === playing && !progressTimerRef.current) {
              progressTimerRef.current = setInterval(() => {
                const p = playerRef.current;
                if (!p) return;
                const duration = p.getDuration();
                const current = p.getCurrentTime();
                if (duration > 0) {
                  onProgressRef.current?.({
                    played: current / duration,
                    playedSeconds: current,
                    loaded: 1,
                  });
                }
              }, 1000);
            }
          },
        },
      });
      playerRef.current = player;
    });

    return () => {
      cancelled = true;
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
      try {
        playerRef.current?.destroy();
      } catch {
        // ignore — iframe may already be unmounted
      }
      playerRef.current = null;
    };
  }, [src, iframeId]);

  if (!src) {
    return (
      <div
        className={cn(
          "relative aspect-video w-full overflow-hidden rounded-2xl bg-black/95",
          className,
        )}
      >
        <div className="flex h-full items-center justify-center text-sm text-white/60">
          Invalid YouTube URL
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
            <p className="text-xs text-white/40">
              {isLive ? "Connecting to live stream..." : "Loading video..."}
            </p>
          </div>
        </div>
      )}
      {isLive && isReady && (
        <span className="absolute left-3 top-3 z-20 inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-lg">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
          </span>
          Live
        </span>
      )}
      <iframe
        id={iframeId}
        src={src}
        title="YouTube video player"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="absolute inset-0 h-full w-full border-0"
      />
    </div>
  );
}
