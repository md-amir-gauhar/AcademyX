"use client";

import { detectVideoType, type VideoType } from "@/lib/video";
import { YouTubeIframe } from "./video-player/youtube-iframe";
import { VideoJsPlayer } from "./video-player/videojs-player";

export type { VideoType };

interface VideoPlayerProps {
  url: string;
  videoType?: VideoType;
  title?: string;
  thumbnail?: string | null;
  onProgress?: (state: {
    played: number;
    playedSeconds: number;
    loaded: number;
  }) => void;
  onDuration?: (duration: number) => void;
  onEnded?: () => void;
  onReady?: () => void;
  autoPlay?: boolean;
  className?: string;
}

/**
 * Unified video player.
 *
 * Branches by URL/type:
 *   - YouTube videos and live streams → native iframe + IFrame Player API for
 *     events. Avoids the unmaintained `videojs-youtube` plugin.
 *   - HLS (m3u8) and MP4 → video.js with VHS for adaptive bitrate streaming.
 *     A custom `vjs-academyx` skin in `./video-player/videojs-skin.css` keeps
 *     it visually consistent with the rest of the app.
 *
 * The public API is intentionally identical to what we shipped before so all
 * existing call sites continue to work without changes.
 */
export function VideoPlayer({
  url,
  videoType,
  thumbnail,
  onProgress,
  onDuration,
  onEnded,
  onReady,
  autoPlay = false,
  className,
}: VideoPlayerProps) {
  const resolvedType: VideoType = videoType ?? detectVideoType(url);

  if (resolvedType === "YOUTUBE" || resolvedType === "YOUTUBE_LIVE") {
    return (
      <YouTubeIframe
        url={url}
        isLive={resolvedType === "YOUTUBE_LIVE"}
        autoPlay={autoPlay}
        className={className}
        onReady={onReady}
        onEnded={onEnded}
        onProgress={onProgress}
        onDuration={onDuration}
      />
    );
  }

  return (
    <VideoJsPlayer
      url={url}
      videoType={resolvedType}
      thumbnail={thumbnail}
      autoPlay={autoPlay}
      className={className}
      onReady={onReady}
      onProgress={onProgress}
      onDuration={onDuration}
      onEnded={onEnded}
    />
  );
}
